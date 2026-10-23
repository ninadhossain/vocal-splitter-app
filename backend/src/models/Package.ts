import mongoose, { Schema, Document } from 'mongoose';
import { StemMode } from './Job';

export interface IPackage {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IPackageDocument extends Omit<IPackage, 'id'>, Document {}

const PackageSchema = new Schema<IPackageDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    priceMonthly: { type: Number, required: true, default: 0 },
    priceYearly: { type: Number, required: true, default: 0 },
    description: { type: String, required: true },
    trackLimit: { type: Number, required: true, default: 5 },
    maxDuration: { type: Number, required: true, default: 180 },
    allowedModes: [{ type: String, enum: ['2-stem', '4-stem', '6-stem'] }],
    features: [{ type: String }],
    badge: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PackageModel =
  mongoose.models.Package || mongoose.model<IPackageDocument>('Package', PackageSchema);

// In-Memory Fallback Store
const memoryPackages = new Map<string, IPackage>();
let isMongo = false;

// Seed standard tiers
const initialPackages: IPackage[] = [
  {
    id: 'pkg_free',
    name: 'Free Starter',
    slug: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Perfect for quick vocal removal and testing AI stem separation.',
    trackLimit: 5,
    maxDuration: 180, // 3 minutes
    allowedModes: ['2-stem'],
    features: [
      '5 Track Separations / month',
      'Vocal Remover (Vocals & Instrumental)',
      'Up to 3-minute audio length',
      'Standard Multi-threaded CPU Queue',
      '16-bit 44.1kHz Stereo WAV Exports',
      'Web Multi-Track Waveform Audition',
    ],
    badge: 'FREE FOREVER',
    isActive: true,
    isPopular: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pkg_pro',
    name: 'Creator Pro',
    slug: 'pro',
    priceMonthly: 15,
    priceYearly: 144, // 20% discount ($12/mo)
    description: 'For musicians, DJs, producers, and audio engineers who need full 4-stem isolation.',
    trackLimit: 50,
    maxDuration: 600, // 10 minutes
    allowedModes: ['2-stem', '4-stem'],
    features: [
      '50 Track Separations / month',
      'Full 4-Stem Isolation (Vocals, Drums, Bass, Other)',
      'Up to 10-minute audio length',
      'DirectML GPU Accelerated Priority Queue',
      '24-bit Lossless Studio WAV & ZIP Bundle',
      'Synchronized Multi-Track DAW with Pan & Solo',
      'AI Musical Key, BPM & Energy Analysis',
    ],
    badge: 'MOST POPULAR',
    isActive: true,
    isPopular: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pkg_studio',
    name: 'Studio Mastering',
    slug: 'studio',
    priceMonthly: 39,
    priceYearly: 374, // 20% discount ($31/mo)
    description: 'Unlimited high-throughput neural processing for record labels, studios, and heavy creators.',
    trackLimit: -1, // Unlimited
    maxDuration: 1800, // 30 minutes
    allowedModes: ['2-stem', '4-stem', '6-stem'],
    features: [
      'Unlimited Track Separations',
      '2-Stem, 4-Stem & 6-Stem (Guitar & Piano extraction)',
      'Up to 30-minute full DJ sets / podcasts',
      'Dedicated Cloud A100 Ultra-Fast VIP Queue',
      '32-bit Float Pristine Master Quality',
      'Direct DAW Integration & Batch Processing',
      'Priority 24/7 Support & Early Access to Models',
    ],
    badge: 'VIP STUDIO',
    isActive: true,
    isPopular: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

for (const pkg of initialPackages) {
  memoryPackages.set(pkg.id, pkg);
}

export class PackageRepository {
  static setMongoConnected(connected: boolean) {
    isMongo = connected;
    if (connected) {
      this.ensurePackagesInMongo().catch((err) =>
        console.error('[PackageRepository] Seed error:', err)
      );
    }
  }

  private static async ensurePackagesInMongo() {
    for (const p of initialPackages) {
      const existing = await PackageModel.findOne({ slug: p.slug });
      if (!existing) {
        await PackageModel.create({
          name: p.name,
          slug: p.slug,
          priceMonthly: p.priceMonthly,
          priceYearly: p.priceYearly,
          description: p.description,
          trackLimit: p.trackLimit,
          maxDuration: p.maxDuration,
          allowedModes: p.allowedModes,
          features: p.features,
          badge: p.badge,
          isActive: p.isActive,
          isPopular: p.isPopular,
        });
      }
    }
    console.log('[PackageRepository] Seeded default subscription tiers into MongoDB.');
  }

  static async listAll(onlyActive = false): Promise<IPackage[]> {
    if (isMongo) {
      try {
        const query = onlyActive ? { isActive: true } : {};
        const docs = await PackageModel.find(query).sort({ priceMonthly: 1 }).lean();
        if (docs.length > 0) {
          return docs.map((d: any) => ({ ...d, id: d._id.toString() } as IPackage));
        }
      } catch {}
    }
    const list = Array.from(memoryPackages.values()).sort(
      (a, b) => a.priceMonthly - b.priceMonthly
    );
    return onlyActive ? list.filter((p) => p.isActive) : list;
  }

  static async findById(id: string): Promise<IPackage | null> {
    if (isMongo) {
      try {
        const doc = await PackageModel.findById(id).lean();
        if (doc) return { ...doc, id: (doc as any)._id.toString() } as unknown as IPackage;
      } catch {}
    }
    return memoryPackages.get(id) || null;
  }

  static async findBySlug(slug: string): Promise<IPackage | null> {
    const s = slug.toLowerCase().trim();
    if (isMongo) {
      try {
        const doc = await PackageModel.findOne({ slug: s }).lean();
        if (doc) return { ...doc, id: (doc as any)._id.toString() } as unknown as IPackage;
      } catch {}
    }
    for (const p of memoryPackages.values()) {
      if (p.slug.toLowerCase() === s) return p;
    }
    return null;
  }

  static async create(pkgData: Partial<IPackage>): Promise<IPackage> {
    const id = `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullPkg: IPackage = {
      id,
      name: pkgData.name || 'Custom Package',
      slug: (pkgData.slug || `pkg-${Date.now()}`).toLowerCase().trim(),
      priceMonthly: Number(pkgData.priceMonthly) || 0,
      priceYearly: Number(pkgData.priceYearly) || 0,
      description: pkgData.description || '',
      trackLimit: pkgData.trackLimit ?? 5,
      maxDuration: pkgData.maxDuration ?? 300,
      allowedModes: pkgData.allowedModes || ['2-stem', '4-stem'],
      features: pkgData.features || [],
      badge: pkgData.badge,
      isActive: pkgData.isActive ?? true,
      isPopular: Boolean(pkgData.isPopular),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongo) {
      try {
        const created = await PackageModel.create({
          name: fullPkg.name,
          slug: fullPkg.slug,
          priceMonthly: fullPkg.priceMonthly,
          priceYearly: fullPkg.priceYearly,
          description: fullPkg.description,
          trackLimit: fullPkg.trackLimit,
          maxDuration: fullPkg.maxDuration,
          allowedModes: fullPkg.allowedModes,
          features: fullPkg.features,
          badge: fullPkg.badge,
          isActive: fullPkg.isActive,
          isPopular: fullPkg.isPopular,
        });
        fullPkg.id = (created as any)._id.toString();
      } catch (err) {
        console.warn('[PackageRepository] MongoDB create failed, storing in memory:', err);
      }
    }

    memoryPackages.set(fullPkg.id, fullPkg);
    return fullPkg;
  }

  static async update(id: string, updates: Partial<IPackage>): Promise<IPackage | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: IPackage = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    if (isMongo) {
      try {
        await PackageModel.findByIdAndUpdate(id, { $set: updates });
      } catch (err) {
        console.warn('[PackageRepository] MongoDB update failed:', err);
      }
    }

    memoryPackages.set(id, updated);
    return updated;
  }

  static async delete(id: string): Promise<boolean> {
    if (isMongo) {
      try {
        await PackageModel.findByIdAndDelete(id);
      } catch {}
    }
    return memoryPackages.delete(id);
  }
}
