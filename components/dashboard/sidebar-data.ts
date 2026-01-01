import type { AppMessages } from '@/lib/i18n';
import { ROUTES } from '@/lib/shared/constants/routeres';
import type { DashboardSidebarNavItem, DashboardSidebarSupportContent } from '@/components/dashboard/dashboard-sidebar';

export type RawNavItem = {
  label?: string;
  href?: string;
  icon?: string;
  badge?: string;
};

const SIDEBAR_ICON_KEYS = [
  'overview',
  'learning',
  'analytics',
  'courses',
  'tickets',
  'communications',
  'community',
  'users',
  'reports',
  'support',
  'targets',
  'settings',
  'alerts'
] as const;

type SidebarIconKey = (typeof SIDEBAR_ICON_KEYS)[number];

const isSidebarIconName = (value?: string): value is SidebarIconKey => {
  if (!value) {
    return false;
  }
  return SIDEBAR_ICON_KEYS.includes(value as SidebarIconKey);
};

const createSidebarItems = (
  items: RawNavItem[] | undefined,
  defaults: DashboardSidebarNavItem
): DashboardSidebarNavItem[] => {
  const normalized = (items ?? []).map((item) => ({
    label: item?.label || defaults.label,
    href: item?.href || defaults.href,
    icon: isSidebarIconName(item?.icon) ? (item.icon as SidebarIconKey) : defaults.icon,
    badge: item?.badge
  }));

  if (normalized.length === 0) {
    return [{ ...defaults }];
  }

  return normalized;
};

export type SidebarContent = {
  title: string;
  tagline: string;
  navItems: DashboardSidebarNavItem[];
  secondaryNavItems: DashboardSidebarNavItem[];
  support: DashboardSidebarSupportContent;
};

export const buildSidebarContent = (dictionary: AppMessages): SidebarContent => {
  const dashboardCopy = dictionary.dashboard ?? {};
  const sidebarCopy = dashboardCopy.sidebar ?? {};

  const navItems = createSidebarItems(sidebarCopy.navigation as RawNavItem[] | undefined, {
    label: 'Overview',
    href: ROUTES.HOME,
    icon: 'overview'
  });

  const secondaryNavItems = createSidebarItems(sidebarCopy.secondaryNavigation as RawNavItem[] | undefined, {
    label: 'Settings',
    href: ROUTES.SETTINGS,
    icon: 'settings'
  });

  const support: DashboardSidebarSupportContent = {
    label: sidebarCopy.support?.label || 'Need help?',
    title: sidebarCopy.support?.title || 'Connect with operations',
    description: sidebarCopy.support?.description || 'Escalate incidents directly.',
    cta: sidebarCopy.support?.cta || 'Contact operations'
  };

  return {
    title: sidebarCopy.title || 'LMS Admin',
    tagline: sidebarCopy.tagline || 'Mission control',
    navItems,
    secondaryNavItems,
    support
  };
};
