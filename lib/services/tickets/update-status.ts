import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';
import type { AdminTicketRecord, TicketStatus } from './types';

export type UpdateTicketStatusPayload = {
  status: TicketStatus;
  resolutionMessage?: string;
};

export const updateTicketStatus = async (
  ticketId: string,
  payload: UpdateTicketStatusPayload
): Promise<AdminTicketRecord> => {
  const response = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    credentials: 'include'
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to update ticket status', response.status, errorPayload);
  }

  const data = (await response.json().catch(() => null)) as AdminTicketRecord | { data?: AdminTicketRecord } | null;
  if (data && 'data' in (data as object) && data.data) {
    return data.data;
  }

  if (data && !('data' in (data as object))) {
    return data as AdminTicketRecord;
  }

  throw new ApiError('Missing ticket payload', 500);
};
