import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';
import type { AdminCourseRecord } from './list';

export type CreateCoursePayload = {
  code: string;
  name: string;
  description?: string;
  image?: string;
  tags?: string[];
  credits?: number;
  instructor?: string;
  schedule?: string;
  room?: string;
  capacity?: number;
};

export const createAdminCourse = async (payload: CreateCoursePayload): Promise<AdminCourseRecord> => {
  const response = await fetch('/api/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to create course', response.status, errorPayload);
  }

  const data = (await response.json()) as AdminCourseRecord;
  return data;
};
