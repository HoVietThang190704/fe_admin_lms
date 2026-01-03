import type { MetricCardConfig } from '@/components/dashboard/metric-card';
import type { TicketStatus } from '@/lib/services/tickets';

export type TicketSummaryCard = MetricCardConfig;

export type TicketStatusFilterValue = 'all' | TicketStatus;

export type TicketStatusChoice = {
  value: TicketStatus;
  label: string;
};
