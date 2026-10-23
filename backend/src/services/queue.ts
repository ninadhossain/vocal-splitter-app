import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { JobRepository, IJob, IStemInfo, StemMode } from '../models/Job';
import { sseManager } from './sseManager';
import { STEMS_DIR, WORKER_DIR } from '../config/storage';
import { separateAudioWithFFmpeg } from './dspSplitter';
import { separateWithReplicateDemucs } from './replicateDemucs';
import { analyzeAudioWithOpenAI } from './openAiService';

export const STEM_METADATA: Record<string, { name: string; color: string }> = {
  vocals: { name: 'Vocals', color: '#06B6D4' },      // Cyan
  no_vocals: { name: 'Instrumental', color: '#10B981' }, // Emerald
  drums: { name: 'Drums', color: '#F59E0B' },        // Amber
  bass: { name: 'Bass', color: '#8B5CF6' },          // Purple
  other: { name: 'Other / Guitars', color: '#EC4899' }, // Pink
};

class SeparationQueue {
  private queue: string[] = [];
  private isProcessing = false;

  public async enqueue(jobId: string): Promise<void> {
    this.queue.push(jobId);
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const jobId = this.queue.shift()!;

    try {
      await this.runJob(jobId);
    } catch (err: any) {
      console.error(`[Queue] Failed processing job ${jobId}:`, err);
      await JobRepository.update(jobId, {
        status: 'FAILED',
        errorMessage: err.message || 'Separation failed',
      });
      sseManager.broadcast(jobId, 'error', { jobId, error: err.message });
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }

  private async runJob(jobId: string): Promise<void> {
    const job = await JobRepository.findByJobId(jobId);
    if (!job) return;

    console.log(`[Queue] Starting separation for job ${jobId} (Mode: ${job.mode}, Input: ${job.inputFilePath})`);
    await JobRepository.update(jobId, {
      status: 'PROCESSING',
      progress: 5,
      currentStep: 'Analyzing Audio Spectrogram',
    });
    sseManager.broadcast(jobId, 'progress', {
      jobId,
      status: 'PROCESSING',
      progress: 5,
      step: 'Analyzing Audio Spectrogram',
    });

    const jobStemsDir = path.join(STEMS_DIR, jobId);
    if (!fs.existsSync(jobStemsDir)) {
      fs.mkdirSync(jobStemsDir, { recursive: true });
    }

    // Check if Cloud Neural AI (Replicate Demucs v4) API token is provided
    let successWithCloudAI = false;
    if (job.apiToken && job.inputFilePath && fs.existsSync(job.inputFilePath)) {
      try {
        console.log(`[Queue] Routing job ${jobId} to Cloud Demucs v4 on NVIDIA A100 GPU...`);
        await separateWithReplicateDemucs(
          job.inputFilePath,
          jobStemsDir,
          job.mode,
          job.apiToken,
          async (prog, stepText) => {
            await JobRepository.update(job.jobId, { progress: prog, currentStep: stepText });
            sseManager.broadcast(job.jobId, 'progress', {
              jobId: job.jobId,
              status: 'PROCESSING',
              progress: prog,
              step: stepText,
            });
          }
        );
        successWithCloudAI = true;
      } catch (err: any) {
        console.error(`[Queue] Cloud Demucs AI error (${err.message}). Switching to local engine.`);
      }
    }

    if (!successWithCloudAI) {
      // Try executing local Python Demucs worker
      let successWithPython = false;
      try {
        successWithPython = await this.tryExecutePythonWorker(job, jobStemsDir);
      } catch (err: any) {
        console.warn(`[Queue] Python worker could not execute (${err.message}). Using acoustic DSP engine.`);
      }

      if (!successWithPython) {
        // Fallback to real acoustic DSP stem engine on user's original file
        await this.runDspFallback(job, jobStemsDir);
      }
    }

    // If OpenAI API key is provided, run lyrics and harmonic mastering analysis
    if (job.openAiKey && job.inputFilePath && fs.existsSync(job.inputFilePath)) {
      analyzeAudioWithOpenAI(job.inputFilePath, job.openAiKey)
        .then((analysis) => {
          JobRepository.update(job.jobId, { aiAnalysis: analysis });
        })
        .catch(() => {});
    }

    // Gather output stems
    const stemFiles = fs.readdirSync(jobStemsDir).filter((f) => f.endsWith('.wav') || f.endsWith('.mp3'));
    const stemsMap: Record<string, IStemInfo> = {};

    for (const file of stemFiles) {
      const stemKey = path.basename(file, path.extname(file));
      const meta = STEM_METADATA[stemKey] || { name: stemKey.toUpperCase(), color: '#3B82F6' };
      const filePath = path.join(jobStemsDir, file);
      const stat = fs.statSync(filePath);

      stemsMap[stemKey] = {
        name: meta.name,
        stemKey,
        filePath,
        url: `/api/stems/${jobId}/${stemKey}`,
        format: path.extname(file).replace('.', ''),
        color: meta.color,
        fileSize: stat.size,
      };
    }

    const completedJob = await JobRepository.update(jobId, {
      status: 'COMPLETED',
      progress: 100,
      currentStep: 'Stem Separation Complete',
      stems: stemsMap,
      completedAt: new Date(),
    });

    console.log(`[Queue] Job ${jobId} completed successfully with ${Object.keys(stemsMap).length} stems.`);
    sseManager.broadcast(jobId, 'complete', {
      jobId,
      status: 'COMPLETED',
      progress: 100,
      stems: stemsMap,
      job: completedJob,
    });
  }

  private tryExecutePythonWorker(job: IJob, outputDir: string): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonScript = path.join(WORKER_DIR, 'worker.py');
      if (!fs.existsSync(pythonScript)) {
        console.warn(`[Queue] worker.py not found at ${pythonScript}`);
        return resolve(false);
      }

      const inputAudio = job.inputFilePath || '';
      if (!inputAudio || !fs.existsSync(inputAudio)) {
        console.warn(`[Queue] Input audio file not found at ${inputAudio}`);
        return resolve(false);
      }

      // Check if portable python environment exists
      const portablePy = path.join(WORKER_DIR, 'python_env', 'python.exe');
      const pythonBin = fs.existsSync(portablePy) ? portablePy : 'python';

      console.log(`[Queue] Launching Meta Demucs v4 Neural Worker using: ${pythonBin}`);

      const py = spawn(pythonBin, [
        pythonScript,
        '--job-id', job.jobId,
        '--input', inputAudio,
        '--output-dir', outputDir,
        '--mode', job.mode,
      ]);

      // 10-minute timeout for neural model inference
      const timeoutHandle = setTimeout(() => {
        console.warn(`[Queue] Python worker timed out after 10 minutes`);
        try {
          py.kill();
        } catch {}
        resolve(false);
      }, 600000);

      py.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.progress !== undefined) {
              JobRepository.update(job.jobId, {
                progress: parsed.progress,
                currentStep: parsed.step || 'Demucs Neural Separation',
              });
              sseManager.broadcast(job.jobId, 'progress', {
                jobId: job.jobId,
                status: 'PROCESSING',
                progress: parsed.progress,
                step: parsed.step,
              });
            }
          } catch {
            console.log(`[PythonWorker] ${trimmed}`);
          }
        }
      });

      py.stderr.on('data', (data) => {
        console.error(`[PythonWorker ERR] ${data.toString()}`);
      });

      py.on('error', (err) => {
        clearTimeout(timeoutHandle);
        console.error(`[PythonWorker Spawn Error] ${err.message}`);
        resolve(false);
      });

      py.on('close', (code) => {
        clearTimeout(timeoutHandle);
        console.log(`[PythonWorker] Process exited with code ${code}`);
        resolve(code === 0);
      });
    });
  }

  private async runDspFallback(job: IJob, outputDir: string): Promise<void> {
    const inputAudio = job.inputFilePath;
    if (!inputAudio || !fs.existsSync(inputAudio)) {
      throw new Error(`Input audio file not found on server: ${inputAudio}`);
    }

    await separateAudioWithFFmpeg(inputAudio, outputDir, job.mode, async (prog, stepText) => {
      await JobRepository.update(job.jobId, {
        progress: prog,
        currentStep: stepText,
      });
      sseManager.broadcast(job.jobId, 'progress', {
        jobId: job.jobId,
        status: 'PROCESSING',
        progress: prog,
        step: stepText,
      });
    });
  }
}

export const separationQueue = new SeparationQueue();
