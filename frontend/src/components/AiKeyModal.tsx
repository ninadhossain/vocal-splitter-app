'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Sparkles, ExternalLink, Check, AlertCircle, Shield } from 'lucide-react';

interface AiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysSaved?: () => void;
}

export function AiKeyModal({ isOpen, onClose, onKeysSaved }: AiKeyModalProps) {
  const [replicateKey, setReplicateKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReplicateKey(localStorage.getItem('SONIC_REPLICATE_KEY') || '');
      setOpenAiKey(localStorage.getItem('SONIC_OPENAI_KEY') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      if (replicateKey.trim()) {
        localStorage.setItem('SONIC_REPLICATE_KEY', replicateKey.trim());
      } else {
        localStorage.removeItem('SONIC_REPLICATE_KEY');
      }

      if (openAiKey.trim()) {
        localStorage.setItem('SONIC_OPENAI_KEY', openAiKey.trim());
      } else {
        localStorage.removeItem('SONIC_OPENAI_KEY');
      }
    }
    setIsSaved(true);
    onKeysSaved?.();
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('SONIC_REPLICATE_KEY');
      localStorage.removeItem('SONIC_OPENAI_KEY');
    }
    setReplicateKey('');
    setOpenAiKey('');
    onKeysSaved?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl glass-panel-glow rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl text-left space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3.5 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>AI Neural Engine & API Settings</span>
            </h3>
            <p className="text-xs text-slate-400">
              Configure Cloud AI models for pristine, studio-quality stem separation.
            </p>
          </div>
        </div>

        {/* Replicate Demucs v4 Cloud Engine (Primary for Audio Stem Separation) */}
        <div className="space-y-2.5 bg-slate-900/60 p-4 rounded-2xl border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <label className="text-sm font-bold text-cyan-300">
                Replicate API Token (Demucs v4 on A100 GPU)
              </label>
            </div>
            <a
              href="https://replicate.com/account/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1 font-mono"
            >
              <span>Get Token</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Runs Meta&apos;s true <strong>Hybrid Demucs v4</strong> model on cloud NVIDIA A100 GPUs. Produces crystal-clear, isolated stems for Vocals, Drums, Bass, and Other with zero bleeding or phase issues.
          </p>

          <div className="relative">
            <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="r8_********************************"
              value={replicateKey}
              onChange={(e) => setReplicateKey(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* OpenAI GPT-4o-mini & Whisper Engine */}
        <div className="space-y-2.5 bg-slate-900/60 p-4 rounded-2xl border border-violet-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <label className="text-sm font-bold text-violet-300">
                OpenAI API Key (GPT-4o-mini & Whisper)
              </label>
            </div>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-violet-400 hover:underline flex items-center space-x-1 font-mono"
            >
              <span>Get Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            OpenAI LLMs transcribe full song lyrics and provide track mastering, musical key, and vocal style analysis to accompany your stems.
          </p>

          <div className="relative">
            <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="sk-proj-********************************"
              value={openAiKey}
              onChange={(e) => setOpenAiKey(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-violet-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-400 transition-colors"
            />
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 px-1">
          <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>Keys are stored strictly in your local browser and sent securely only for processing your requests.</span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg"
          >
            Clear Keys
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save & Activate AI</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
