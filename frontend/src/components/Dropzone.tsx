'use client';

import React, { useState, useRef } from 'react';
import { Upload, Music, Sparkles, FileAudio, PlayCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { StemMode } from '@/types';

interface DropzoneProps {
  onJobStarted: (jobId: string) => void;
  mode: StemMode;
  apiBaseUrl?: string;
  onOpenAiSettings: () => void;
  hasCloudKey: boolean;
}

export function Dropzone({
  onJobStarted,
  mode,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  onOpenAiSettings,
  hasCloudKey,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt && !file.type.startsWith('audio/')) {
      setErrorMessage(`Unsupported format. Please select an MP3, WAV, FLAC, M4A, or OGG file.`);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max limit is 100MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('audio', selectedFile);
    formData.append('mode', mode);

    // Read stored API keys from localStorage
    if (typeof window !== 'undefined') {
      const replicateKey = localStorage.getItem('SONIC_REPLICATE_KEY');
      const openAiKey = localStorage.getItem('SONIC_OPENAI_KEY');
      if (replicateKey) formData.append('apiToken', replicateKey);
      if (openAiKey) formData.append('openAiKey', openAiKey);
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start separation job.');
      }

      onJobStarted(data.jobId);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setErrorMessage(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsUploading(true);
    setErrorMessage(null);

    let replicateKey: string | null = null;
    let openAiKey: string | null = null;
    if (typeof window !== 'undefined') {
      replicateKey = localStorage.getItem('SONIC_REPLICATE_KEY');
      openAiKey = localStorage.getItem('SONIC_OPENAI_KEY');
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/upload/sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          sampleName: 'Neon Dreams - Synthwave Demo.wav',
          apiToken: replicateKey || undefined,
          openAiKey: openAiKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load demo sample.');
      }

      onJobStarted(data.jobId);
    } catch (err: any) {
      console.error('Sample Error:', err);
      setErrorMessage(err.message || 'Error loading sample track.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 px-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative overflow-hidden rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-2 border-cyan-400 bg-cyan-950/20 shadow-2xl shadow-cyan-500/20'
            : 'border border-white/10 bg-[#0F172A]/70 hover:border-cyan-500/40 hover:bg-[#0F172A]/90'
        }`}
      >
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
          className="hidden"
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
                <Upload className="w-9 h-9 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Drag & Drop your audio file here
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Or click to browse from your device. Lossless separation powered by Meta Demucs v4 neural models.
              </p>
            </div>

            {/* Badges for formats */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {['WAV', 'MP3', 'FLAC', 'M4A', 'OGG'].map((format) => (
                <span
                  key={format}
                  className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md bg-white/5 border border-white/10 text-slate-300"
                >
                  {format}
                </span>
              ))}
              <span className="text-xs text-slate-500 font-medium ml-1">Up to 100MB</span>
            </div>

            {/* Divider or instant demo */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
              >
                Browse Files
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample();
                }}
                disabled={isUploading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-violet-500/30 text-violet-300 hover:text-white font-semibold text-sm transition-all duration-200 active:scale-95 shadow-md"
              >
                <Sparkles className="w-4 h-4 text-violet-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Try with Demo Audio Track</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-4 bg-slate-900/90 border border-white/15 px-6 py-4 rounded-2xl shadow-xl w-full max-w-lg">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <FileAudio className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{selectedFile.name}</p>
                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>•</span>
                  <span className="uppercase font-mono text-cyan-400">{selectedFile.name.split('.').pop()}</span>
                  <span>•</span>
                  <span className="capitalize text-violet-400">{mode.replace('-', ' ')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1"
              >
                Change
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center space-x-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Uploading & Queuing...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Stems with AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-500/20 px-4 py-2.5 rounded-xl max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* AI Engine Status Strip */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-[#0B0F19]/60 border border-white/5 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Sparkles className={`w-4 h-4 ${hasCloudKey ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} style={{ animationDuration: '6s' }} />
          <span>
            {hasCloudKey ? (
              <span className="text-cyan-300 font-medium">
                Cloud Neural AI Active (Meta Demucs v4 on A100 GPU)
              </span>
            ) : (
              <span className="text-slate-400">
                Want crystal-clear AI separation without audio bleed?
              </span>
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenAiSettings}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-cyan-500/40 hover:decoration-cyan-400 transition-all flex items-center space-x-1"
        >
          <span>{hasCloudKey ? 'Change AI API Key' : 'Configure AI API Key (Demucs / GPT)'}</span>
        </button>
      </div>
    </div>
  );
}
