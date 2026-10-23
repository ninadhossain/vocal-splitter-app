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
  volume: number; // 0.0 to 1.5
  pan: number;    // -1.0 (Left) to +1.0 (Right)
  isMuted: boolean;
  isSolo: boolean;
}
