import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';

export type UpdateUserRolePayload = {
  role: 'admin' | 'teacher' | 'student';
};

export const updateAdminUserRole = async (userId: string, payload: UpdateUserRolePayload) => {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    credentials: 'include'
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to update user role', response.status, errorPayload);
  }

  return response.json();
};
