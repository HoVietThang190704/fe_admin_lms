import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

export type CoursesApiResponse = {
  courses: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const buildCoursesEndpoint = (searchParams: URLSearchParams) => {
  const target = new URL(buildApiUrl(INTERNAL_API_ENDPOINTS.COURSE.LIST));
  searchParams.forEach((value, key) => {
    if (value !== undefined && value !== null && value !== '') {
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
  const endpoint = buildCoursesEndpoint(req.nextUrl.searchParams);
  const accessToken = req.cookies.get('lmsAccessToken')?.value;
  const headers = buildAuthHeaders(accessToken);

  const { data } = await backendFetch(endpoint, {
    method: 'GET',
    parseJson: true,
    headers
  });

  const payload = data ?? {};
  const courses = Array.isArray(payload.data) ? payload.data : [];
  const meta = payload.meta ?? {};

  return {
    courses,
    pagination: {
      page: meta.page ?? 1,
      limit: meta.limit ?? 10,
      total: meta.total ?? courses.length,
      totalPages: meta.totalPages ?? (meta.total && meta.limit ? Math.ceil(meta.total / meta.limit) : 1)
    }
  } satisfies CoursesApiResponse;
});

export const POST = apiHandlerWithReq(async (req) => {
  const accessToken = req.cookies.get('lmsAccessToken')?.value;
  const headers = buildAuthHeaders(accessToken);
  headers.set('Content-Type', 'application/json');

  const body = await req.json();
  const { data } = await backendFetch(buildApiUrl(INTERNAL_API_ENDPOINTS.COURSE.CREATE), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    parseJson: true
  });

  return data?.data ?? {};
});
