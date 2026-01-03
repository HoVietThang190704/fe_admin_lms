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

  type TicketUpdateResponse = AdminTicketRecord | { data?: AdminTicketRecord | null } | null;
  const payloadBody = (await response.json().catch(() => null)) as TicketUpdateResponse;

  if (payloadBody && typeof payloadBody === 'object' && 'data' in payloadBody) {
    if (payloadBody.data) {
      return payloadBody.data;
    }
    throw new ApiError('Missing ticket payload', 500);
  }

  if (payloadBody) {
    return payloadBody as AdminTicketRecord;
  }

  throw new ApiError('Missing ticket payload', 500);
};
