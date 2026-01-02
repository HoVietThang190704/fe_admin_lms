import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';

export const deleteAdminUser = async (userId: string) => {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to delete user', response.status, errorPayload);
  }

  return response.json();
};
