import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

const buildTicketStatusEndpoint = (ticketId: string) => {
  const template = INTERNAL_API_ENDPOINTS.TICKETS.STATUS || '/api/tickets/{id}/status';
  return buildApiUrl(template.replace('{id}', encodeURIComponent(ticketId)));
};

const extractTicketId = (pathname: string) => {
  const match = pathname.match(/\/api\/tickets\/([^/]+)\/status(?:\/)?$/);
  if (!match?.[1]) {
    throw new Error('Invalid ticket id');
  }
  return decodeURIComponent(match[1]);
};

const buildAuthHeaders = (accessToken?: string) => {
  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return headers;
};

export const PATCH = apiHandlerWithReq(async (req) => {
  const accessToken = req.cookies.get('lmsAccessToken')?.value;
  const headers = buildAuthHeaders(accessToken);
  headers.set('Content-Type', 'application/json');

  const ticketId = extractTicketId(req.nextUrl.pathname);
  const payload = await req.json();

  const { data } = await backendFetch(buildTicketStatusEndpoint(ticketId), {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
    parseJson: true
  });

  return data?.data ?? {};
});
