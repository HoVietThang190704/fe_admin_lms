import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

export const GET = apiHandlerWithReq(async (req) => {
  const url = new URL(req.url);
  const query = url.searchParams.toString();
  const endpoint = buildApiUrl(`${INTERNAL_API_ENDPOINTS.HOME.COURSES}${query ? `?${query}` : ''}`);

  const { data } = await backendFetch(endpoint, {
    method: 'GET',
    parseJson: true
  });

  return data;
});
