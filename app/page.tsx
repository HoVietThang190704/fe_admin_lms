import { headers } from 'next/headers';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { fetchDashboardSummary } from '@/lib/services/home/dashboard';
import { getMessages, resolveLocale } from '@/lib/i18n';
import { getErrorMessage } from '@/lib/shared/utils/api';

const resolveRequestOrigin = (headerList: Headers) => {
  const protocol = headerList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = headerList.get('x-forwarded-host') || headerList.get('host');

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  return `${protocol}://${host}`;
};

export default async function HomePage() {
  const headerList = await headers();
  const localeHeader = headerList.get('accept-language');
  const locale = resolveLocale(localeHeader);
  const dictionary = getMessages(locale);
  const requestOrigin = resolveRequestOrigin(headerList);

  let dashboardData = null;
  let errorMessage: string | null = null;

  try {
    dashboardData = await fetchDashboardSummary({ baseUrl: requestOrigin });
  } catch (error) {
    errorMessage = getErrorMessage(error, 'Unable to load dashboard overview.');
  }

  return <DashboardShell data={dashboardData} dictionary={dictionary} locale={locale} errorMessage={errorMessage} />;
}
