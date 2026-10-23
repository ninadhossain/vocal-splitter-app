import { Router, Response } from 'express';
import { MailServerRepository, IMailServer } from '../models/MailServer';
import { MailService } from '../services/mailService';
import { authenticate, requireSuperadmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Protect all routes with Superadmin check
router.use(authenticate, requireSuperadmin);

/**
 * Mask password for safe transmission to client
 */
function maskServer(server: IMailServer) {
  return {
    ...server,
    password: server.password ? '••••••••' : '',
  };
}

/**
 * GET /api/admin/mail-servers
 */
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const servers = await MailServerRepository.listAll();
    res.json(servers.map(maskServer));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/mail-servers
 * Register a new mail server with instant verification
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { label, host, port, username, password, fromEmail, secure, isActive } = req.body;

    if (!host || !port || !username || !password) {
      res.status(400).json({ error: 'Host, port, username, and password are required.' });
      return;
    }

    const testServerConfig: Partial<IMailServer> = {
      label: label || 'SMTP Mail Server',
      host: host.trim(),
      port: Number(port),
      username: username.trim(),
      password: password,
      fromEmail: (fromEmail || username).trim(),
      secure: Boolean(secure),
      isActive: Boolean(isActive),
    };

    // Test verify connection
    const testResult = await MailService.verifyServer(testServerConfig as IMailServer);

    const created = await MailServerRepository.create({
      ...testServerConfig,
      lastTestedAt: new Date(),
      lastTestStatus: testResult.success ? 'success' : 'failed',
      lastTestMessage: testResult.message,
    });

    res.status(201).json({
      success: true,
      message: testResult.success
        ? 'Mail server saved and verified successfully.'
        : `Mail server saved, but verification test failed: ${testResult.message}`,
      server: maskServer(created),
      verification: testResult,
    });
  } catch (err: any) {
    console.error('[MailServer Error - Create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/mail-servers/:id/activate
 * Set specified mail server as active primary provider
 */
router.post('/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    const updated = await MailServerRepository.setActive(req.params.id);
    if (!updated) {
      res.status(404).json({ error: 'Mail server not found' });
      return;
    }

    res.json({
      success: true,
      message: `Mail server '${updated.label}' is now the active primary SMTP provider.`,
      server: maskServer(updated),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/mail-servers/test
 * Send a live test email to recipient
 */
router.post('/test', async (req: AuthRequest, res: Response) => {
  try {
    const { toEmail, serverId, serverConfig } = req.body;

    if (!toEmail) {
      res.status(400).json({ error: 'Recipient email address (toEmail) is required.' });
      return;
    }

    let configToUse: IMailServer | undefined;
    if (serverId) {
      const found = await MailServerRepository.findById(serverId);
      if (found) configToUse = found;
    } else if (serverConfig) {
      configToUse = serverConfig;
    }

    const result = await MailService.sendTestEmail(toEmail, configToUse);

    res.json({
      success: true,
      message: `Test email dispatched successfully to ${toEmail}!`,
      details: result,
    });
  } catch (err: any) {
    console.error('[MailServer Test Error]', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch test email' });
  }
});

/**
 * PUT /api/admin/mail-servers/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { label, host, port, username, password, fromEmail, secure, isActive } = req.body;
    const existing = await MailServerRepository.findById(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Mail server not found' });
      return;
    }

    const updates: Partial<IMailServer> = {};
    if (label !== undefined) updates.label = label;
    if (host !== undefined) updates.host = host;
    if (port !== undefined) updates.port = Number(port);
    if (username !== undefined) updates.username = username;
    if (password) updates.password = password; // Only update password if provided
    if (fromEmail !== undefined) updates.fromEmail = fromEmail;
    if (secure !== undefined) updates.secure = Boolean(secure);
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    // Verify if host/port/user/pass changed
    if (updates.host || updates.port || updates.username || updates.password) {
      const mergedConfig = { ...existing, ...updates };
      const testResult = await MailService.verifyServer(mergedConfig);
      updates.lastTestedAt = new Date();
      updates.lastTestStatus = testResult.success ? 'success' : 'failed';
      updates.lastTestMessage = testResult.message;
    }

    const updated = await MailServerRepository.update(req.params.id, updates);
    res.json({
      success: true,
      message: 'Mail server updated successfully.',
      server: maskServer(updated!),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/mail-servers/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const success = await MailServerRepository.delete(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Mail server not found' });
      return;
    }
    res.json({ success: true, message: 'Mail server deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
