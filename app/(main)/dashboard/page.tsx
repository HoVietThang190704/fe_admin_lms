import { headers } from 'next/headers';
import { Activity, BookOpenCheck, GaugeCircle, Sparkles } from 'lucide-react';

import { DashboardView } from './dashboard-view';
import { fetchDashboardSummary } from '@/lib/services/home/dashboard';
import { createTranslator, getMessages, resolveLocale } from '@/lib/i18n';
import { getErrorMessage } from '@/lib/shared/utils/api';
import { buildSidebarContent } from '@/components/dashboard/sidebar-data';

const resolveRequestOrigin = (headerList: Headers) => {
  const protocol = headerList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = headerList.get('x-forwarded-host') || headerList.get('host');

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  return `${protocol}://${host}`;
};

export default async function DashboardPage() {
  const headerList = await headers();
  const localeHeader = headerList.get('accept-language');
  const locale = resolveLocale(localeHeader);
  const dictionary = getMessages(locale);
  const t = createTranslator(dictionary);
  const sidebarContent = buildSidebarContent(dictionary);
  const requestOrigin = resolveRequestOrigin(headerList);

  let dashboardData = null;
  let errorMessage: string | null = null;

  try {
    dashboardData = await fetchDashboardSummary({ baseUrl: requestOrigin });
  } catch (error) {
    errorMessage = getErrorMessage(error, 'Unable to load dashboard overview.');
  }

  const dashboardCopy = dictionary.dashboard ?? {};
  const heroCopy = dashboardCopy.hero ?? {};
  const statsCopy = dashboardCopy.stats ?? {};
  const sectionsCopy = dashboardCopy.sections ?? {};
  const statusCopy = dashboardCopy.statuses ?? {};
  const emptyCopy = dashboardCopy.empty ?? {};

  const userName = dashboardData?.user?.name || heroCopy.fallbackName || t('login.form.supportEmail', 'Admin');
  const hero = {
    title: (heroCopy.greeting || 'Welcome back, {name}!').replace('{name}', userName),
    subtitle: heroCopy.subtitle || 'Operations look stable. Keep monitoring live classes and assignments.',
    statusLabel: heroCopy.statusLabel || 'Global status',
    statusValue: heroCopy.statusValue || 'Optimal',
    primaryAction: heroCopy.primaryAction || 'View incidents',
    secondaryAction: heroCopy.secondaryAction || 'Download report'
  };

  const stats = [
    {
      key: 'enrolled',
      value: dashboardData?.stats?.enrolledCourses ?? 0,
      label: statsCopy.enrolled?.label || 'Active courses',
      caption: statsCopy.enrolled?.caption || 'Assigned to your pod',
      accent: 'from-emerald-500/10 to-emerald-500/5',
      icon: BookOpenCheck
    },
    {
      key: 'assignments',
      value: dashboardData?.stats?.pendingAssignments ?? 0,
      label: statsCopy.assignments?.label || 'Open assignments',
      caption: statsCopy.assignments?.caption || 'Need intervention',
      accent: 'from-amber-500/10 to-amber-500/5',
      icon: Activity
    },
    {
      key: 'grade',
      value: Number(dashboardData?.stats?.averageGrade ?? 0),
      label: statsCopy.averageGrade?.label || 'Average grade',
      caption: statsCopy.averageGrade?.caption || 'Weighted cohort score',
      accent: 'from-violet-500/10 to-violet-500/5',
      icon: GaugeCircle,
      suffix: '%'
    },
    {
      key: 'progress',
      value: dashboardData?.stats?.learningProgress ?? 0,
      label: statsCopy.progress?.label || 'Learning progress',
      caption: statsCopy.progress?.caption || 'Completion across classes',
      accent: 'from-sky-500/10 to-sky-500/5',
      icon: Sparkles,
      suffix: '%'
    }
  ];

  const normalizedSectionsCopy = {
    classes: {
      title: sectionsCopy.classes?.title || 'Monitored classes',
      subtitle: sectionsCopy.classes?.subtitle || 'Real-time signals from active cohorts',
      progressLabel: sectionsCopy.classes?.progressLabel || 'Progress',
      lessonProgress: sectionsCopy.classes?.lessonProgress || 'Lessons',
      empty: sectionsCopy.classes?.empty || emptyCopy.generic || 'No monitored classes yet.'
    },
    assignments: {
      title: sectionsCopy.assignments?.title || 'Assignments & tickets',
      subtitle: sectionsCopy.assignments?.subtitle || 'Track blockers that impact learners',
      deadlineLabel: sectionsCopy.assignments?.deadlineLabel || 'Due',
      empty: sectionsCopy.assignments?.empty || emptyCopy.generic || 'No open assignments.'
    },
    notifications: {
      title: sectionsCopy.notifications?.title || 'Notifications',
      subtitle: sectionsCopy.notifications?.subtitle || 'Latest alerts from the field',
      empty: sectionsCopy.notifications?.empty || emptyCopy.generic || 'You are fully caught up.'
    },
    courses: {
      title: sectionsCopy.courses?.title || 'Recommended courses',
      subtitle: sectionsCopy.courses?.subtitle || 'Surface content that deserves attention',
      capacityLabel: sectionsCopy.courses?.capacityLabel || 'seats',
      empty: sectionsCopy.courses?.empty || emptyCopy.generic || 'No highlighted courses.'
    }
  };

  const statusLabels = {
    pending: statusCopy.pending || 'Pending',
    inProgress: statusCopy.inProgress || 'In progress',
    completed: statusCopy.completed || 'Completed'
  };

  const emptyStateCopy = {
    generic: emptyCopy.generic || 'Nothing to display.'
  };

  return (
    <DashboardView
      data={dashboardData}
      locale={locale}
      sidebarContent={sidebarContent}
      hero={hero}
      stats={stats}
      sectionsCopy={normalizedSectionsCopy}
      statusCopy={statusLabels}
      emptyCopy={emptyStateCopy}
      errorMessage={errorMessage}
    />
  );
}
