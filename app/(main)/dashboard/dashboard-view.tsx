import { BellRing, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import type { SupportedLocale } from '@/lib/i18n';
import type { HomeDashboardPayload, HomeAssignmentSummary } from '@/lib/services/home/dashboard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminScaffold } from '@/components/layout/admin-scaffold';
import type { SidebarContent } from '@/components/dashboard/sidebar-data';

const ASSIGNMENT_STATUS_STYLES: Record<Exclude<HomeAssignmentSummary['status'], undefined>, string> = {
  pending: 'bg-amber-50 text-amber-900 border border-amber-100',
  'in-progress': 'bg-blue-50 text-blue-900 border border-blue-100',
  completed: 'bg-emerald-50 text-emerald-900 border border-emerald-100'
};

const clampPercentage = (value?: number) => Math.min(100, Math.max(0, value ?? 0));

const formatDate = (value: string, locale: string) => {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric'
  });
  return formatter.format(new Date(value));
};

const formatRelativeTime = (value: string, locale: string) => {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60]
  ];
  for (const [unit, divider] of units) {
    const amount = Math.round(diffMs / divider);
    if (Math.abs(amount) >= 1 || unit === 'minute') {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return rtf.format(amount, unit);
    }
  }
  return '';
};

type DashboardHero = {
  title: string;
  subtitle: string;
  statusLabel: string;
  statusValue: string;
  primaryAction: string;
  secondaryAction: string;
};

type DashboardStat = {
  key: string;
  value: number;
  label: string;
  caption: string;
  accent: string;
  icon: LucideIcon;
  suffix?: string;
};

type DashboardSectionsCopy = {
  classes: {
    title: string;
    subtitle: string;
    progressLabel: string;
    lessonProgress: string;
    empty: string;
  };
  assignments: {
    title: string;
    subtitle: string;
    deadlineLabel: string;
    empty: string;
  };
  notifications: {
    title: string;
    subtitle: string;
    empty: string;
  };
  courses: {
    title: string;
    subtitle: string;
    capacityLabel: string;
    empty: string;
  };
};

type DashboardStatusCopy = {
  pending: string;
  inProgress: string;
  completed: string;
};

type DashboardEmptyCopy = {
  generic: string;
};

type DashboardViewProps = {
  data: HomeDashboardPayload | null;
  locale: SupportedLocale;
  sidebarContent: SidebarContent;
  hero: DashboardHero;
  stats: DashboardStat[];
  sectionsCopy: DashboardSectionsCopy;
  statusCopy: DashboardStatusCopy;
  emptyCopy: DashboardEmptyCopy;
  errorMessage?: string | null;
};

export const DashboardView = ({
  data,
  locale,
  sidebarContent,
  hero,
  stats,
  sectionsCopy,
  statusCopy,
  emptyCopy,
  errorMessage
}: DashboardViewProps) => {
  const numberFormatter = new Intl.NumberFormat(locale);

  const assignmentStatusLabel = (status: HomeAssignmentSummary['status']) => {
    if (!status) return '';
    if (status === 'pending') return statusCopy.pending;
    if (status === 'in-progress') return statusCopy.inProgress;
    return statusCopy.completed;
  };

  return (
    <AdminScaffold sidebar={sidebarContent}>
      {errorMessage ? (
        <Alert variant="danger">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-4xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 px-6 py-8 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">{hero.statusLabel}</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">{hero.title}</h1>
            <p className="mt-3 text-base text-white/80">{hero.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">{hero.statusLabel}</p>
              <p className="text-2xl font-semibold text-emerald-300">{hero.statusValue}</p>
            </div>
            <div className="flex gap-3">
              <Button className="rounded-2xl bg-white/15 text-white shadow-lg hover:bg-white/25">{hero.primaryAction}</Button>
              <Button variant="muted" className="rounded-2xl bg-white text-slate-900 hover:bg-white/90">
                {hero.secondaryAction}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className={`rounded-3xl border border-white/60 bg-gradient-to-br ${item.accent} from-10% to-90% p-5 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {numberFormatter.format(item.value)}
                    {item.suffix || ''}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/70 p-2 text-slate-900">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">{item.caption}</p>
              {item.key === 'progress' ? (
                <div className="mt-4 h-1.5 w-full rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-slate-900" style={{ width: `${clampPercentage(item.value)}%` }} />
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Panel title={sectionsCopy.classes.title} description={sectionsCopy.classes.subtitle}>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {(data?.classes || []).slice(0, 4).map((clazz) => (
                      <div key={clazz.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>{clazz.courseCode}</span>
                          <span>{clazz.schedule}</span>
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">{clazz.courseName}</h3>
                        <p className="text-sm text-slate-500">{clazz.instructor}</p>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{sectionsCopy.classes.progressLabel}</span>
                            <span>{clampPercentage(clazz.progress)}%</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-slate-900" style={{ width: `${clampPercentage(clazz.progress)}%` }} />
                          </div>
                          <p className="mt-2 text-xs text-slate-400">{sectionsCopy.classes.lessonProgress} · {clazz.lessonProgress}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!data?.classes?.length ? (
                    <EmptyState message={sectionsCopy.classes.empty || emptyCopy.generic} />
                  ) : null}
                </Panel>

                <Panel
                  title={sectionsCopy.assignments.title}
                  description={sectionsCopy.assignments.subtitle}
                >
                  <div className="space-y-3">
                    {(data?.assignments || []).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex flex-col gap-2 rounded-3xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:gap-4"
                      >
                        <div className="flex-1">
                          <p className="text-base font-semibold text-slate-900">{assignment.title}</p>
                          <p className="text-xs text-slate-400">{assignment.courseCode}</p>
                        </div>
                        <div className="text-sm text-slate-500">
                          <p>{sectionsCopy.assignments.deadlineLabel}</p>
                          <p className="font-medium text-slate-900">{formatDate(assignment.deadline, locale)}</p>
                        </div>
                        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', ASSIGNMENT_STATUS_STYLES[assignment.status])}>
                          {assignmentStatusLabel(assignment.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!data?.assignments?.length ? <EmptyState message={sectionsCopy.assignments.empty || emptyCopy.generic} /> : null}
                </Panel>
              </div>

              <div className="space-y-6">
                <Panel title={sectionsCopy.notifications.title} description={sectionsCopy.notifications.subtitle}>
                  <div className="space-y-3">
                    {(data?.notifications || []).map((notification) => (
                      <div key={notification.id} className="rounded-3xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-slate-900/90 p-2 text-white">
                            <BellRing className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                            <p className="text-xs text-slate-500">{formatRelativeTime(notification.time, locale)}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{notification.description}</p>
                      </div>
                    ))}
                  </div>
                  {!data?.notifications?.length ? <EmptyState message={sectionsCopy.notifications.empty || emptyCopy.generic} /> : null}
                </Panel>

                <Panel
                  title={sectionsCopy.courses.title}
                  description={sectionsCopy.courses.subtitle}
                >
                  <div className="space-y-3">
                    {(data?.courses || []).slice(0, 4).map((course) => (
                      <div key={course.id} className="rounded-3xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{course.name}</p>
                            <p className="text-xs text-slate-500">{course.instructor}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                          <span>{course.schedule}</span>
                          <span>•</span>
                          <span>
                            {course.enrolled}/{course.capacity} {sectionsCopy.courses.capacityLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!data?.courses?.length ? <EmptyState message={sectionsCopy.courses.empty || emptyCopy.generic} /> : null}
                </Panel>
              </div>
            </section>
    </AdminScaffold>
  );
};

type PanelProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

const Panel = ({ title, description, children }: PanelProps) => (
  <section className="rounded-4xl border border-slate-100 bg-white/90 p-6 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{description}</p>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      </div>
    </div>
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
    {message}
  </div>
);
