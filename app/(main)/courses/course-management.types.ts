import type { FieldErrorsImpl } from 'react-hook-form';

import type { AdminCourseRecord, CourseStatus } from '@/lib/services/courses/list';
import type { CreateCourseFormSchema } from '@/lib/shared/validation/courses';

export type CourseStatusFilterValue = 'all' | CourseStatus;

export type PaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CreateCourseFormValues = CreateCourseFormSchema;

export type CreateCourseFormErrors = FieldErrorsImpl<CreateCourseFormValues>;

export type StatusChoice = {
  value: CourseStatus;
  label: string;
};

export type CourseSummary = {
  total: number;
  active: number;
  archived: number;
};

export type AdminCourseTableProps = {
  courses: AdminCourseRecord[];
};
