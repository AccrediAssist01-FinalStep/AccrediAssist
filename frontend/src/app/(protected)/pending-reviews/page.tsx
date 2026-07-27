'use client';

import { PageHeader } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/common/EmptyState';
import { NoPendingIllustration } from '@/components/illustrations';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table';

export default function PendingReviewsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Pending Reviews"
        description="Review and approve records submitted via WhatsApp and manual entry."
        action={<Badge variant="warning">Review Queue</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            illustration={<NoPendingIllustration className="size-32" />}
            title="No pending reviews"
            description="All records have been reviewed. New submissions from WhatsApp will appear here."
          />
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted">
              Connect to backend to load pending records
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
