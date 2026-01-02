import { z } from 'zod';

export const createCourseFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Mã khóa học phải có ít nhất 2 ký tự')
    .max(20, 'Mã khóa học không được vượt quá 20 ký tự'),
  name: z
    .string()
    .trim()
    .min(3, 'Tên khóa học phải có ít nhất 3 ký tự')
    .max(200, 'Tên khóa học không được vượt quá 200 ký tự'),
  image: z
    .string()
    .trim()
    .url('Ảnh khóa học phải là một URL hợp lệ')
    .max(500, 'URL ảnh không được vượt quá 500 ký tự')
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Mô tả không được vượt quá 1000 ký tự')
    .optional(),
  instructor: z
    .string()
    .trim()
    .max(120, 'Tên giảng viên không được vượt quá 120 ký tự')
    .optional(),
  schedule: z
    .string()
    .trim()
    .max(120, 'Lịch học không được vượt quá 120 ký tự')
    .optional(),
  credits: z.number().int().positive().max(10).optional(),
  capacity: z.number().int().positive().max(9999).optional(),
  tagsInput: z
    .string()
    .trim()
    .max(200, 'Tags không được vượt quá 200 ký tự')
    .optional()
});

export type CreateCourseFormSchema = z.infer<typeof createCourseFormSchema>;
