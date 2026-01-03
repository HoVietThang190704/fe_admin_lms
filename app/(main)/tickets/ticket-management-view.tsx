'use client';

import { useMemo, type FormEvent } from 'react';
import { RefreshCw, Search } from 'lucide-react';

import { AdminScaffold } from '@/components/layout/admin-scaffold';
import type { SidebarContent } from '@/components/dashboard/sidebar-data';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popup } from '@/components/ui/popup';
import { cn } from '@/lib/utils/cn';
import type { SupportedLocale } from '@/lib/i18n';
import type { AdminTicketRecord, TicketPriority, TicketStatus } from '@/lib/services/tickets';

import type { TicketSummaryCard, TicketStatusChoice, TicketStatusFilterValue } from './ticket-management.types';

const priorityClassMap: Record<TicketPriority, string> = {
  low: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-100 bg-amber-50 text-amber-700',
  high: 'border-orange-100 bg-orange-50 text-orange-700',
  urgent: 'border-rose-100 bg-rose-50 text-rose-700'
};

const statusClassMap: Record<TicketStatus, string> = {
  open: 'border-rose-200 bg-rose-50 text-rose-700',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-700',
  on_hold: 'border-slate-200 bg-slate-50 text-slate-600',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  closed: 'border-slate-200 bg-slate-100 text-slate-600',
  rejected: 'border-stone-200 bg-stone-50 text-stone-600'
};

const formatTicketType = (value?: string | null) => {
  if (!value) return '—';
  return value
    .split(/[_-]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

export type TicketManagementViewProps = {
  locale: SupportedLocale;
  sidebarContent: SidebarContent;
  pageCopy: Record<string, string | undefined>;
  filtersCopy: Record<string, string | undefined>;
  tableCopy: Record<string, string | undefined>;
  detailCopy: Record<string, string | undefined>;
  statusLabels: Record<TicketStatus, string>;
  priorityLabels: Record<TicketPriority, string>;
  tickets: AdminTicketRecord[];
  summaryCards: TicketSummaryCard[];
  searchInput: string;
  statusFilter: TicketStatusFilterValue;
  statusOptions: Array<{ value: TicketStatusFilterValue; label: string }>;
  statusChoices: TicketStatusChoice[];
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusFilterChange: (value: TicketStatusFilterValue) => void;
  onRefresh: () => void;
  onSelectTicket: (ticketId: string) => void;
  onUpdateStatus: (ticketId: string, nextStatus: TicketStatus) => void;
  statusMutations: Record<string, boolean>;
  isLoading: boolean;
  errorMessage: string | null;
  detailTicket: AdminTicketRecord | null;
  detailError: string | null;
  isDetailOpen: boolean;
  isDetailLoading: boolean;
  onCloseDetail: () => void;
  lastSyncedAt: string | null;
  summaryLabel: string;
};

export const TicketManagementView = ({
  locale,
  sidebarContent,
  pageCopy,
  filtersCopy,
  tableCopy,
  detailCopy,
  statusLabels,
  priorityLabels,
  tickets,
  summaryCards,
  searchInput,
  statusFilter,
  statusOptions,
  statusChoices,
  onSearchInputChange,
  onSearchSubmit,
  onStatusFilterChange,
  onRefresh,
  onSelectTicket,
  onUpdateStatus,
  statusMutations,
  isLoading,
  errorMessage,
  detailTicket,
  detailError,
  isDetailOpen,
  isDetailLoading,
  onCloseDetail,
  lastSyncedAt,
  summaryLabel
}: TicketManagementViewProps) => {
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }), [locale]);
  const lastSyncedLabel = useMemo(() => (lastSyncedAt ? dateFormatter.format(new Date(lastSyncedAt)) : null), [dateFormatter, lastSyncedAt]);

  const searchPlaceholder = filtersCopy.searchPlaceholder || 'Search tickets by title, ID, or requester';
  const refreshLabel = filtersCopy.refreshCta || 'Refresh';
  const statusLabel = filtersCopy.statusLabel || 'Status';

  const tableLoadingLabel = tableCopy.loading || 'Loading tickets...';
  const tableEmptyLabel = tableCopy.empty || 'No tickets match the current filters.';
  const viewDetailsLabel = tableCopy.viewDetails || 'View details';
  const statusPlaceholder = tableCopy.statusPlaceholder || 'Update status';

  const createdByLabel = detailCopy.createdBy || 'Created by';
  const assignedToLabel = detailCopy.assignedTo || 'Assigned to';
  const descriptionLabel = detailCopy.descriptionLabel || 'Description';
  const metadataLabel = detailCopy.metadata || 'Metadata';
  const relatedOrderLabel = detailCopy.relatedOrder || 'Related order';
  const relatedShopLabel = detailCopy.relatedShop || 'Related shop';
  const resolutionLabel = detailCopy.resolution || 'Resolution message';
  const commentsLabel = detailCopy.comments || 'Comments';

  const renderStatusBadge = (status: TicketStatus) => (
    <span className={cn('inline-flex max-w-max items-center rounded-full border px-3 py-1 text-xs font-semibold', statusClassMap[status] || 'border-slate-200 bg-slate-50 text-slate-600')}>
      {statusLabels[status] || status}
    </span>
  );

  const renderPriorityBadge = (priority: TicketPriority) => (
    <span className={cn('inline-flex max-w-max rounded-full border px-3 py-1 text-xs font-semibold', priorityClassMap[priority] || 'border-slate-200 bg-slate-50 text-slate-600')}>
      {priorityLabels[priority] || priority}
    </span>
  );

  const renderTicketMetaValue = (value?: string | null) => value || '—';

  return (
    <AdminScaffold sidebar={sidebarContent}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{pageCopy.badge || 'Incident desk'}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{pageCopy.title || 'Ticket operations'}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">{pageCopy.description || 'Monitor every learner and instructor escalation in real time.'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="muted" type="button" disabled>
              {pageCopy.secondaryAction || 'Export log'}
            </Button>
            <Button type="button" onClick={onRefresh} disabled={isLoading}>
              {pageCopy.primaryAction || 'Refresh stream'}
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <Alert variant="danger">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map(({ key, ...cardConfig }) => (
            <MetricCard key={key} {...cardConfig} valueFormatter={(value) => numberFormatter.format(value)} />
          ))}
        </section>

        <Card className="p-0">
          <CardHeader className="gap-2 border-b border-slate-100 px-6 py-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl">{pageCopy.title || 'Ticket operations'}</CardTitle>
                <CardDescription>{pageCopy.description || 'Monitor every escalation flowing into the LMS.'}</CardDescription>
              </div>
              <div className="text-sm text-slate-500">
                <p>{summaryLabel}</p>
                {lastSyncedLabel ? <p className="text-xs text-slate-400">Last synced {lastSyncedLabel}</p> : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <form onSubmit={onSearchSubmit} className="flex flex-1 gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={searchPlaceholder}
                    className="pl-10"
                    value={searchInput}
                    onChange={(event) => onSearchInputChange(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {tableCopy.searchCta || 'Search'}
                </Button>
              </form>
              <div className="flex w-full gap-3 lg:w-auto">
                <div className="flex flex-1 flex-col gap-1 text-sm text-slate-500 lg:flex-none">
                  <Label htmlFor="ticket-status-filter" className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {statusLabel}
                  </Label>
                  <select
                    id="ticket-status-filter"
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
                    value={statusFilter}
                    onChange={(event) => onStatusFilterChange(event.target.value as TicketStatusFilterValue)}
                    disabled={isLoading}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="button" variant="ghost" onClick={onRefresh} disabled={isLoading} aria-label={refreshLabel}>
                  <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max divide-y divide-slate-100 text-left text-sm">
                  <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">{tableCopy.ticket || 'Ticket'}</th>
                      <th className="px-6 py-3 font-semibold">{tableCopy.priority || 'Priority'}</th>
                      <th className="px-6 py-3 font-semibold">{tableCopy.type || 'Type'}</th>
                      <th className="px-6 py-3 font-semibold">{tableCopy.assigned || 'Assigned'}</th>
                      <th className="px-6 py-3 font-semibold">{tableCopy.created || 'Created'}</th>
                      <th className="px-6 py-3 font-semibold">{tableCopy.status || 'Status'}</th>
                      <th className="px-6 py-3 font-semibold">{tableCopy.actions || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                          <div className="flex items-center justify-center gap-3">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>{tableLoadingLabel}</span>
                          </div>
                        </td>
                      </tr>
                    ) : tickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                          {tableEmptyLabel}
                        </td>
                      </tr>
                    ) : (
                      tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-slate-50/60">
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-slate-900">{ticket.title}</p>
                              <p className="text-xs text-slate-500">#{ticket.ticketNumber || ticket.id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {renderPriorityBadge(ticket.priority)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatTicketType(ticket.type)}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900">{ticket.assignedToName || ticket.assignedTo || (tableCopy.unassigned || 'Unassigned')}</p>
                              <p className="text-xs text-slate-500">{ticket.createdByName || ticket.createdBy}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {ticket.createdAt ? dateFormatter.format(new Date(ticket.createdAt)) : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {renderStatusBadge(ticket.status)}
                              <div className="relative">
                                <select
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
                                  value={ticket.status}
                                  onChange={(event) => onUpdateStatus(ticket.id, event.target.value as TicketStatus)}
                                  disabled={Boolean(statusMutations[ticket.id])}
                                >
                                  {statusChoices.map((choice) => (
                                    <option key={choice.value} value={choice.value}>
                                      {choice.label}
                                    </option>
                                  ))}
                                </select>
                                {statusMutations[ticket.id] ? (
                                  <RefreshCw className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Button type="button" variant="outline" size="sm" onClick={() => onSelectTicket(ticket.id)}>
                              {viewDetailsLabel}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Popup
        isOpen={isDetailOpen}
        onClose={onCloseDetail}
        eyebrow={pageCopy.badge || 'Incident desk'}
        title={detailCopy.title || 'Ticket details'}
        description={detailCopy.description || 'Full metadata and resolution history.'}
        size="lg"
      >
        {detailError ? (
          <Alert variant="danger" className="mb-4">
            <AlertDescription>{detailError}</AlertDescription>
          </Alert>
        ) : null}

        {isDetailLoading ? (
          <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>{tableLoadingLabel}</span>
          </div>
        ) : detailTicket ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {renderStatusBadge(detailTicket.status)}
                {renderPriorityBadge(detailTicket.priority)}
                <span className="inline-flex max-w-max rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  {formatTicketType(detailTicket.type)}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{detailTicket.title}</h3>
                <p className="text-sm text-slate-500">#{detailTicket.ticketNumber || detailTicket.id}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-[0.2em] text-slate-400">{createdByLabel}</Label>
                <p className="text-sm font-medium text-slate-900">{renderTicketMetaValue(detailTicket.createdByName || detailTicket.createdBy)}</p>
                <p className="text-xs text-slate-500">{detailTicket.createdAt ? dateFormatter.format(new Date(detailTicket.createdAt)) : '—'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-[0.2em] text-slate-400">{assignedToLabel}</Label>
                <p className="text-sm font-medium text-slate-900">{renderTicketMetaValue(detailTicket.assignedToName || detailTicket.assignedTo)}</p>
                <p className="text-xs text-slate-500">{detailTicket.updatedAt ? dateFormatter.format(new Date(detailTicket.updatedAt)) : '—'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{descriptionLabel}</Label>
              <p className="text-sm text-slate-600">{detailTicket.description || '—'}</p>
            </div>

            <div className="grid gap-4 rounded-2xl bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{metadataLabel}</p>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">{relatedOrderLabel}</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {renderTicketMetaValue(detailTicket.relatedOrderReference || detailTicket.relatedOrderId)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">{relatedShopLabel}</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {renderTicketMetaValue(detailTicket.relatedShopReference || detailTicket.relatedShopId)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Ticket ID</dt>
                  <dd className="text-sm font-medium text-slate-900">{detailTicket.id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Ticket #</dt>
                  <dd className="text-sm font-medium text-slate-900">{detailTicket.ticketNumber || '—'}</dd>
                </div>
              </dl>
              {detailTicket.tags && detailTicket.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {detailTicket.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {detailTicket.attachments && detailTicket.attachments.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Attachments</p>
                  <ul className="space-y-2 text-sm">
                    {detailTicket.attachments.map((attachment) => (
                      <li key={attachment.url}>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 underline-offset-4 hover:underline"
                        >
                          {attachment.filename || attachment.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {detailTicket.resolutionMessage ? (
              <div className="space-y-2">
                <Label>{resolutionLabel}</Label>
                <p className="text-sm text-slate-600">{detailTicket.resolutionMessage}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 p-4">
              <div className="flex-1">
                <Label className="text-xs uppercase tracking-[0.2em] text-slate-400">{statusPlaceholder}</Label>
                <p className="text-sm text-slate-600">{commentsLabel}: {detailTicket.commentsCount ?? 0}</p>
              </div>
              <div className="relative w-full max-w-xs">
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
                  value={detailTicket.status}
                  onChange={(event) => onUpdateStatus(detailTicket.id, event.target.value as TicketStatus)}
                  disabled={Boolean(statusMutations[detailTicket.id])}
                >
                  {statusChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
                {statusMutations[detailTicket.id] ? (
                  <RefreshCw className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                ) : null}
              </div>
            </div>

            <div className="text-xs text-slate-400">
              <p>Created: {detailTicket.createdAt ? dateFormatter.format(new Date(detailTicket.createdAt)) : '—'}</p>
              <p>Updated: {detailTicket.updatedAt ? dateFormatter.format(new Date(detailTicket.updatedAt)) : '—'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a ticket to inspect.</p>
        )}
      </Popup>
    </AdminScaffold>
  );
};
