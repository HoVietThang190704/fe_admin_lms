'use client';

import type { BaseSyntheticEvent, ReactNode } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { CalendarClock, LogOut, Mail, RefreshCcw, Shield, UserCircle } from 'lucide-react';

import { AdminScaffold } from '@/components/layout/admin-scaffold';
import type { SidebarContent } from '@/components/dashboard/sidebar-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils/cn';
import type { SupportedLocale, AppMessages } from '@/lib/i18n';
import type { AdminProfile } from '@/lib/services/users/profile';
import type { ChangePasswordFormValues } from '@/lib/shared/validation/settings';

type InfoTileProps = {
  label: string;
  value?: ReactNode | null;
  resolveLabel: (value?: ReactNode | null) => ReactNode;
};

const InfoTile = ({ label, value, resolveLabel }: InfoTileProps) => (
  <div className="rounded-3xl border border-slate-100 bg-white/70 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
    <div className="mt-2 text-base font-semibold text-slate-900">{resolveLabel(value)}</div>
  </div>
);

const formatDateTime = (value: string | null, locale: SupportedLocale) => {
  if (!value) {
    return '';
  }
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    return formatter.format(new Date(value));
  } catch {
    return value;
  }
};

type CopyBlock = Record<string, string | undefined>;

type SettingsViewProps = {
  sidebarContent: SidebarContent;
  dictionary: AppMessages;
  locale: SupportedLocale;
  pageCopy: CopyBlock;
  accountCopy: CopyBlock;
  passwordCopy: CopyBlock;
  sessionCopy: CopyBlock;
  profile: AdminProfile | null;
  isProfileLoading: boolean;
  isRefreshingProfile: boolean;
  profileError: string | null;
  lastSyncedAt: string | null;
  onRefreshProfile: () => void;
  logoutError: string | null;
  isLoggingOut: boolean;
  onLogout: () => void;
  passwordSuccessMessage: string | null;
  passwordErrorMessage: string | null;
  onSubmitPassword: (event?: BaseSyntheticEvent) => Promise<void>;
  onResetPasswordForm: () => void;
  formErrors: FieldErrors<ChangePasswordFormValues>;
  register: UseFormRegister<ChangePasswordFormValues>;
  isSubmitting: boolean;
  resolveFieldError: (message?: string) => string | null;
};

export const SettingsView = ({
  sidebarContent,
  dictionary,
  locale,
  pageCopy,
  accountCopy,
  passwordCopy,
  sessionCopy,
  profile,
  isProfileLoading,
  isRefreshingProfile,
  profileError,
  lastSyncedAt,
  onRefreshProfile,
  logoutError,
  isLoggingOut,
  onLogout,
  passwordSuccessMessage,
  passwordErrorMessage,
  onSubmitPassword,
  onResetPasswordForm,
  formErrors,
  register,
  isSubmitting,
  resolveFieldError
}: SettingsViewProps) => {
  const statusLabel = profile
    ? profile.isBlocked
      ? accountCopy.statusBlocked || 'Blocked'
      : profile.isActive
        ? accountCopy.statusActive || 'Active'
        : accountCopy.statusInactive || 'Inactive'
    : '';

  const statusTone = profile
    ? profile.isBlocked
      ? 'bg-red-100 text-red-700'
      : profile.isActive
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-amber-100 text-amber-800'
    : 'bg-slate-100 text-slate-600';

  const lastUpdatedDisplay = lastSyncedAt ? formatDateTime(lastSyncedAt, locale) : null;

  const filtersCopy = dictionary.users?.filters;
  const roleLabel = (() => {
    if (!profile?.role) {
      return accountCopy.missingValue || 'Not provided';
    }
    if (profile.role === 'admin') return filtersCopy?.roleAdmin || 'Admin';
    if (profile.role === 'teacher') return filtersCopy?.roleTeacher || 'Instructor';
    return filtersCopy?.roleStudent || 'Learner';
  })();

  const resolveLabel = (value?: ReactNode | null) => value || accountCopy.missingValue || 'Not provided';

  const AccountSkeleton = (
    <div className="mt-6 space-y-3">
      <div className="h-20 w-full animate-pulse rounded-3xl bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="h-16 animate-pulse rounded-3xl bg-slate-100" />
        ))}
      </div>
    </div>
  );

  return (
    <AdminScaffold sidebar={sidebarContent}>
      <section className="space-y-2">
        {pageCopy.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">{pageCopy.eyebrow}</p>
        ) : null}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{pageCopy.title || 'Admin settings'}</h1>
            <p className="mt-2 text-sm text-slate-500">{pageCopy.description || 'Manage your profile, password, and session.'}</p>
          </div>
          <Button variant="muted" className="rounded-2xl" onClick={onRefreshProfile} disabled={isRefreshingProfile || isProfileLoading}>
            <RefreshCcw className={cn('mr-2 h-4 w-4', isRefreshingProfile && 'animate-spin')} />
            {accountCopy.refreshCta || 'Refresh profile'}
          </Button>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="rounded-4xl border border-slate-100">
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>{accountCopy.title || 'Account overview'}</CardTitle>
            <CardDescription>{accountCopy.subtitle || 'Synced from the LMS directory.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {profileError ? (
              <Alert variant="danger">
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-4 rounded-4xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-2xl font-semibold text-white">
                {profile?.profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profile.avatarUrl} alt={profile.fullName || profile.email} className="h-full w-full rounded-3xl object-cover" />
                ) : (
                  profile?.fullName?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || <UserCircle className="h-10 w-10" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-slate-500">{accountCopy.nameLabel || 'Full name'}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{resolveLabel(profile?.fullName)}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <Mail className="h-4 w-4" />
                    {resolveLabel(profile?.email)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                    <Shield className="h-3.5 w-3.5" />
                    {roleLabel}
                  </span>
                  <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', statusTone)}>
                    <UserCircle className="h-3.5 w-3.5" />
                    {statusLabel}
                  </span>
                </div>
                {lastUpdatedDisplay ? (
                  <p className="inline-flex items-center gap-2 text-xs text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {accountCopy.lastUpdatedLabel || 'Last updated'}: {lastUpdatedDisplay}
                  </p>
                ) : null}
              </div>
            </div>

            {isProfileLoading && !profile ? (
              AccountSkeleton
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoTile label={accountCopy.emailLabel || 'Email'} value={profile?.email} resolveLabel={resolveLabel} />
                <InfoTile label={accountCopy.phoneLabel || 'Phone'} value={profile?.profile?.phone} resolveLabel={resolveLabel} />
                <InfoTile label={accountCopy.bioLabel || 'Bio'} value={profile?.profile?.bio} resolveLabel={resolveLabel} />
                <InfoTile label={accountCopy.statusLabel || 'Status'} value={statusLabel} resolveLabel={resolveLabel} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-4xl border border-slate-100">
          <CardHeader>
            <CardTitle>{sessionCopy.title || 'Session controls'}</CardTitle>
            <CardDescription>{sessionCopy.subtitle || 'Sign out if you suspect suspicious activity.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">{sessionCopy.description || 'Signing out clears the tokens stored in this browser.'}</p>
            {logoutError ? (
              <Alert variant="danger">
                <AlertDescription>{logoutError}</AlertDescription>
              </Alert>
            ) : null}
            <Button variant="outline" className="w-full rounded-2xl border-red-200 text-red-600 hover:bg-red-50" onClick={onLogout} disabled={isLoggingOut}>
              <LogOut className={cn('mr-2 h-4 w-4', isLoggingOut && 'animate-spin')} />
              {isLoggingOut ? sessionCopy.logoutSubmitting || 'Signing out...' : sessionCopy.logoutCta || 'Sign out'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-4xl border border-slate-100">
        <CardHeader>
          <CardTitle>{passwordCopy.title || 'Change password'}</CardTitle>
          <CardDescription>{passwordCopy.subtitle || 'Enter your current password to confirm this update.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordSuccessMessage ? (
            <Alert variant="success">
              <AlertDescription>{passwordSuccessMessage}</AlertDescription>
            </Alert>
          ) : null}
          {passwordErrorMessage ? (
            <Alert variant="danger">
              <AlertDescription>{passwordErrorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <form className="space-y-5" onSubmit={(event) => void onSubmitPassword(event)}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">{passwordCopy.currentLabel || 'Current password'}</Label>
                <Input id="currentPassword" type="password" autoComplete="current-password" placeholder="••••••" {...register('currentPassword')} />
                {resolveFieldError(formErrors.currentPassword?.message) ? (
                  <p className="text-sm text-red-600">{resolveFieldError(formErrors.currentPassword?.message)}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">{passwordCopy.newLabel || 'New password'}</Label>
                <Input id="newPassword" type="password" autoComplete="new-password" placeholder="••••••" {...register('newPassword')} />
                {resolveFieldError(formErrors.newPassword?.message) ? (
                  <p className="text-sm text-red-600">{resolveFieldError(formErrors.newPassword?.message)}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">{passwordCopy.confirmLabel || 'Confirm new password'}</Label>
                <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••" {...register('confirmPassword')} />
                {resolveFieldError(formErrors.confirmPassword?.message) ? (
                  <p className="text-sm text-red-600">{resolveFieldError(formErrors.confirmPassword?.message)}</p>
                ) : null}
              </div>
            </div>

            <p className="text-sm text-slate-500">{passwordCopy.helper || 'Minimum 6 characters. Avoid reusing recent passwords.'}</p>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="rounded-2xl" disabled={isSubmitting}>
                <Shield className={cn('mr-2 h-4 w-4', isSubmitting && 'animate-spin')} />
                {isSubmitting ? passwordCopy.submitting || 'Updating...' : passwordCopy.submit || 'Update password'}
              </Button>
              <Button type="button" variant="ghost" className="rounded-2xl" onClick={onResetPasswordForm} disabled={isSubmitting}>
                {accountCopy.refreshCta || 'Reset form'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminScaffold>
  );
};
