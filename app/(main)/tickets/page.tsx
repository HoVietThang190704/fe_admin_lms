'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Clock8, LifeBuoy, UserMinus } from 'lucide-react';

import { buildSidebarContent } from '@/components/dashboard/sidebar-data';
import { detectClientLocale, getMessages, type SupportedLocale } from '@/lib/i18n';
import { getErrorMessage } from '@/lib/shared/utils/api';
import {
  fetchAdminTickets,
  fetchTicketDetail,
  updateTicketStatus,
  type AdminTicketRecord,
  type TicketPriority,
  type TicketStatus
} from '@/lib/services/tickets';

import { TicketManagementView } from './ticket-management-view';
import type { TicketStatusChoice, TicketStatusFilterValue, TicketSummaryCard } from './ticket-management.types';

const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'on_hold', 'resolved', 'closed', 'rejected'];
const defaultTicketLimit = 200;

const useLocaleDictionary = () => {
  const [locale] = useState<SupportedLocale>(() => detectClientLocale());
  const dictionary = useMemo(() => getMessages(locale), [locale]);
  return { locale, dictionary };
};

export default function TicketsPage() {
  const { locale, dictionary } = useLocaleDictionary();
  const sidebarContent = useMemo(() => buildSidebarContent(dictionary), [dictionary]);
  const ticketsCopy = useMemo(() => dictionary.tickets ?? {}, [dictionary]);
  const pageCopy = useMemo(() => ticketsCopy.page ?? {}, [ticketsCopy]);
  const filtersCopy = useMemo(() => ticketsCopy.filters ?? {}, [ticketsCopy]);
  const summaryCopy = useMemo(() => ticketsCopy.summary ?? {}, [ticketsCopy]);
  const tableCopy = useMemo(() => ticketsCopy.table ?? {}, [ticketsCopy]);
  const detailCopy = useMemo(() => ticketsCopy.detail ?? {}, [ticketsCopy]);
  const statusCopy = useMemo(() => ticketsCopy.status ?? {}, [ticketsCopy]);
  const priorityCopy = useMemo(() => ticketsCopy.priority ?? {}, [ticketsCopy]);
  const errorsCopy = useMemo(() => ticketsCopy.errors ?? {}, [ticketsCopy]);

  const [tickets, setTickets] = useState<AdminTicketRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilterValue>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailTicket, setDetailTicket] = useState<AdminTicketRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [statusMutations, setStatusMutations] = useState<Record<string, boolean>>({});
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const statusLabels: Record<TicketStatus, string> = useMemo(
    () => ({
      open: statusCopy.open || 'Open',
      in_progress: statusCopy.in_progress || 'In progress',
      on_hold: statusCopy.on_hold || 'On hold',
      resolved: statusCopy.resolved || 'Resolved',
      closed: statusCopy.closed || 'Closed',
      rejected: statusCopy.rejected || 'Rejected'
    }),
    [statusCopy]
  );

  const priorityLabels: Record<TicketPriority, string> = useMemo(
    () => ({
      low: priorityCopy.low || 'Low',
      medium: priorityCopy.medium || 'Medium',
      high: priorityCopy.high || 'High',
      urgent: priorityCopy.urgent || 'Urgent'
    }),
    [priorityCopy]
  );

  const statusOptions = useMemo(
    () => [
      { value: 'all' as TicketStatusFilterValue, label: filtersCopy.statusAll || 'All statuses' },
      ...TICKET_STATUSES.map((value) => ({ value, label: statusLabels[value] }))
    ],
    [filtersCopy.statusAll, statusLabels]
  );

  const statusChoices: TicketStatusChoice[] = useMemo(
    () => TICKET_STATUSES.map((value) => ({ value, label: statusLabels[value] })),
    [statusLabels]
  );

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchAdminTickets({ limit: defaultTicketLimit });
      setTickets(result.tickets);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setErrorMessage(getErrorMessage(error, errorsCopy.load || 'Unable to load tickets. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [errorsCopy.load]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchTerm(searchInput.trim().toLowerCase());
  };

  const handleStatusFilterChange = (value: TicketStatusFilterValue) => {
    setStatusFilter(value);
  };

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        ticket.title,
        ticket.ticketNumber,
        ticket.id,
        ticket.createdByName,
        ticket.createdBy,
        ticket.assignedToName,
        ticket.assignedTo
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [tickets, statusFilter, searchTerm]);

  const filteredCount = filteredTickets.length;
  const totalCount = tickets.length;

  const summaryLabel = useMemo(() => {
    if (totalCount === 0) {
      return tableCopy.empty || 'No tickets available yet.';
    }

    if (filteredCount === totalCount) {
      return `Showing ${filteredCount} / ${totalCount} tickets`;
    }

    return `Showing ${filteredCount} of ${totalCount} tickets`;
  }, [filteredCount, totalCount, tableCopy.empty]);

  const summaryCards: TicketSummaryCard[] = useMemo(() => {
    const openCount = tickets.filter((ticket) => ticket.status === 'open').length;
    const inProgressCount = tickets.filter((ticket) => ticket.status === 'in_progress').length;
    const resolvedCount = tickets.filter((ticket) => ticket.status === 'resolved').length;
    const unassignedCount = tickets.filter((ticket) => !ticket.assignedTo).length;
    const syncCaption = lastSyncedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastSyncedAt))
      : pageCopy.badge || 'Incident desk';

    return [
      {
        key: 'total',
        label: summaryCopy.total || 'All tickets',
        value: tickets.length,
        caption: syncCaption,
        icon: LifeBuoy,
        accent: 'from-slate-900/10 to-slate-900/5'
      },
      {
        key: 'open',
        label: summaryCopy.open || statusLabels.open,
        value: openCount,
        caption: statusLabels.open,
        icon: AlertTriangle,
        accent: 'from-rose-500/10 to-rose-500/5'
      },
      {
        key: 'inProgress',
        label: summaryCopy.inProgress || statusLabels.in_progress,
        value: inProgressCount,
        caption: statusLabels.in_progress,
        icon: Clock8,
        accent: 'from-amber-500/10 to-amber-500/5'
      },
      {
        key: 'resolved',
        label: summaryCopy.resolved || statusLabels.resolved,
        value: resolvedCount,
        caption: statusLabels.resolved,
        icon: CheckCircle2,
        accent: 'from-emerald-500/10 to-emerald-500/5'
      },
      {
        key: 'unassigned',
        label: summaryCopy.unassigned || 'Unassigned',
        value: unassignedCount,
        caption: tableCopy.assigned || 'Assignment',
        icon: UserMinus,
        accent: 'from-sky-500/10 to-sky-500/5'
      }
    ];
  }, [tickets, summaryCopy, statusLabels, lastSyncedAt, locale, pageCopy.badge, tableCopy.assigned]);

  const handleRefresh = () => {
    void loadTickets();
  };

  const handleSelectTicket = async (ticketId: string) => {
    setIsDetailOpen(true);
    setDetailError(null);
    const fallbackTicket = tickets.find((ticket) => ticket.id === ticketId) ?? null;
    setDetailTicket(fallbackTicket);
    setIsDetailLoading(true);

    try {
      const detail = await fetchTicketDetail(ticketId);
      setDetailTicket(detail);
    } catch (error) {
      setDetailError(getErrorMessage(error, errorsCopy.detail || 'Unable to load ticket details.'));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setDetailTicket(null);
    setDetailError(null);
  };

  const handleUpdateStatus = async (ticketId: string, nextStatus: TicketStatus) => {
    setStatusMutations((prev) => ({ ...prev, [ticketId]: true }));
    setErrorMessage(null);
    setDetailError(null);

    try {
      const updated = await updateTicketStatus(ticketId, { status: nextStatus });
      setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      setDetailTicket((prev) => (prev && prev.id === ticketId ? updated : prev));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, errorsCopy.status || 'Unable to update ticket status.'));
    } finally {
      setStatusMutations((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    }
  };

  return (
    <TicketManagementView
      locale={locale}
      sidebarContent={sidebarContent}
      pageCopy={pageCopy}
      filtersCopy={filtersCopy}
      tableCopy={tableCopy}
      detailCopy={detailCopy}
      statusLabels={statusLabels}
      priorityLabels={priorityLabels}
      tickets={filteredTickets}
      summaryCards={summaryCards}
      searchInput={searchInput}
      statusFilter={statusFilter}
      statusOptions={statusOptions}
      statusChoices={statusChoices}
      onSearchInputChange={setSearchInput}
      onSearchSubmit={handleSearchSubmit}
      onStatusFilterChange={handleStatusFilterChange}
      onRefresh={handleRefresh}
      onSelectTicket={handleSelectTicket}
      onUpdateStatus={handleUpdateStatus}
      statusMutations={statusMutations}
      isLoading={isLoading}
      errorMessage={errorMessage}
      detailTicket={detailTicket}
      detailError={detailError}
      isDetailOpen={isDetailOpen}
      isDetailLoading={isDetailLoading}
      onCloseDetail={handleCloseDetail}
      lastSyncedAt={lastSyncedAt}
      summaryLabel={summaryLabel}
    />
  );
}
