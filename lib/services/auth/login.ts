import { login as backendLogin } from '@/lib/infra/api/modules/auth.api';
import type { AuthenticatedUser, LoginPayload, LoginResponse } from '@/lib/infra/api/modules/auth.api';
import { ApiError } from '@/lib/shared/utils/api';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';

export type { AuthenticatedUser, LoginPayload, LoginResponse };

export const requestBackendLogin = async (payload: LoginPayload): Promise<LoginResponse> =>
  backendLogin(payload);

export const loginWithEmail = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await fetch(INTERNAL_API_ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    cache: 'no-store'
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const payload = data as { message?: string; error?: string } | undefined;
    const message = payload?.message || payload?.error || 'Login failed';
    throw new ApiError(message, response.status, data);
  }

  return data as LoginResponse;
};
