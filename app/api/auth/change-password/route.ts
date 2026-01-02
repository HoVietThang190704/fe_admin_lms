import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';
import { ApiError } from '@/lib/shared/utils/api';
import { HttpStatusCode } from '@/lib/shared/constants/http';

type ChangePasswordRequestBody = {
  oldPassword?: string;
  currentPassword?: string;
  newPassword?: string;
};

const buildAuthHeaders = (accessToken?: string) => {
  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return headers;
};

export const POST = apiHandlerWithReq(async (req) => {
  const accessToken = req.cookies.get('lmsAccessToken')?.value;
  if (!accessToken) {
    throw new ApiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
  }

  const body = ((await req.json()) as ChangePasswordRequestBody | null) ?? {};
  const oldPassword = (body.oldPassword ?? body.currentPassword)?.trim();
  const newPassword = body.newPassword?.trim();

  if (!oldPassword || !newPassword) {
    throw new ApiError('Current and new password are required.', HttpStatusCode.BAD_REQUEST);
  }

  const headers = buildAuthHeaders(accessToken);
  headers.set('Content-Type', 'application/json');

  const { data } = await backendFetch(buildApiUrl(INTERNAL_API_ENDPOINTS.AUTH.CHANGE_PASSWORD), {
    method: 'POST',
    headers,
    body: JSON.stringify({ oldPassword, newPassword }),
    parseJson: true
  });

  return data;
});
