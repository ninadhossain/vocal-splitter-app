import { Router, Response } from 'express';
import { UserRepository } from '../models/User';
import { JobRepository } from '../models/Job';
import { PackageRepository } from '../models/Package';
import { MailServerRepository } from '../models/MailServer';
import { authenticate, requireAdmin, requireSuperadmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/stats
 * Overview dashboard metrics
 */
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await UserRepository.count();
    const allUsers = await UserRepository.listAll();
    const allJobs = await JobRepository.listRecent(100);
    const packages = await PackageRepository.listAll();
    const activeMailServer = await MailServerRepository.getActive();

    const planBreakdown: Record<string, number> = {};
    for (const u of allUsers) {
      planBreakdown[u.packageSlug] = (planBreakdown[u.packageSlug] || 0) + 1;
    }

    res.json({
      totalUsers,
      totalJobs: allJobs.length,
      activePackagesCount: packages.filter((p) => p.isActive).length,
      planBreakdown,
      activeMailServer: activeMailServer
        ? {
            id: activeMailServer.id,
            label: activeMailServer.label,
            host: activeMailServer.host,
            port: activeMailServer.port,
            fromEmail: activeMailServer.fromEmail,
            secure: activeMailServer.secure,
            lastTestStatus: activeMailServer.lastTestStatus,
            lastTestedAt: activeMailServer.lastTestedAt,
          }
        : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/users
 * List all registered users
 */
router.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await UserRepository.listAll();
    const sanitized = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      packageSlug: u.packageSlug,
      separationsThisMonth: u.separationsThisMonth,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
    }));
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/users/:id
 * Superadmin: Update user role, package, or status
 */
router.put('/users/:id', requireSuperadmin, async (req: AuthRequest, res: Response) => {
  try {
    const { role, status, packageSlug, separationsThisMonth } = req.body;
    const existing = await UserRepository.findById(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent removing the last superadmin
    if (existing.role === 'superadmin' && role && role !== 'superadmin') {
      const all = await UserRepository.listAll();
      const superadmins = all.filter((u) => u.role === 'superadmin');
      if (superadmins.length <= 1) {
        res.status(400).json({ error: 'Cannot demote the only superadmin account.' });
        return;
      }
    }

    const updates: any = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (packageSlug) updates.packageSlug = packageSlug;
    if (separationsThisMonth !== undefined) updates.separationsThisMonth = Number(separationsThisMonth);

    const updated = await UserRepository.update(req.params.id, updates);

    res.json({
      success: true,
      message: 'User account updated successfully.',
      user: {
        id: updated!.id,
        name: updated!.name,
        email: updated!.email,
        role: updated!.role,
        status: updated!.status,
        packageSlug: updated!.packageSlug,
        separationsThisMonth: updated!.separationsThisMonth,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Superadmin: Delete user account
 */
router.delete('/users/:id', requireSuperadmin, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserRepository.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.role === 'superadmin') {
      res.status(400).json({ error: 'Superadmin accounts cannot be deleted directly.' });
      return;
    }

    await UserRepository.delete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
