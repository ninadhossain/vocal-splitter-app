import mongoose, { Schema, Document } from 'mongoose';

export type StemMode = '2-stem' | '4-stem' | '6-stem';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IStemInfo {
  name: string;
  stemKey: string;
  filePath: string;
  url: string;
  format: string;
  color: string;
  fileSize?: number;
}

export interface IJob {
  jobId: string;
  originalFileName: string;
  fileSize: number;
  format: string;
  inputFilePath?: string;
  duration?: number;
  mode: StemMode;
  aiModel: string;
  apiToken?: string;
  openAiKey?: string;
  aiAnalysis?: any;
  status: JobStatus;
  progress: number;
  currentStep: string;
  stems: Record<string, IStemInfo>;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface IJobDocument extends IJob, Document {}

const StemInfoSchema = new Schema<IStemInfo>(
  {
    name: { type: String, required: true },
    stemKey: { type: String, required: true },
    filePath: { type: String, required: true },
    url: { type: String, required: true },
    format: { type: String, required: true },
    color: { type: String, required: true },
    fileSize: { type: Number },
  },
  { _id: false }
);

const JobSchema = new Schema<IJobDocument>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    originalFileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    format: { type: String, required: true },
    inputFilePath: { type: String },
    duration: { type: Number },
    mode: { type: String, enum: ['2-stem', '4-stem', '6-stem'], default: '4-stem' },
    aiModel: { type: String, default: 'htdemucs' },
    apiToken: { type: String },
    openAiKey: { type: String },
    aiAnalysis: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'QUEUED',
      index: true,
    },
    progress: { type: Number, default: 0 },
    currentStep: { type: String, default: 'Queued for processing' },
    stems: { type: Map, of: StemInfoSchema, default: {} },
    errorMessage: { type: String },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const MongooseJobModel = mongoose.model<IJobDocument>('Job', JobSchema);

// In-Memory store fallback for quick testing without running mongod
const inMemoryJobs = new Map<string, IJob>();

export class JobRepository {
  private static isMongoConnected = false;

  public static setMongoConnected(connected: boolean) {
    this.isMongoConnected = connected;
  }

  public static async create(jobData: Partial<IJob>): Promise<IJob> {
    const job: IJob = {
      jobId: jobData.jobId || Math.random().toString(36).substring(2, 9),
      originalFileName: jobData.originalFileName || 'untitled.mp3',
      fileSize: jobData.fileSize || 0,
      format: jobData.format || 'mp3',
      inputFilePath: jobData.inputFilePath || '',
      duration: jobData.duration || 0,
      mode: jobData.mode || '4-stem',
      aiModel: jobData.aiModel || 'htdemucs',
      apiToken: jobData.apiToken,
      openAiKey: jobData.openAiKey,
      aiAnalysis: jobData.aiAnalysis,
      status: jobData.status || 'QUEUED',
      progress: jobData.progress || 0,
      currentStep: jobData.currentStep || 'Queued for processing',
      stems: jobData.stems || {},
      errorMessage: jobData.errorMessage,
      createdAt: new Date(),
    };

    if (this.isMongoConnected) {
      try {
        const created = await MongooseJobModel.create(job);
        return created.toObject() as IJob;
      } catch (err) {
        console.warn('[DB] MongoDB write error, falling back to in-memory:', err);
      }
    }

    inMemoryJobs.set(job.jobId, { ...job });
    return job;
  }

  public static async findByJobId(jobId: string): Promise<IJob | null> {
    if (this.isMongoConnected) {
      try {
        const job = await MongooseJobModel.findOne({ jobId }).lean();
        if (job) return job as unknown as IJob;
      } catch (err) {
        console.warn('[DB] MongoDB read error, falling back to in-memory:', err);
      }
    }

    return inMemoryJobs.get(jobId) || null;
  }

  public static async update(jobId: string, updates: Partial<IJob>): Promise<IJob | null> {
    if (this.isMongoConnected) {
      try {
        const updated = await MongooseJobModel.findOneAndUpdate(
          { jobId },
          { $set: updates },
          { new: true }
        ).lean();
        if (updated) return updated as unknown as IJob;
      } catch (err) {
        console.warn('[DB] MongoDB update error, updating in-memory:', err);
      }
    }

    const existing = inMemoryJobs.get(jobId);
    if (!existing) return null;

    const updatedJob: IJob = {
      ...existing,
      ...updates,
      stems: updates.stems ? { ...existing.stems, ...updates.stems } : existing.stems,
    };
    inMemoryJobs.set(jobId, updatedJob);
    return updatedJob;
  }

  public static async listRecent(limit = 10): Promise<IJob[]> {
    if (this.isMongoConnected) {
      try {
        const jobs = await MongooseJobModel.find().sort({ createdAt: -1 }).limit(limit).lean();
        return jobs as unknown as IJob[];
      } catch (err) {
        console.warn('[DB] MongoDB list error:', err);
      }
    }

    return Array.from(inMemoryJobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
