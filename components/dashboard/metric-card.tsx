import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

export type MetricCardConfig = {
  key: string;
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
  accent?: string;
};

export type MetricCardProps = MetricCardConfig & {
  valueFormatter?: (value: number) => string;
};

const defaultFormatter = (value: number) => value.toString();

export const MetricCard = ({
  label,
  value,
  caption,
  icon: Icon,
  accent = 'from-white/10 to-white/5',
  valueFormatter = defaultFormatter
}: MetricCardProps) => (
  <div className={cn('rounded-3xl border border-white/70 bg-linear-to-br from-10% to-90% p-5 shadow-sm', accent)}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{valueFormatter(value)}</p>
      </div>
      <div className="rounded-2xl bg-white/80 p-2 text-slate-900">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
    </div>
    <p className="mt-4 text-sm text-slate-500">{caption}</p>
  </div>
);
