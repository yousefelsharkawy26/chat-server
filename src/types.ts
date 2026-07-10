export type UserRole = "admin" | "moderator" | "user" | "guest";

export interface CustomEmoji {
  id: string;
  name: string;
  url: string;
  creator: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target?: string;
  details?: string;
  timestamp: string;
  type: "moderation" | "system" | "security";
}

export interface User {
  id: string;
  username: string;
  room: string;
  joinTime?: string;
  messageCount?: number;
  status?: "online" | "away" | "busy" | "focus";
  statusText?: string;
  statusEmoji?: string;
  color?: string;
  role: UserRole;
  isMuted?: boolean;
  focusConfig?: {
    enabled: boolean;
    allowedUsers: string[]; // Usernames allowed to bypass focus mode
  };
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  encryptedText?: string;
  isEncrypted?: boolean;
  timestamp: string;
  room: string;
  isSystem?: boolean;
  seenBy?: string[];
  audioUrl?: string;
  audioDuration?: number;
  audioTranscription?: string;
  isPinned?: boolean;
  isResolved?: boolean;
  bookmarkedBy?: string[];
  parentId?: string;
  reactions?: { [emoji: string]: string[] };
  isSending?: boolean;
}

export interface Task {
  id: string;
  room: string;
  text: string;
  creator: string;
  assignee?: string;
  dueDate?: string;
  status: "todo" | "in-progress" | "done";
  createdAt: string;
  messageId?: string;
}

export interface Channel {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  emoji?: string;
  isEncrypted?: boolean;
}

export interface ChannelFolder {
  id: string;
  name: string;
  channelIds: string[];
}
