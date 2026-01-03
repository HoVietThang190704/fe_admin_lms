import { AdminScaffold } from '@/components/layout/admin-scaffold';
import type { SidebarContent } from '@/components/dashboard/sidebar-data';
import type { LearningReportCard, LearningRhythmSnapshot } from '@/lib/services/home/learning-rhythm';

export type ReportsPageCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

export type ReportsWeeklyCopy = {
  eyebrow: string;
  title: string;
  summarySessionsPrefix: string;
  summaryCompletionSuffix: string;
  sessionsPerWeekSuffix: string;
  progressLabel: string;
  notesSuffix: string;
};

export type ReportsSearchCopy = {
  label: string;
  placeholder: string;
  action: string;
  clear: string;
  empty: string;
  summaryPrefix: string;
  pageLabel: string;
  previous: string;
  next: string;
};

type MonitoringState = {
  segments: LearningRhythmSnapshot['segments'];
  total: number;
  page: number;
  limit: number;
  searchQuery?: string;
  errorMessage?: string | null;
  basePath: string;
};

type LearningRhythmViewProps = {
  sidebarContent: SidebarContent;
  pageCopy: ReportsPageCopy;
  weeklyCopy: ReportsWeeklyCopy;
  searchCopy: ReportsSearchCopy;
  snapshot: LearningRhythmSnapshot;
  reportCards: LearningReportCard[];
  errorMessage?: string | null;
  monitoring: MonitoringState;
};

export const LearningRhythmView = ({
  sidebarContent,
  pageCopy,
  weeklyCopy,
  searchCopy,
  snapshot,
  reportCards,
  errorMessage,
  monitoring
}: LearningRhythmViewProps) => {
  const totalRecords = Math.max(0, monitoring.total);
  const pageLimit = Math.max(1, monitoring.limit || 1);
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageLimit));
  const currentPage = Math.min(Math.max(1, monitoring.page), totalPages);
  const firstItemIndex = totalRecords === 0 ? 0 : (currentPage - 1) * pageLimit + 1;
  const lastItemIndex = totalRecords === 0 ? 0 : firstItemIndex + Math.max(0, monitoring.segments.length - 1);
  const summaryRangeLabel = totalRecords === 0 ? '0' : `${firstItemIndex}-${lastItemIndex}`;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();

    if (monitoring.searchQuery) {
      params.set('keyword', monitoring.searchQuery);
    }

    if (targetPage > 1) {
      params.set('page', String(targetPage));
    }

    const query = params.toString();
    return query ? `${monitoring.basePath}?${query}` : monitoring.basePath;
  };

  const paginationButtonClass = (enabled: boolean) =>
    enabled
      ? 'rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-900'
      : 'pointer-events-none rounded-2xl border border-slate-100 px-4 py-2 text-sm font-medium text-slate-300';

  return (
    <AdminScaffold sidebar={sidebarContent}>
      <div className="space-y-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{pageCopy.eyebrow}</p>
          <h1 className="text-3xl font-semibold text-slate-900">{pageCopy.title}</h1>
          <p className="text-sm text-slate-500">{pageCopy.description}</p>
        </header>

        {errorMessage ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {reportCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.id} className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{card.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/90 p-2 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{card.description}</p>
                  {card.trend ? (
                    <p className={card.trend.isPositive ? 'mt-2 text-sm font-semibold text-emerald-600' : 'mt-2 text-sm font-semibold text-rose-600'}>
                      {card.trend.delta} {card.trend.label}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </section>
        )}

        <section className="rounded-4xl border border-slate-100 bg-white/90 p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{weeklyCopy.eyebrow}</p>
              <h2 className="text-2xl font-semibold text-slate-900">{weeklyCopy.title}</h2>
              <p className="text-sm text-slate-500">
                {weeklyCopy.summarySessionsPrefix} {snapshot.averageSessionsPerWeek} {weeklyCopy.sessionsPerWeekSuffix},{' '}
                {snapshot.averageCompletedAssignments}% {weeklyCopy.summaryCompletionSuffix}
              </p>
            </div>
            <form className="flex max-w-xl flex-1 flex-col gap-2 sm:flex-row" method="get" action={monitoring.basePath}>
              <label htmlFor="keyword" className="text-sm font-medium text-slate-500">
                {searchCopy.label}
              </label>
              <div className="flex flex-1 gap-2">
                <input
                  id="keyword"
                  name="keyword"
                  type="text"
                  defaultValue={monitoring.searchQuery}
                  placeholder={searchCopy.placeholder}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                {monitoring.searchQuery ? (
                  <a
                    href={monitoring.basePath}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-900"
                  >
                    {searchCopy.clear}
                  </a>
                ) : null}
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {searchCopy.action}
                </button>
              </div>
            </form>
          </div>

          {monitoring.errorMessage ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {monitoring.errorMessage}
            </div>
          ) : null}

          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
            {searchCopy.summaryPrefix}{' '}
            <span className="font-bold text-slate-900">{summaryRangeLabel}</span>
            /{totalRecords}
          </p>

          {monitoring.segments.length ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {monitoring.segments.map((segment) => (
                <div key={segment.id} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{segment.label}</p>
                      <h3 className="text-xl font-semibold text-slate-900">{segment.course}</h3>
                      <p className="text-sm text-slate-500">{segment.instructor}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>
                        {segment.sessionsPerWeek} {weeklyCopy.sessionsPerWeekSuffix}
                      </p>
                      <p className="font-semibold text-slate-900">
                        {segment.progress}% {weeklyCopy.progressLabel}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-white">
                    <div className="h-full rounded-full bg-slate-900" style={{ width: `${segment.progress}%` }} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {segment.completedLessons}/{segment.totalLessons} {weeklyCopy.notesSuffix}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500">
              {searchCopy.empty}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {searchCopy.pageLabel} {currentPage} / {totalPages}
              </p>
              <div className="flex gap-2">
                <a
                  href={hasPrev ? buildPageHref(currentPage - 1) : undefined}
                  aria-disabled={!hasPrev}
                  className={paginationButtonClass(hasPrev)}
                >
                  {searchCopy.previous}
                </a>
                <a
                  href={hasNext ? buildPageHref(currentPage + 1) : undefined}
                  aria-disabled={!hasNext}
                  className={paginationButtonClass(hasNext)}
                >
                  {searchCopy.next}
                </a>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </AdminScaffold>
  );
};
