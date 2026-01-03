import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';
import type { TicketStatus } from './types';
import type { TicketListResponse, AdminTicketRecord } from './types';

export type TicketListParams = {
  status?: TicketStatus;
  assignedTo?: string;
  limit?: number;
  offset?: number;
};

const buildQuery = (params: TicketListParams) => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.assignedTo) searchParams.set('assignedTo', params.assignedTo);
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit));
  if (typeof params.offset === 'number') searchParams.set('offset', String(params.offset));
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

type TicketApiResponse = Partial<TicketListResponse> & {
  data?: AdminTicketRecord[] | null;
};

export const fetchAdminTickets = async (params: TicketListParams = {}): Promise<TicketListResponse> => {
  const query = buildQuery(params);
  const response = await fetch(`/api/tickets${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to fetch tickets', response.status, errorPayload);
  }

  let payload: TicketApiResponse = {};
  try {
    payload = (await response.json()) as TicketApiResponse;
  } catch {
    payload = {};
  }

  const tickets = Array.isArray(payload.tickets) ? payload.tickets : Array.isArray(payload.data) ? payload.data : [];

  return {
    tickets: (tickets as AdminTicketRecord[]) ?? []
  };
};
