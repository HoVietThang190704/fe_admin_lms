import type { AdminUserRecord, AdminUserPagination } from '@/lib/services/users/list';

export type RoleFilterValue = 'all' | AdminUserRecord['role'];

export type CreateUserFormValues = {
  fullName: string;
  email: string;
  password: string;
  role: AdminUserRecord['role'];
  phone?: string;
  bio?: string;
};

export type PaginationState = AdminUserPagination;
