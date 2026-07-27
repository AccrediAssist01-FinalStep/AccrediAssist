'use client';

import { FileText, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const reportTypes = [
  { title: 'Monthly Report', description: 'Comprehensive monthly accreditation summary' },
  { title: 'Placement Report', description: 'Student placement statistics and company details' },
  { title: 'Internship Report', description: 'Internship completion and company analytics' },
  { title: 'Faculty Achievement Report', description: 'Faculty awards, publications, and patents' },
  { title: 'Event Report', description: 'Workshops, seminars, and industrial visits' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Generate and download accreditation reports for NAAC/NBA compliance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Card key={report.title} className="group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <FileText className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription className="mt-1">{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2" disabled>
                <Download className="size-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmptyState
        title="Report generation coming soon"
        description="Connect report templates to generate PDF and Excel exports for accreditation submissions."
      />
    </div>
  );
}
