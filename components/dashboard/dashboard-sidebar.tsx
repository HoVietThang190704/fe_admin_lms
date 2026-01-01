'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  BookOpenCheck,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Menu,
  MessageSquare,
  Settings,
  Target,
  Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const SIDEBAR_ICON_MAP = {
  overview: LayoutDashboard,
  learning: GraduationCap,
  analytics: LineChart,
  courses: BookOpenCheck,
  tickets: LifeBuoy,
  communications: MessageSquare,
  community: Users,
  reports: LineChart,
  support: Headphones,
  targets: Target,
  settings: Settings,
  alerts: BellRing
} as const;

export type SidebarIconName = keyof typeof SIDEBAR_ICON_MAP;

export type DashboardSidebarNavItem = {
  label: string;
  href: string;
  icon: SidebarIconName;
  badge?: string;
};

type SupportContent = {
  label: string;
  title: string;
  description: string;
  cta: string;
};

type DashboardSidebarProps = {
  title: string;
  tagline: string;
  navItems: DashboardSidebarNavItem[];
  secondaryNavItems: DashboardSidebarNavItem[];
  support: SupportContent;
};

const resolveIcon = (icon: SidebarIconName) => SIDEBAR_ICON_MAP[icon] ?? LayoutDashboard;

export const isSidebarIconName = (value?: string): value is SidebarIconName => {
  if (!value) {
    return false;
  }
  return value in SIDEBAR_ICON_MAP;
};

export const DashboardSidebar = ({ title, tagline, navItems, secondaryNavItems, support }: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const navLinkBaseClass = 'flex items-center rounded-2xl text-sm font-medium transition';
  const navLinkSpacing = collapsed ? 'justify-center gap-0 px-2 py-3' : 'gap-3 px-4 py-3';

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-white/5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 py-8 transition-all duration-300',
        collapsed ? 'w-20 px-3' : 'w-72 px-6'
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn('transition-opacity duration-300', collapsed && 'opacity-0 pointer-events-none absolute h-0 w-0 overflow-hidden')}>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">{title}</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{tagline}</h2>
        </div>
        <button
          type="button"
          aria-pressed={collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-2xl border border-white/10 p-2 text-white/70 transition hover:bg-white/10"
        >
          <Menu className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-90')} />
        </button>
      </div>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const Icon = resolveIcon(item.icon);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(navLinkBaseClass, navLinkSpacing, 'text-white/80 hover:bg-white/10')}
            >
              <Icon className="h-4 w-4" />
              <span className={cn('flex-1', collapsed && 'sr-only')}>{item.label}</span>
              {item.badge && !collapsed ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest">{item.badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <nav className="mt-10 space-y-1 border-t border-white/5 pt-6">
        {secondaryNavItems.map((item) => {
          const Icon = resolveIcon(item.icon);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(navLinkBaseClass, navLinkSpacing, 'text-white/60 hover:bg-white/5')}
            >
              <Icon className="h-4 w-4" />
              <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={cn('mt-auto rounded-3xl bg-white/5 px-4 py-5 text-sm text-white transition-all duration-300', collapsed && 'opacity-0 pointer-events-none absolute h-0 w-0 overflow-hidden')}>
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">{support.label}</p>
        <p className="mt-2 text-base font-semibold text-white">{support.title}</p>
        <p className="mt-1 text-sm text-white/70">{support.description}</p>
        <Button variant="muted" className="mt-4 w-full rounded-2xl bg-white text-slate-900 hover:bg-white/90">
          {support.cta}
        </Button>
      </div>
    </aside>
  );
};
