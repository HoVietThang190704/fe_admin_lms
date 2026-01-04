import type { SupportedLocale } from '@/lib/i18n';

import type { SupportChatMessage } from './support-chat.types';

export const formatTimestamp = (value: string | null | undefined, locale: SupportedLocale): string => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const getLastMessage = (messages: SupportChatMessage[]): SupportChatMessage | undefined =>
  messages.length > 0 ? messages[messages.length - 1] : undefined;
