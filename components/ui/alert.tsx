import * as React from 'react';
import { AlertTriangle, CircleCheck } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

export type AlertVariant = 'info' | 'danger' | 'success';

const variantIconMap = {
  info: CircleCheck,
  danger: AlertTriangle,
  success: CircleCheck
};

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-blue-50 text-blue-900 ring-1 ring-blue-100',
  danger: 'bg-red-50 text-red-900 ring-1 ring-red-100',
  success: 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100'
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export const Alert = ({ variant = 'info', className, children, ...props }: AlertProps) => {
  const Icon = variantIconMap[variant];

  return (
    <div
      role="alert"
      className={cn(
        'flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4" />
      <div className="flex-1">{children}</div>
    </div>
  );
};

export const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm leading-relaxed', className)} {...props} />
);
