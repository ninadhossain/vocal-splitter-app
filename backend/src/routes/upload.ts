import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UPLOADS_DIR } from '../config/storage';
import { JobRepository, StemMode } from '../models/Job';
import { separationQueue } from '../services/queue';
import { generateWavHeader } from '../services/dspSplitter';

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.aiff', '.wma'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format (${ext}). Allowed: ${allowedExts.join(', ')}`));
    }
  },
});

/**
 * POST /api/upload
 * Handles audio file upload and initiates separation job
 */
router.post('/', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided in request.' });
      return;
    }

    const mode: StemMode = (req.body.mode as StemMode) || '4-stem';
    const apiToken = (req.body.apiToken as string) || (req.headers['x-api-token'] as string) || process.env.REPLICATE_API_TOKEN;
    const openAiKey = (req.body.openAiKey as string) || (req.headers['x-openai-key'] as string) || process.env.OPENAI_API_KEY;
    const jobId = uuidv4();

    const job = await JobRepository.create({
      jobId,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      format: path.extname(req.file.originalname).replace('.', '').toLowerCase(),
      inputFilePath: req.file.path,
      mode,
      aiModel: apiToken ? 'demucs-v4-cloud' : (mode === '6-stem' ? 'htdemucs_6s' : 'htdemucs'),
      apiToken,
      openAiKey,
      status: 'QUEUED',
      progress: 0,
      currentStep: 'Uploaded & Queued',
    });

    // Enqueue separation process
    separationQueue.enqueue(jobId);

    res.status(201).json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      originalFileName: job.originalFileName,
      mode: job.mode,
      aiModel: job.aiModel,
    });
  } catch (err: any) {
    console.error('[Upload] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to process audio upload.' });
  }
});

/**
 * POST /api/upload/sample
 * Instant demo track loader so users can test immediately without uploading their own file!
 */
router.post('/sample', async (req: Request, res: Response): Promise<void> => {
  try {
    const mode: StemMode = (req.body.mode as StemMode) || '4-stem';
    const sampleName = req.body.sampleName || 'Neon Dreams - Electro Funk (Demo).wav';
    const jobId = uuidv4();

    // Create a demo audio file in storage/uploads if needed
    const samplePath = path.join(UPLOADS_DIR, `demo-${jobId}.wav`);
    if (!fs.existsSync(samplePath)) {
      const header = generateWavHeader(44100 * 2 * 2 * 15); // 15s mock buffer
      fs.writeFileSync(samplePath, header);
    }

    const job = await JobRepository.create({
      jobId,
      originalFileName: sampleName,
      fileSize: 2646044,
      format: 'wav',
      inputFilePath: samplePath,
      mode,
      aiModel: 'htdemucs',
      status: 'QUEUED',
      progress: 0,
      currentStep: 'Loaded demo sample',
    });

    separationQueue.enqueue(jobId);

    res.status(201).json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      originalFileName: job.originalFileName,
      mode: job.mode,
      aiModel: job.aiModel,
    });
  } catch (err: any) {
    console.error('[Upload Sample] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to load sample audio.' });
  }
});

export default router;
