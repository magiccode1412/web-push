export type ContentType = 'text' | 'markdown' | 'html';

export interface Message {
  id: string;
  title: string;
  content: string;
  type?: ContentType;
  imageUrl?: string;
  timestamp: number;
  read: boolean;
}

export interface Subscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushRecord {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  targetUserId?: string;
}
