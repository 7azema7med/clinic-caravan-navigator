import React from 'react';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

const Research: React.FC = () => {
  return (
    <PageLayout title="Research Questionnaire">
      <Card className="glass-card max-w-2xl mx-auto">
        <CardContent className="p-12 text-center text-muted-foreground">
          <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold text-foreground mb-2">Research Questionnaire</p>
          <p>Research questions can be configured by the admin (Hazem) from the Admin Panel. Questions will appear here once defined.</p>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Research;
