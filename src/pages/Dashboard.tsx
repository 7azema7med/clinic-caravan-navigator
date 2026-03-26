import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StudentAssignment } from '@/lib/types';
import { ClipboardList, HeartPulse, FileText, ScrollText, LogOut, Timer, Shield, Users, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentUser, logout, setAssignment } = useAuth();
  const { clinics, getClinicStats } = useData();
  const navigate = useNavigate();
  const [selectedClinic, setSelectedClinic] = useState('');
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    const start = currentUser.loginTime ? new Date(currentUser.loginTime).getTime() : Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser, navigate]);

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

  const sections = [
    { key: 'registration' as StudentAssignment, icon: ClipboardList, title: 'Patient Registration', desc: 'Register new patients', color: 'bg-primary' },
    { key: 'vitals' as StudentAssignment, icon: HeartPulse, title: 'Vital Signs', desc: 'Record vital signs data', color: 'bg-accent' },
    { key: 'clinic' as StudentAssignment, icon: FileText, title: 'Patient Report Clinic', desc: 'Examine & manage patients', color: 'bg-success' },
    { key: 'research' as StudentAssignment, icon: ScrollText, title: 'Research Questionnaire', desc: 'Research data collection', color: 'bg-info' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
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
            </div>
            {currentUser.role === 'admin' && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Shield className="w-4 h-4 mr-1" /> Admin Panel
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

        {/* Clinic stats */}
        <h2 className="text-lg font-bold font-heading mb-4 text-foreground">Clinic Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.map(s => (
            <Card key={s.clinicId} className="glass-card">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm text-foreground">{s.clinicName}</h4>
                <div className="flex gap-3 mt-2">
                  <Badge variant="outline" className="text-xs border-warning text-warning">Waiting: {s.waiting}</Badge>
                  <Badge variant="outline" className="text-xs border-success text-success">Done: {s.examined}</Badge>
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
    </div>
  );
};

export default Dashboard;
