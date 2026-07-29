import { redirect } from 'next/navigation';
import { LEGACY_ROUTE_REDIRECTS } from '@/config/modules';

export default function LegacyPublicationsRedirect() {
  redirect(LEGACY_ROUTE_REDIRECTS['/publications']);
}
