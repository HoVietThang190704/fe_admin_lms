import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

const ALLOWED_QUERY_KEYS = ['status', 'assignedTo', 'limit', 'offset'] as const;

const buildTicketsEndpoint = (searchParams: URLSearchParams) => {
  const target = new URL(buildApiUrl(INTERNAL_API_ENDPOINTS.TICKETS.LIST));
  ALLOWED_QUERY_KEYS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      target.searchParams.set(key, value);
    }
  });
  return target.toString();
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

  const endpoint = buildTicketsEndpoint(req.nextUrl.searchParams);
  const { data } = await backendFetch(endpoint, {
    method: 'GET',
    headers,
    parseJson: true
  });

  const payload = data ?? {};
  const tickets = Array.isArray(payload.data) ? payload.data : [];

  return {
    tickets
  };
});
