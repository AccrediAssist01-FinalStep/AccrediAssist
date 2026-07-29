import { redirect } from 'next/navigation';
import { LEGACY_ROUTE_REDIRECTS } from '@/config/modules';

export default function LegacyEventReportsRedirect() {
  redirect(LEGACY_ROUTE_REDIRECTS['/event-reports']);
}
