import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

const buildTicketDetailEndpoint = (ticketId: string) => {
  const template = INTERNAL_API_ENDPOINTS.TICKETS.DETAIL || '/api/tickets/{id}';
  return buildApiUrl(template.replace('{id}', encodeURIComponent(ticketId)));
};

const extractTicketId = (pathname: string) => {
  const match = pathname.match(/\/api\/tickets\/([^/]+)(?:\/)?$/);
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

export const GET = apiHandlerWithReq(async (req) => {
  const accessToken = req.cookies.get('lmsAccessToken')?.value;
  const headers = buildAuthHeaders(accessToken);
  const ticketId = extractTicketId(req.nextUrl.pathname);

  const { data } = await backendFetch(buildTicketDetailEndpoint(ticketId), {
    method: 'GET',
    headers,
    parseJson: true
  });

  return data?.data ?? null;
});
