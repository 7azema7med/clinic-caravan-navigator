import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudentAssignment } from '@/lib/types';

const Register: React.FC = () => {
  const [step, setStep] = useState<'register' | 'assign'>('register');
  const [form, setForm] = useState({ username: '', email: '', studentCode: '', password: '', confirmPassword: '', fullName: '' });
  const [assignment, setAssignment] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const { register, login, setAssignment: setUserAssignment } = useAuth();
  const { clinics } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const activeClinics = clinics.filter(c => c.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (register({ username: form.username, email: form.email, studentCode: form.studentCode || undefined, password: form.password, fullName: form.fullName })) {
      login(form.username, form.password);
      setStep('assign');
    } else {
      toast({ title: 'Error', description: 'Username or email already exists', variant: 'destructive' });
    }
  };

  const handleAssign = () => {
    if (!assignment) return;
    setUserAssignment(assignment as StudentAssignment, assignment === 'clinic' ? selectedClinic : undefined);
    toast({ title: 'Welcome!', description: 'Account created and position set!' });
    navigate('/dashboard');
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center medical-gradient p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/20 backdrop-blur-sm mb-3">
              <Stethoscope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-primary-foreground">
              {step === 'register' ? 'Create Account' : 'Choose Your Position'}
            </h1>
          </div>
          <Card className="glass-card border-0 shadow-2xl">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg font-heading">
                {step === 'register' ? 'Register' : 'Select Assignment'}
              </CardTitle>
              <CardDescription>
                {step === 'register' ? 'Fill in your details to create an account' : 'Choose where you will work in the caravan'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'register' ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" value={form.fullName} onChange={e => update('fullName', e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="username">Username *</Label>
                    <Input id="username" value={form.username} onChange={e => update('username', e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="studentCode">Student Code (optional)</Label>
                    <Input id="studentCode" value={form.studentCode} onChange={e => update('studentCode', e.target.value)} className="h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Password *</Label>
                      <Input id="password" type="password" value={form.password} onChange={e => update('password', e.target.value)} required className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Confirm *</Label>
                      <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required className="h-10" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10 font-semibold">
                    <UserPlus className="w-4 h-4 mr-2" /> Register
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Position / Assignment</Label>
                    <Select value={assignment} onValueChange={setAssignment}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Choose your position" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registration">Patient Registration</SelectItem>
                        <SelectItem value="vitals">Vital Signs</SelectItem>
                        <SelectItem value="clinic">Patient Report Clinic</SelectItem>
                        <SelectItem value="research">Research Questionnaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {assignment === 'clinic' && (
                    <div className="space-y-2">
                      <Label>Clinic</Label>
                      <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select clinic" /></SelectTrigger>
                        <SelectContent>
                          {activeClinics.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.nameAr} - {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button onClick={handleAssign} className="w-full h-10 font-semibold" disabled={!assignment || (assignment === 'clinic' && !selectedClinic)}>
                    Continue to Dashboard
                  </Button>
                </div>
              )}
              {step === 'register' && (
                <div className="mt-3 text-center">
                  <Link to="/" className="text-sm text-primary hover:underline">Already have an account? Sign in</Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="footer-credit medical-gradient-dark text-primary-foreground/70 border-t-0">
        This system was programmed and developed by Hazem Ahmed © 2026
      </div>
    </div>
  );
};

export default Register;
