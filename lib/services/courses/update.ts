import { ApiError } from '@/lib/shared/utils/api';
import type { AdminCourseRecord, CourseStatus } from './list';

export type UpdateCoursePayload = Partial<{
  name: string;
  description: string;
  image: string;
  tags: string[];
  credits: number;
  instructor: string;
  schedule: string;
  room: string;
  capacity: number;
  status: CourseStatus;
}>;

export const updateAdminCourse = async (courseId: string, payload: UpdateCoursePayload): Promise<AdminCourseRecord> => {
  const response = await fetch(`/api/courses/${encodeURIComponent(courseId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
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
        ? String((errorPayload as { message?: string }).message ?? 'Failed to update course')
        : 'Failed to update course';

    throw new ApiError(errorMessage, response.status, errorPayload);
  }

  const data = (await response.json()) as AdminCourseRecord;
  return data;
};
