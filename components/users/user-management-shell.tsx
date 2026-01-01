'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { GraduationCap, Loader2, RefreshCw, Search, ShieldCheck, Users as UsersIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils/cn';
import type { AppMessages, SupportedLocale } from '@/lib/i18n';
import { fetchAdminUsers, type AdminUserRecord } from '@/lib/services/users/list';
import { updateUserBlockStatus } from '@/lib/services/users/block';
import { getErrorMessage } from '@/lib/shared/utils/api';

const ROLE_BADGE_STYLES: Record<AdminUserRecord['role'], string> = {
  admin: 'bg-rose-50 text-rose-700 border border-rose-100',
  teacher: 'bg-amber-50 text-amber-700 border border-amber-100',
  student: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
};

type RoleFilterValue = 'all' | AdminUserRecord['role'];

type UserManagementShellProps = {
  locale: SupportedLocale;
  dictionary: AppMessages;
};

const formatDate = (value: string | Date | undefined, formatter: Intl.DateTimeFormat) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return formatter.format(date);
};

const formatRelativeTime = (value: string | Date | undefined, formatter: Intl.RelativeTimeFormat) => {
  if (!value) return '—';
  const target = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(target.getTime())) {
    return '—';
  }
  const diffMs = target.getTime() - Date.now();
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60]
  ];
  for (const [unit, divider] of units) {
    const amount = Math.round(diffMs / divider);
    if (Math.abs(amount) >= 1 || unit === 'minute') {
      return formatter.format(amount, unit);
    }
  }
  return formatter.format(0, 'minute');
};

const getInitials = (value?: string | null) => {
  if (!value) return 'NA';
  const parts = value.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) {
    return value.slice(0, 2).toUpperCase();
  }
  return parts.map((part) => part[0]).join('').toUpperCase();
};

const downloadCsv = (users: AdminUserRecord[], filename: string) => {
  if (!users.length) return;
  const headers = ['id', 'fullName', 'email', 'role', 'isActive', 'isBlocked', 'createdAt', 'lastLoginAt'];
  const rows = users.map((user) => [
    user.id,
    user.fullName ?? '',
    user.email,
    user.role,
    user.isActive ? 'active' : 'inactive',
    user.isBlocked ? 'blocked' : 'unblocked',
    user.createdAt ?? '',
    user.lastLoginAt ?? ''
  ]);
  const csv = [headers, ...rows]
    .map((columns) => columns.map((col) => `"${String(col ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const UserManagementShell = ({ locale, dictionary }: UserManagementShellProps) => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rowMutations, setRowMutations] = useState<Record<string, boolean>>({});

  const userCopy = dictionary.users ?? {};
  const pageCopy = userCopy.page ?? {};
  const filtersCopy = userCopy.filters ?? {};
  const tableCopy = userCopy.table ?? {};
  const statusCopy = userCopy.status ?? {};
  const paginationCopy = userCopy.pagination ?? {};
  const errorsCopy = userCopy.errors ?? {};

  const supportEmail = dictionary.login?.form?.supportEmail || 'support@lms.vn';
  const inviteHref = `mailto:${supportEmail}?subject=${encodeURIComponent(pageCopy.primaryAction || 'Invite user')}`;

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale]);
  const relativeFormatter = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }), [locale]);

  const limit = pagination.limit || 10;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchAdminUsers({
        page: pagination.page,
        limit,
        role: roleFilter === 'all' ? undefined : roleFilter,
        search: searchTerm || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, errorsCopy.load || 'Unable to load users.'));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, limit, roleFilter, searchTerm, errorsCopy.load]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const roleStats = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      { admin: 0, teacher: 0, student: 0 } as Record<AdminUserRecord['role'], number>
    );
  }, [users]);

  const handleRoleChange = (value: RoleFilterValue) => {
    setRoleFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchTerm(searchInput.trim());
  };

  const handleExport = () => {
    if (!users.length) return;
    downloadCsv(users, `users-page-${pagination.page}.csv`);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const isRowMutating = (userId: string) => Boolean(rowMutations[userId]);

  const handleToggleBlock = async (user: AdminUserRecord) => {
    setErrorMessage(null);
    setRowMutations((prev) => ({ ...prev, [user.id]: true }));
    try {
      const nextBlocked = !user.isBlocked;
      await updateUserBlockStatus(user.id, { isBlocked: nextBlocked });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, isBlocked: nextBlocked } : item)));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, errorsCopy.block || 'Không thể cập nhật trạng thái khóa.'));
    } finally {
      setRowMutations((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  const pageSummary = paginationCopy.summary
    ? paginationCopy.summary.replace('{page}', String(pagination.page)).replace('{total}', String(Math.max(pagination.totalPages, 1)))
    : `Page ${pagination.page} / ${Math.max(pagination.totalPages, 1)}`;

  const canGoPrev = pagination.page > 1 && !isLoading;
  const canGoNext = pagination.page < Math.max(pagination.totalPages, 1) && !isLoading;

  const roleOptions: Array<{ value: RoleFilterValue; label: string }> = [
    { value: 'all', label: filtersCopy.allRoles || 'All roles' },
    { value: 'admin', label: filtersCopy.roleAdmin || 'Admin' },
    { value: 'teacher', label: filtersCopy.roleTeacher || 'Instructor' },
    { value: 'student', label: filtersCopy.roleStudent || 'Learner' }
  ];

  const summaryCards = [
    {
      key: 'total',
      label: filtersCopy.allRoles || 'All roles',
      value: pagination.total,
      caption: pageSummary,
      icon: UsersIcon,
      accent: 'from-slate-900/10 to-slate-900/5'
    },
    {
      key: 'admin',
      label: filtersCopy.roleAdmin || 'Admin',
      value: roleStats.admin || 0,
      caption: pageCopy.currentScope || 'Current page',
      icon: ShieldCheck,
      accent: 'from-rose-500/10 to-rose-500/5'
    },
    {
      key: 'teacher',
      label: filtersCopy.roleTeacher || 'Instructor',
      value: roleStats.teacher || 0,
      caption: pageCopy.currentScope || 'Current page',
      icon: GraduationCap,
      accent: 'from-amber-500/10 to-amber-500/5'
    },
    {
      key: 'student',
      label: filtersCopy.roleStudent || 'Learner',
      value: roleStats.student || 0,
      caption: pageCopy.currentScope || 'Current page',
      icon: UsersIcon,
      accent: 'from-emerald-500/10 to-emerald-500/5'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">{pageCopy.badge || 'User graph'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{pageCopy.title || 'User management'}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{pageCopy.description || 'Monitor every profile synced from the LMS backend.'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="muted" type="button" onClick={handleExport} disabled={!users.length || isLoading}>
            {pageCopy.secondaryAction || 'Export' }
          </Button>
          <Button asChild variant="default">
            <a href={inviteHref}>{pageCopy.primaryAction || 'Invite user'}</a>
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Alert variant="danger">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className={`rounded-3xl border border-white/70 bg-gradient-to-br ${card.accent} from-10% to-90% p-5 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{numberFormatter.format(card.value)}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-2 text-slate-900">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">{card.caption}</p>
            </div>
          );
        })}
      </section>

      <Card className="p-0">
        <CardHeader className="gap-4 border-b border-slate-100 px-6 py-6">
          <CardTitle className="text-2xl">
            {pageCopy.title || 'User management'}
          </CardTitle>
          <CardDescription>{pageCopy.description || 'Monitor every profile synced from the LMS backend.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={filtersCopy.searchPlaceholder || 'Search users'}
                  className="pl-10"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : tableCopy.searchCta || 'Search'}
              </Button>
            </form>
            <div className="flex w-full gap-3 lg:w-auto">
              <select
                className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
                value={roleFilter}
                onChange={(event) => handleRoleChange(event.target.value as RoleFilterValue)}
                disabled={isLoading}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="button" variant="ghost" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{tableCopy.user || 'User'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.role || 'Role'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.status || 'Status'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.created || 'Created'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.lastLogin || 'Last login'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.blockStatus || 'Block status'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.actions || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{tableCopy.loading || 'Loading users...'}</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                        {tableCopy.empty || 'No users available.'}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.profile?.avatarUrl ? (
                              <img
                                src={user.profile.avatarUrl}
                                alt={user.fullName || user.email}
                                className="h-10 w-10 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">
                                {getInitials(user.fullName || user.email)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{user.fullName || '—'}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', ROLE_BADGE_STYLES[user.role])}>
                            {roleOptions.find((option) => option.value === user.role)?.label || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                              user.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            )}
                          >
                            {user.isActive ? statusCopy.active || 'Active' : statusCopy.inactive || 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(user.createdAt, dateFormatter)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatRelativeTime(user.lastLoginAt, relativeFormatter)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-3 py-1 text-xs font-semibold border',
                              user.isBlocked
                                ? 'border-rose-100 bg-rose-50 text-rose-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            )}
                          >
                            {user.isBlocked ? statusCopy.blocked || 'Blocked' : statusCopy.unblocked || 'Unblocked'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isLoading || isRowMutating(user.id)}
                            onClick={() => handleToggleBlock(user)}
                          >
                            {isRowMutating(user.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isBlocked ? (
                              tableCopy.unblockCta || 'Unblock'
                            ) : (
                              tableCopy.blockCta || 'Block'
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>{pageSummary}</p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" type="button" disabled={!canGoPrev} onClick={() => canGoPrev && setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}>
                  {paginationCopy.prev || 'Previous'}
                </Button>
                <Button variant="outline" size="sm" type="button" disabled={!canGoNext} onClick={() => canGoNext && setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}>
                  {paginationCopy.next || 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
