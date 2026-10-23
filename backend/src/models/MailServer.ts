import mongoose, { Schema, Document } from 'mongoose';

export interface IMailServer {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  fromEmail: string;
  secure: boolean;
  isActive: boolean;
  lastTestedAt?: Date;
  lastTestStatus?: 'success' | 'failed' | 'untested';
  lastTestMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMailServerDocument extends Omit<IMailServer, 'id'>, Document {}

const MailServerSchema = new Schema<IMailServerDocument>(
  {
    label: { type: String, required: true, trim: true },
    host: { type: String, required: true, trim: true },
    port: { type: Number, required: true, default: 587 },
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    fromEmail: { type: String, required: true, trim: true },
    secure: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false, index: true },
    lastTestedAt: { type: Date },
    lastTestStatus: { type: String, enum: ['success', 'failed', 'untested'], default: 'untested' },
    lastTestMessage: { type: String },
  },
  { timestamps: true }
);

export const MailServerModel =
  mongoose.models.MailServer || mongoose.model<IMailServerDocument>('MailServer', MailServerSchema);

// In-Memory Fallback Store
const memoryMailServers = new Map<string, IMailServer>();
let isMongo = false;

// Seed initial Gmail mail server matching user's screenshot
const initialMailServer: IMailServer = {
  id: 'ms_gmail_01',
  label: 'Gmail SMTP',
  host: 'smtp.gmail.com',
  port: 587,
  username: 'babylonresources@gmail.com',
  password: 'app-password-placeholder',
  fromEmail: 'noreply@babylonresources.com',
  secure: false,
  isActive: true,
  lastTestedAt: new Date(),
  lastTestStatus: 'success',
  lastTestMessage: 'Ready for outbound notifications',
  createdAt: new Date(),
  updatedAt: new Date(),
};
memoryMailServers.set(initialMailServer.id, initialMailServer);

export class MailServerRepository {
  static setMongoConnected(connected: boolean) {
    isMongo = connected;
    if (connected) {
      this.ensureInitialServerInMongo().catch((err) =>
        console.error('[MailServerRepository] Seed error:', err)
      );
    }
  }

  private static async ensureInitialServerInMongo() {
    const count = await MailServerModel.countDocuments();
    if (count === 0) {
      await MailServerModel.create({
        label: initialMailServer.label,
        host: initialMailServer.host,
        port: initialMailServer.port,
        username: initialMailServer.username,
        password: initialMailServer.password,
        fromEmail: initialMailServer.fromEmail,
        secure: initialMailServer.secure,
        isActive: initialMailServer.isActive,
        lastTestedAt: initialMailServer.lastTestedAt,
        lastTestStatus: initialMailServer.lastTestStatus,
        lastTestMessage: initialMailServer.lastTestMessage,
      });
      console.log(`[MailServerRepository] Seeded default mail server (${initialMailServer.label}) into MongoDB.`);
    }
  }

  static async listAll(): Promise<IMailServer[]> {
    if (isMongo) {
      try {
        const docs = await MailServerModel.find().sort({ isActive: -1, createdAt: -1 }).lean();
        if (docs.length > 0) {
          return docs.map((d: any) => ({ ...d, id: d._id.toString() } as IMailServer));
        }
      } catch {}
    }
    return Array.from(memoryMailServers.values()).sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));
  }

  static async getActive(): Promise<IMailServer | null> {
    if (isMongo) {
      try {
        const doc = await MailServerModel.findOne({ isActive: true }).lean();
        if (doc) return { ...doc, id: (doc as any)._id.toString() } as unknown as IMailServer;
      } catch {}
    }
    for (const server of memoryMailServers.values()) {
      if (server.isActive) return server;
    }
    // Return first available if none marked active
    const first = Array.from(memoryMailServers.values())[0];
    return first || null;
  }

  static async findById(id: string): Promise<IMailServer | null> {
    if (isMongo) {
      try {
        const doc = await MailServerModel.findById(id).lean();
        if (doc) return { ...doc, id: (doc as any)._id.toString() } as unknown as IMailServer;
      } catch {}
    }
    return memoryMailServers.get(id) || null;
  }

  static async create(serverData: Partial<IMailServer>): Promise<IMailServer> {
    const id = `ms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullServer: IMailServer = {
      id,
      label: serverData.label || 'Custom SMTP',
      host: serverData.host || 'smtp.gmail.com',
      port: Number(serverData.port) || 587,
      username: serverData.username || '',
      password: serverData.password || '',
      fromEmail: serverData.fromEmail || serverData.username || 'noreply@sonicsplit.ai',
      secure: Boolean(serverData.secure),
      isActive: Boolean(serverData.isActive),
      lastTestedAt: serverData.lastTestedAt,
      lastTestStatus: serverData.lastTestStatus || 'untested',
      lastTestMessage: serverData.lastTestMessage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If new server is marked active, deactivate others
    if (fullServer.isActive) {
      await this.deactivateAll();
    }

    if (isMongo) {
      try {
        const created = await MailServerModel.create({
          label: fullServer.label,
          host: fullServer.host,
          port: fullServer.port,
          username: fullServer.username,
          password: fullServer.password,
          fromEmail: fullServer.fromEmail,
          secure: fullServer.secure,
          isActive: fullServer.isActive,
          lastTestedAt: fullServer.lastTestedAt,
          lastTestStatus: fullServer.lastTestStatus,
          lastTestMessage: fullServer.lastTestMessage,
        });
        fullServer.id = (created as any)._id.toString();
      } catch (err) {
        console.warn('[MailServerRepository] MongoDB create failed, storing in memory:', err);
      }
    }

    memoryMailServers.set(fullServer.id, fullServer);
    return fullServer;
  }

  static async update(id: string, updates: Partial<IMailServer>): Promise<IMailServer | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    if (updates.isActive) {
      await this.deactivateAll();
    }

    const updated: IMailServer = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    if (isMongo) {
      try {
        await MailServerModel.findByIdAndUpdate(id, { $set: updates });
      } catch (err) {
        console.warn('[MailServerRepository] MongoDB update failed:', err);
      }
    }

    memoryMailServers.set(id, updated);
    return updated;
  }

  static async setActive(id: string): Promise<IMailServer | null> {
    await this.deactivateAll();
    return this.update(id, { isActive: true });
  }

  private static async deactivateAll() {
    if (isMongo) {
      try {
        await MailServerModel.updateMany({}, { $set: { isActive: false } });
      } catch {}
    }
    for (const [key, val] of memoryMailServers.entries()) {
      val.isActive = false;
      memoryMailServers.set(key, val);
    }
  }

  static async delete(id: string): Promise<boolean> {
    if (isMongo) {
      try {
        await MailServerModel.findByIdAndDelete(id);
      } catch {}
    }
    return memoryMailServers.delete(id);
  }
}
