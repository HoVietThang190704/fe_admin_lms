import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';

export type UpdateBlockStatusPayload = {
  isBlocked: boolean;
};

export const updateUserBlockStatus = async (userId: string, payload: UpdateBlockStatusPayload) => {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/block`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    credentials: 'include'
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to update block status', response.status, errorPayload);
  }

  const data = await response.json();
  return data;
};
