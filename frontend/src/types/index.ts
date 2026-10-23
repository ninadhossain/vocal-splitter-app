export type StemMode = '2-stem' | '4-stem' | '6-stem';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface StemInfo {
  name: string;
  stemKey: string;
  filePath: string;
  url: string;
  format: string;
  color: string;
  fileSize?: number;
}

export interface AiAnalysis {
  lyrics?: string;
  musicalKey?: string;
  bpmEstimate?: number;
  genre?: string;
  vocalStyle?: string;
  aiNotes?: string;
}

export interface Job {
  jobId: string;
  originalFileName: string;
  fileSize: number;
  format: string;
  duration?: number;
  mode: StemMode;
  model: string;
  status: JobStatus;
  progress: number;
  currentStep: string;
  stems: Record<string, StemInfo>;
  aiAnalysis?: AiAnalysis;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ChannelControlState {
  volume: number; // 0.0 to 1.0
  pan: number;    // -1.0 (Left) to +1.0 (Right)
  isMuted: boolean;
  isSolo: boolean;
}

// User & Auth Types
export type UserRole = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  packageSlug: string;
  packageDetails?: Package;
  separationsThisMonth: number;
  isVerified?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

// Package / Subscription Tier Types
export interface Package {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  trackLimit: number; // -1 for unlimited
  maxDuration: number; // in seconds
  allowedModes: StemMode[];
  features: string[];
  badge?: string;
  isActive: boolean;
  isPopular: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Mail Server / SMTP Types (matches superadmin screenshot)
export interface MailServer {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  fromEmail: string;
  secure: boolean;
  isActive: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed' | 'untested';
  lastTestMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}
