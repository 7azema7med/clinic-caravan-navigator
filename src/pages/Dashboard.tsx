import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { StudentAssignment } from '@/lib/types';
import { ClipboardList, HeartPulse, FileText, ScrollText, LogOut, Timer, Shield, Users, Activity, User as UserIcon, AlertTriangle, ArrowLeftRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentUser, logout, setAssignment, users } = useAuth();
  const { clinics, getClinicStats, settings, switchRequests, addSwitchRequest, updateSwitchRequest } = useData();
  const navigate = useNavigate();
  const [selectedClinic, setSelectedClinic] = useState('');
  const [elapsed, setElapsed] = useState('00:00:00');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [rotationExpired, setRotationExpired] = useState(false);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [switchTarget, setSwitchTarget] = useState('');

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    const start = currentUser.loginTime ? new Date(currentUser.loginTime).getTime() : Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      setElapsedMs(diff);
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
      if (settings.rotationTimeMinutes > 0 && diff >= settings.rotationTimeMinutes * 60000) {
        setRotationExpired(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser, navigate, settings.rotationTimeMinutes]);

  if (!currentUser) return null;

  const stats = getClinicStats();
  const totalPatients = stats.reduce((sum, s) => sum + s.total, 0);
  const totalWaiting = stats.reduce((sum, s) => sum + s.waiting, 0);

  const handleGoTo = (assignment: StudentAssignment) => {
    if (assignment === 'clinic' && !selectedClinic) return;
    setAssignment(assignment, assignment === 'clinic' ? selectedClinic : undefined);
    const routes: Record<StudentAssignment, string> = {
      registration: '/registration',
      vitals: '/vitals',
      clinic: '/clinic-report',
      research: '/research',
    };
    navigate(routes[assignment]);
  };

  const activeClinics = clinics.filter(c => c.isActive);
  const otherUsers = users.filter(u => u.id !== currentUser.id && u.role === 'student' && u.isActive);
  const pendingRequests = switchRequests.filter(r => r.toUserId === currentUser.id && r.status === 'pending');

  const handleSwitchRequest = () => {
    if (!switchTarget) return;
    const target = users.find(u => u.id === switchTarget);
    if (!target) return;
    addSwitchRequest({
      fromUserId: currentUser.id,
      fromUserName: currentUser.fullName,
      fromAssignment: currentUser.assignment || 'registration',
      fromClinicId: currentUser.assignedClinic,
      toUserId: target.id,
      toUserName: target.fullName,
      toAssignment: target.assignment || 'registration',
      toClinicId: target.assignedClinic,
    });
    setShowSwitchDialog(false);
    setSwitchTarget('');
  };

  const handleAcceptSwitch = (reqId: string) => {
    updateSwitchRequest(reqId, 'accepted');
    const req = switchRequests.find(r => r.id === reqId);
    if (req) {
      setAssignment(req.fromAssignment, req.fromClinicId);
    }
  };

  const sections = [
    { key: 'registration' as StudentAssignment, icon: ClipboardList, title: 'Patient Registration', desc: 'Register new patients', color: 'bg-primary' },
    { key: 'vitals' as StudentAssignment, icon: HeartPulse, title: 'Vital Signs', desc: 'Record vital signs data', color: 'bg-accent' },
    { key: 'clinic' as StudentAssignment, icon: FileText, title: 'Patient Report Clinic', desc: 'Examine & manage patients', color: 'bg-success' },
    { key: 'research' as StudentAssignment, icon: ScrollText, title: 'Research Questionnaire', desc: 'Research data collection', color: 'bg-info' },
  ];

  const rotationMinutes = settings.rotationTimeMinutes;
  const remainingMs = Math.max(0, rotationMinutes * 60000 - elapsedMs);
  const remainMin = Math.floor(remainingMs / 60000);
  const remainSec = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Rotation expired banner */}
      {rotationExpired && (
        <div className="bg-destructive text-destructive-foreground px-4 py-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">⏰ Rotation time ended! Time to switch positions.</span>
          </div>
          <Button size="sm" variant="outline" className="border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground/10" onClick={() => setShowSwitchDialog(true)}>
            <ArrowLeftRight className="w-4 h-4 mr-1" /> Request Switch
          </Button>
        </div>
      )}

      {/* Pending switch requests */}
      {pendingRequests.map(req => (
        <div key={req.id} className="bg-warning/20 border-b border-warning px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium">🔄 {req.fromUserName} wants to switch positions with you ({req.fromAssignment} ↔ {req.toAssignment})</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleAcceptSwitch(req.id)}>Accept</Button>
            <Button size="sm" variant="outline" onClick={() => updateSwitchRequest(req.id, 'rejected')}>Reject</Button>
          </div>
        </div>
      ))}

      <header className="medical-gradient px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-7 h-7 text-primary-foreground" />
            <div>
              <h1 className="text-xl font-bold font-heading text-primary-foreground">Medical Caravan System</h1>
              <p className="text-xs text-primary-foreground/70">Welcome, {currentUser.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <Timer className="w-4 h-4" />
              <span className="font-mono text-sm">{elapsed}</span>
              {rotationMinutes > 0 && !rotationExpired && (
                <span className="text-xs opacity-70">({remainMin}:{String(remainSec).padStart(2, '0')} left)</span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="text-primary-foreground hover:bg-primary-foreground/10">
              <UserIcon className="w-5 h-5" />
            </Button>
            {currentUser.role === 'admin' && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Shield className="w-4 h-4 mr-1" /> Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }} className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold font-heading text-foreground">{totalPatients}</p>
              <p className="text-xs text-muted-foreground">Total Patients</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-1 text-warning" />
              <p className="text-2xl font-bold font-heading text-foreground">{totalWaiting}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <HeartPulse className="w-6 h-6 mx-auto mb-1 text-success" />
              <p className="text-2xl font-bold font-heading text-foreground">{totalPatients - totalWaiting}</p>
              <p className="text-xs text-muted-foreground">Examined</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <FileText className="w-6 h-6 mx-auto mb-1 text-accent" />
              <p className="text-2xl font-bold font-heading text-foreground">{activeClinics.length}</p>
              <p className="text-xs text-muted-foreground">Active Clinics</p>
            </CardContent>
          </Card>
        </div>

        {/* Sections */}
        <h2 className="text-lg font-bold font-heading mb-4 text-foreground">Select Your Station</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {sections.map(sec => (
            <Card key={sec.key} className="glass-card hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${sec.color} text-primary-foreground group-hover:scale-110 transition-transform`}>
                    <sec.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold font-heading text-foreground">{sec.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{sec.desc}</p>
                    {sec.key === 'clinic' && (
                      <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                        <SelectTrigger className="mb-3 h-9">
                          <SelectValue placeholder="Select a clinic" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeClinics.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.nameAr} - {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" onClick={() => handleGoTo(sec.key)} disabled={sec.key === 'clinic' && !selectedClinic}>
                      Go to {sec.title}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Online users */}
        {otherUsers.length > 0 && (
          <>
            <h2 className="text-lg font-bold font-heading mb-4 text-foreground">Active Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              {otherUsers.map(u => {
                const uStart = u.loginTime ? new Date(u.loginTime).getTime() : Date.now();
                const uElapsed = Date.now() - uStart;
                const uRemain = Math.max(0, rotationMinutes * 60000 - uElapsed);
                const uMin = Math.floor(uRemain / 60000);
                const uSec = Math.floor((uRemain % 60000) / 1000);
                const uClinic = u.assignedClinic ? clinics.find(c => c.id === u.assignedClinic) : null;
                return (
                  <Card key={u.id} className="glass-card">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm text-foreground">{u.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.assignment === 'clinic' && uClinic ? `${uClinic.nameAr} Clinic` : u.assignment || 'Unassigned'}
                      </p>
                      {rotationMinutes > 0 && <p className="text-xs text-muted-foreground">⏱ {uMin}:{String(uSec).padStart(2, '0')} left</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Clinic stats */}
        <h2 className="text-lg font-bold font-heading mb-4 text-foreground">Clinic Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.map(s => (
            <Card key={s.clinicId} className="glass-card">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm text-foreground">{s.clinicName}</h4>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-xs border-warning text-warning">Waiting: {s.waiting}</Badge>
                  <Badge variant="outline" className="text-xs border-success text-success">Done: {s.examined}</Badge>
                  {s.absent > 0 && <Badge variant="outline" className="text-xs border-destructive text-destructive">Absent: {s.absent}</Badge>}
                  <Badge variant="secondary" className="text-xs">Total: {s.total}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <div className="footer-credit">
        This system was programmed and developed by Hazem Ahmed © 2026
      </div>

      {/* Switch dialog */}
      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Position Switch</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select a user to switch positions with:</p>
            <Select value={switchTarget} onValueChange={setSwitchTarget}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {otherUsers.map(u => {
                  const uClinic = u.assignedClinic ? clinics.find(c => c.id === u.assignedClinic) : null;
                  return (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName} — {u.assignment === 'clinic' && uClinic ? `${uClinic.nameAr} Clinic` : u.assignment || 'Unassigned'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleSwitchRequest} disabled={!switchTarget}>Send Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
