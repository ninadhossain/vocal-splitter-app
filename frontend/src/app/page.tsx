'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Dropzone } from '@/components/Dropzone';
import { ProcessingView } from '@/components/ProcessingView';
import { MultiTrackPlayer } from '@/components/MultiTrackPlayer';
import { AiKeyModal } from '@/components/AiKeyModal';
import { useJobSSE } from '@/hooks/useJobSSE';
import { StemMode } from '@/types';
import {
  Layers,
  Cpu,
  Sliders,
  AudioWaveform,
  Zap,
  ShieldCheck,
  Music4,
  DownloadCloud,
} from 'lucide-react';

export default function Home() {
  const [mode, setMode] = useState<StemMode>('4-stem');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [hasCloudKey, setHasCloudKey] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const repKey = localStorage.getItem('SONIC_REPLICATE_KEY');
      const openKey = localStorage.getItem('SONIC_OPENAI_KEY');
      setHasCloudKey(Boolean(repKey || openKey));
    }
  }, []);

  const refreshKeys = () => {
    if (typeof window !== 'undefined') {
      const repKey = localStorage.getItem('SONIC_REPLICATE_KEY');
      const openKey = localStorage.getItem('SONIC_OPENAI_KEY');
      setHasCloudKey(Boolean(repKey || openKey));
    }
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const { job, progress, currentStep, isProcessing, isComplete, error } = useJobSSE(
    activeJobId,
    API_BASE_URL
  );

  const handleReset = () => {
    setActiveJobId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B14]">
      {/* Studio Header */}
      <Header
        mode={mode}
        onModeChange={setMode}
        isProcessing={isProcessing}
        onOpenAiSettings={() => setIsAiModalOpen(true)}
        hasCloudKey={hasCloudKey}
      />

      {/* AI Key Settings Modal */}
      <AiKeyModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onKeysSaved={refreshKeys}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Ambient Gradient Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-cyan-600/10 via-violet-600/10 to-transparent blur-3xl pointer-events-none" />

        {/* Dynamic State Rendering */}
        {isProcessing ? (
          <ProcessingView
            progress={progress}
            currentStep={currentStep}
            error={error}
            onCancel={handleReset}
          />
        ) : isComplete && job ? (
          <MultiTrackPlayer
            job={job}
            apiBaseUrl={API_BASE_URL}
            onReset={handleReset}
          />
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Hero Headline */}
            <div className="text-center max-w-3xl mx-auto mt-6 mb-8 space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/25 text-cyan-300 text-xs font-mono">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next-Gen Audio AI Architecture</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-sans">
                Separate Any Track into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">
                  Lossless Stems
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
                Meta Hybrid Demucs v4 neural models run locally or on Cloud A100 GPUs.
                Isolate vocals, drums, bass, and instruments with studio-grade fidelity.
              </p>
            </div>

            {/* Dropzone Upload Area */}
            <Dropzone
              onJobStarted={(jobId) => setActiveJobId(jobId)}
              mode={mode}
              apiBaseUrl={API_BASE_URL}
              onOpenAiSettings={() => setIsAiModalOpen(true)}
              hasCloudKey={hasCloudKey}
            />

            {/* Feature Highlights Grid */}
            <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 px-4">
              <div className="glass-panel rounded-2xl p-6 space-y-3 border border-white/5 hover:border-cyan-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Demucs v4 Hybrid Architecture
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Processes both time-domain waveforms and frequency-domain spectrograms simultaneously for ultra-clean separation without phase artifacts.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-6 space-y-3 border border-white/5 hover:border-violet-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <AudioWaveform className="w-5 h-5 text-violet-400" />
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Synchronized Multi-Track DAW
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive Wavesurfer.js waveforms with per-stem Solo, Mute, Volume, and Stereo Pan controls for real-time mastering and stem auditioning.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-6 space-y-3 border border-white/5 hover:border-fuchsia-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center">
                  <DownloadCloud className="w-5 h-5 text-fuchsia-400" />
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Lossless WAV & ZIP Exports
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download individual isolated stems or stream a consolidated ZIP archive containing all stems ready to drag straight into your favorite DAW.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#070A12] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400 font-medium">SonicSplit AI • Meta Demucs v4 + Wavesurfer.js</span>
          </div>
          <p className="text-slate-500">
            Powered by Next.js App Router, Express API Gateway & MongoDB
          </p>
        </div>
      </footer>
    </div>
  );
}
