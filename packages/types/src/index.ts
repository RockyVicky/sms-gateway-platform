// User types
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Device types
export type DeviceStatus = 'online' | 'offline' | 'paused';

export interface Device {
  id: string;
  deviceId: string; // Hardware UUID
  name: string;
  phoneNumber: string;
  provider: string; // e.g. Jio
  status: DeviceStatus;
  battery: number; // 0-100
  signal: number; // 0-4 scale or dBm
  socketId?: string | null;
  publicKey: string; // RSA Public Key
  lastSeenAt: Date;
  createdAt: Date;
}

// Message types
export type MessageStatus = 'pending' | 'queued' | 'processing' | 'sent' | 'delivered' | 'failed';

export interface Message {
  id: string;
  userId: string;
  deviceId?: string | null;
  recipient: string;
  content: string;
  status: MessageStatus;
  errorMessage?: string | null;
  attempts: number;
  maxAttempts: number;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// OTP Request types
export interface OtpRequest {
  id: string;
  phone: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

// API Key types
export type ApiKeyStatus = 'active' | 'revoked';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string; // e.g. "sg_live_xxxx"
  keyHash: string;
  userId: string;
  status: ApiKeyStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook types
export interface WebhookPayload {
  event: 'message.sent' | 'message.delivered' | 'message.failed' | 'device.status';
  timestamp: string;
  data: any;
}
