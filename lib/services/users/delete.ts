import { ApiError } from '@/lib/shared/utils/api';

export const deleteAdminUser = async (userId: string) => {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    let errorPayload: any = null;
    try {
      errorPayload = await response.clone().json();
    } catch {
      errorPayload = null;
    }

    throw new ApiError(errorPayload?.message || 'Failed to delete user', response.status, errorPayload);
  }

  return response.json();
};
