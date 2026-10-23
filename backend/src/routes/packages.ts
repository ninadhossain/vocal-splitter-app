import { Router, Response } from 'express';
import { PackageRepository } from '../models/Package';
import { UserRepository } from '../models/User';
import { authenticate, requireSuperadmin, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/packages
 * Public: List active packages for pricing page & studio modal
 */
router.get('/', async (_req, res: Response) => {
  try {
    const packages = await PackageRepository.listAll(true);
    res.json(packages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/packages/all
 * Superadmin: List all packages including inactive
 */
router.get('/all', authenticate, requireSuperadmin, async (_req: AuthRequest, res: Response) => {
  try {
    const packages = await PackageRepository.listAll(false);
    res.json(packages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/packages/subscribe
 * Authenticated: User subscribes to or switches a plan
 */
router.post('/subscribe', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { packageSlug, billingCycle } = req.body;
    const user = req.user!;

    if (!packageSlug) {
      res.status(400).json({ error: 'packageSlug is required.' });
      return;
    }

    const pkg = await PackageRepository.findBySlug(packageSlug);
    if (!pkg || !pkg.isActive) {
      res.status(404).json({ error: 'Selected subscription tier is not currently available.' });
      return;
    }

    // Set expiration based on billing cycle (30 days or 365 days)
    const days = billingCycle === 'yearly' ? 365 : 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const updated = await UserRepository.update(user.id, {
      packageSlug: pkg.slug,
      packageExpiresAt: expiresAt,
      separationsThisMonth: 0, // Reset counter on upgrade/renewal
    });

    res.json({
      success: true,
      message: `Successfully subscribed to ${pkg.name} (${billingCycle || 'monthly'}).`,
      user: {
        id: updated!.id,
        name: updated!.name,
        email: updated!.email,
        packageSlug: updated!.packageSlug,
        packageExpiresAt: updated!.packageExpiresAt,
      },
      package: pkg,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/packages
 * Superadmin: Create new package
 */
router.post('/', authenticate, requireSuperadmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      slug,
      priceMonthly,
      priceYearly,
      description,
      trackLimit,
      maxDuration,
      allowedModes,
      features,
      badge,
      isActive,
      isPopular,
    } = req.body;

    if (!name || !description) {
      res.status(400).json({ error: 'Package name and description are required.' });
      return;
    }

    const created = await PackageRepository.create({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      priceMonthly: Number(priceMonthly) || 0,
      priceYearly: Number(priceYearly) || 0,
      description,
      trackLimit: Number(trackLimit) ?? 5,
      maxDuration: Number(maxDuration) ?? 300,
      allowedModes: allowedModes || ['2-stem', '4-stem'],
      features: Array.isArray(features) ? features : [],
      badge,
      isActive: isActive !== false,
      isPopular: Boolean(isPopular),
    });

    res.status(201).json({
      success: true,
      message: 'Package created successfully.',
      package: created,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/packages/:id
 * Superadmin: Update existing package
 */
router.put('/:id', authenticate, requireSuperadmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await PackageRepository.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Package updated successfully.',
      package: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/packages/:id
 * Superadmin: Delete package
 */
router.delete('/:id', authenticate, requireSuperadmin, async (req: AuthRequest, res: Response) => {
  try {
    const success = await PackageRepository.delete(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }

    res.json({ success: true, message: 'Package deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
