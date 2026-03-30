import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Save, FileText, CheckCircle2, UserX, Edit, Trash2, Download, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageLayout from '@/components/PageLayout';

const ClinicReport: React.FC = () => {
  const { currentUser } = useAuth();
  const { getPatientsByClinic, updatePatient, deletePatient, clinics } = useData();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ diagnosis: '', treatment: '', investigation: '', referral: false, referralNote: '', note: '' });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);

  const clinic = clinics.find(c => c.id === currentUser?.assignedClinic);
  const allPatients = currentUser?.assignedClinic ? getPatientsByClinic(currentUser.assignedClinic) : [];
  const waitingPatients = allPatients.filter(p => !p.examined && !p.isAbsent);
  const examinedPatients = allPatients.filter(p => p.examined);
  const absentPatients = allPatients.filter(p => p.isAbsent && !p.examined);
  const selectedPatient = selectedPatientId ? allPatients.find(p => p.id === selectedPatientId) : null;

  const searchResults = searchQuery
    ? allPatients.filter(p => p.ticketNumber.includes(searchQuery) || p.fullNameAr.includes(searchQuery))
    : null;

  const handleSave = () => {
    if (!selectedPatientId) return;
    updatePatient(selectedPatientId, {
      diagnosis: form.diagnosis,
      treatment: form.treatment,
      investigation: form.investigation || undefined,
      referral: form.referral,
      referralNote: form.referralNote || undefined,
      examNote: form.note || undefined,
      doctorSignature: clinic?.doctorName || 'Doctor',
      examStudentSignature: currentUser?.fullName,
      examinedAt: new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' }),
      examined: true,
      isAbsent: false,
    });
    toast({ title: 'Saved', description: 'Examination completed successfully' });
    setSelectedPatientId(null);
    setForm({ diagnosis: '', treatment: '', investigation: '', referral: false, referralNote: '', note: '' });
  };

  const handleMarkAbsent = (id: string) => {
    updatePatient(id, { isAbsent: true, absentAt: new Date().toISOString() });
    toast({ title: 'Marked Absent', description: 'Patient moved to absent list' });
    if (selectedPatientId === id) setSelectedPatientId(null);
  };

  const handleRestoreAbsent = (id: string) => {
    updatePatient(id, { isAbsent: false, absentAt: undefined });
    toast({ title: 'Restored', description: 'Patient returned to waiting list' });
  };

  const handleEditExamined = (p: any) => {
    setEditingPatient({ ...p });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingPatient) return;
    updatePatient(editingPatient.id, {
      diagnosis: editingPatient.diagnosis,
      treatment: editingPatient.treatment,
      investigation: editingPatient.investigation,
      referral: editingPatient.referral,
      referralNote: editingPatient.referralNote,
      examNote: editingPatient.examNote,
    });
    toast({ title: 'Updated' });
    setShowEditDialog(false);
  };

  const selectAndLoadPatient = (id: string) => {
    const p = allPatients.find(pt => pt.id === id);
    setSelectedPatientId(id);
    if (p?.examined) {
      setForm({
        diagnosis: p.diagnosis || '',
        treatment: p.treatment || '',
        investigation: p.investigation || '',
        referral: p.referral || false,
        referralNote: p.referralNote || '',
        note: p.examNote || '',
      });
    } else {
      setForm({ diagnosis: '', treatment: '', investigation: '', referral: false, referralNote: '', note: '' });
    }
  };

  return (
    <PageLayout title={clinic ? `${clinic.nameAr} - ${clinic.name} Clinic` : 'Clinic Report'}>
      {clinic?.doctorName && (
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Doctor: <span className="font-semibold text-foreground">{clinic.doctorName}</span>
          </div>
          <div className="flex gap-3 text-sm">
            <Badge variant="outline" className="border-warning text-warning"><Clock className="w-3 h-3 mr-1" />Waiting: {waitingPatients.length}</Badge>
            <Badge variant="outline" className="border-success text-success"><CheckCircle2 className="w-3 h-3 mr-1" />Examined: {examinedPatients.length}</Badge>
            <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Total: {allPatients.length}</Badge>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient list */}
        <div className="space-y-4">
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search ticket/name..." className="h-9" />

          {searchResults ? (
            <Card className="glass-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Results ({searchResults.length})</CardTitle></CardHeader>
              <CardContent className="max-h-96 overflow-y-auto space-y-1">
                {searchResults.map(p => (
                  <button key={p.id} onClick={() => selectAndLoadPatient(p.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPatientId === p.id ? 'bg-primary/10 border-primary' : p.examined ? 'status-completed' : 'status-waiting'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{p.fullNameAr}</span>
                      <Badge variant="outline" className="text-xs font-bold">{p.ticketNumber}</Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="glass-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Waiting ({waitingPatients.length})</CardTitle></CardHeader>
                <CardContent className="max-h-48 overflow-y-auto space-y-1">
                  {waitingPatients.map(p => (
                    <div key={p.id} className={`flex items-center gap-1 rounded-lg border transition-colors ${selectedPatientId === p.id ? 'bg-primary/10 border-primary' : 'status-waiting'}`}>
                      <button onClick={() => selectAndLoadPatient(p.id)} className="flex-1 text-left p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{p.fullNameAr}</span>
                          <Badge variant="outline" className="text-xs font-bold">{p.ticketNumber}</Badge>
                        </div>
                        <p className="text-xs mt-1 opacity-70">{p.mainComplaint}</p>
                      </button>
                      <Button size="icon" variant="ghost" className="text-destructive mr-1" title="Mark Absent" onClick={() => handleMarkAbsent(p.id)}>
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {waitingPatients.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No patients waiting</p>}
                </CardContent>
              </Card>

              {absentPatients.length > 0 && (
                <Card className="glass-card border-destructive/30">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-heading text-destructive">Absent ({absentPatients.length})</CardTitle></CardHeader>
                  <CardContent className="max-h-32 overflow-y-auto space-y-1">
                    {absentPatients.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-destructive/20 bg-destructive/5">
                        <div>
                          <span className="font-medium text-sm">{p.fullNameAr}</span>
                          <span className="text-xs ml-2 opacity-70">#{p.ticketNumber}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleRestoreAbsent(p.id)}>Restore</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="glass-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Examined ({examinedPatients.length})</CardTitle></CardHeader>
                <CardContent className="max-h-48 overflow-y-auto space-y-1">
                  {examinedPatients.map(p => (
                    <div key={p.id} className={`flex items-center gap-1 rounded-lg border transition-colors ${selectedPatientId === p.id ? 'bg-primary/10 border-primary' : 'status-completed'}`}>
                      <button onClick={() => selectAndLoadPatient(p.id)} className="flex-1 text-left p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{p.fullNameAr}</span>
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        </div>
                        <p className="text-xs mt-1 opacity-70">{p.diagnosis}</p>
                      </button>
                      <Button size="icon" variant="ghost" onClick={() => handleEditExamined(p)}><Edit className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Patient details & exam form */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <FileText className="w-5 h-5 text-primary" />
                  {selectedPatient.fullNameAr} — Ticket #{selectedPatient.ticketNumber}
                  {selectedPatient.examined && <Badge className="bg-success text-success-foreground ml-2">Examined</Badge>}
                  {selectedPatient.isAbsent && <Badge variant="destructive" className="ml-2">Absent</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Complaint:</span> <span className="font-medium">{selectedPatient.mainComplaint}</span></div>
                  <div><span className="text-muted-foreground">Age:</span> <span className="font-medium">{selectedPatient.age}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedPatient.phone || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">Registered:</span> <span className="font-medium">{selectedPatient.registeredAt}</span></div>
                  {selectedPatient.note && <div className="col-span-2"><span className="text-muted-foreground">Note:</span> <span className="font-medium">{selectedPatient.note}</span></div>}
                </div>

                {selectedPatient.vitalsCompleted && (
                  <div className="bg-accent/10 rounded-lg p-4 text-sm">
                    <h4 className="font-semibold mb-2 text-foreground">Vital Signs</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedPatient.bloodPressureSystolic && <div>BP: {selectedPatient.bloodPressureSystolic}/{selectedPatient.bloodPressureDiastolic}</div>}
                      {selectedPatient.bloodSugar && <div>Sugar: {selectedPatient.bloodSugar} mg/dL</div>}
                      {selectedPatient.pulse && <div>Pulse: {selectedPatient.pulse} bpm</div>}
                    </div>
                    {selectedPatient.pastHistory && <div className="mt-2">Past History: {selectedPatient.pastHistory}</div>}
                  </div>
                )}

                {!selectedPatient.examined ? (
                  <>
                    <div className="space-y-2">
                      <Label>Diagnosis / التشخيص *</Label>
                      <Textarea value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="Enter diagnosis..." dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Treatment / العلاج *</Label>
                      <Textarea value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))} placeholder="Enter treatment plan..." dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Investigation / Labs</Label>
                      <Textarea value={form.investigation} onChange={e => setForm(f => ({ ...f, investigation: e.target.value }))} placeholder="If applicable..." dir="rtl" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={form.referral} onCheckedChange={v => setForm(f => ({ ...f, referral: v }))} />
                        <Label>Referral</Label>
                      </div>
                      {form.referral && (
                        <Input value={form.referralNote} onChange={e => setForm(f => ({ ...f, referralNote: e.target.value }))} placeholder="Referral details" className="flex-1 h-9" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Note</Label>
                      <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Any additional notes..." />
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>Doctor: {clinic?.doctorName || 'N/A'}</span>
                      <span>Student: {currentUser?.fullName}</span>
                    </div>
                    <Button onClick={handleSave} className="w-full h-11 font-semibold bg-success hover:bg-success/90">
                      <Save className="w-4 h-4 mr-2" /> Save Examination
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3 text-sm">
                    <h4 className="font-semibold text-foreground">Examination Results</h4>
                    <div><span className="text-muted-foreground">Diagnosis:</span> {selectedPatient.diagnosis}</div>
                    <div><span className="text-muted-foreground">Treatment:</span> {selectedPatient.treatment}</div>
                    {selectedPatient.investigation && <div><span className="text-muted-foreground">Investigation:</span> {selectedPatient.investigation}</div>}
                    {selectedPatient.referral && <div><span className="text-muted-foreground">Referral:</span> {selectedPatient.referralNote}</div>}
                    {selectedPatient.examNote && <div><span className="text-muted-foreground">Note:</span> {selectedPatient.examNote}</div>}
                    <div className="text-xs text-muted-foreground">
                      Doctor: {selectedPatient.doctorSignature} | Student: {selectedPatient.examStudentSignature} | {selectedPatient.examinedAt}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a patient from the waiting list to begin examination</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit examined patient dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Examination — {editingPatient?.fullNameAr}</DialogTitle></DialogHeader>
          {editingPatient && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Diagnosis</Label>
                <Textarea value={editingPatient.diagnosis || ''} onChange={e => setEditingPatient({ ...editingPatient, diagnosis: e.target.value })} dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label>Treatment</Label>
                <Textarea value={editingPatient.treatment || ''} onChange={e => setEditingPatient({ ...editingPatient, treatment: e.target.value })} dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label>Investigation</Label>
                <Textarea value={editingPatient.investigation || ''} onChange={e => setEditingPatient({ ...editingPatient, investigation: e.target.value })} dir="rtl" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default ClinicReport;
