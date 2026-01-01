import { backendFetch } from '@/lib/infra/api/httpClient';
import { ApiError } from '@/lib/shared/utils/api';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName?: string;
  userName?: string;
  phone?: string;
  role: string;
  isVerified?: boolean;
};

export type LoginResponse = {
  success: boolean;
  message?: string;
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
};

const LOGIN_ENDPOINT = INTERNAL_API_ENDPOINTS.AUTH.LOGIN;

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await backendFetch(buildApiUrl(LOGIN_ENDPOINT), {
    method: 'POST',
    body: JSON.stringify(payload),
    parseJson: true
  });

  if (!data || typeof data !== 'object' || !('success' in data) || !(data as { success: boolean }).success) {
    const errorMessage = (data as { message?: string })?.message || 'Login failed';
    throw new ApiError(errorMessage, 400, data);
  }

  return data as LoginResponse;
};
