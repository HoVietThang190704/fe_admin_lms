import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';

export type CreateAdminUserPayload = {
  email: string;
  password: string;
  fullName?: string;
  role: 'admin' | 'teacher' | 'student';
  phone?: string;
  bio?: string;
};

export const createAdminUser = async (payload: CreateAdminUserPayload) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    credentials: 'include'
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to create user', response.status, errorPayload);
  }

  return response.json();
};
