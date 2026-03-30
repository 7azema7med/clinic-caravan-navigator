import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Ticket, Search, Edit, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Patient } from '@/lib/types';
import PageLayout from '@/components/PageLayout';

const COMMON_COMPLAINTS = [
  'صداع', 'ألم في البطن', 'سعال', 'حمى', 'ألم في الظهر', 'دوخة',
  'ضيق في التنفس', 'ألم في الصدر', 'غثيان', 'إسهال', 'إمساك',
  'ألم في المفاصل', 'طفح جلدي', 'ألم في الأذن', 'ألم في العين',
  'التهاب في الحلق', 'ارتفاع ضغط الدم', 'سكر مرتفع',
  'ألم في الأسنان', 'حساسية', 'ألم في الركبة', 'ألم في الكتف',
  'أرق', 'تعب عام', 'فقدان الشهية', 'ألم في الحوض',
  'حرقان في البول', 'ضعف النظر', 'طنين الأذن', 'تنميل الأطراف',
  'ألم أسفل البطن', 'انتفاخ', 'حموضة', 'كحة مزمنة',
  'ألم في الرقبة', 'صعوبة في البلع', 'حكة جلدية', 'تورم القدمين',
  'ألم في العضلات', 'رعاف', 'دوار', 'خفقان القلب',
];

const PatientRegistration: React.FC = () => {
  const { currentUser } = useAuth();
  const { clinics, addPatient, updatePatient, deletePatient, settings, getNextTicketNumber, patients, searchPatients } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [savedPatient, setSavedPatient] = useState<Patient | null>(null);
  const [complaintSuggestions, setComplaintSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [form, setForm] = useState({
    mainComplaint: '',
    clinicId: '',
    fullNameAr: '',
    age: '',
    phone: '',
    note: '',
    referToVitals: false,
    referToResearch: false,
  });

  const activeClinics = clinics.filter(c => c.isActive);
  const filteredPatients = searchQuery ? searchPatients(searchQuery) : patients;

  const update = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'mainComplaint' && typeof value === 'string') {
      if (value.length > 0) {
        setComplaintSuggestions(COMMON_COMPLAINTS.filter(c => c.includes(value)));
      } else {
        setComplaintSuggestions([]);
      }
    }
  };

  if (!settings.registrationOpen && currentUser?.role !== 'admin') {
    return (
      <PageLayout title="Patient Registration">
        <Card className="glass-card max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-destructive">Registration is currently closed</p>
            <p className="text-muted-foreground mt-2">The admin has paused patient registration.</p>
            <Button className="mt-4" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clinicId || !form.fullNameAr || !form.mainComplaint || !form.age) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    const clinic = activeClinics.find(c => c.id === form.clinicId);
    const now = new Date();
    const egyptTime = now.toLocaleString('en-EG', { timeZone: 'Africa/Cairo' });

    const patient = addPatient({
      mainComplaint: form.mainComplaint,
      clinicId: form.clinicId,
      clinicName: clinic ? `${clinic.nameAr} - ${clinic.name}` : '',
      fullNameAr: form.fullNameAr,
      age: parseInt(form.age),
      phone: form.phone || undefined,
      note: form.note || undefined,
      referToVitals: form.referToVitals,
      referToResearch: form.referToResearch,
      registeredBy: currentUser?.fullName || '',
      registeredAt: egyptTime,
      vitalsCompleted: false,
      examined: false,
      referral: false,
    });

    setSavedPatient(patient);
    setShowConfirm(true);
    setForm({ mainComplaint: '', clinicId: '', fullNameAr: '', age: '', phone: '', note: '', referToVitals: false, referToResearch: false });
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient({ ...patient });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingPatient) return;
    updatePatient(editingPatient.id, {
      fullNameAr: editingPatient.fullNameAr,
      age: editingPatient.age,
      phone: editingPatient.phone,
      mainComplaint: editingPatient.mainComplaint,
      clinicId: editingPatient.clinicId,
      clinicName: editingPatient.clinicName,
      note: editingPatient.note,
      referToVitals: editingPatient.referToVitals,
      referToResearch: editingPatient.referToResearch,
    });
    toast({ title: 'Updated', description: 'Patient data updated' });
    setShowEditDialog(false);
  };

  const handleDeletePatient = (id: string) => {
    deletePatient(id);
    toast({ title: 'Deleted', description: 'Patient removed' });
  };

  return (
    <PageLayout title="Patient Registration">
      <Tabs defaultValue="register" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="register"><Plus className="w-4 h-4 mr-1" /> New Patient</TabsTrigger>
          <TabsTrigger value="list"><Search className="w-4 h-4 mr-1" /> All Patients ({patients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card className="glass-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Ticket className="w-5 h-5 text-primary" />
                New Patient — Ticket: {getNextTicketNumber()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2 relative">
                  <Label>Main Complaint / الشكوى الرئيسية *</Label>
                  <Input value={form.mainComplaint} onChange={e => update('mainComplaint', e.target.value)} placeholder="اكتب الشكوى الرئيسية" className="h-11 text-right" dir="rtl" required />
                  {complaintSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-card border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {complaintSuggestions.map((s, i) => (
                        <button key={i} type="button" className="w-full text-right px-3 py-2 hover:bg-muted text-sm" dir="rtl"
                          onClick={() => { update('mainComplaint', s); setComplaintSuggestions([]); }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Clinic / العيادة *</Label>
                  <Select value={form.clinicId} onValueChange={v => update('clinicId', v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select clinic" /></SelectTrigger>
                    <SelectContent>
                      {activeClinics.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nameAr} - {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Patient Full Name (Arabic) / اسم المريض بالكامل *</Label>
                  <Input value={form.fullNameAr} onChange={e => update('fullNameAr', e.target.value)} placeholder="الاسم الرباعي" className="h-11 text-right" dir="rtl" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age / العمر *</Label>
                    <Input type="number" min={0} max={150} value={form.age} onChange={e => update('age', e.target.value)} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone / الهاتف</Label>
                    <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="Optional" className="h-11" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Note / ملاحظة</Label>
                  <Textarea value={form.note} onChange={e => update('note', e.target.value)} placeholder="Any additional notes..." className="text-right" dir="rtl" />
                </div>

                <div className="flex items-center gap-6 py-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.referToVitals} onCheckedChange={v => update('referToVitals', v)} />
                    <Label>Refer to Vital Signs</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.referToResearch} onCheckedChange={v => update('referToResearch', v)} />
                    <Label>Refer to Research</Label>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Student: {currentUser?.fullName}</span>
                  <span>{new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' })}</span>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold">
                  <Save className="w-4 h-4 mr-2" /> Register Patient
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by ticket number or name..." className="h-10 max-w-md" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredPatients.map(p => (
                  <div key={p.id} className={`p-3 rounded-lg border flex items-center justify-between ${p.examined ? 'status-completed' : 'status-waiting'}`}>
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <p className="text-lg font-bold font-heading text-primary">{p.ticketNumber}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{p.fullNameAr}</p>
                        <p className="text-xs opacity-70">{p.clinicName} • {p.mainComplaint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.examined && <CheckCircle2 className="w-4 h-4 text-success" />}
                      <Button size="icon" variant="ghost" onClick={() => handleEditPatient(p)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeletePatient(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
                {filteredPatients.length === 0 && <p className="text-center text-muted-foreground py-8">No patients found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-heading text-success">✅ Patient Registered Successfully</DialogTitle>
          </DialogHeader>
          {savedPatient && (
            <div className="space-y-3 text-sm">
              <div className="text-center p-4 bg-primary/10 rounded-xl">
                <p className="text-xs text-muted-foreground">Ticket Number</p>
                <p className="text-4xl font-bold font-heading text-primary">{savedPatient.ticketNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{savedPatient.fullNameAr}</span></div>
                <div><span className="text-muted-foreground">Age:</span> <span className="font-medium">{savedPatient.age}</span></div>
                <div><span className="text-muted-foreground">Clinic:</span> <span className="font-medium">{savedPatient.clinicName}</span></div>
                <div><span className="text-muted-foreground">Complaint:</span> <span className="font-medium">{savedPatient.mainComplaint}</span></div>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Registered by {savedPatient.registeredBy} at {savedPatient.registeredAt}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowConfirm(false)} className="w-full">Register Another Patient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Patient — Ticket: {editingPatient?.ticketNumber}</DialogTitle>
          </DialogHeader>
          {editingPatient && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full Name (Arabic)</Label>
                <Input value={editingPatient.fullNameAr} onChange={e => setEditingPatient({ ...editingPatient, fullNameAr: e.target.value })} dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Age</Label>
                  <Input type="number" value={editingPatient.age} onChange={e => setEditingPatient({ ...editingPatient, age: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={editingPatient.phone || ''} onChange={e => setEditingPatient({ ...editingPatient, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Main Complaint</Label>
                <Input value={editingPatient.mainComplaint} onChange={e => setEditingPatient({ ...editingPatient, mainComplaint: e.target.value })} dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label>Clinic</Label>
                <Select value={editingPatient.clinicId} onValueChange={v => {
                  const c = clinics.find(cl => cl.id === v);
                  setEditingPatient({ ...editingPatient, clinicId: v, clinicName: c ? `${c.nameAr} - ${c.name}` : '' });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activeClinics.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nameAr} - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Note</Label>
                <Textarea value={editingPatient.note || ''} onChange={e => setEditingPatient({ ...editingPatient, note: e.target.value })} dir="rtl" />
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

export default PatientRegistration;
