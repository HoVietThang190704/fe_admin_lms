import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';
import { ApiError } from '@/lib/shared/utils/api';

const buildDeleteEndpoint = (userId: string) => {
  const template = INTERNAL_API_ENDPOINTS.USERS.DELETE || '/api/users/{id}';
  return buildApiUrl(template.replace('{id}', encodeURIComponent(userId)));
};

const extractUserId = (pathname: string): string => {
  const match = pathname.match(/\/api\/users\/([^/]+)(?:\/)?$/);
  if (!match?.[1]) {
    throw new ApiError('Invalid user id', 400);
  }
  return decodeURIComponent(match[1]);
};

export const DELETE = apiHandlerWithReq(async (req) => {
  const userId = extractUserId(req.nextUrl.pathname);
  const accessToken = req.cookies.get('lmsAccessToken')?.value;

  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const { data } = await backendFetch(buildDeleteEndpoint(userId), {
    method: 'DELETE',
    headers,
    parseJson: true
  });

  return data?.data ?? {};
});
