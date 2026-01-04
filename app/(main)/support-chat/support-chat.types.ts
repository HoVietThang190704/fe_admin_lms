export type SupportChatSender = 'user' | 'admin' | 'system';

export type SupportChatMessage = {
  id: string;
  userId: string;
  senderRole: SupportChatSender;
  senderId?: string | null;
  senderName?: string | null;
  content: string;
  createdAt: string;
  clientMessageId?: string;
  pending?: boolean;
  error?: boolean;
};

export type SupportConversation = {
  userId: string;
  userName?: string | null;
  messages: SupportChatMessage[];
  lastMessageAt: string | null;
  unreadCount: number;
};

export type SupportChatAck = {
  success?: boolean;
  error?: string;
  messageId?: string;
  clientMessageId?: string;
};
