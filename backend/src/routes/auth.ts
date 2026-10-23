import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRepository } from '../models/User';
import { PackageRepository } from '../models/Package';
import { MailService } from '../services/mailService';
import { authenticate, AuthRequest, JWT_SECRET } from '../middleware/auth';

const router = Router();

function signUserToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res: Response) => {
  try {
    const { name, email, password, packageSlug } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const targetSlug = packageSlug || 'free';

    const newUser = await UserRepository.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'active',
      isVerified: true,
      packageSlug: targetSlug,
      separationsThisMonth: 0,
    });

    // Send Welcome Email in background
    MailService.sendWelcomeEmail(newUser).catch((err) =>
      console.warn('[Auth] Failed to dispatch welcome email:', err.message)
    );

    const token = signUserToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        packageSlug: newUser.packageSlug,
        status: newUser.status,
      },
    });
  } catch (err: any) {
    console.error('[Auth Error - Signup]', err);
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

/**
 * POST /api/auth/signin
 */
router.post('/signin', async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await UserRepository.findByEmail(email);
    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signUserToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        packageSlug: user.packageSlug,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error('[Auth Error - Signin]', err);
    res.status(500).json({ error: err.message || 'Signin failed' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const userPackage = await PackageRepository.findBySlug(user.packageSlug);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      packageSlug: user.packageSlug,
      packageDetails: userPackage,
      separationsThisMonth: user.separationsThisMonth,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/auth/profile
 */
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { name, password } = req.body;

    const updates: any = {};
    if (name) updates.name = name;
    if (password) {
      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    const updated = await UserRepository.update(user.id, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updated!.id,
        name: updated!.name,
        email: updated!.email,
        role: updated!.role,
        packageSlug: updated!.packageSlug,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Return success anyway to avoid user enumeration
      res.json({
        success: true,
        message: 'If that email address exists in our system, recovery instructions have been dispatched.',
      });
      return;
    }

    // Generate random 6-digit pin and secure token
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await UserRepository.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
      verificationToken: pinCode,
    });

    // Send email via configured active SMTP server
    await MailService.sendPasswordResetEmail(user, resetToken, pinCode);

    res.json({
      success: true,
      message: 'Password recovery email dispatched.',
      resetToken, // also returned in response for seamless development/testing
      pinCode,    // also returned for convenience
    });
  } catch (err: any) {
    console.error('[Auth Error - Forgot Password]', err);
    res.status(500).json({ error: err.message || 'Recovery request failed' });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res: Response) => {
  try {
    const { token, pinCode, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    let user = null;
    if (token) {
      user = await UserRepository.findByResetToken(token);
    }

    if (!user && pinCode) {
      const allUsers = await UserRepository.listAll();
      const now = new Date();
      user = allUsers.find(
        (u) =>
          u.verificationToken === pinCode &&
          u.resetPasswordExpires &&
          new Date(u.resetPasswordExpires) > now
      ) || null;
    }

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired password reset token or PIN code.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserRepository.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
      verificationToken: undefined,
    });

    res.json({
      success: true,
      message: 'Your password has been successfully reset. You may now sign in with your new credentials.',
    });
  } catch (err: any) {
    console.error('[Auth Error - Reset Password]', err);
    res.status(500).json({ error: err.message || 'Password reset failed' });
  }
});

export default router;
