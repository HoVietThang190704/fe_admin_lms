'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { LoginView } from './login';
import { loginWithEmail } from '@/lib/services/auth/login';
import { getErrorMessage } from '@/lib/shared/utils/api';
import { ROUTES } from '@/lib/shared/constants/routeres';
import { loginSchema, type LoginFormValues } from '@/lib/shared/validation/login';
import {
  AppMessages,
  DEFAULT_LOCALE,
  SupportedLocale,
  createTranslator,
  detectClientLocale,
  getMessages
} from '@/lib/i18n';

const buildSupportHref = (email: string, subject?: string) => {
  const encodedSubject = subject ? encodeURIComponent(subject) : '';
  return `mailto:${email}${encodedSubject ? `?subject=${encodedSubject}` : ''}`;
};

export default function LoginPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [dictionary, setDictionary] = useState<AppMessages>(getMessages(DEFAULT_LOCALE));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const detected = detectClientLocale();
    if (detected !== locale) {
      setLocale(detected);
      setDictionary(getMessages(detected));
    }
  }, [locale]);

  const t = useMemo(() => createTranslator(dictionary), [dictionary]);
  const loginCopy = dictionary?.login ?? {};
  const heroCopy = loginCopy.hero ?? {};
  const formCopy = loginCopy.form ?? {};
  const highlightCards = Array.isArray(heroCopy.highlights) ? heroCopy.highlights : [];
  const heroStat = heroCopy.stat ?? {};
  const supportEmail = formCopy.supportEmail ?? 'support@lms.vn';
  const forgotHref = formCopy.forgotHref ?? ROUTES.FORGOT_PASSWORD;
  const operationsHref = formCopy.supportEmail ? buildSupportHref(supportEmail) : ROUTES.SUPPORT;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' }
  });

  const resolveError = (message?: string | null) => (message ? t(message, message) : null);

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithEmail(values);

      localStorage.setItem('lms:accessToken', result.accessToken);
      localStorage.setItem('lms:refreshToken', result.refreshToken);
      localStorage.setItem('lms:adminUser', JSON.stringify(result.user));

      router.replace(ROUTES.HOME);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t('login.form.errorFallback')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginView
      heroCopy={heroCopy}
      highlightCards={highlightCards}
      heroStat={heroStat}
      formCopy={formCopy}
      errorMessage={errorMessage}
      emailError={resolveError(errors.email?.message)}
      passwordError={resolveError(errors.password?.message)}
      forgotHref={forgotHref}
      operationsHref={operationsHref}
      isSubmitting={isSubmitting}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((prev) => !prev)}
      onSubmit={handleSubmit(onSubmit)}
      emailFieldProps={{
        id: 'email',
        type: 'email',
        autoComplete: 'email',
        className: 'pl-11',
        ...register('email')
      }}
      passwordFieldProps={{
        id: 'password',
        type: showPassword ? 'text' : 'password',
        autoComplete: 'current-password',
        className: 'pl-11 pr-12',
        ...register('password')
      }}
    />
  );
}
