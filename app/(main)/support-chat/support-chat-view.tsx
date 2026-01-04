'use client';

import { FormEvent, KeyboardEvent, MutableRefObject } from 'react';
import { Loader2, MessageSquare, Radio, Send, Users } from 'lucide-react';

import { AdminScaffold } from '@/components/layout/admin-scaffold';
import type { SidebarContent } from '@/components/dashboard/sidebar-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils/cn';
import type { SupportedLocale } from '@/lib/i18n';

import type { SupportChatMessage, SupportConversation } from './support-chat.types';
import { formatTimestamp, getLastMessage } from './support-chat.utils';

export type SupportChatViewProps = {
  sidebarContent: SidebarContent;
  pageCopy: Record<string, string | undefined>;
  listCopy: Record<string, string | undefined>;
  threadCopy: Record<string, string | undefined>;
  metaCopy: Record<string, string | undefined>;
  hasAdminProfile: boolean;
  adminDisplayName: string;
  isProfileLoading: boolean;
  profileError: string | null;
  connectionError: string | null;
  onRefreshProfile: () => void;
  onReconnect: () => void;
  socketState: 'idle' | 'connecting' | 'online' | 'error';
  statusLabel: string;
  connectionBadgeClass: string;
  lastConnectedLabel: string | null;
  conversationList: SupportConversation[];
  totalUnread: number;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedUserId: string | null;
  onSelectConversation: (userId: string) => void;
  activeConversation: SupportConversation | null;
  activeMessages: SupportChatMessage[];
  messageEndRef: MutableRefObject<HTMLDivElement | null>;
  onSendMessage: (event?: FormEvent<HTMLFormElement>) => void;
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  currentDraft: string;
  onDraftChange: (value: string) => void;
  locale: SupportedLocale;
};

export const SupportChatView = ({
  sidebarContent,
  pageCopy,
  listCopy,
  threadCopy,
  metaCopy,
  hasAdminProfile,
  adminDisplayName,
  isProfileLoading,
  profileError,
  connectionError,
  onRefreshProfile,
  onReconnect,
  socketState,
  statusLabel,
  connectionBadgeClass,
  lastConnectedLabel,
  conversationList,
  totalUnread,
  searchTerm,
  onSearchTermChange,
  selectedUserId,
  onSelectConversation,
  activeConversation,
  activeMessages,
  messageEndRef,
  onSendMessage,
  onComposerKeyDown,
  currentDraft,
  onDraftChange,
  locale
}: SupportChatViewProps) => {
  const renderEmptyInbox = () => (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-slate-500">
      <Users className="h-6 w-6 text-slate-400" />
      <p>{pageCopy.emptyDescription || 'Learner chats will appear here the moment someone reaches out.'}</p>
    </div>
  );

  const renderConversationList = () => (
    <div className="space-y-2">
      {conversationList.map((conversation) => {
        const lastMessage = getLastMessage(conversation.messages);
        const isActive = conversation.userId === selectedUserId;
        return (
          <button
            type="button"
            key={conversation.userId}
            onClick={() => onSelectConversation(conversation.userId)}
            className={cn(
              'w-full rounded-2xl border px-4 py-3 text-left transition',
              isActive ? 'border-slate-900 bg-slate-900/5' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{conversation.userName || `Learner ${conversation.userId}`}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  {formatTimestamp(conversation.lastMessageAt, locale)}
                </p>
              </div>
              {conversation.unreadCount > 0 ? (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </span>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-slate-500">
              {lastMessage?.content || listCopy.emptyPreview || 'No messages yet'}
            </p>
          </button>
        );
      })}
    </div>
  );

  const renderActiveConversation = () => (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <p className="text-sm font-semibold text-slate-900">{activeConversation?.userName || `Learner ${activeConversation?.userId}`}</p>
          <p className="text-xs text-slate-500">
            {threadCopy.headerTitle || 'Conversation'} · {formatTimestamp(activeConversation?.lastMessageAt ?? null, locale)}
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p className="font-semibold text-slate-900">{statusLabel}</p>
          {lastConnectedLabel ? <p>{lastConnectedLabel}</p> : null}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6" role="log" aria-live="polite">
        {activeMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-500">
            <MessageSquare className="h-6 w-6 text-slate-400" />
            <p>{threadCopy.emptyState || 'Start the conversation with a quick greeting.'}</p>
          </div>
        ) : (
          activeMessages.map((message) => {
            const isAdminMessage = message.senderRole === 'admin';
            return (
              <div key={message.id} className={cn('flex flex-col gap-1', isAdminMessage ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-sm',
                    isAdminMessage ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
                  )}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-white/70">
                    <span className="opacity-80">
                      {isAdminMessage ? threadCopy.operatorLabel || 'You' : message.senderName || 'Learner'}
                    </span>
                    <span className="opacity-60">{formatTimestamp(message.createdAt, locale)}</span>
                  </div>
                  {message.pending ? (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-white/70">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{threadCopy.sendingLabel || 'Sending...'}</span>
                    </div>
                  ) : null}
                  {message.error ? (
                    <div className="mt-2 text-[11px] text-rose-200">{threadCopy.sendErrorLabel || 'Failed to send.'}</div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      <form onSubmit={onSendMessage} className="border-t border-slate-100 px-6 py-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
          <textarea
            rows={3}
            value={currentDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder={threadCopy.composerPlaceholder || 'Type a reply...'}
            disabled={socketState !== 'online'}
            className="w-full resize-none rounded-2xl border border-transparent bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-200 disabled:cursor-not-allowed"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{metaCopy.messagePlaceholder || 'Press Enter to send · Shift+Enter for new line'}</span>
            <Button type="submit" size="sm" disabled={socketState !== 'online' || !currentDraft.trim()} className="gap-2">
              {threadCopy.sendCta || 'Send reply'}
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </form>
    </>
  );

  const renderEmptyState = () => (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-slate-500">
      <Radio className="h-8 w-8 text-slate-400" />
      <div>
        <p className="text-lg font-semibold text-slate-900">{pageCopy.emptyTitle || 'No conversations yet'}</p>
        <p className="mt-2 text-sm text-slate-500">
          {pageCopy.emptyDescription || 'Learner chats will appear here as soon as a message is received.'}
        </p>
      </div>
    </div>
  );

  return (
    <AdminScaffold sidebar={sidebarContent}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{pageCopy.badge || 'Support desk'}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{pageCopy.title || 'Live learner chat'}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              {pageCopy.description || 'Monitor every learner escalation and respond without leaving the admin console.'}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              {hasAdminProfile
                ? `${pageCopy.currentOperator || 'Responding as'} ${adminDisplayName}`
                : isProfileLoading
                  ? 'Loading administrator profile...'
                  : profileError
                    ? profileError
                    : 'No administrator profile detected.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="muted" onClick={onRefreshProfile} disabled={isProfileLoading}>
              {pageCopy.secondaryAction || 'Refresh profile'}
            </Button>
            <Button type="button" onClick={onReconnect} disabled={socketState === 'connecting'}>
              {socketState === 'connecting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {pageCopy.primaryAction || 'Reconnect socket'}
            </Button>
          </div>
        </div>

        {profileError && !isProfileLoading ? (
          <Alert variant="danger">
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
        ) : null}

        {connectionError ? (
          <Alert variant="danger">
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{listCopy.totalThreads || 'Threads'}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{conversationList.length}</p>
            <p className="text-xs text-slate-500">{listCopy.activeLabel || 'Active conversations'}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{listCopy.unreadLabel || 'Unread'}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalUnread}</p>
            <p className="text-xs text-slate-500">{listCopy.queueLabel || 'Awaiting responses'}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{threadCopy.syncBadge || 'Connected'}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 capitalize">{statusLabel}</p>
            <p className="text-xs text-slate-500">{lastConnectedLabel || threadCopy.disconnectedBadge || 'Offline'}</p>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-100 bg-white/80 p-5 shadow-2xl shadow-slate-200/70">
          <div className="grid min-h-[900px] gap-6 overflow-hidden lg:h-[calc(100vh-100px)] lg:grid-cols-[360px,1fr]">
            <aside className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{listCopy.title || 'Inbox'}</p>
                <p className="text-xs text-slate-500">{conversationList.length} chats</p>
              </div>
              <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', connectionBadgeClass)}>{statusLabel}</span>
            </div>
            <div className="border-b border-slate-100 px-5 py-3">
              <Input
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                placeholder={listCopy.searchPlaceholder || 'Search by learner or ID'}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-4">
              {conversationList.length === 0 ? renderEmptyInbox() : renderConversationList()}
            </div>
            </aside>

            <section className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
              {activeConversation ? renderActiveConversation() : renderEmptyState()}
            </section>
          </div>
        </section>
      </div>
    </AdminScaffold>
  );
};
