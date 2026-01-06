'use client';

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { io, type Socket } from 'socket.io-client';

import { buildSidebarContent } from '@/components/dashboard/sidebar-data';
import { detectClientLocale, getMessages, type SupportedLocale } from '@/lib/i18n';
import { fetchAdminProfile, type AdminProfile } from '@/lib/services/users/profile';
import { getErrorMessage } from '@/lib/shared/utils/api';

import { SupportChatView } from './support-chat-view';
import type { SupportChatAck, SupportChatMessage, SupportConversation } from './support-chat.types';
import { formatTimestamp, getLastMessage } from './support-chat.utils';

const SOCKET_BASE_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  'http://localhost:5000';

const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io';

const STORAGE_KEYS = {
  ADMIN_USER: 'lms:adminUser'
};

const defaultStatusLabels: Record<'idle' | 'connecting' | 'online' | 'error', string> = {
  idle: 'Idle',
  connecting: 'Connecting...',
  online: 'Online',
  error: 'Error'
};

const statusBadgeClass: Record<'idle' | 'connecting' | 'online' | 'error', string> = {
  idle: 'bg-slate-100 text-slate-600',
  connecting: 'bg-amber-100 text-amber-700',
  online: 'bg-emerald-100 text-emerald-700',
  error: 'bg-rose-100 text-rose-700'
};

const buildClientMessageId = () => `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const useLocaleDictionary = () => {
  const [locale] = useState<SupportedLocale>(() => detectClientLocale());
  const dictionary = useMemo(() => getMessages(locale), [locale]);
  return { locale, dictionary };
};

export default function SupportChatPage() {
  const { locale, dictionary } = useLocaleDictionary();
  const sidebarContent = useMemo(() => buildSidebarContent(dictionary), [dictionary]);
  const supportChatCopy = dictionary.supportChat ?? {};
  const pageCopy = supportChatCopy.page ?? {};
  const listCopy = supportChatCopy.list ?? {};
  const threadCopy = supportChatCopy.thread ?? {};
  const statesCopy = supportChatCopy.states ?? {};
  const errorsCopy = supportChatCopy.errors ?? {};
  const metaCopy = supportChatCopy.meta ?? {};

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Record<string, SupportConversation>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [socketState, setSocketState] = useState<'idle' | 'connecting' | 'online' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [socketAttempt, setSocketAttempt] = useState(0);
  const [socketConnectedAt, setSocketConnectedAt] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const socketUrl = useMemo(() => SOCKET_BASE_URL.replace(/\/$/, ''), []);
  const adminDisplayName = admin?.fullName || admin?.email || 'Admin';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<AdminProfile> & { userName?: string };
      setAdmin((prev) =>
        prev ?? {
          id: parsed.id || 'admin-local',
          email: parsed.email || 'admin@lms.local',
          fullName: parsed.fullName || parsed.userName,
          role: (parsed.role as AdminProfile['role']) || 'admin',
          isActive: true,
          isBlocked: false,
          profile: parsed.profile,
          facebookId: parsed.facebookId,
          googleId: parsed.googleId
        }
      );
    } catch {
      // ignore malformed payloads
    }
  }, []);

  const loadAdminProfile = useCallback(async () => {
    setIsProfileLoading(true);
    setProfileError(null);
    try {
      const profile = await fetchAdminProfile();
      setAdmin(profile);
    } catch (error) {
      setProfileError(getErrorMessage(error, errorsCopy.profile || 'Unable to load administrator profile.'));
    } finally {
      setIsProfileLoading(false);
    }
  }, [errorsCopy.profile]);

  useEffect(() => {
    void loadAdminProfile();
  }, [loadAdminProfile]);

  const handleIncomingMessage = useCallback(
    (incoming: SupportChatMessage) => {
      if (!incoming?.userId) return;
      setConversations((prev) => {
        const existing = prev[incoming.userId] ?? {
          userId: incoming.userId,
          userName: incoming.senderRole === 'user' ? incoming.senderName : null,
          messages: [],
          lastMessageAt: null,
          unreadCount: 0
        };

        const nextMessages = (() => {
          if (incoming.clientMessageId) {
            const index = existing.messages.findIndex((msg) => msg.clientMessageId === incoming.clientMessageId);
            if (index !== -1) {
              const copy = [...existing.messages];
              copy[index] = { ...incoming, pending: false, error: false };
              return copy;
            }
          }
          return [...existing.messages, { ...incoming, pending: false, error: false }];
        })();

        const shouldIncreaseUnread = incoming.senderRole === 'user' && selectedUserId !== incoming.userId;
        const unreadCount = shouldIncreaseUnread ? Math.min((existing.unreadCount || 0) + 1, 999) : existing.unreadCount || 0;

        return {
          ...prev,
          [incoming.userId]: {
            ...existing,
            userName: existing.userName ?? incoming.senderName ?? existing.userName,
            messages: nextMessages,
            lastMessageAt: incoming.createdAt || existing.lastMessageAt,
            unreadCount
          }
        };
      });

      setSelectedUserId((prev) => prev ?? incoming.userId);
    },
    [selectedUserId]
  );

  useEffect(() => {
    if (!admin?.id) return;
    setSocketState('connecting');
    setConnectionError(null);

    const socket = io(socketUrl, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketState('online');
      setConnectionError(null);
      setSocketConnectedAt(new Date().toISOString());
      socket.emit('support-chat:join-admin', { adminId: admin.id });
    });

    socket.on('connect_error', (error) => {
      setSocketState('error');
      setConnectionError(error?.message || errorsCopy.connection || 'Unable to connect to support socket.');
    });

    socket.on('support-chat:message', handleIncomingMessage);

    socket.on('disconnect', () => {
      setSocketState('idle');
    });

    return () => {
      socket.off('support-chat:message', handleIncomingMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [admin?.id, socketUrl, handleIncomingMessage, errorsCopy.connection, socketAttempt]);

  useEffect(() => {
    if (!selectedUserId) return;
    setConversations((prev) => {
      const selected = prev[selectedUserId];
      if (!selected || selected.unreadCount === 0) {
        return prev;
      }
      return {
        ...prev,
        [selectedUserId]: {
          ...selected,
          unreadCount: 0
        }
      };
    });
  }, [selectedUserId]);

  const activeConversation = selectedUserId ? conversations[selectedUserId] ?? null : null;
  const activeMessages = activeConversation?.messages ?? [];

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, selectedUserId]);

  const conversationList = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const values = Object.values(conversations);
    const filtered = normalizedSearch
      ? values.filter((conversation) => {
          const haystack = [conversation.userName, conversation.userId, getLastMessage(conversation.messages)?.content]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        })
      : values;

    const toTimestamp = (value?: string | null) => (value ? new Date(value).getTime() : 0);
    return filtered
      .slice()
      .sort((a, b) => toTimestamp(b.lastMessageAt) - toTimestamp(a.lastMessageAt));
  }, [conversations, searchTerm]);

  const totalUnread = useMemo(
    () => Object.values(conversations).reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0),
    [conversations]
  );

  const handleSelectConversation = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setConversations((prev) => {
      const target = prev[userId];
      if (!target || target.unreadCount === 0) return prev;
      return { ...prev, [userId]: { ...target, unreadCount: 0 } };
    });
  }, []);

  const markMessageAsErrored = useCallback((userId: string, clientMessageId: string) => {
    setConversations((prev) => {
      const target = prev[userId];
      if (!target) return prev;
      const updated = target.messages.map((message) =>
        message.clientMessageId === clientMessageId ? { ...message, pending: false, error: true } : message
      );
      return { ...prev, [userId]: { ...target, messages: updated } };
    });
  }, []);

  const handleSendMessage = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!selectedUserId || !socketRef.current || socketState !== 'online' || !admin?.id) {
        return;
      }

      const draft = drafts[selectedUserId] ?? '';
      const content = draft.trim();
      if (!content) return;

      const clientMessageId = buildClientMessageId();
      const optimisticMessage: SupportChatMessage = {
        id: clientMessageId,
        clientMessageId,
        userId: selectedUserId,
        senderRole: 'admin',
        senderId: admin.id,
        senderName: adminDisplayName,
        content,
        createdAt: new Date().toISOString(),
        pending: true
      };

      setConversations((prev) => {
        const existing = prev[selectedUserId] ?? {
          userId: selectedUserId,
          userName: null,
          messages: [],
          lastMessageAt: null,
          unreadCount: 0
        };
        return {
          ...prev,
          [selectedUserId]: {
            ...existing,
            messages: [...existing.messages, optimisticMessage],
            lastMessageAt: optimisticMessage.createdAt
          }
        };
      });

      setDrafts((prev) => ({ ...prev, [selectedUserId]: '' }));
      setConnectionError(null);

      socketRef.current.emit(
        'support-chat:send-message',
        {
          userId: selectedUserId,
          content,
          senderId: admin.id,
          senderName: adminDisplayName,
          senderRole: 'admin',
          clientMessageId
        },
        (ack?: SupportChatAck) => {
          if (ack && ack.success === false) {
            setConnectionError(ack.error || errorsCopy.send || 'Unable to send message. Please try again.');
            markMessageAsErrored(selectedUserId, clientMessageId);
          }
        }
      );
    },
    [admin?.id, adminDisplayName, drafts, errorsCopy.send, markMessageAsErrored, selectedUserId, socketState]
  );

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleReconnect = () => {
    setSocketAttempt((prev) => prev + 1);
  };

  const handleDraftChange = (value: string) => {
    if (!selectedUserId) return;
    setDrafts((prev) => ({ ...prev, [selectedUserId]: value }));
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
  };

  const currentDraft = selectedUserId ? drafts[selectedUserId] ?? '' : '';
  const statusLabel = statesCopy[socketState] || defaultStatusLabels[socketState];
  const connectionBadgeClass = statusBadgeClass[socketState];
  const lastConnectedLabel = socketConnectedAt
    ? `${metaCopy.lastConnected || 'Last connected'} ${formatTimestamp(socketConnectedAt, locale)}`
    : null;

  return (
    <SupportChatView
      sidebarContent={sidebarContent}
      pageCopy={pageCopy}
      listCopy={listCopy}
      threadCopy={threadCopy}
      metaCopy={metaCopy}
      hasAdminProfile={Boolean(admin)}
      adminDisplayName={adminDisplayName}
      isProfileLoading={isProfileLoading}
      profileError={profileError}
      connectionError={connectionError}
      onRefreshProfile={loadAdminProfile}
      onReconnect={handleReconnect}
      socketState={socketState}
      statusLabel={statusLabel}
      connectionBadgeClass={connectionBadgeClass}
      lastConnectedLabel={lastConnectedLabel}
      conversationList={conversationList}
      totalUnread={totalUnread}
      searchTerm={searchTerm}
      onSearchTermChange={handleSearchTermChange}
      selectedUserId={selectedUserId}
      onSelectConversation={handleSelectConversation}
      activeConversation={activeConversation}
      activeMessages={activeMessages}
      messageEndRef={messageEndRef}
      onSendMessage={handleSendMessage}
      onComposerKeyDown={handleComposerKeyDown}
      currentDraft={currentDraft}
      onDraftChange={handleDraftChange}
      locale={locale}
    />
  );
}
