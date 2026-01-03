import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';
import type { AdminTicketRecord } from './types';

export const fetchTicketDetail = async (ticketId: string): Promise<AdminTicketRecord> => {
  const response = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to load ticket detail', response.status, errorPayload);
  }

  const data = (await response.json().catch(() => null)) as AdminTicketRecord | { data?: AdminTicketRecord } | null;
  if (data && 'data' in data && data.data) {
    return data.data;
  }

  if (data && !('data' in (data as object))) {
    return data as AdminTicketRecord;
  }

  throw new ApiError('Ticket not found', 404);
};
