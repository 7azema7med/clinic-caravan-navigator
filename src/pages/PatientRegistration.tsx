import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Patient } from '@/lib/types';
import PageLayout from '@/components/PageLayout';

const COMMON_COMPLAINTS = [
  'صداع', 'ألم في البطن', 'سعال', 'حمى', 'ألم في الظهر', 'دوخة',
  'ضيق في التنفس', 'ألم في الصدر', 'غثيان', 'إسهال', 'إمساك',
  'ألم في المفاصل', 'طفح جلدي', 'ألم في الأذن', 'ألم في العين',
  'التهاب في الحلق', 'ارتفاع ضغط الدم', 'سكر مرتفع',
];

const PatientRegistration: React.FC = () => {
  const { currentUser } = useAuth();
  const { clinics, addPatient, settings, getNextTicketNumber } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [savedPatient, setSavedPatient] = useState<Patient | null>(null);
  const [complaintSuggestions, setComplaintSuggestions] = useState<string[]>([]);

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

  if (!settings.registrationOpen) {
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

  return (
    <PageLayout title="Patient Registration">
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
                <div className="absolute z-10 w-full bg-card border rounded-lg shadow-lg mt-1 max-h-32 overflow-y-auto">
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

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-heading text-success">✅ Patient Registered Successfully</DialogTitle>
          </DialogHeader>
          {savedPatient && (
            <div className="space-y-3 text-sm">
              <div className="text-center p-4 bg-primary/10 rounded-xl">
                <p className="text-xs text-muted-foreground">Ticket Number</p>
                <p className="text-3xl font-bold font-heading text-primary">{savedPatient.ticketNumber}</p>
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
    </PageLayout>
  );
};

export default PatientRegistration;
