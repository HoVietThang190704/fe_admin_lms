import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'settings.validation.currentPasswordRequired'),
    newPassword: z.string().min(6, 'settings.validation.passwordMin'),
    confirmPassword: z.string().min(6, 'settings.validation.passwordMin')
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'settings.validation.passwordMismatch'
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
