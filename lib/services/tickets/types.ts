export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'rejected';
export type TicketType = 'support' | 'bug' | 'feature' | 'question' | 'refund' | 'other';

export type TicketAttachment = {
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
};

export type AdminTicketRecord = {
  id: string;
  ticketNumber?: string | null;
  title: string;
  description?: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: string;
  createdByName?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
  relatedShopId?: string | null;
  relatedShopReference?: string | null;
  relatedOrderId?: string | null;
  relatedOrderReference?: string | null;
  tags?: string[];
  attachments?: TicketAttachment[];
  commentsCount?: number;
  isPublic?: boolean;
  resolutionMessage?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketListResponse = {
  tickets: AdminTicketRecord[];
};
