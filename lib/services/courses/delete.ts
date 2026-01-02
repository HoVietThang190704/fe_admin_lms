import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';

export const deleteAdminCourse = async (courseId: string) => {
  const response = await fetch(`/api/courses/${encodeURIComponent(courseId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to delete course', response.status, errorPayload);
  }

  return response.json().catch(() => ({}));
};
