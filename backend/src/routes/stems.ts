import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { STEMS_DIR } from '../config/storage';
import { JobRepository } from '../models/Job';

const router = express.Router();

/**
 * GET /api/stems/:jobId/download-all
 * Streams a ZIP archive of all stems for the job
 */
router.get('/:jobId/download-all', async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;
  const job = await JobRepository.findByJobId(jobId);
  const jobStemsDir = path.join(STEMS_DIR, jobId);

  if (!fs.existsSync(jobStemsDir)) {
    res.status(404).json({ error: 'Stem directory not found' });
    return;
  }

  const files = fs.readdirSync(jobStemsDir).filter((f) => f.endsWith('.wav') || f.endsWith('.mp3'));
  if (files.length === 0) {
    res.status(404).json({ error: 'No stem files available to download' });
    return;
  }

  const rawBaseName = job?.originalFileName
    ? path.basename(job.originalFileName, path.extname(job.originalFileName))
    : 'Stems';
  const cleanTrackName = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const zipFileName = `${cleanTrackName}_Demucs_Stems.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

  const archive = archiver('zip', {
    zlib: { level: 6 },
  });

  archive.on('error', (err) => {
    console.error('[Archiver] Error:', err);
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);

  for (const file of files) {
    const fullPath = path.join(jobStemsDir, file);
    archive.file(fullPath, { name: `${cleanTrackName}_${file}` });
  }

  await archive.finalize();
});

/**
 * GET /api/stems/:jobId/:stemKey
 * Streams stem audio with full HTTP 206 Range support for instant audio seeking in Wavesurfer
 */
router.get('/:jobId/:stemKey', async (req: Request, res: Response): Promise<void> => {
  const { jobId, stemKey } = req.params;
  const job = await JobRepository.findByJobId(jobId);

  // Look for stem file (.wav or .mp3)
  const baseStemPath = path.join(STEMS_DIR, jobId, `${stemKey}.wav`);
  const mp3StemPath = path.join(STEMS_DIR, jobId, `${stemKey}.mp3`);

  let targetPath = '';
  let contentType = 'audio/wav';

  if (fs.existsSync(baseStemPath)) {
    targetPath = baseStemPath;
    contentType = 'audio/wav';
  } else if (fs.existsSync(mp3StemPath)) {
    targetPath = mp3StemPath;
    contentType = 'audio/mpeg';
  } else {
    res.status(404).json({ error: `Stem '${stemKey}' not found for job ${jobId}` });
    return;
  }

  const stat = fs.statSync(targetPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(targetPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
    };
    res.writeHead(200, head);
    fs.createReadStream(targetPath).pipe(res);
  }
});

export default router;
