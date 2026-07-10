'use client';

import { AuthGuard } from '@/components/common/AuthGuard';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-border bg-white md:block">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-bold text-primary">AccrediAssist</h2>
            <p className="text-xs text-muted">Accreditation Management</p>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-sm ${
                      pathname === item.href
                        ? 'bg-primary text-white'
                        : 'text-foreground hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted">{user?.role}</p>
            </div>
          </header>
          <main className="flex-1 bg-secondary p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
