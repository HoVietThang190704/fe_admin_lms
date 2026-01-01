import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'login.validation.emailRequired').email('login.validation.emailInvalid'),
  password: z.string().min(6, 'login.validation.passwordMin')
});

export type LoginFormValues = z.infer<typeof loginSchema>;
