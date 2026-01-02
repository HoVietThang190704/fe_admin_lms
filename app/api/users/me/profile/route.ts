import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';
import { ApiError } from '@/lib/shared/utils/api';
import { HttpStatusCode } from '@/lib/shared/constants/http';

const buildAuthHeaders = (accessToken?: string) => {
  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return headers;
};

export const GET = apiHandlerWithReq(async (req) => {
  const accessToken = req.cookies.get('lmsAccessToken')?.value;

  if (!accessToken) {
    throw new ApiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
  }

  const headers = buildAuthHeaders(accessToken);

  const { data } = await backendFetch(buildApiUrl(INTERNAL_API_ENDPOINTS.USERS.ME_PROFILE), {
    method: 'GET',
    headers,
    parseJson: true
  });

  return data;
});
