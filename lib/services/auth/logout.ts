import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';

export type LogoutResponse = {
  success?: boolean;
  message?: string;
};

export const logout = async (): Promise<LogoutResponse> => {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to sign out.', response.status, errorPayload);
  }

  const data = (await response.json().catch(() => ({ success: true }))) as LogoutResponse;
  return data;
};
