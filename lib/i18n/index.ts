import en from '@/locales/en.json';
import vi from '@/locales/vi.json';

export const messages = { en, vi } as const;

export type SupportedLocale = keyof typeof messages;
export type AppMessages = (typeof messages)[SupportedLocale];

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'vi'];
export const DEFAULT_LOCALE: SupportedLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE === 'en' ? 'en' : 'vi';
export const LOCALE_STORAGE_KEY = 'lms:locale';

const getFromPath = (object: unknown, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, object);
};

export const resolveLocale = (input?: string | null): SupportedLocale => {
  if (!input) {
    return DEFAULT_LOCALE;
  }

  const normalized = input.toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.includes(normalized as SupportedLocale)
    ? (normalized as SupportedLocale)
    : DEFAULT_LOCALE;
};

export const getMessages = (locale: SupportedLocale = DEFAULT_LOCALE): AppMessages => {
  return messages[locale] as AppMessages;
};

export type Translator = (path: string, fallback?: string) => string;

export const createTranslator = (localeOrMessages?: SupportedLocale | AppMessages): Translator => {
  const dictionary =
    typeof localeOrMessages === 'string' ? getMessages(localeOrMessages) : localeOrMessages ?? getMessages();

  return (path: string, fallback?: string) => {
    if (!path) {
      return fallback ?? '';
    }

    const value = getFromPath(dictionary, path);

    if (typeof value === 'string') {
      return value;
    }

    return fallback ?? path;
  };
};

export const detectClientLocale = (): SupportedLocale => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored) {
    return resolveLocale(stored);
  }

  const browserLocale = typeof navigator !== 'undefined' ? navigator.language : undefined;
  return resolveLocale(browserLocale);
};
