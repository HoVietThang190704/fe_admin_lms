import { ApiError } from '@/lib/shared/utils/api';

export type CourseStatus = 'active' | 'archived';

export type AdminCourseRecord = {
  id: string;
  code: string;
  name: string;
  description?: string;
  ownerId?: string;
  status: CourseStatus;
  tags?: string[];
  image?: string;
  credits?: number;
  instructor?: string;
  schedule?: string;
  room?: string;
  capacity?: number;
  enrolled?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCoursePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminCourseListResult = {
  courses: AdminCourseRecord[];
  pagination: AdminCoursePagination;
};

export type AdminCourseListParams = {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: CourseStatus;
};

const buildQueryString = (params: AdminCourseListParams) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

type RawCourse = {
  _id?: string;
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  ownerId?: string;
  status?: string;
  tags?: unknown;
  image?: string;
  credits?: unknown;
  instructor?: string;
  schedule?: string;
  room?: string;
  capacity?: unknown;
  enrolled?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeCourse = (course: RawCourse): AdminCourseRecord => ({
  id: String(
    course._id ??
      course.id ??
      course.code ??
      `${course.name ?? 'course'}-${Date.now().toString(36)}`
  ),
  code: course.code ?? 'N/A',
  name: course.name ?? 'Untitled course',
  description: course.description ?? undefined,
  ownerId: course.ownerId ?? undefined,
  status: course.status === 'archived' ? 'archived' : 'active',
  tags: Array.isArray(course.tags) ? (course.tags as string[]) : undefined,
  image: course.image ?? undefined,
  credits: typeof course.credits === 'number' ? course.credits : undefined,
  instructor: course.instructor ?? undefined,
  schedule: course.schedule ?? undefined,
  room: course.room ?? undefined,
  capacity: typeof course.capacity === 'number' ? course.capacity : undefined,
  enrolled: typeof course.enrolled === 'number' ? course.enrolled : undefined,
  createdAt: course.createdAt ?? undefined,
  updatedAt: course.updatedAt ?? undefined
});

export const fetchAdminCourses = async (params: AdminCourseListParams = {}): Promise<AdminCourseListResult> => {
  const query = buildQueryString(params);
  const response = await fetch(`/api/courses${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store',
    credentials: 'include'
  });

  if (!response.ok) {
    let errorPayload: unknown = null;
    try {
      errorPayload = await response.clone().json();
    } catch {
      errorPayload = null;
    }

    const errorMessage =
      typeof errorPayload === 'object' && errorPayload !== null && 'message' in errorPayload
        ? String((errorPayload as { message?: string }).message ?? 'Failed to fetch courses')
        : 'Failed to fetch courses';

    throw new ApiError(errorMessage, response.status, errorPayload);
  }

  const data = (await response.json()) as AdminCourseListResult;
  const rawCourses = Array.isArray(data.courses)
    ? (data.courses as RawCourse[])
    : Array.isArray((data as Record<string, unknown>)?.['data'])
      ? (((data as Record<string, unknown>).data as RawCourse[]))
      : [];
  const normalizedCourses = rawCourses.map(normalizeCourse);

  return {
    courses: normalizedCourses,
    pagination: data.pagination ?? { page: 1, limit: 10, total: normalizedCourses.length, totalPages: 1 }
  };
};
