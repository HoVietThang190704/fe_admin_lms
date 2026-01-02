'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { buildSidebarContent } from '@/components/dashboard/sidebar-data';
import { SettingsView } from './settings-view';
import { detectClientLocale, getMessages, type AppMessages, type SupportedLocale, createTranslator } from '@/lib/i18n';
import { fetchAdminProfile, type AdminProfile } from '@/lib/services/users/profile';
import { changePassword } from '@/lib/services/auth/change-password';
import { logout as logoutService } from '@/lib/services/auth/logout';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/lib/shared/validation/settings';
import { getErrorMessage } from '@/lib/shared/utils/api';
import { ROUTES } from '@/lib/shared/constants/routeres';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'lms:accessToken',
  REFRESH_TOKEN: 'lms:refreshToken',
  ADMIN_USER: 'lms:adminUser'
};

const useLocaleDictionary = () => {
  const [locale] = useState<SupportedLocale>(() => detectClientLocale());
  const dictionary = useMemo<AppMessages>(() => getMessages(locale), [locale]);
  return { locale, dictionary };
};

export default function SettingsPage() {
  const router = useRouter();
  const { locale, dictionary } = useLocaleDictionary();
  const t = useMemo(() => createTranslator(dictionary), [dictionary]);
  const sidebarContent = useMemo(() => buildSidebarContent(dictionary), [dictionary]);
  const settingsCopy = dictionary.settings ?? {};
  const pageCopy = settingsCopy.page ?? {};
  const accountCopy = settingsCopy.account ?? {};
  const passwordCopy = settingsCopy.password ?? {};
  const sessionCopy = settingsCopy.session ?? {};
  const errorsCopy = settingsCopy.errors ?? {};

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors, isSubmitting }
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
      if (!stored) return;
      type StoredAdminProfile = Partial<AdminProfile> & { userName?: string; phone?: string };
      const parsed = JSON.parse(stored) as StoredAdminProfile;
      setProfile((prev) =>
        prev ?? {
          id: parsed.id ?? 'local',
          email: parsed.email ?? '',
          fullName: parsed.fullName ?? parsed.userName ?? undefined,
          role: (parsed.role as AdminProfile['role']) ?? 'admin',
          isActive: true,
          isBlocked: false,
          profile: parsed.profile ?? (parsed.phone ? { phone: parsed.phone } : undefined),
          facebookId: parsed.facebookId,
          googleId: parsed.googleId
        }
      );
    } catch {
      // Ignore malformed local storage payloads
    }
  }, []);

  const loadProfile = useCallback(
    async (options?: { silent?: boolean }) => {
      if (options?.silent) {
        setIsRefreshingProfile(true);
      } else {
        setIsProfileLoading(true);
      }
      setProfileError(null);
      try {
        const result = await fetchAdminProfile();
        setProfile(result);
        setLastSyncedAt(new Date().toISOString());
      } catch (error) {
        setProfileError(getErrorMessage(error, errorsCopy.profile || 'Unable to load profile.'));
      } finally {
        if (options?.silent) {
          setIsRefreshingProfile(false);
        } else {
          setIsProfileLoading(false);
        }
      }
    },
    [errorsCopy.profile]
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onSubmitPassword = handleSubmit(async (values) => {
    setPasswordSuccessMessage(null);
    setPasswordErrorMessage(null);
    try {
      await changePassword({ oldPassword: values.currentPassword, newPassword: values.newPassword });
      setPasswordSuccessMessage(passwordCopy.success || 'Password updated successfully.');
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordErrorMessage(getErrorMessage(error, errorsCopy.password || 'Unable to update password.'));
    }
  });

  const handleLogout = async () => {
    setLogoutError(null);
    setIsLoggingOut(true);
    try {
      await logoutService();
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        window.localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        window.localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
      }
      router.replace(ROUTES.LOGIN);
    } catch (error) {
      setLogoutError(getErrorMessage(error, errorsCopy.logout || 'Unable to sign out.'));
    } finally {
      setIsLoggingOut(false);
    }
  };

  const resolveFieldError = (message?: string) => (message ? t(message, message) : null);
  return (
    <SettingsView
      sidebarContent={sidebarContent}
      dictionary={dictionary}
      locale={locale}
      pageCopy={pageCopy}
      accountCopy={accountCopy}
      passwordCopy={passwordCopy}
      sessionCopy={sessionCopy}
      profile={profile}
      isProfileLoading={isProfileLoading}
      isRefreshingProfile={isRefreshingProfile}
      profileError={profileError}
      lastSyncedAt={lastSyncedAt}
      onRefreshProfile={() => loadProfile({ silent: true })}
      logoutError={logoutError}
      isLoggingOut={isLoggingOut}
      onLogout={handleLogout}
      passwordSuccessMessage={passwordSuccessMessage}
      passwordErrorMessage={passwordErrorMessage}
      onSubmitPassword={onSubmitPassword}
      onResetPasswordForm={() => reset({ currentPassword: '', newPassword: '', confirmPassword: '' })}
      formErrors={formErrors}
      register={register}
      isSubmitting={isSubmitting}
      resolveFieldError={resolveFieldError}
    />
  );
}
