import fs from 'fs';
import path from 'path';
import Replicate from 'replicate';

interface StemUrls {
  vocals?: string;
  drums?: string;
  bass?: string;
  other?: string;
  no_vocals?: string;
  [key: string]: string | undefined;
}

/**
 * Runs Meta Demucs v4 on Cloud NVIDIA A100 GPU via Replicate API.
 * Produces studio-grade neural AI separated stems (Vocals, Drums, Bass, Other).
 */
export async function separateWithReplicateDemucs(
  inputAudioPath: string,
  outputDir: string,
  mode: '2-stem' | '4-stem' | '6-stem',
  apiToken: string,
  onProgress: (pct: number, step: string) => void
): Promise<string[]> {
  onProgress(15, 'Authenticating with Demucs v4 Cloud Engine...');
  const replicate = new Replicate({ auth: apiToken });

  if (!fs.existsSync(inputAudioPath)) {
    throw new Error(`Input audio file not found: ${inputAudioPath}`);
  }

  const stat = fs.statSync(inputAudioPath);
  console.log(`[ReplicateDemucs] Reading audio file (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);
  onProgress(25, 'Encoding & Transmitting Audio to Cloud AI GPU (NVIDIA A100)...');

  const audioBuffer = fs.readFileSync(inputAudioPath);
  const ext = path.extname(inputAudioPath).replace('.', '').toLowerCase() || 'mp3';
  const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'flac' ? 'audio/flac' : 'audio/mpeg';
  const dataUri = `data:${mimeType};base64,${audioBuffer.toString('base64')}`;

  const inputParams: any = {
    audio: dataUri,
    mp3: false, // Request lossless WAV stems
  };

  if (mode === '2-stem') {
    inputParams.two_stems = 'vocals';
  }

  onProgress(45, 'Meta Demucs v4 Neural Inference in progress on Cloud GPU (A100)...');

  // cjwbw/demucs v4 model version on Replicate
  const output = (await replicate.run(
    'cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953',
    { input: inputParams }
  )) as StemUrls;

  onProgress(80, 'Neural separation finished! Downloading isolated stems...');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const createdFiles: string[] = [];
  const entries = Object.entries(output);

  for (let i = 0; i < entries.length; i++) {
    const [rawKey, url] = entries[i];
    if (!url) continue;

    // Normalize stem key
    let stemKey = rawKey.toLowerCase();
    if (stemKey === 'accompaniment' || stemKey === 'no_vocal') {
      stemKey = 'no_vocals';
    }

    const progressPct = 80 + Math.round(((i + 1) / entries.length) * 18);
    onProgress(progressPct, `Downloading ${stemKey.toUpperCase()} stem...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download stem ${stemKey} from cloud (${response.statusText})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const targetFile = path.join(outputDir, `${stemKey}.wav`);
    fs.writeFileSync(targetFile, Buffer.from(arrayBuffer));
    createdFiles.push(targetFile);
  }

  onProgress(100, 'Cloud Neural Separation Completed Successfully');
  return createdFiles;
}
