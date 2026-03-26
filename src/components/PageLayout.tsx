import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity } from 'lucide-react';

const PageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="medical-gradient px-6 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Activity className="w-6 h-6 text-primary-foreground" />
            <h1 className="text-lg font-bold font-heading text-primary-foreground">{title}</h1>
          </div>
          <p className="text-sm text-primary-foreground/70">{currentUser?.fullName}</p>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {children}
      </main>
      <div className="footer-credit">
        This system was programmed and developed by Hazem Ahmed © 2026
      </div>
    </div>
  );
};

export default PageLayout;
