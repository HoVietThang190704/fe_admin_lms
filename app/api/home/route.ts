import { apiHandler } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

export const GET = apiHandler(async () => {
  const { data } = await backendFetch(buildApiUrl(INTERNAL_API_ENDPOINTS.HOME.DASHBOARD), {
    method: 'GET',
    parseJson: true
  });

  return data;
});
