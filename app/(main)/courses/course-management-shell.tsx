'use client';

import Image from 'next/image';
import { useMemo, type FormEvent } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { RefreshCw, Search, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popup } from '@/components/ui/popup';
import { MetricCard, type MetricCardConfig } from '@/components/dashboard/metric-card';
import { cn } from '@/lib/utils/cn';
import type { AppMessages, SupportedLocale } from '@/lib/i18n';
import type { AdminCourseRecord, CourseStatus } from '@/lib/services/courses/list';

import type { CourseStatusFilterValue, CreateCourseFormValues, StatusChoice } from './course-management.types';

export type CourseSummaryCard = MetricCardConfig;

export type CourseManagementShellProps = {
  locale: SupportedLocale;
  dictionary: AppMessages;
  courses: AdminCourseRecord[];
  statusFilter: CourseStatusFilterValue;
  statusOptions: Array<{ value: CourseStatusFilterValue; label: string }>;
  statusChoices: StatusChoice[];
  searchInput: string;
  isLoading: boolean;
  errorMessage: string | null;
  isCreateModalOpen: boolean;
  isCreatingCourse: boolean;
  createErrorMessage: string | null;
  createFormErrors: FieldErrors<CreateCourseFormValues>;
  canGoPrev: boolean;
  canGoNext: boolean;
  pageSummary: string;
  summaryCards: CourseSummaryCard[];
  register: UseFormRegister<CreateCourseFormValues>;
  imagePreviewUrl: string | null;
  currentImageUrl?: string | null;
  isUploadingImage: boolean;
  imageUploadError: string | null;
  onImageFileChange: (file: File | null) => void;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusFilterChange: (value: CourseStatusFilterValue) => void;
  onRefresh: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onChangeCourseStatus: (course: AdminCourseRecord, status: CourseStatus) => void;
  onDeleteCourse: (course: AdminCourseRecord) => void;
  isRowUpdatingStatus: (courseId: string) => boolean;
  isRowDeleting: (courseId: string) => boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  onCreateCourseSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const getInitials = (value?: string | null) => {
  if (!value) return 'NA';
  const parts = value.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) {
    return value.slice(0, 2).toUpperCase();
  }
  return parts.map((part) => part[0]).join('').toUpperCase();
};

const normalizeOptionalString = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

const normalizeOptionalNumber = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const CourseManagementShell = ({
  locale,
  dictionary,
  courses,
  statusFilter,
  statusOptions,
  statusChoices,
  searchInput,
  isLoading,
  errorMessage,
  isCreateModalOpen,
  isCreatingCourse,
  createErrorMessage,
  createFormErrors,
  canGoPrev,
  canGoNext,
  pageSummary,
  summaryCards,
  register,
  imagePreviewUrl,
  currentImageUrl,
  isUploadingImage,
  imageUploadError,
  onImageFileChange,
  onSearchInputChange,
  onSearchSubmit,
  onStatusFilterChange,
  onRefresh,
  onPrevPage,
  onNextPage,
  onChangeCourseStatus,
  onDeleteCourse,
  isRowUpdatingStatus,
  isRowDeleting,
  openCreateModal,
  closeCreateModal,
  onCreateCourseSubmit
}: CourseManagementShellProps) => {
  const courseCopy = dictionary.courses ?? {};
  const pageCopy = courseCopy.page ?? {};
  const filtersCopy = courseCopy.filters ?? {};
  const tableCopy = courseCopy.table ?? {};
  const paginationCopy = courseCopy.pagination ?? {};
  const previewSrc = imagePreviewUrl || currentImageUrl || null;

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">{pageCopy.badge || 'Course matrix'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{pageCopy.title || 'Course management'}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            {pageCopy.description || 'Coordinate every course published by instructors and admins.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="muted" type="button" onClick={onRefresh} disabled={isLoading}>
            {pageCopy.secondaryAction || 'Refresh snapshot'}
          </Button>
          <Button type="button" variant="default" onClick={openCreateModal}>
            {pageCopy.primaryAction || 'New course'}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Alert variant="danger">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ key, ...cardConfig }) => (
          <MetricCard key={key} {...cardConfig} valueFormatter={(value) => numberFormatter.format(value)} />
        ))}
      </section>

      <Card className="p-0">
        <CardHeader className="gap-4 border-b border-slate-100 px-6 py-6">
          <CardTitle className="text-2xl">{pageCopy.title || 'Course management'}</CardTitle>
          <CardDescription>
            {pageCopy.description || 'Monitor every published course and keep metadata accurate.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form onSubmit={onSearchSubmit} className="flex flex-1 gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={filtersCopy.searchPlaceholder || 'Search courses'}
                  className="pl-10"
                  value={searchInput}
                  onChange={(event) => onSearchInputChange(event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {tableCopy.searchCta || 'Search'}
              </Button>
            </form>
            <div className="flex w-full gap-3 lg:w-auto">
              <select
                className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value as CourseStatusFilterValue)}
                disabled={isLoading}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="button" variant="ghost" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{tableCopy.course || 'Course'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.instructor || 'Instructor'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.schedule || 'Schedule'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.status || 'Status'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.capacity || 'Capacity'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.enrolled || 'Enrolled'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.created || 'Created'}</th>
                    <th className="px-6 py-3 font-semibold">{tableCopy.actions || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                        <div className="flex items-center justify-center gap-3">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>{tableCopy.loading || 'Loading courses...'}</span>
                        </div>
                      </td>
                    </tr>
                  ) : courses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                        {tableCopy.empty || 'No courses available.'}
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {course.image ? (
                              <Image
                                src={course.image}
                                alt={course.name}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">
                                {getInitials(course.name)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{course.name}</p>
                              <p className="text-xs text-slate-500">{course.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{course.instructor || '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{course.schedule || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <span
                              className={cn(
                                'inline-flex max-w-max rounded-full px-3 py-1 text-xs font-semibold border',
                                course.status === 'archived'
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-emerald-100 bg-emerald-50 text-emerald-700'
                              )}
                            >
                              {course.status === 'archived'
                                ? tableCopy.statusArchived || 'Archived'
                                : tableCopy.statusActive || 'Active'}
                            </span>
                            <div className="relative">
                              <select
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
                                value={course.status}
                                onChange={(event) => onChangeCourseStatus(course, event.target.value as CourseStatus)}
                                disabled={isRowUpdatingStatus(course.id)}
                              >
                                {statusChoices.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {isRowUpdatingStatus(course.id) ? (
                                <RefreshCw className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {typeof course.capacity === 'number' ? numberFormatter.format(course.capacity) : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {typeof course.enrolled === 'number' ? numberFormatter.format(course.enrolled) : '0'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{course.createdAt ? dateFormatter.format(new Date(course.createdAt)) : '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-rose-200 text-rose-600 hover:bg-rose-50"
                              disabled={isRowDeleting(course.id)}
                              onClick={() => onDeleteCourse(course)}
                            >
                              {isRowDeleting(course.id) ? <RefreshCw className="h-4 w-4 animate-spin" /> : tableCopy.deleteCta || 'Delete'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>{pageSummary}</p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" type="button" disabled={!canGoPrev} onClick={onPrevPage}>
                  {paginationCopy.prev || 'Previous'}
                </Button>
                <Button variant="outline" size="sm" type="button" disabled={!canGoNext} onClick={onNextPage}>
                  {paginationCopy.next || 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Popup
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        eyebrow={pageCopy.primaryAction || 'Create course'}
        title={pageCopy.createTitle || 'Add a new course'}
        description={pageCopy.createSubtitle || 'Define the core metadata for the new course.'}
        size="lg"
      >
        {createErrorMessage ? (
          <Alert variant="danger" className="mb-4">
            <AlertDescription>{createErrorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={onCreateCourseSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="code">{tableCopy.codeLabel || 'Course code'}</Label>
            <Input id="code" placeholder="CS101" disabled={isCreatingCourse} {...register('code')} />
            {createFormErrors.code ? <p className="text-xs text-rose-600">{createFormErrors.code.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">{tableCopy.nameLabel || 'Course name'}</Label>
            <Input id="name" placeholder="Fundamentals of Programming" disabled={isCreatingCourse} {...register('name')} />
            {createFormErrors.name ? <p className="text-xs text-rose-600">{createFormErrors.name.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">{tableCopy.imageLabel || 'Thumbnail image URL'}</Label>
            <Input
              id="image"
              placeholder="https://cdn.example.com/courses/cs101.jpg"
              disabled={isCreatingCourse}
              {...register('image', { setValueAs: normalizeOptionalString })}
            />
            {createFormErrors.image ? <p className="text-xs text-rose-600">{createFormErrors.image.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label>{tableCopy.imageUploadLabel || 'Upload from device'}</Label>
            <input
              type="file"
              accept="image/*"
              disabled={isCreatingCourse || isUploadingImage}
              onChange={(event) => onImageFileChange(event.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-slate-400 hover:file:bg-slate-700"
            />
            <p className="text-xs text-slate-500">{tableCopy.imageUploadHint || 'Supported formats: JPG, PNG up to 10MB.'}</p>
            {isUploadingImage ? (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                {tableCopy.imageUploadStatus || 'Uploading image...'}
              </p>
            ) : null}
            {imageUploadError ? <p className="text-xs text-rose-600">{imageUploadError}</p> : null}
            {previewSrc ? (
              <div className="mt-1 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <Image
                  src={previewSrc}
                  alt={tableCopy.imagePreviewLabel || 'Course preview'}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-2xl border border-white/60 object-cover shadow-md"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-700">{tableCopy.imagePreviewLabel || 'Preview'}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {currentImageUrl || tableCopy.imagePreviewPlaceholder || 'Select a file to preview the thumbnail.'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="instructor">{tableCopy.instructorLabel || 'Instructor'}</Label>
            <Input
              id="instructor"
              placeholder="Nguyen Van A"
              disabled={isCreatingCourse}
              {...register('instructor', { setValueAs: normalizeOptionalString })}
            />
            {createFormErrors.instructor ? <p className="text-xs text-rose-600">{createFormErrors.instructor.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="schedule">{tableCopy.scheduleLabel || 'Schedule'}</Label>
            <Input
              id="schedule"
              placeholder="Mon & Wed 07:00 - 09:00"
              disabled={isCreatingCourse}
              {...register('schedule', { setValueAs: normalizeOptionalString })}
            />
            {createFormErrors.schedule ? <p className="text-xs text-rose-600">{createFormErrors.schedule.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="credits">{tableCopy.creditsLabel || 'Credits'}</Label>
            <Input
              id="credits"
              type="number"
              min={1}
              max={10}
              disabled={isCreatingCourse}
              {...register('credits', { setValueAs: normalizeOptionalNumber })}
            />
            {createFormErrors.credits ? <p className="text-xs text-rose-600">{createFormErrors.credits.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="capacity">{tableCopy.capacityLabel || 'Capacity'}</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              max={9999}
              disabled={isCreatingCourse}
              {...register('capacity', { setValueAs: normalizeOptionalNumber })}
            />
            {createFormErrors.capacity ? <p className="text-xs text-rose-600">{createFormErrors.capacity.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">{tableCopy.descriptionLabel || 'Description'}</Label>
            <textarea
              id="description"
              placeholder="High‑level overview of the course."
              className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
              disabled={isCreatingCourse}
              {...register('description', { setValueAs: normalizeOptionalString })}
            />
            {createFormErrors.description ? <p className="text-xs text-rose-600">{createFormErrors.description.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tagsInput">{tableCopy.tagsLabel || 'Tags'}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tagsInput"
                placeholder="ai, machine-learning"
                disabled={isCreatingCourse}
                {...register('tagsInput', { setValueAs: normalizeOptionalString })}
              />
              <Tag className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            {createFormErrors.tagsInput ? <p className="text-xs text-rose-600">{createFormErrors.tagsInput.message}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeCreateModal} disabled={isCreatingCourse}>
              {tableCopy.cancelCta || 'Cancel'}
            </Button>
            <Button type="submit" disabled={isCreatingCourse}>
              {isCreatingCourse ? <RefreshCw className="h-4 w-4 animate-spin" /> : tableCopy.submitCta || 'Create course'}
            </Button>
          </div>
        </form>
      </Popup>
    </div>
  );
};
