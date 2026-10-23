# SonicSplit AI — AI Audio Stem Separator & Vocal Remover

A production-grade, state-of-the-art AI audio separation studio built with **Next.js App Router**, **Tailwind CSS**, **Wavesurfer.js**, **Node.js Express API Gateway**, **Meta Demucs v4**, and **MongoDB**.

![SonicSplit Studio Screenshot](file:///C:/Users/User/.gemini/antigravity-ide/brain/832c84ce-6ee7-4b21-b821-5d555dc5fedd/multitrack_player.png)

---

## Architecture Overview

```text
[ Next.js App Router (Tailwind CSS + Wavesurfer.js) ]
                      │
           HTTP / Server-Sent Events (SSE)
                      ▼
[ Node.js / Express API Gateway (MongoDB + Multer) ]
                      │
          Message Queue / Background Worker
                      ▼
[ Python AI Engine (Demucs / Hybrid Demucs v4) ]
                      │
               Local / S3 Storage
```

- **Frontend**: Next.js 14+ App Router, Tailwind CSS, Lucide Icons, Wavesurfer.js for multi-track waveform rendering and sample-accurate synchronized playback.
- **Backend API Gateway**: Node.js + Express, Multer audio file upload, MongoDB metadata persistence via Mongoose, real-time Server-Sent Events (SSE) progress broadcasting, HTTP 206 Partial Content Range streaming, dynamic ZIP exporter.
- **AI Worker**: Meta Demucs v4 (`htdemucs` / `htdemucs_6s`) with autonomous acoustic DSP fallback engine for high availability.
- **Database**: MongoDB (Tracks, Processing Jobs, Stem URLs).

---

## Key Features

- **Vocal Remover Mode (2 Stems)**: Isolates `vocals.wav` and backing instrumental `no_vocals.wav`.
- **Stem Splitter Mode (4 Stems)**: Isolates `vocals.wav`, `drums.wav`, `bass.wav`, and `other.wav`.
- **Interactive Multi-Track DAW Mixer**:
  - Sample-accurate synchronized playback across all waveforms.
  - Per-track **Solo (S)** and **Mute (M)** toggling.
  - Per-track Volume Slider (0% - 150%) and Stereo Panning (L100 - R100).
  - High-precision digital timecode counter.
  - Spacebar shortcut for Play/Pause.
  - Consolidated ZIP archive download and individual lossless WAV downloads.
- **Drag & Drop Upload Zone**: Supports MP3, WAV, FLAC, M4A, OGG up to 100MB.
- **Instant Demo Mode**: Test the entire application with one click without uploading a local file.
- **Real-Time SSE Progress**: Live stage checklist, animated spectrum equalizer, and glowing progress bar.

---

## Quick Start

### 1. Install Dependencies
```powershell
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Run Locally (Concurrent Dev Mode)
```powershell
npm run dev
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)

### 3. Run with Docker Compose
```powershell
docker-compose up --build
```

---

## API Endpoints

- `GET /api/health` — API status and directory checks
- `POST /api/upload` — Multipart audio upload (file + mode)
- `POST /api/upload/sample` — Instant demo audio loader
- `GET /api/jobs/:id` — Retrieve job status and stem metadata
- `GET /api/jobs/:id/events` — Server-Sent Events stream for live progress
- `GET /api/stems/:jobId/:stemKey` — Lossless audio stream with HTTP 206 Range support
- `GET /api/stems/:jobId/download-all` — Dynamic multi-stem ZIP archive stream
