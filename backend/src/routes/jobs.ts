import express, { Request, Response } from 'express';
import { JobRepository } from '../models/Job';
import { sseManager } from '../services/sseManager';

const router = express.Router();

/**
 * GET /api/jobs
 * List recent jobs
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await JobRepository.listRecent(15);
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/jobs/:id
 * Retrieve a specific job's status and stems
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await JobRepository.findByJobId(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/jobs/:id/events
 * Real-time Server-Sent Events stream for job progress & status updates
 */
router.get('/:id/events', async (req: Request, res: Response): Promise<void> => {
  const jobId = req.params.id;
  const job = await JobRepository.findByJobId(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  sseManager.register(jobId, res);

  // If already completed or failed, emit current state immediately
  if (job.status === 'COMPLETED') {
    sseManager.broadcast(jobId, 'complete', {
      jobId,
      status: job.status,
      progress: 100,
      stems: job.stems,
      job,
    });
  } else if (job.status === 'FAILED') {
    sseManager.broadcast(jobId, 'error', {
      jobId,
      error: job.errorMessage || 'Job failed',
    });
  }
});

export default router;
