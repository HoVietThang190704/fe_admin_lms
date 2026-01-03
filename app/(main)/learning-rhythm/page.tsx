import { headers } from 'next/headers';
import { LearningRhythmView, type ReportsPageCopy, type ReportsWeeklyCopy, type ReportsSearchCopy } from './learning-rhythm-view';
import { buildSidebarContent } from '@/components/dashboard/sidebar-data';
import { fetchDashboardSummary, fetchMonitoringClasses } from '@/lib/services/home/dashboard';
import { buildReportCards, normalizeLearningRhythm } from '@/lib/services/home/learning-rhythm';
import { createTranslator, getMessages, resolveLocale } from '@/lib/i18n';
import { getErrorMessage } from '@/lib/shared/utils/api';

const resolveRequestOrigin = (headerList: Headers) => {
  const protocol = headerList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = headerList.get('x-forwarded-host') || headerList.get('host');

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  return `${protocol}://${host}`;
};

type ReportsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function LearningRhythmPage({ searchParams }: ReportsPageProps) {
  const headerList = await headers();
  const locale = resolveLocale(headerList.get('accept-language'));
  const dictionary = getMessages(locale);
  const t = createTranslator(dictionary);
  const sidebarContent = buildSidebarContent(dictionary);
  const requestOrigin = resolveRequestOrigin(headerList);
  const baseLearningRhythmPath = '/learning-rhythm';
  const keywordParam = searchParams?.keyword;
  const pageParam = searchParams?.page;
  const searchQuery = typeof keywordParam === 'string' ? keywordParam : undefined;
  const pageNumber = typeof pageParam === 'string' ? Number.parseInt(pageParam, 10) : undefined;

  let dashboardData = null;
  let errorMessage: string | null = null;
  let monitoringData = null;
  let monitoringError: string | null = null;

  try {
    dashboardData = await fetchDashboardSummary({ baseUrl: requestOrigin });
  } catch (error) {
    errorMessage = getErrorMessage(error, t('reports.errorFallback'));
  }

  try {
    monitoringData = await fetchMonitoringClasses({
      baseUrl: requestOrigin,
      keyword: searchQuery,
      page: Number.isFinite(pageNumber) ? pageNumber : undefined,
      limit: 12
    });
  } catch (error) {
    monitoringError = getErrorMessage(error, t('reports.search.error', 'Không thể tải danh sách môn học.'));
  }

  const learningRhythm = normalizeLearningRhythm(dashboardData, {
    classes: monitoringData?.classes && monitoringData.classes.length ? monitoringData.classes : undefined
  });
  const reportCards = buildReportCards(learningRhythm, t);

  const pageCopy: ReportsPageCopy = {
    eyebrow: t('reports.page.eyebrow'),
    title: t('reports.page.title'),
    description: t('reports.page.description')
  };

  const weeklyCopy: ReportsWeeklyCopy = {
    eyebrow: t('reports.weekly.eyebrow'),
    title: t('reports.weekly.title'),
    summarySessionsPrefix: t('reports.weekly.summarySessionsPrefix'),
    summaryCompletionSuffix: t('reports.weekly.summaryCompletionSuffix'),
    sessionsPerWeekSuffix: t('reports.segments.sessionsPerWeekSuffix'),
    progressLabel: t('reports.segments.progressLabel'),
    notesSuffix: t('reports.segments.notesSuffix')
  };

  const searchCopy: ReportsSearchCopy = {
    label: t('reports.search.label'),
    placeholder: t('reports.search.placeholder'),
    action: t('reports.search.action'),
    clear: t('reports.search.clear'),
    empty: t('reports.search.empty'),
    summaryPrefix: t('reports.search.summary'),
    pageLabel: t('reports.search.pageLabel'),
    previous: t('reports.search.previous'),
    next: t('reports.search.next')
  };

  const derivedLimit = monitoringData?.pagination.limit ?? learningRhythm.segments.length;
  const normalizedLimit = typeof derivedLimit === 'number' && derivedLimit > 0 ? derivedLimit : 12;

  const monitoringState = {
    segments: learningRhythm.segments,
    total: monitoringData?.pagination.total ?? learningRhythm.segments.length,
    page: monitoringData?.pagination.page ?? 1,
    limit: normalizedLimit,
    searchQuery,
    errorMessage: monitoringError,
    basePath: baseLearningRhythmPath
  };

  return (
    <LearningRhythmView
      sidebarContent={sidebarContent}
      pageCopy={pageCopy}
      weeklyCopy={weeklyCopy}
      searchCopy={searchCopy}
      snapshot={learningRhythm}
      reportCards={reportCards}
      errorMessage={errorMessage}
      monitoring={monitoringState}
    />
  );
}
