'use client';

import React from 'react';
import { Cpu, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface ProcessingViewProps {
  progress: number;
  currentStep: string;
  error: string | null;
  onCancel?: () => void;
}

export function ProcessingView({ progress, currentStep, error, onCancel }: ProcessingViewProps) {
  const steps = [
    { label: 'Audio Ingestion & Resampling', threshold: 15 },
    { label: 'Spectrogram STFT Analysis', threshold: 35 },
    { label: 'Demucs Neural Mask Inference', threshold: 75 },
    { label: 'Lossless WAV Resynthesis & Normalization', threshold: 95 },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-12 px-4">
      <div className="glass-panel-glow rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Sound Spectrum Wave Graphic */}
        <div className="flex items-center justify-center space-x-1.5 h-16 mb-6">
          <div className="w-1.5 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-full animate-spectrum-1" />
          <div className="w-1.5 bg-gradient-to-t from-violet-500 to-cyan-300 rounded-full animate-spectrum-2" />
          <div className="w-1.5 bg-gradient-to-t from-fuchsia-500 to-violet-300 rounded-full animate-spectrum-3" />
          <div className="w-1.5 bg-gradient-to-t from-amber-500 to-fuchsia-300 rounded-full animate-spectrum-4" />
          <div className="w-1.5 bg-gradient-to-t from-cyan-500 to-emerald-300 rounded-full animate-spectrum-5" />
          <div className="w-1.5 bg-gradient-to-t from-violet-500 to-cyan-300 rounded-full animate-spectrum-2" />
          <div className="w-1.5 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-full animate-spectrum-1" />
        </div>

        {/* Header Title */}
        <div className="space-y-2 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>Demucs v4 Neural Worker Active</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white">
            Separating Audio Stems
          </h3>
          <p className="text-sm text-slate-300 font-mono">
            {currentStep || 'Analyzing frequency domain and spectral peaks...'}
          </p>
        </div>

        {/* Big Percentage & Progress Bar */}
        <div className="space-y-3 mb-8">
          <div className="flex items-end justify-between px-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Neural Processing
            </span>
            <span className="text-3xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">
              {progress}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-900/90 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 transition-all duration-300 ease-out shadow-lg shadow-cyan-500/30"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
        </div>

        {/* Pipeline Step Checklist */}
        <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-4 text-left space-y-2.5 mb-6">
          {steps.map((s, idx) => {
            const isCompleted = progress >= s.threshold;
            const isCurrent = progress < s.threshold && (idx === 0 || progress >= steps[idx - 1].threshold);

            return (
              <div
                key={s.label}
                className={`flex items-center justify-between text-xs transition-colors duration-200 ${
                  isCompleted
                    ? 'text-cyan-400 font-medium'
                    : isCurrent
                    ? 'text-white font-semibold'
                    : 'text-slate-500'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                  )}
                  <span>{s.label}</span>
                </div>
                {isCompleted && <span className="font-mono text-[10px] text-cyan-500">Done</span>}
                {isCurrent && <span className="font-mono text-[10px] text-violet-400 animate-pulse">Running</span>}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center justify-center space-x-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-500/20 p-3 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-200 underline decoration-slate-600 transition-colors"
          >
            Cancel job and return to upload
          </button>
        )}
      </div>
    </div>
  );
}
