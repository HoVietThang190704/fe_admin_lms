import { ApiError } from '@/lib/shared/utils/api';

export type AdminUserProfile = {
  avatarUrl?: string;
  phone?: string;
  bio?: string;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  fullName?: string;
  profile?: AdminUserProfile;
  facebookId?: string;
  googleId?: string;
  role: 'admin' | 'teacher' | 'student';
  isActive: boolean;
  isBlocked: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUserPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminUserListResult = {
  users: AdminUserRecord[];
  pagination: AdminUserPagination;
};

export type AdminUserListParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'admin' | 'teacher' | 'student';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

const buildQueryString = (params: AdminUserListParams) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.role) searchParams.set('role', params.role);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const fetchAdminUsers = async (params: AdminUserListParams = {}): Promise<AdminUserListResult> => {
  const query = buildQueryString(params);
  const response = await fetch(`/api/users${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store',
    credentials: 'include'
  });

  if (!response.ok) {
    let errorPayload: any = null;
    try {
      errorPayload = await response.clone().json();
    } catch {
      errorPayload = null;
    }

    throw new ApiError(errorPayload?.message || 'Failed to fetch users', response.status, errorPayload);
  }

  const data = (await response.json()) as AdminUserListResult;
  const users = Array.isArray(data.users) ? data.users : [];
  return {
    users: users.map((user) => ({
      ...user,
      isBlocked: Boolean(user.isBlocked)
    })),
    pagination: data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }
  };
};
