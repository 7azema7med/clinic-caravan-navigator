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
import { Search, Save, FileText, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageLayout from '@/components/PageLayout';

const ClinicReport: React.FC = () => {
  const { currentUser } = useAuth();
  const { getPatientsByClinic, updatePatient, clinics } = useData();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTicket, setSearchTicket] = useState('');
  const [form, setForm] = useState({ diagnosis: '', treatment: '', investigation: '', referral: false, referralNote: '', note: '' });

  const clinic = clinics.find(c => c.id === currentUser?.assignedClinic);
  const patients = currentUser?.assignedClinic ? getPatientsByClinic(currentUser.assignedClinic) : [];
  const waitingPatients = patients.filter(p => !p.examined);
  const examinedPatients = patients.filter(p => p.examined);
  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const filteredWaiting = searchTicket
    ? waitingPatients.filter(p => p.ticketNumber.includes(searchTicket) || p.fullNameAr.includes(searchTicket))
    : waitingPatients;

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
    });
    toast({ title: 'Saved', description: 'Examination completed successfully' });
    setSelectedPatientId(null);
    setForm({ diagnosis: '', treatment: '', investigation: '', referral: false, referralNote: '', note: '' });
  };

  return (
    <PageLayout title={clinic ? `${clinic.nameAr} - ${clinic.name} Clinic` : 'Clinic Report'}>
      {clinic?.doctorName && (
        <div className="mb-4 text-sm text-muted-foreground">
          Doctor: <span className="font-semibold text-foreground">{clinic.doctorName}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient list */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={searchTicket} onChange={e => setSearchTicket(e.target.value)} placeholder="Search ticket/name..." className="h-9" />
            <Button size="icon" variant="outline"><Search className="w-4 h-4" /></Button>
          </div>

          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Waiting ({waitingPatients.length})</CardTitle></CardHeader>
            <CardContent className="max-h-64 overflow-y-auto space-y-1">
              {filteredWaiting.map(p => (
                <button key={p.id} onClick={() => { setSelectedPatientId(p.id); setForm({ diagnosis: '', treatment: '', investigation: '', referral: false, referralNote: '', note: '' }); }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPatientId === p.id ? 'bg-primary/10 border-primary' : 'status-waiting'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{p.fullNameAr}</span>
                    <Badge variant="outline" className="text-xs">{p.ticketNumber}</Badge>
                  </div>
                  <p className="text-xs mt-1 opacity-70">{p.mainComplaint}</p>
                </button>
              ))}
              {filteredWaiting.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No patients waiting</p>}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Examined ({examinedPatients.length})</CardTitle></CardHeader>
            <CardContent className="max-h-64 overflow-y-auto space-y-1">
              {examinedPatients.map(p => (
                <button key={p.id} onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPatientId === p.id ? 'bg-primary/10 border-primary' : 'status-completed'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{p.fullNameAr}</span>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-xs mt-1 opacity-70">{p.diagnosis}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Patient details & exam form */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <FileText className="w-5 h-5 text-primary" />
                  {selectedPatient.fullNameAr} — {selectedPatient.ticketNumber}
                  {selectedPatient.examined && <Badge className="bg-success text-success-foreground ml-2">Examined</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Patient info */}
                <div className="bg-muted/50 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Complaint:</span> <span className="font-medium">{selectedPatient.mainComplaint}</span></div>
                  <div><span className="text-muted-foreground">Age:</span> <span className="font-medium">{selectedPatient.age}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedPatient.phone || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">Registered:</span> <span className="font-medium">{selectedPatient.registeredAt}</span></div>
                  {selectedPatient.note && <div className="col-span-2"><span className="text-muted-foreground">Note:</span> <span className="font-medium">{selectedPatient.note}</span></div>}
                </div>

                {/* Vitals if available */}
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

                {/* Examination form */}
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
    </PageLayout>
  );
};

export default ClinicReport;
