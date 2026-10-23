'use client';

import React from 'react';
import { Waves, Cpu, Layers, Mic2, Sparkles, Key } from 'lucide-react';
import { StemMode } from '@/types';

interface HeaderProps {
  mode: StemMode;
  onModeChange: (mode: StemMode) => void;
  isProcessing: boolean;
  onOpenAiSettings: () => void;
  hasCloudKey: boolean;
}

export function Header({
  mode,
  onModeChange,
  isProcessing,
  onOpenAiSettings,
  hasCloudKey,
}: HeaderProps) {
  return (
    <header className="w-full border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/20">
            <Waves className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                SONIC<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">SPLIT</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-medium">
                DEMUCS v4
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal">
              Neural AI Audio Stem & Vocal Extraction Studio
            </p>
          </div>
        </div>

        {/* Mode Selector Pill */}
        <div className="hidden md:flex items-center bg-slate-900/90 p-1.5 rounded-xl border border-white/10 shadow-inner">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onModeChange('2-stem')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              mode === '2-stem'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Vocal Remover (2 Stems)</span>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onModeChange('4-stem')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              mode === '4-stem'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25'
                : 'text-slate-400 hover:text-slate-200'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Splitter AI (4 Stems)</span>
          </button>
        </div>

        {/* AI Engine & API Key Action Button */}
        <div className="flex items-center space-x-3 text-xs">
          <button
            type="button"
            onClick={onOpenAiSettings}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border transition-all duration-200 active:scale-95 ${
              hasCloudKey
                ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800/80 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-xs">
              {hasCloudKey ? 'AI Cloud Key: Active' : 'Set AI API Key'}
            </span>
            {hasCloudKey && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          {/* Engine Status */}
          <div className="hidden sm:flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-full text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-medium">Engine: Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
