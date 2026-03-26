import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Save, HeartPulse } from 'lucide-react';
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
  const { getPatientByTicket, updatePatient, settings, patients } = useData();
  const { toast } = useToast();
  const [searchTicket, setSearchTicket] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [form, setForm] = useState({ systolic: '', diastolic: '', sugar: '', pulse: '', pastHistory: '', note: '' });

  const referredPatients = patients.filter(p => p.referToVitals && !p.vitalsCompleted);
  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const handleSearch = () => {
    const p = getPatientByTicket(searchTicket);
    if (p) {
      setSelectedPatientId(p.id);
      setForm({
        systolic: p.bloodPressureSystolic?.toString() || '',
        diastolic: p.bloodPressureDiastolic?.toString() || '',
        sugar: p.bloodSugar?.toString() || '',
        pulse: p.pulse?.toString() || '',
        pastHistory: p.pastHistory || '',
        note: p.vitalsNote || '',
      });
    } else {
      toast({ title: 'Not found', description: 'No patient with this ticket number', variant: 'destructive' });
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
    setSearchTicket('');
    setForm({ systolic: '', diastolic: '', sugar: '', pulse: '', pastHistory: '', note: '' });
  };

  const ranges = settings.vitalRanges;
  const bpStatus = form.systolic && form.diastolic ? getBPStatus(parseInt(form.systolic), parseInt(form.diastolic), ranges) : null;
  const sugarStatus = form.sugar ? getSugarStatus(parseInt(form.sugar), ranges) : null;
  const pulseStatus = form.pulse ? getPulseStatus(parseInt(form.pulse), ranges) : null;

  return (
    <PageLayout title="Vital Signs Data">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: search & waiting list */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-heading">Search Patient</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={searchTicket} onChange={e => setSearchTicket(e.target.value)} placeholder="Ticket number" className="h-10" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <Button size="icon" onClick={handleSearch}><Search className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-heading">Referred Patients ({referredPatients.length})</CardTitle></CardHeader>
            <CardContent className="max-h-96 overflow-y-auto space-y-2">
              {referredPatients.map(p => (
                <button key={p.id} onClick={() => { setSelectedPatientId(p.id); setForm({ systolic: '', diastolic: '', sugar: '', pulse: '', pastHistory: '', note: '' }); }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPatientId === p.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted border-border'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-foreground">{p.fullNameAr}</span>
                    <Badge variant="outline" className="text-xs">{p.ticketNumber}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.clinicName}</p>
                </button>
              ))}
              {referredPatients.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No patients waiting</p>}
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
                  {selectedPatient.fullNameAr} — {selectedPatient.ticketNumber}
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
                  <Save className="w-4 h-4 mr-2" /> Save Vital Signs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <HeartPulse className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a patient from the list or search by ticket number</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default VitalSigns;
