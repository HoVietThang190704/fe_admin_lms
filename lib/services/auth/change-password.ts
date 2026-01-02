import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message?: string;
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<ChangePasswordResponse> => {
  const response = await fetch(INTERNAL_API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to change password.', response.status, errorPayload);
  }

  const data = (await response.json().catch(() => ({ success: true }))) as ChangePasswordResponse;
  return data;
};
