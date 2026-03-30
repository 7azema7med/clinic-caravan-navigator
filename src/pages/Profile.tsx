import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { StudentAssignment } from '@/lib/types';
import { User as UserIcon, Save } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

const Profile: React.FC = () => {
  const { currentUser, updateProfile, setAssignment } = useAuth();
  const { clinics } = useData();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: currentUser?.fullName || '',
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    studentCode: currentUser?.studentCode || '',
    password: '',
    confirmPassword: '',
  });

  const [assignment, setAssignmentLocal] = useState<string>(currentUser?.assignment || '');
  const [selectedClinic, setSelectedClinic] = useState(currentUser?.assignedClinic || '');

  const activeClinics = clinics.filter(c => c.isActive);

  const handleSaveProfile = () => {
    if (form.password && form.password !== form.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    const updates: Record<string, string | undefined> = {
      fullName: form.fullName,
      username: form.username,
      email: form.email,
      studentCode: form.studentCode || undefined,
    };
    if (form.password) updates.password = form.password;
    updateProfile(updates);
    toast({ title: 'Saved', description: 'Profile updated successfully' });
  };

  const handleSaveAssignment = () => {
    if (!assignment) return;
    setAssignment(assignment as StudentAssignment, assignment === 'clinic' ? selectedClinic : undefined);
    toast({ title: 'Updated', description: 'Assignment changed successfully' });
  };

  if (!currentUser) return null;

  return (
    <PageLayout title="Profile">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <UserIcon className="w-5 h-5 text-primary" /> Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Student Code</Label>
                <Input value={form.studentCode} onChange={e => setForm(f => ({ ...f, studentCode: e.target.value }))} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Password (leave blank to keep)</Label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} className="h-10" />
              </div>
            </div>
            <Button onClick={handleSaveProfile} className="w-full h-10">
              <Save className="w-4 h-4 mr-2" /> Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-sm">Change Assignment / Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Assignment</Label>
              <Select value={assignment} onValueChange={setAssignmentLocal}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Choose position" /></SelectTrigger>
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
            <Button onClick={handleSaveAssignment} className="w-full h-10" disabled={!assignment || (assignment === 'clinic' && !selectedClinic)}>
              <Save className="w-4 h-4 mr-2" /> Save Assignment
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Profile;
