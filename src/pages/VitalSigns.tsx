import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Save, HeartPulse, CheckCircle2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VitalRanges } from '@/lib/types';
import PageLayout from '@/components/PageLayout';

const getBPStatus = (sys: number, dia: number, ranges: VitalRanges) => {
  if (sys > ranges.bp.emergencySys || dia > ranges.bp.emergencyDia) return { label: '🚨 Emergency', className: 'vital-emergency' };
  if (sys >= ranges.bp.veryHighSysMin || dia >= ranges.bp.veryHighDiaMin) return { label: '🔴 Very High', className: 'vital-very-high' };
  if ((sys >= ranges.bp.highSysMin && sys <= ranges.bp.highSysMax) || (dia >= ranges.bp.highDiaMin && dia <= ranges.bp.highDiaMax)) return { label: '🟠 High', className: 'vital-high' };
  if (sys >= ranges.bp.elevatedSysMin && sys <= ranges.bp.elevatedSysMax && dia < ranges.bp.normalDiaMax) return { label: '🟡 Elevated', className: 'vital-elevated' };
  if (sys < ranges.bp.normalSysMax && dia < ranges.bp.normalDiaMax) return { label: '🟢 Normal', className: 'vital-normal' };
  return { label: '🟡 Elevated', className: 'vital-elevated' };
};

const getSugarStatus = (val: number, ranges: VitalRanges) => {
  if (val < ranges.sugar.low) return { label: '🔵 Low', className: 'vital-low' };
  if (val <= ranges.sugar.normalMax) return { label: '🟢 Normal', className: 'vital-normal' };
  if (val <= ranges.sugar.highMax) return { label: '🟡 High', className: 'vital-elevated' };
  return { label: '🔴 Very High', className: 'vital-very-high' };
};

const getPulseStatus = (val: number, ranges: VitalRanges) => {
  if (val < ranges.pulse.low) return { label: '🔵 Low', className: 'vital-low' };
  if (val <= ranges.pulse.normalMax) return { label: '🟢 Normal', className: 'vital-normal' };
  if (val <= ranges.pulse.highMax) return { label: '🟡 High', className: 'vital-elevated' };
  return { label: '🔴 Very High', className: 'vital-very-high' };
};

const VitalSigns: React.FC = () => {
  const { currentUser } = useAuth();
  const { updatePatient, settings, patients, searchPatients } = useData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [form, setForm] = useState({ systolic: '', diastolic: '', sugar: '', pulse: '', pastHistory: '', note: '' });

  const referredPatients = patients.filter(p => p.referToVitals);
  const waitingVitals = referredPatients.filter(p => !p.vitalsCompleted);
  const completedVitals = referredPatients.filter(p => p.vitalsCompleted);
  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const filteredPatients = searchQuery ? searchPatients(searchQuery).filter(p => p.referToVitals) : referredPatients;

  const handleSelectPatient = (id: string) => {
    const p = patients.find(pt => pt.id === id);
    setSelectedPatientId(id);
    if (p) {
      setForm({
        systolic: p.bloodPressureSystolic?.toString() || '',
        diastolic: p.bloodPressureDiastolic?.toString() || '',
        sugar: p.bloodSugar?.toString() || '',
        pulse: p.pulse?.toString() || '',
        pastHistory: p.pastHistory || '',
        note: p.vitalsNote || '',
      });
    }
  };

  const handleSave = () => {
    if (!selectedPatientId) return;
    updatePatient(selectedPatientId, {
      bloodPressureSystolic: form.systolic ? parseInt(form.systolic) : undefined,
      bloodPressureDiastolic: form.diastolic ? parseInt(form.diastolic) : undefined,
      bloodSugar: form.sugar ? parseInt(form.sugar) : undefined,
      pulse: form.pulse ? parseInt(form.pulse) : undefined,
      pastHistory: form.pastHistory || undefined,
      vitalsNote: form.note || undefined,
      vitalsBy: currentUser?.fullName,
      vitalsAt: new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' }),
      vitalsCompleted: true,
    });
    toast({ title: 'Saved', description: 'Vital signs recorded successfully' });
    setSelectedPatientId(null);
    setForm({ systolic: '', diastolic: '', sugar: '', pulse: '', pastHistory: '', note: '' });
  };

  const ranges = settings.vitalRanges;
  const bpStatus = form.systolic && form.diastolic ? getBPStatus(parseInt(form.systolic), parseInt(form.diastolic), ranges) : null;
  const sugarStatus = form.sugar ? getSugarStatus(parseInt(form.sugar), ranges) : null;
  const pulseStatus = form.pulse ? getPulseStatus(parseInt(form.pulse), ranges) : null;

  return (
    <PageLayout title="Vital Signs Data">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: search & patient list */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-heading">Search Patient</CardTitle></CardHeader>
            <CardContent>
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by ticket or name..." className="h-10" />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-heading">Waiting ({waitingVitals.length})</CardTitle></CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1">
              {(searchQuery ? filteredPatients.filter(p => !p.vitalsCompleted) : waitingVitals).map(p => (
                <button key={p.id} onClick={() => handleSelectPatient(p.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPatientId === p.id ? 'bg-primary/10 border-primary' : 'status-waiting'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{p.fullNameAr}</span>
                    <Badge variant="outline" className="text-xs font-bold">{p.ticketNumber}</Badge>
                  </div>
                  <p className="text-xs mt-1 opacity-70">{p.clinicName}</p>
                </button>
              ))}
              {waitingVitals.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No patients waiting</p>}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-heading">Completed ({completedVitals.length})</CardTitle></CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1">
              {(searchQuery ? filteredPatients.filter(p => p.vitalsCompleted) : completedVitals).map(p => (
                <button key={p.id} onClick={() => handleSelectPatient(p.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPatientId === p.id ? 'bg-primary/10 border-primary' : 'status-completed'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{p.fullNameAr}</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      <Badge variant="outline" className="text-xs font-bold">{p.ticketNumber}</Badge>
                    </div>
                  </div>
                  <p className="text-xs mt-1 opacity-70">{p.clinicName}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <HeartPulse className="w-5 h-5 text-accent" />
                  {selectedPatient.fullNameAr} — Ticket #{selectedPatient.ticketNumber}
                  {selectedPatient.vitalsCompleted && <Badge className="bg-success text-success-foreground ml-2">Completed</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p><span className="text-muted-foreground">Complaint:</span> {selectedPatient.mainComplaint}</p>
                  <p><span className="text-muted-foreground">Clinic:</span> {selectedPatient.clinicName}</p>
                  <p><span className="text-muted-foreground">Age:</span> {selectedPatient.age}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Pressure (Systolic)</Label>
                    <Input type="number" value={form.systolic} onChange={e => setForm(f => ({ ...f, systolic: e.target.value }))} placeholder="e.g. 120" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Pressure (Diastolic)</Label>
                    <Input type="number" value={form.diastolic} onChange={e => setForm(f => ({ ...f, diastolic: e.target.value }))} placeholder="e.g. 80" className="h-10" />
                  </div>
                  <div className="flex items-end">
                    {bpStatus && <p className={`text-lg font-bold ${bpStatus.className}`}>{bpStatus.label}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Random Blood Sugar (mg/dL)</Label>
                    <Input type="number" value={form.sugar} onChange={e => setForm(f => ({ ...f, sugar: e.target.value }))} placeholder="e.g. 100" className="h-10" />
                  </div>
                  <div className="flex items-end">
                    {sugarStatus && <p className={`text-lg font-bold ${sugarStatus.className}`}>{sugarStatus.label}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Pulse (bpm)</Label>
                    <Input type="number" value={form.pulse} onChange={e => setForm(f => ({ ...f, pulse: e.target.value }))} placeholder="e.g. 72" className="h-10" />
                  </div>
                  <div className="flex items-end">
                    {pulseStatus && <p className={`text-lg font-bold ${pulseStatus.className}`}>{pulseStatus.label}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Past History</Label>
                  <Textarea value={form.pastHistory} onChange={e => setForm(f => ({ ...f, pastHistory: e.target.value }))} placeholder="Previous medical history..." dir="rtl" />
                </div>

                <div className="space-y-2">
                  <Label>Note</Label>
                  <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Additional notes..." dir="rtl" />
                </div>

                <div className="text-sm text-muted-foreground">Student: {currentUser?.fullName}</div>

                <Button onClick={handleSave} className="w-full h-11 font-semibold">
                  <Save className="w-4 h-4 mr-2" /> {selectedPatient.vitalsCompleted ? 'Update' : 'Save'} Vital Signs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <HeartPulse className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a patient from the list or search by ticket number/name</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default VitalSigns;
