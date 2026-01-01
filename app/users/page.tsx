import { headers } from 'next/headers';

import { AdminScaffold } from '@/components/layout/admin-scaffold';
import { buildSidebarContent } from '@/components/dashboard/sidebar-data';
import { UserManagementShell } from '@/components/users/user-management-shell';
import { getMessages, resolveLocale } from '@/lib/i18n';

export default async function UsersPage() {
  const headerList = await headers();
  const localeHeader = headerList.get('accept-language');
  const locale = resolveLocale(localeHeader);
  const dictionary = getMessages(locale);
  const sidebarContent = buildSidebarContent(dictionary);

  return (
    <AdminScaffold sidebar={sidebarContent}>
      <UserManagementShell locale={locale} dictionary={dictionary} />
    </AdminScaffold>
  );
}
