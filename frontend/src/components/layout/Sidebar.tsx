'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/branding/Logo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  ACCOUNT_NAV_ITEMS,
  ALL_SUBMODULES,
  LOGOUT_NAV_ITEM,
  MODULE_NAV_GROUPS,
  SYSTEM_NAV_ITEMS,
  TOP_NAV_ITEMS,
  type NavGroup,
  type NavItem,
} from '@/config/modules';
import { canAccessRoute } from '@/lib/permissions';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigationStore } from '@/hooks/use-navigation-store';
import { useSidebarStore } from '@/hooks/use-sidebar';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isCollapsed, toggleCollapsed, openGroups, toggleGroup, setGroupOpen } = useSidebarStore();
  const setPendingPath = useNavigationStore((state) => state.setPendingPath);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
    setPendingPath(null);
  }, [pathname, setPendingPath]);

  useEffect(() => {
    for (const group of MODULE_NAV_GROUPS) {
      const isActive = group.items.some(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
      );
      if (isActive) {
        setGroupOpen(group.id, true);
      }
    }
  }, [pathname, setGroupOpen]);

  const renderNavItem = (item: NavItem, nested = false) => {
    if (!canAccessRoute(user?.role, item.permission)) return null;

    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const isLoading = pendingHref === item.href && pathname !== item.href;
    const Icon = item.icon;

    const link = (
      <Link
        href={item.href}
        prefetch
        onClick={() => {
          if (pathname !== item.href) {
            setPendingHref(item.href);
            setPendingPath(item.href);
          }
          onNavigate?.();
        }}
        aria-current={isActive ? 'page' : undefined}
        aria-busy={isLoading || undefined}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
          nested && !isCollapsed && 'pl-9 py-2 text-[13px]',
          isActive
            ? 'gradient-primary text-white shadow-soft'
            : 'text-muted hover:bg-accent hover:text-foreground',
          isCollapsed && !nested && 'justify-center px-2',
          isLoading && 'opacity-80',
        )}
      >
        {isLoading ? (
          <Loader2 className={cn('size-[16px] shrink-0 animate-spin', isActive && 'text-white')} />
        ) : (
          <Icon className={cn('size-[16px] shrink-0', isActive && 'text-white', !nested && 'size-[18px]')} />
        )}
        {(!isCollapsed || nested) && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (isCollapsed && !nested) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{link}</div>;
  };

  const renderNavGroup = (group: NavGroup) => {
    const visibleItems = group.items.filter((item) => canAccessRoute(user?.role, item.permission));
    if (visibleItems.length === 0) return null;

    const isOpen = openGroups[group.id] ?? group.defaultOpen ?? false;
    const isGroupActive = visibleItems.some(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
    const GroupIcon = group.icon;

    if (isCollapsed) {
      return (
        <div key={group.id} className="space-y-1">
          {visibleItems.map((item) => renderNavItem(item, true))}
        </div>
      );
    }

    return (
      <div key={group.id} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleGroup(group.id)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors',
            isGroupActive ? 'text-primary' : 'text-foreground hover:bg-accent',
          )}
        >
          <GroupIcon className="size-[18px] shrink-0" />
          <span className="flex-1 truncate">{group.label}</span>
          <ChevronDown className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 pb-1">{visibleItems.map((item) => renderNavItem(item, true))}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-card transition-all duration-300',
        isCollapsed ? 'w-[72px]' : 'w-72',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-border px-4', isCollapsed && 'justify-center px-2')}>
        <Logo showText={!isCollapsed} size={isCollapsed ? 'sm' : 'md'} />
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {!isCollapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Overview</p>
          )}
          {TOP_NAV_ITEMS.map((item) => renderNavItem(item))}

          <Separator className="my-3" />

          {!isCollapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">ERP Modules</p>
          )}
          <div className="space-y-3">{MODULE_NAV_GROUPS.map(renderNavGroup)}</div>

          <Separator className="my-3" />

          {!isCollapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Tools</p>
          )}
          {SYSTEM_NAV_ITEMS.map((item) => renderNavItem(item))}

          <Separator className="my-4" />

          {!isCollapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Account</p>
          )}
          {ACCOUNT_NAV_ITEMS.map((item) => renderNavItem(item))}
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-3">
        <div className="mb-2">{renderNavItem(LOGOUT_NAV_ITEM)}</div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-accent hover:text-foreground"
        >
          {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    'pending-reviews': 'Pending Reviews',
    'student-activities': 'Student Activities',
    'faculty-activities': 'Faculty Activities',
    'department-activities': 'Department Activities',
    search: 'Smart Search',
    reports: 'Reports',
    analytics: 'Analytics',
    notifications: 'Notifications',
    profile: 'Profile',
    settings: 'Settings',
  };

  for (const submodule of ALL_SUBMODULES) {
    labels[submodule.slug] = submodule.label;
  }

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted">
      <Link href="/dashboard" className="transition-colors hover:text-foreground">
        Home
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            {isLast ? (
              <span className="font-medium text-foreground">{labels[segment] ?? segment}</span>
            ) : (
              <Link href={href} className="transition-colors hover:text-foreground">
                {labels[segment] ?? segment}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
