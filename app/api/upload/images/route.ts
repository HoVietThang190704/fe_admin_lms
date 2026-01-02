import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

const buildAuthHeaders = (token?: string) => {
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

export const POST = apiHandlerWithReq(async (req) => {
  const formData = await req.formData();
  const accessToken = req.cookies.get('lmsAccessToken')?.value;
  const headers = buildAuthHeaders(accessToken);

  const { data } = await backendFetch(buildApiUrl(INTERNAL_API_ENDPOINTS.UPLOAD.IMAGES), {
    method: 'POST',
    headers,
    body: formData,
    parseJson: true
  });

  return data ?? {};
});
