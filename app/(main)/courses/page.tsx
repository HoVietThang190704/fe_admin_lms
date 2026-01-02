'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpenCheck, Layers, Tag } from 'lucide-react';

import { AdminScaffold } from '@/components/layout/admin-scaffold';
import { buildSidebarContent } from '@/components/dashboard/sidebar-data';
import { detectClientLocale, getMessages, type SupportedLocale } from '@/lib/i18n';
import { getErrorMessage } from '@/lib/shared/utils/api';
import { fetchAdminCourses, type AdminCourseRecord, type CourseStatus } from '@/lib/services/courses/list';
import { createAdminCourse } from '@/lib/services/courses/create';
import { updateAdminCourse } from '@/lib/services/courses/update';
import { deleteAdminCourse } from '@/lib/services/courses/delete';

import { CourseManagementShell, type CourseSummaryCard } from './course-management-shell';
import type { CourseStatusFilterValue, PaginationState, StatusChoice } from './course-management.types';
import { createCourseFormSchema, type CreateCourseFormSchema } from '@/lib/shared/validation/courses';

const defaultPagination: PaginationState = { page: 1, limit: 10, total: 0, totalPages: 0 };

const COURSE_STATUS_VALUES: CourseStatus[] = ['active', 'archived'];


const useLocaleDictionary = () => {
  const [locale] = useState<SupportedLocale>(() => detectClientLocale());
  const dictionary = useMemo(() => getMessages(locale), [locale]);
  return { locale, dictionary };
};

const formatStatusLabelMap = (dictionary: Record<string, string | undefined>) => ({
  all: dictionary.allStatuses || 'All statuses',
  active: dictionary.statusActive || 'Active',
  archived: dictionary.statusArchived || 'Archived'
});

export default function CoursesPage() {
  const { locale, dictionary } = useLocaleDictionary();
  const sidebarContent = useMemo(() => buildSidebarContent(dictionary), [dictionary]);
  const courseCopy = useMemo(() => dictionary.courses ?? {}, [dictionary]);
  const filtersCopy = useMemo(() => courseCopy.filters ?? {}, [courseCopy]);
  const tableCopy = useMemo(() => courseCopy.table ?? {}, [courseCopy]);
  const errorsCopy = useMemo(() => courseCopy.errors ?? {}, [courseCopy]);
  const paginationCopy = useMemo(() => courseCopy.pagination ?? {}, [courseCopy]);

  const [courses, setCourses] = useState<AdminCourseRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(defaultPagination);
  const [queryState, setQueryState] = useState({ page: 1, status: 'all' as CourseStatusFilterValue, keyword: '' });
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [statusMutations, setStatusMutations] = useState<Record<string, boolean>>({});
  const [deleteMutations, setDeleteMutations] = useState<Record<string, boolean>>({});
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const tempImagePreviewRef = useRef<string | null>(null);

  const limit = pagination.limit || defaultPagination.limit;
  const statusFilter = queryState.status;
  const statusLabels = useMemo(() => formatStatusLabelMap(filtersCopy), [filtersCopy]);

  const statusOptions = useMemo<Array<{ value: CourseStatusFilterValue; label: string }>>(
    () => [
      { value: 'all', label: statusLabels.all },
      { value: 'active', label: statusLabels.active },
      { value: 'archived', label: statusLabels.archived }
    ],
    [statusLabels]
  );

  const statusChoices: StatusChoice[] = useMemo(
    () => COURSE_STATUS_VALUES.map((value) => ({ value, label: statusLabels[value] })),
    [statusLabels]
  );

  const {
    register,
    handleSubmit,
    reset: resetCreateForm,
    setValue,
    watch,
    formState: { errors: createFormErrors }
  } = useForm<CreateCourseFormSchema>({
    resolver: zodResolver(createCourseFormSchema),
    defaultValues: {
      code: '',
      name: '',
      image: '',
      description: '',
      instructor: '',
      schedule: '',
      credits: undefined,
      capacity: undefined,
      tagsInput: ''
    }
  });

  const imageFieldValue = watch('image');

  const releaseTempImagePreview = useCallback(() => {
    if (tempImagePreviewRef.current) {
      URL.revokeObjectURL(tempImagePreviewRef.current);
      tempImagePreviewRef.current = null;
    }
  }, []);

  const resetImageUploadState = useCallback(() => {
    releaseTempImagePreview();
    setImagePreview(null);
    setImageUploadError(null);
    setIsUploadingImage(false);
    setValue('image', '');
  }, [releaseTempImagePreview, setValue]);

  useEffect(() => {
    return () => {
      releaseTempImagePreview();
    };
  }, [releaseTempImagePreview]);

  const loadErrorMessage = errorsCopy.load || 'Không thể tải danh sách khóa học.';

  const fetchCourses = useCallback(
    async (params: { page: number; status: CourseStatusFilterValue; keyword: string }) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await fetchAdminCourses({
          page: params.page,
          limit,
          keyword: params.keyword || undefined,
          status: params.status === 'all' ? undefined : params.status
        });
        setCourses(result.courses);
        setPagination(result.pagination ?? { ...defaultPagination, page: params.page, limit });
      } catch (error) {
        setErrorMessage(getErrorMessage(error, loadErrorMessage));
      } finally {
        setIsLoading(false);
      }
    },
    [limit, loadErrorMessage]
  );

  useEffect(() => {
    fetchCourses(queryState);
  }, [fetchCourses, queryState, refreshIndex]);

  const handleImageFileChange = useCallback(
    async (file: File | null) => {
      if (!file) {
        resetImageUploadState();
        return;
      }

      setIsUploadingImage(true);
      setImageUploadError(null);

      releaseTempImagePreview();
      const previewUrl = URL.createObjectURL(file);
      tempImagePreviewRef.current = previewUrl;
      setImagePreview(previewUrl);

      try {
        const formData = new FormData();
        formData.append('images', file);

        const response = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData
        });

        type UploadResponse = {
          success?: boolean;
          message?: string;
          data?: {
            urls?: string[];
          };
        };
        let payload: UploadResponse | null = null;
        try {
          payload = await response.json();
        } catch {
        }

        if (!response.ok) {
          throw new Error(payload?.message || 'Upload failed');
        }

        const uploadedUrl = Array.isArray(payload?.data?.urls) ? payload.data?.urls[0] : undefined;
        if (!uploadedUrl) {
          throw new Error('Uploaded image URL is missing.');
        }

        setValue('image', uploadedUrl, { shouldDirty: true, shouldValidate: true });
        releaseTempImagePreview();
        setImagePreview(uploadedUrl);
        setImageUploadError(null);
      } catch (error) {
        releaseTempImagePreview();
        setImagePreview(null);
        setValue('image', '');
        setImageUploadError(getErrorMessage(error, errorsCopy.imageUpload || 'Không thể tải ảnh lên.'));
      } finally {
        setIsUploadingImage(false);
      }
    },
    [errorsCopy.imageUpload, releaseTempImagePreview, resetImageUploadState, setValue]
  );

  const visibleCourses = courses;

  const summaryCards: CourseSummaryCard[] = useMemo(() => {
    const activeCount = courses.filter((course) => course.status !== 'archived').length;
    const archivedCount = courses.filter((course) => course.status === 'archived').length;

    return [
      {
        key: 'total',
        label: filtersCopy.allStatuses || 'All courses',
        value: pagination.total,
        caption: paginationCopy.summary
          ? paginationCopy.summary.replace('{page}', String(pagination.page)).replace('{total}', String(Math.max(pagination.totalPages, 1)))
          : `Page ${pagination.page} / ${Math.max(pagination.totalPages, 1)}`,
        icon: Layers,
        accent: 'from-slate-900/10 to-slate-900/5'
      },
      {
        key: 'active',
        label: statusLabels.active,
        value: activeCount,
        caption: pageCopyCurrentScope(courseCopy) || 'Current page',
        icon: BookOpenCheck,
        accent: 'from-emerald-500/10 to-emerald-500/5'
      },
      {
        key: 'archived',
        label: statusLabels.archived,
        value: archivedCount,
        caption: pageCopyCurrentScope(courseCopy) || 'Current page',
        icon: Tag,
        accent: 'from-amber-500/10 to-amber-500/5'
      }
    ];
  }, [courses, filtersCopy.allStatuses, pagination.total, pagination.page, pagination.totalPages, paginationCopy.summary, statusLabels.active, statusLabels.archived, courseCopy]);

  const handleStatusFilterChange = (value: CourseStatusFilterValue) => {
    setQueryState((prev) => {
      if (prev.status === value && prev.page === 1) {
        return prev;
      }
      return { ...prev, status: value, page: 1 };
    });
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    setQueryState((prev) => {
      if (prev.keyword === trimmed && prev.page === 1) {
        return prev;
      }
      return { ...prev, keyword: trimmed, page: 1 };
    });
  };

  const handleRefresh = () => {
    setRefreshIndex((index) => index + 1);
  };

  const handlePrevPage = () => {
    if (queryState.page <= 1 || isLoading) return;
    setQueryState((prev) => {
      if (prev.page <= 1) {
        return prev;
      }
      return { ...prev, page: prev.page - 1 };
    });
  };

  const handleNextPage = () => {
    if (queryState.page >= Math.max(pagination.totalPages, 1) || isLoading) return;
    setQueryState((prev) => {
      if (prev.page >= Math.max(pagination.totalPages, 1)) {
        return prev;
      }
      return { ...prev, page: prev.page + 1 };
    });
  };

  const handleChangeCourseStatus = async (course: AdminCourseRecord, nextStatus: CourseStatus) => {
    if (course.status === nextStatus) {
      return;
    }

    setStatusMutations((prev) => ({ ...prev, [course.id]: true }));
    setErrorMessage(null);
    try {
      await updateAdminCourse(course.id, { status: nextStatus });
      setCourses((prev) => prev.map((item) => (item.id === course.id ? { ...item, status: nextStatus } : item)));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, errorsCopy.status || 'Không thể cập nhật trạng thái khóa học.'));
    } finally {
      setStatusMutations((prev) => {
        const next = { ...prev };
        delete next[course.id];
        return next;
      });
    }
  };

  const handleDeleteCourse = async (course: AdminCourseRecord) => {
    const confirmMessage = tableCopy.deleteConfirm || 'Bạn có chắc chắn muốn xóa khóa học này?';
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        return;
      }
    }

    setDeleteMutations((prev) => ({ ...prev, [course.id]: true }));
    setErrorMessage(null);
    try {
      await deleteAdminCourse(course.id);
      await fetchCourses({ ...queryState });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, errorsCopy.delete || 'Không thể xóa khóa học.'));
    } finally {
      setDeleteMutations((prev) => {
        const next = { ...prev };
        delete next[course.id];
        return next;
      });
    }
  };

  const submitCreateCourse = handleSubmit(async (values) => {
    setCreateErrorMessage(null);
    setIsCreatingCourse(true);
    try {
      const payload = {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        image: values.image?.trim() || undefined,
        description: values.description?.trim() || undefined,
        instructor: values.instructor?.trim() || undefined,
        schedule: values.schedule?.trim() || undefined,
        credits: typeof values.credits === 'number' && !Number.isNaN(values.credits) ? values.credits : undefined,
        capacity: typeof values.capacity === 'number' && !Number.isNaN(values.capacity) ? values.capacity : undefined,
        tags: values.tagsInput
          ? values.tagsInput
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : undefined
      };

      await createAdminCourse(payload);
      if (queryState.page === 1) {
        setRefreshIndex((index) => index + 1);
      } else {
        setQueryState((prev) => ({ ...prev, page: 1 }));
      }
      resetCreateForm();
      resetImageUploadState();
      setIsCreateModalOpen(false);
    } catch (error) {
      setCreateErrorMessage(getErrorMessage(error, errorsCopy.create || 'Không thể tạo khóa học.'));
    } finally {
      setIsCreatingCourse(false);
    }
  });

  const handleCreateCourseSubmit = (event: FormEvent<HTMLFormElement>) => {
    void submitCreateCourse(event);
  };

  const canGoPrev = queryState.page > 1 && !isLoading;
  const canGoNext = queryState.page < Math.max(pagination.totalPages, 1) && !isLoading;

  const isRowUpdatingStatus = (courseId: string) => Boolean(statusMutations[courseId]);
  const isRowDeleting = (courseId: string) => Boolean(deleteMutations[courseId]);

  const pageSummary = useMemo(() => {
    const totalPages = Math.max(pagination.totalPages, 1);
    if (!paginationCopy.summary) {
      return `Page ${pagination.page} / ${totalPages}`;
    }
    return paginationCopy.summary.replace('{page}', String(pagination.page)).replace('{total}', String(totalPages));
  }, [pagination.page, pagination.totalPages, paginationCopy.summary]);

  const openCreateModal = () => {
    setCreateErrorMessage(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreatingCourse) return;
    setIsCreateModalOpen(false);
    setCreateErrorMessage(null);
    resetCreateForm();
    resetImageUploadState();
  };

  return (
    <AdminScaffold sidebar={sidebarContent}>
      <CourseManagementShell
        locale={locale}
        dictionary={dictionary}
        courses={visibleCourses}
        statusFilter={statusFilter}
        statusOptions={statusOptions}
        statusChoices={statusChoices}
        searchInput={searchInput}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isCreateModalOpen={isCreateModalOpen}
        isCreatingCourse={isCreatingCourse}
        createErrorMessage={createErrorMessage}
        createFormErrors={createFormErrors}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        pageSummary={pageSummary}
        summaryCards={summaryCards}
        register={register}
        imagePreviewUrl={imagePreview}
        currentImageUrl={imageFieldValue}
        isUploadingImage={isUploadingImage}
        imageUploadError={imageUploadError}
        onImageFileChange={handleImageFileChange}
        onSearchInputChange={handleSearchInputChange}
        onSearchSubmit={handleSearchSubmit}
        onStatusFilterChange={handleStatusFilterChange}
        onRefresh={handleRefresh}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onChangeCourseStatus={handleChangeCourseStatus}
        onDeleteCourse={handleDeleteCourse}
        isRowUpdatingStatus={isRowUpdatingStatus}
        isRowDeleting={isRowDeleting}
        openCreateModal={openCreateModal}
        closeCreateModal={closeCreateModal}
        onCreateCourseSubmit={handleCreateCourseSubmit}
      />
    </AdminScaffold>
  );
}

type CourseCopy = {
  page?: {
    currentScope?: string;
  };
};

const pageCopyCurrentScope = (courseCopy: CourseCopy) => courseCopy.page?.currentScope;
