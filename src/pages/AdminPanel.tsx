import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, Building2, Settings, UserCog, Plus, Trash2, Edit, Download, PauseCircle, PlayCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Clinic, StudentAssignment } from '@/lib/types';
import PageLayout from '@/components/PageLayout';

const AdminPanel: React.FC = () => {
  const { currentUser, users, updateUser, deleteUser } = useAuth();
  const { clinics, addClinic, updateClinic, deleteClinic, settings, updateSettings, patients, getClinicStats } = useData();
  const { toast } = useToast();
  const [clinicDialog, setClinicDialog] = useState(false);
  const [editClinic, setEditClinic] = useState<Partial<Clinic>>({ name: '', nameAr: '', doctorName: '', isActive: true });
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);

  if (currentUser?.role !== 'admin') {
    return <PageLayout title="Admin Panel"><p className="text-center text-destructive">Access Denied</p></PageLayout>;
  }

  const stats = getClinicStats();
  const totalPatients = patients.length;
  const totalExamined = patients.filter(p => p.examined).length;
  const studentUsers = users.filter(u => u.role === 'student');

  const handleSaveClinic = () => {
    if (!editClinic.name || !editClinic.nameAr) return;
    if (editingClinicId) {
      updateClinic(editingClinicId, editClinic);
      toast({ title: 'Updated', description: 'Clinic updated' });
    } else {
      addClinic(editClinic as Omit<Clinic, 'id'>);
      toast({ title: 'Added', description: 'Clinic added' });
    }
    setClinicDialog(false);
    setEditClinic({ name: '', nameAr: '', doctorName: '', isActive: true });
    setEditingClinicId(null);
  };

  const handleExportData = () => {
    const data = JSON.stringify(patients, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Patient data exported' });
  };

  return (
    <PageLayout title="Admin Panel">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="clinics"><Building2 className="w-4 h-4 mr-1" /> Clinics</TabsTrigger>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Users</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card"><CardContent className="p-4 text-center">
              <p className="text-3xl font-bold font-heading text-foreground">{totalPatients}</p>
              <p className="text-xs text-muted-foreground">Total Patients</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="p-4 text-center">
              <p className="text-3xl font-bold font-heading text-foreground">{totalPatients - totalExamined}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="p-4 text-center">
              <p className="text-3xl font-bold font-heading text-success">{totalExamined}</p>
              <p className="text-xs text-muted-foreground">Examined</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="p-4 text-center">
              <p className="text-3xl font-bold font-heading text-foreground">{studentUsers.filter(u => u.isActive).length}</p>
              <p className="text-xs text-muted-foreground">Active Students</p>
            </CardContent></Card>
          </div>

          <Card className="glass-card">
            <CardHeader><CardTitle className="font-heading text-sm">Clinic Statistics</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.map(s => (
                  <div key={s.clinicId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-sm text-foreground">{s.clinicName}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="border-warning text-warning">Waiting: {s.waiting}</Badge>
                      <Badge variant="outline" className="border-success text-success">Done: {s.examined}</Badge>
                      <Badge variant="secondary">Total: {s.total}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleExportData} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export All Patient Data
          </Button>
        </TabsContent>

        <TabsContent value="clinics" className="space-y-4">
          <Button onClick={() => { setEditingClinicId(null); setEditClinic({ name: '', nameAr: '', doctorName: '', isActive: true }); setClinicDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Clinic
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinics.map(c => (
              <Card key={c.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{c.nameAr} - {c.name}</h4>
                      <p className="text-sm text-muted-foreground">Doctor: {c.doctorName || 'Not assigned'}</p>
                      <Badge variant={c.isActive ? 'default' : 'secondary'} className="mt-1">{c.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingClinicId(c.id); setEditClinic(c); setClinicDialog(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { deleteClinic(c.id); toast({ title: 'Deleted' }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="font-heading text-sm">Student Accounts</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">{u.fullName} ({u.username})</p>
                      <p className="text-xs text-muted-foreground">
                        {u.assignment || 'Unassigned'} {u.isActive && '• Online'}
                        {u.loginTime && ` • Login: ${new Date(u.loginTime).toLocaleTimeString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={u.assignment || ''} onValueChange={(v) => updateUser(u.id, { assignment: v as StudentAssignment })}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Assign" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="registration">Registration</SelectItem>
                          <SelectItem value="vitals">Vital Signs</SelectItem>
                          <SelectItem value="clinic">Clinic Report</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { deleteUser(u.id); toast({ title: 'User deleted' }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {studentUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No student accounts</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="font-heading text-sm">System Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-foreground">Patient Registration</p>
                  <p className="text-xs text-muted-foreground">{settings.registrationOpen ? 'Open' : 'Closed'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {settings.registrationOpen ? <PlayCircle className="w-5 h-5 text-success" /> : <PauseCircle className="w-5 h-5 text-destructive" />}
                  <Switch checked={settings.registrationOpen} onCheckedChange={v => updateSettings({ registrationOpen: v })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rotation Time (minutes)</Label>
                <Input type="number" value={settings.rotationTimeMinutes} onChange={e => updateSettings({ rotationTimeMinutes: parseInt(e.target.value) || 30 })} className="max-w-32 h-10" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={clinicDialog} onOpenChange={setClinicDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingClinicId ? 'Edit' : 'Add'} Clinic</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name (English)</Label>
              <Input value={editClinic.name} onChange={e => setEditClinic(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Name (Arabic)</Label>
              <Input value={editClinic.nameAr} onChange={e => setEditClinic(prev => ({ ...prev, nameAr: e.target.value }))} dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <Label>Doctor Name</Label>
              <Input value={editClinic.doctorName} onChange={e => setEditClinic(prev => ({ ...prev, doctorName: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editClinic.isActive} onCheckedChange={v => setEditClinic(prev => ({ ...prev, isActive: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveClinic}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default AdminPanel;
