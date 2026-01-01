import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

export type UsersApiResponse = {
  users: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const getUsersEndpoint = (searchParams: URLSearchParams) => {
  const targetUrl = new URL(buildApiUrl(INTERNAL_API_ENDPOINTS.USERS.LIST));
  searchParams.forEach((value, key) => {
    if (value !== undefined && value !== null && value !== '') {
      targetUrl.searchParams.set(key, value);
    }
  });
  return targetUrl.toString();
};

export const GET = apiHandlerWithReq(async (req) => {
  const endpoint = getUsersEndpoint(req.nextUrl.searchParams);
  const accessToken = req.cookies.get('lmsAccessToken')?.value;

  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const { data } = await backendFetch(endpoint, {
    method: 'GET',
    parseJson: true,
    headers
  });

  const payload = data?.data ?? {};

  return {
    users: Array.isArray(payload.users) ? payload.users : [],
    pagination: {
      page: payload.pagination?.page ?? 1,
      limit: payload.pagination?.limit ?? 10,
      total: payload.pagination?.total ?? 0,
      totalPages: payload.pagination?.totalPages ?? 0
    }
  } satisfies UsersApiResponse;
});
