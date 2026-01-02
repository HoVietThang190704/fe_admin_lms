import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

const buildCourseEndpoint = (courseId: string) => {
  const template = INTERNAL_API_ENDPOINTS.COURSE.UPDATE || '/api/courses/{id}';
  return buildApiUrl(template.replace('{id}', encodeURIComponent(courseId)));
};

const extractCourseId = (pathname: string) => {
  const match = pathname.match(/\/api\/courses\/([^/]+)(?:\/)?$/);
  if (!match?.[1]) {
    throw new Error('Invalid course id');
  }
  return decodeURIComponent(match[1]);
};

const buildAuthHeaders = (accessToken?: string) => {
  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return headers;
};

export const PATCH = apiHandlerWithReq(async (req) => {
  const accessToken = req.cookies.get('lmsAccessToken')?.value;
  const headers = buildAuthHeaders(accessToken);
  headers.set('Content-Type', 'application/json');

  const courseId = extractCourseId(req.nextUrl.pathname);
  const payload = await req.json();

  const { data } = await backendFetch(buildCourseEndpoint(courseId), {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
    parseJson: true
  });

  return data?.data ?? {};
});

export const DELETE = apiHandlerWithReq(async (req) => {
  const accessToken = req.cookies.get('lmsAccessToken')?.value;
  const headers = buildAuthHeaders(accessToken);

  const courseId = extractCourseId(req.nextUrl.pathname);

  const response = await backendFetch(buildCourseEndpoint(courseId), {
    method: 'DELETE',
    headers,
    parseJson: true
  });

  return response.data ?? {};
});
