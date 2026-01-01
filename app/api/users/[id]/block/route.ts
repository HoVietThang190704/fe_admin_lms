import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';
import { ApiError } from '@/lib/shared/utils/api';

const buildBlockEndpoint = (userId: string) => {
  const template = INTERNAL_API_ENDPOINTS.USERS.BLOCK || '/api/users/{id}/block';
  return buildApiUrl(template.replace('{id}', encodeURIComponent(userId)));
};

const extractUserId = (pathname: string): string => {
  const match = pathname.match(/\/api\/users\/([^/]+)\/block/);
  if (!match?.[1]) {
    throw new ApiError('Invalid user id', 400);
  }
  return decodeURIComponent(match[1]);
};

export const PATCH = apiHandlerWithReq(async (req) => {
  const userId = extractUserId(req.nextUrl.pathname);
  const payload = await req.json();
  const accessToken = req.cookies.get('lmsAccessToken')?.value;

  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const { data } = await backendFetch(buildBlockEndpoint(userId), {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
    parseJson: true
  });

  return data?.data ?? {};
});
