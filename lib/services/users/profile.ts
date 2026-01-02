import { ApiError, parseApiErrorPayload } from '@/lib/shared/utils/api';
import type { AdminUserProfile } from './list';

export type AdminProfile = {
  id: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'teacher' | 'student';
  isActive: boolean;
  isBlocked: boolean;
  profile?: AdminUserProfile;
  facebookId?: string;
  googleId?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminProfileResponse = {
  success?: boolean;
  message?: string;
  data?: AdminProfile;
};

export const fetchAdminProfile = async (): Promise<AdminProfile> => {
  const response = await fetch('/api/users/me/profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorPayload = await parseApiErrorPayload(response);
    throw new ApiError(errorPayload?.message || 'Failed to load profile.', response.status, errorPayload);
  }

  const payload = (await response.json()) as AdminProfileResponse;
  if (payload?.data) {
    return payload.data;
  }

  throw new ApiError(payload?.message || 'Profile payload is malformed.', 500, payload);
};
