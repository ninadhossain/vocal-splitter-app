import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'suspended';

export interface IUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  packageSlug: string;
  packageExpiresAt?: Date;
  separationsThisMonth: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  verificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends Omit<IUser, 'id'>, Document {
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    isVerified: { type: Boolean, default: false },
    packageSlug: { type: String, default: 'free' },
    packageExpiresAt: { type: Date },
    separationsThisMonth: { type: Number, default: 0 },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    verificationToken: { type: String },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

// In-Memory Fallback Store
const memoryUsers = new Map<string, IUser>();
let isMongo = false;

// Seed initial superadmin
const defaultSuperadminHash = bcrypt.hashSync('AdminPassword123!', 10);
const initialSuperadmin: IUser = {
  id: 'usr_superadmin_01',
  name: 'SonicSplit Superadmin',
  email: 'admin@sonicsplit.ai',
  password: defaultSuperadminHash,
  role: 'superadmin',
  status: 'active',
  isVerified: true,
  packageSlug: 'studio',
  separationsThisMonth: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};
memoryUsers.set(initialSuperadmin.id, initialSuperadmin);

export class UserRepository {
  static setMongoConnected(connected: boolean) {
    isMongo = connected;
    if (connected) {
      // Ensure superadmin exists in MongoDB
      this.ensureSuperadminInMongo().catch((err) => console.error('[UserRepository] Superadmin seed error:', err));
    }
  }

  private static async ensureSuperadminInMongo() {
    const existing = await UserModel.findOne({ email: initialSuperadmin.email });
    if (!existing) {
      await UserModel.create({
        name: initialSuperadmin.name,
        email: initialSuperadmin.email,
        password: defaultSuperadminHash,
        role: 'superadmin',
        status: 'active',
        isVerified: true,
        packageSlug: 'studio',
        separationsThisMonth: 0,
      });
      console.log(`[UserRepository] Seeded default superadmin (${initialSuperadmin.email}) into MongoDB.`);
    }
  }

  static async findById(id: string): Promise<IUser | null> {
    if (isMongo) {
      try {
        const doc = await UserModel.findById(id).lean();
        if (doc) return { ...doc, id: (doc as any)._id.toString() } as unknown as IUser;
      } catch {}
    }
    return memoryUsers.get(id) || null;
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    const normalized = email.toLowerCase().trim();
    if (isMongo) {
      try {
        const doc = await UserModel.findOne({ email: normalized }).lean();
        if (doc) return { ...doc, id: (doc as any)._id.toString() } as unknown as IUser;
      } catch {}
    }
    for (const user of memoryUsers.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return null;
  }

  static async findByResetToken(token: string): Promise<IUser | null> {
    if (isMongo) {
      try {
        const doc = await UserModel.findOne({
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: new Date() },
        }).lean();
        if (doc) return { ...doc, id: (doc as any)._id.toString() } as unknown as IUser;
      } catch {}
    }
    const now = new Date();
    for (const user of memoryUsers.values()) {
      if (
        user.resetPasswordToken === token &&
        user.resetPasswordExpires &&
        user.resetPasswordExpires > now
      ) {
        return user;
      }
    }
    return null;
  }

  static async create(userData: Partial<IUser>): Promise<IUser> {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullUser: IUser = {
      id,
      name: userData.name || 'User',
      email: (userData.email || '').toLowerCase().trim(),
      password: userData.password,
      role: userData.role || 'user',
      status: userData.status || 'active',
      isVerified: userData.isVerified ?? false,
      packageSlug: userData.packageSlug || 'free',
      packageExpiresAt: userData.packageExpiresAt,
      separationsThisMonth: userData.separationsThisMonth || 0,
      verificationToken: userData.verificationToken,
      resetPasswordToken: userData.resetPasswordToken,
      resetPasswordExpires: userData.resetPasswordExpires,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongo) {
      try {
        const created = await UserModel.create({
          name: fullUser.name,
          email: fullUser.email,
          password: fullUser.password,
          role: fullUser.role,
          status: fullUser.status,
          isVerified: fullUser.isVerified,
          packageSlug: fullUser.packageSlug,
          packageExpiresAt: fullUser.packageExpiresAt,
          separationsThisMonth: fullUser.separationsThisMonth,
          verificationToken: fullUser.verificationToken,
        });
        fullUser.id = (created as any)._id.toString();
      } catch (err) {
        console.warn('[UserRepository] MongoDB create failed, storing in memory:', err);
      }
    }

    memoryUsers.set(fullUser.id, fullUser);
    return fullUser;
  }

  static async update(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    let existing = await this.findById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    if (isMongo) {
      try {
        await UserModel.findByIdAndUpdate(id, { $set: updates });
      } catch (err) {
        console.warn('[UserRepository] MongoDB update failed:', err);
      }
    }

    memoryUsers.set(id, updated);
    return updated;
  }

  static async listAll(): Promise<IUser[]> {
    if (isMongo) {
      try {
        const docs = await UserModel.find().sort({ createdAt: -1 }).lean();
        if (docs.length > 0) {
          return docs.map((d: any) => ({ ...d, id: d._id.toString() } as IUser));
        }
      } catch {}
    }
    return Array.from(memoryUsers.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  static async delete(id: string): Promise<boolean> {
    if (isMongo) {
      try {
        await UserModel.findByIdAndDelete(id);
      } catch {}
    }
    return memoryUsers.delete(id);
  }

  static async count(): Promise<number> {
    if (isMongo) {
      try {
        return await UserModel.countDocuments();
      } catch {}
    }
    return memoryUsers.size;
  }
}
