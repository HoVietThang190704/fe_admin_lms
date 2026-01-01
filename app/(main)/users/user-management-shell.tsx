'use client';

import Image from 'next/image';
import { useMemo, type FormEvent } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popup } from '@/components/ui/popup';
import { cn } from '@/lib/utils/cn';
import type { AppMessages, SupportedLocale } from '@/lib/i18n';
import type { AdminUserRecord } from '@/lib/services/users/list';

import type { CreateUserFormValues, RoleFilterValue } from './user-management.types';

const ROLE_BADGE_STYLES: Record<AdminUserRecord['role'], string> = {
  admin: 'bg-rose-50 text-rose-700 border border-rose-100',
  teacher: 'bg-amber-50 text-amber-700 border border-amber-100',
  student: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
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

export type SummaryCard = {
  key: string;
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
  accent: string;
};

export type UserManagementShellProps = {
  locale: SupportedLocale;
  dictionary: AppMessages;
  users: AdminUserRecord[];
  roleFilter: RoleFilterValue;
  searchInput: string;
  isLoading: boolean;
  errorMessage: string | null;
  isCreateModalOpen: boolean;
  isCreatingUser: boolean;
  createErrorMessage: string | null;
  createFormErrors: FieldErrors<CreateUserFormValues>;
  canGoPrev: boolean;
  canGoNext: boolean;
  pageSummary: string;
  roleOptions: Array<{ value: RoleFilterValue; label: string }>;
  roleChoices: Array<{ value: AdminUserRecord['role']; label: string }>;
  summaryCards: SummaryCard[];
  register: UseFormRegister<CreateUserFormValues>;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRoleChange: (value: RoleFilterValue) => void;
  onRefresh: () => void;
  onExport: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleBlock: (user: AdminUserRecord) => void;
  onDeleteUser: (user: AdminUserRecord) => void;
  isRowBlocking: (userId: string) => boolean;
  isRowDeleting: (userId: string) => boolean;
  onChangeUserRole: (user: AdminUserRecord, role: AdminUserRecord['role']) => void;
  isRowUpdatingRole: (userId: string) => boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  onCreateUserSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const UserManagementShell = ({
  locale,
  dictionary,
  users,
  roleFilter,
  searchInput,
  isLoading,
  errorMessage,
  isCreateModalOpen,
  isCreatingUser,
  createErrorMessage,
  createFormErrors,
  canGoPrev,
  canGoNext,
  pageSummary,
  roleOptions,
  roleChoices,
  summaryCards,
  register,
  onSearchInputChange,
  onSearchSubmit,
  onRoleChange,
  onRefresh,
  onExport,
  onPrevPage,
  onNextPage,
  onToggleBlock,
  onDeleteUser,
  isRowBlocking,
  isRowDeleting,
  onChangeUserRole,
  isRowUpdatingRole,
  openCreateModal,
  closeCreateModal,
  onCreateUserSubmit
}: UserManagementShellProps) => {
  const userCopy = dictionary.users ?? {};
  const pageCopy = userCopy.page ?? {};
  const filtersCopy = userCopy.filters ?? {};
  const tableCopy = userCopy.table ?? {};
  const statusCopy = userCopy.status ?? {};
  const paginationCopy = userCopy.pagination ?? {};

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale]);
  const relativeFormatter = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }), [locale]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">{pageCopy.badge || 'User graph'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{pageCopy.title || 'User management'}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{pageCopy.description || 'Monitor every profile synced from the LMS backend.'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="muted" type="button" onClick={onExport} disabled={!users.length || isLoading}>
            {pageCopy.secondaryAction || 'Export'}
          </Button>
          <Button type="button" variant="default" onClick={openCreateModal}>
            {pageCopy.primaryAction || 'Thêm người dùng'}
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
            <div key={card.key} className={`rounded-3xl border border-white/70 bg-linear-to-br ${card.accent} from-10% to-90% p-5 shadow-sm`}>
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
          <CardTitle className="text-2xl">{pageCopy.title || 'User management'}</CardTitle>
          <CardDescription>{pageCopy.description || 'Monitor every profile synced from the LMS backend.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form onSubmit={onSearchSubmit} className="flex flex-1 gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={filtersCopy.searchPlaceholder || 'Search users'}
                  className="pl-10"
                  value={searchInput}
                  onChange={(event) => onSearchInputChange(event.target.value)}
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
                onChange={(event) => onRoleChange(event.target.value as RoleFilterValue)}
                disabled={isLoading}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="button" variant="ghost" onClick={onRefresh} disabled={isLoading}>
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
                    users.map((user) => {
                      const isAdminRow = user.role === 'admin';
                      const roleSelectDisabled = isLoading || isRowUpdatingRole(user.id) || isAdminRow;
                      const deleteDisabled = isLoading || isRowDeleting(user.id) || isAdminRow;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {user.profile?.avatarUrl ? (
                                <Image
                                  src={user.profile.avatarUrl}
                                  alt={user.fullName || user.email}
                                  width={40}
                                  height={40}
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
                            <div className="flex flex-col gap-2">
                              <span className={cn('inline-flex max-w-max rounded-full px-3 py-1 text-xs font-semibold', ROLE_BADGE_STYLES[user.role])}>
                                {roleOptions.find((option) => option.value === user.role)?.label || user.role}
                              </span>
                              <div className="relative">
                                <select
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
                                  value={user.role}
                                  onChange={(event) => onChangeUserRole(user, event.target.value as AdminUserRecord['role'])}
                                  disabled={roleSelectDisabled}
                                >
                                  {roleChoices.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                {isRowUpdatingRole(user.id) ? (
                                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-3 py-1 text-xs font-semibold border',
                                user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                              )}
                            >
                              {user.isActive ? statusCopy.active || 'Active' : statusCopy.inactive || 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.createdAt, dateFormatter)}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatRelativeTime(user.lastLoginAt, relativeFormatter)}</td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-3 py-1 text-xs font-semibold border',
                                user.isBlocked ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-100 text-slate-600'
                              )}
                            >
                              {user.isBlocked ? statusCopy.blocked || 'Blocked' : statusCopy.unblocked || 'Unblocked'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLoading || isRowBlocking(user.id)}
                                onClick={() => onToggleBlock(user)}
                              >
                                {isRowBlocking(user.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : user.isBlocked ? (
                                  tableCopy.unblockCta || 'Unblock'
                                ) : (
                                  tableCopy.blockCta || 'Block'
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                disabled={deleteDisabled}
                                onClick={() => onDeleteUser(user)}
                              >
                                {isRowDeleting(user.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  tableCopy.deleteCta || 'Delete'
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>{pageSummary}</p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" type="button" disabled={!canGoPrev} onClick={onPrevPage}>
                  {paginationCopy.prev || 'Previous'}
                </Button>
                <Button variant="outline" size="sm" type="button" disabled={!canGoNext} onClick={onNextPage}>
                  {paginationCopy.next || 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Popup
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        eyebrow={pageCopy.primaryAction || 'Create user'}
        title={tableCopy.createTitle || 'Thêm người dùng mới'}
        description={tableCopy.createSubtitle || 'Nhập thông tin cơ bản và phân quyền cho người dùng mới.'}
        size="lg"
      >
        {createErrorMessage ? (
          <Alert variant="danger" className="mb-4">
            <AlertDescription>{createErrorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={onCreateUserSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="fullName">{tableCopy.fullNameLabel || 'Họ và tên'}</Label>
            <Input id="fullName" placeholder="Nguyễn Văn A" disabled={isCreatingUser} {...register('fullName')} />
            {createFormErrors.fullName ? <p className="text-xs text-rose-600">{createFormErrors.fullName.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="user@example.com" disabled={isCreatingUser} {...register('email')} />
            {createFormErrors.email ? <p className="text-xs text-rose-600">{createFormErrors.email.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">{tableCopy.passwordLabel || 'Mật khẩu tạm'}</Label>
            <Input id="password" type="password" autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" disabled={isCreatingUser} {...register('password')} />
            {createFormErrors.password ? <p className="text-xs text-rose-600">{createFormErrors.password.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">{filtersCopy.roleLabel || 'Vai trò'}</Label>
            <select
              id="role"
              className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
              disabled={isCreatingUser}
              {...register('role')}
            >
              <option value="admin">{filtersCopy.roleAdmin || 'Admin'}</option>
              <option value="teacher">{filtersCopy.roleTeacher || 'Instructor'}</option>
              <option value="student">{filtersCopy.roleStudent || 'Learner'}</option>
            </select>
            {createFormErrors.role ? <p className="text-xs text-rose-600">{createFormErrors.role.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">{tableCopy.phoneLabel || 'Số điện thoại'}</Label>
            <Input id="phone" type="tel" placeholder="0901234567" disabled={isCreatingUser} {...register('phone')} />
            {createFormErrors.phone ? <p className="text-xs text-rose-600">{createFormErrors.phone.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">{tableCopy.bioLabel || 'Giới thiệu'}</Label>
                <textarea
              id="bio"
              placeholder="Thông tin ngắn gọn về người dùng"
                  className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
              disabled={isCreatingUser}
              {...register('bio')}
            />
            {createFormErrors.bio ? <p className="text-xs text-rose-600">{createFormErrors.bio.message}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeCreateModal} disabled={isCreatingUser}>
              {tableCopy.cancelCta || 'Hủy'}
            </Button>
            <Button type="submit" disabled={isCreatingUser}>
              {isCreatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : tableCopy.submitCta || 'Tạo người dùng'}
            </Button>
          </div>
        </form>
      </Popup>
    </div>
  );
};
