'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap, ShieldCheck, Users as UsersIcon } from 'lucide-react';

import { AdminScaffold } from '@/components/layout/admin-scaffold';
import { buildSidebarContent } from '@/components/dashboard/sidebar-data';
import { UserManagementShell, type SummaryCard } from './user-management-shell';
import { getMessages, detectClientLocale, type SupportedLocale } from '@/lib/i18n';
import { fetchAdminUsers, type AdminUserRecord } from '@/lib/services/users/list';
import { createAdminUser } from '@/lib/services/users/create';
import { updateUserBlockStatus } from '@/lib/services/users/block';
import { deleteAdminUser } from '@/lib/services/users/delete';
import { updateAdminUserRole } from '@/lib/services/users/update-role';
import { getErrorMessage } from '@/lib/shared/utils/api';
import type { CreateUserFormValues, PaginationState, RoleFilterValue } from './user-management.types';

const defaultPagination: PaginationState = { page: 1, limit: 10, total: 0, totalPages: 0 };
const PHONE_REGEX = /^(\+84|84|0)[1-9][0-9]{8}$/;

const createUserFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Họ tên không được để trống').max(100, 'Họ tên không được vượt quá 100 ký tự'),
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.enum(['admin', 'teacher', 'student']),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Số điện thoại không hợp lệ')
    .optional(),
  bio: z.string().trim().max(500, 'Giới thiệu không được vượt quá 500 ký tự').optional()
});

const downloadCsv = (users: AdminUserRecord[], filename: string) => {
  if (!users.length) return;

  const headers = ['id', 'fullName', 'email', 'role', 'isActive', 'isBlocked', 'createdAt', 'lastLoginAt'];
  const rows = users.map((user) => [
    user.id,
    user.fullName ?? '',
    user.email,
    user.role,
    user.isActive ? 'active' : 'inactive',
    user.isBlocked ? 'blocked' : 'unblocked',
    user.createdAt ?? '',
    user.lastLoginAt ?? ''
  ]);

  const csv = [headers, ...rows]
    .map((columns) => columns.map((col) => `"${String(col ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const useLocaleDictionary = () => {
  const [locale] = useState<SupportedLocale>(() => detectClientLocale());
  const dictionary = useMemo(() => getMessages(locale), [locale]);
  return { locale, dictionary };
};

export default function UsersPage() {
  const { locale, dictionary } = useLocaleDictionary();
  const sidebarContent = useMemo(() => buildSidebarContent(dictionary), [dictionary]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(defaultPagination);
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockMutations, setBlockMutations] = useState<Record<string, boolean>>({});
  const [deleteMutations, setDeleteMutations] = useState<Record<string, boolean>>({});
  const [roleMutations, setRoleMutations] = useState<Record<string, boolean>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);

  const errorsCopy = dictionary.users?.errors ?? {};

  const {
    register,
    handleSubmit,
    reset: resetCreateForm,
    formState: { errors: createFormErrors }
  } = useForm<CreateUserFormValues>(
    {
      resolver: zodResolver(createUserFormSchema),
      defaultValues: {
        fullName: '',
        email: '',
        password: '',
        role: 'student',
        phone: undefined,
        bio: undefined
      }
    }
  );

  const limit = pagination.limit || 10;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchAdminUsers({
        page: pagination.page,
        limit,
        role: roleFilter === 'all' ? undefined : roleFilter,
        search: searchTerm || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setUsers(result.users);
      setPagination(result.pagination ?? defaultPagination);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, errorsCopy.load || 'Unable to load users.'));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, limit, roleFilter, searchTerm, errorsCopy.load]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const roleStats = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      { admin: 0, teacher: 0, student: 0 } as Record<AdminUserRecord['role'], number>
    );
  }, [users]);

  const pageCopy = dictionary.users?.page ?? {};
  const filtersCopy = dictionary.users?.filters ?? {};
  const tableCopy = dictionary.users?.table ?? {};
  const paginationCopy = dictionary.users?.pagination ?? {};

  const roleOptions: Array<{ value: RoleFilterValue; label: string }> = [
    { value: 'all', label: filtersCopy.allRoles || 'All roles' },
    { value: 'admin', label: filtersCopy.roleAdmin || 'Admin' },
    { value: 'teacher', label: filtersCopy.roleTeacher || 'Instructor' },
    { value: 'student', label: filtersCopy.roleStudent || 'Learner' }
  ];

  const roleChoices = roleOptions.filter((option) => option.value !== 'all') as Array<{
    value: AdminUserRecord['role'];
    label: string;
  }>;

  const pageSummary = useMemo(() => {
    const totalPages = Math.max(pagination.totalPages, 1);
    if (!paginationCopy.summary) {
      return `Page ${pagination.page} / ${totalPages}`;
    }
    return paginationCopy.summary.replace('{page}', String(pagination.page)).replace('{total}', String(totalPages));
  }, [pagination.page, pagination.totalPages, paginationCopy.summary]);

  const canGoPrev = pagination.page > 1 && !isLoading;
  const canGoNext = pagination.page < Math.max(pagination.totalPages, 1) && !isLoading;

  const summaryCards: SummaryCard[] = [
    {
      key: 'total',
      label: filtersCopy.allRoles || 'All roles',
      value: pagination.total,
      caption: pageSummary,
      icon: UsersIcon,
      accent: 'from-slate-900/10 to-slate-900/5'
    },
    {
      key: 'admin',
      label: filtersCopy.roleAdmin || 'Admin',
      value: roleStats.admin || 0,
      caption: pageCopy.currentScope || 'Current page',
      icon: ShieldCheck,
      accent: 'from-rose-500/10 to-rose-500/5'
    },
    {
      key: 'teacher',
      label: filtersCopy.roleTeacher || 'Instructor',
      value: roleStats.teacher || 0,
      caption: pageCopy.currentScope || 'Current page',
      icon: GraduationCap,
      accent: 'from-amber-500/10 to-amber-500/5'
    },
    {
      key: 'student',
      label: filtersCopy.roleStudent || 'Learner',
      value: roleStats.student || 0,
      caption: pageCopy.currentScope || 'Current page',
      icon: UsersIcon,
      accent: 'from-emerald-500/10 to-emerald-500/5'
    }
  ];

  const handleRoleChange = (value: RoleFilterValue) => {
    setRoleFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchTerm(searchInput.trim());
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleExport = () => {
    downloadCsv(users, `users-page-${pagination.page}.csv`);
  };

  const openCreateModal = () => {
    setCreateErrorMessage(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreatingUser) return;
    setIsCreateModalOpen(false);
    setCreateErrorMessage(null);
    resetCreateForm({
      fullName: '',
      email: '',
      password: '',
      role: 'student',
      phone: undefined,
      bio: undefined
    });
  };

  const submitCreateUser = handleSubmit(async (values) => {
    setCreateErrorMessage(null);
    setIsCreatingUser(true);
    try {
      await createAdminUser({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        phone: values.phone?.trim() || undefined,
        bio: values.bio?.trim() || undefined
      });

      setPagination((prev) => ({ ...prev, page: 1 }));
      if (pagination.page === 1) {
        await fetchUsers();
      }

      resetCreateForm({
        fullName: '',
        email: '',
        password: '',
        role: 'student',
        phone: undefined,
        bio: undefined
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      setCreateErrorMessage(getErrorMessage(error, errorsCopy.create || 'Không thể tạo người dùng.'));
    } finally {
      setIsCreatingUser(false);
    }
  });

  const handleCreateUserSubmit = (event: FormEvent<HTMLFormElement>) => {
    void submitCreateUser(event);
  };

  const isRowBlocking = (userId: string) => Boolean(blockMutations[userId]);
  const isRowDeleting = (userId: string) => Boolean(deleteMutations[userId]);
  const isRowUpdatingRole = (userId: string) => Boolean(roleMutations[userId]);

  const handleToggleBlock = async (user: AdminUserRecord) => {
    setErrorMessage(null);
    setBlockMutations((prev) => ({ ...prev, [user.id]: true }));
    try {
      const nextBlocked = !user.isBlocked;
      await updateUserBlockStatus(user.id, { isBlocked: nextBlocked });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, isBlocked: nextBlocked } : item)));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, errorsCopy.block || 'Không thể cập nhật trạng thái khóa.'));
    } finally {
      setBlockMutations((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  const handleDeleteUser = async (user: AdminUserRecord) => {
    if (user.role === 'admin') {
      setErrorMessage(errorsCopy.deleteAdmin || 'Không thể xóa quản trị viên.');
      return;
    }

    const confirmMessage = tableCopy.deleteConfirm || 'Bạn có chắc chắn muốn xóa người dùng này?';
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        return;
      }
    }

    setDeleteMutations((prev) => ({ ...prev, [user.id]: true }));
    setErrorMessage(null);
    try {
      await deleteAdminUser(user.id);
      await fetchUsers();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, errorsCopy.delete || 'Không thể xóa người dùng.'));
    } finally {
      setDeleteMutations((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  const handleChangeUserRole = async (user: AdminUserRecord, nextRole: AdminUserRecord['role']) => {
    if (user.role === 'admin') {
      setErrorMessage(errorsCopy.roleAdmin || 'Không thể thay đổi vai trò của quản trị viên.');
      return;
    }

    if (user.role === nextRole) {
      return;
    }

    setRoleMutations((prev) => ({ ...prev, [user.id]: true }));
    setErrorMessage(null);
    try {
      await updateAdminUserRole(user.id, { role: nextRole });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, role: nextRole } : item)));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, errorsCopy.role || 'Không thể cập nhật vai trò.'));
    } finally {
      setRoleMutations((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  const handlePrevPage = () => {
    if (!canGoPrev) return;
    setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
  };

  const handleNextPage = () => {
    if (!canGoNext) return;
    setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  return (
    <AdminScaffold sidebar={sidebarContent}>
      <UserManagementShell
        locale={locale}
        dictionary={dictionary}
        users={users}
        roleFilter={roleFilter}
        searchInput={searchInput}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isCreateModalOpen={isCreateModalOpen}
        isCreatingUser={isCreatingUser}
        createErrorMessage={createErrorMessage}
        createFormErrors={createFormErrors}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        pageSummary={pageSummary}
        roleOptions={roleOptions}
        summaryCards={summaryCards}
        register={register}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onRoleChange={handleRoleChange}
        roleChoices={roleChoices}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onToggleBlock={handleToggleBlock}
        onDeleteUser={handleDeleteUser}
        isRowBlocking={isRowBlocking}
        isRowDeleting={isRowDeleting}
        onChangeUserRole={handleChangeUserRole}
        isRowUpdatingRole={isRowUpdatingRole}
        openCreateModal={openCreateModal}
        closeCreateModal={closeCreateModal}
        onCreateUserSubmit={handleCreateUserSubmit}
      />
    </AdminScaffold>
  );
}
