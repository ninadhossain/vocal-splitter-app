'use client';

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import {
  Mic2,
  Drum,
  Disc3,
  Sliders,
  Volume2,
  VolumeX,
  Download,
  Music2,
  Radio,
} from 'lucide-react';
import { StemInfo, ChannelControlState } from '@/types';

interface ChannelStripProps {
  stem: StemInfo;
  apiBaseUrl: string;
  controlState: ChannelControlState;
  anySoloActive: boolean;
  masterVolume: number;
  currentTime: number;
  duration: number;
  onControlChange: (stemKey: string, updates: Partial<ChannelControlState>) => void;
  onSeekRequested: (time: number) => void;
  onWaveSurferReady: (stemKey: string, ws: WaveSurfer) => void;
}

export function ChannelStrip({
  stem,
  apiBaseUrl,
  controlState,
  anySoloActive,
  masterVolume,
  onControlChange,
  onSeekRequested,
  onWaveSurferReady,
}: ChannelStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine Stem Icon & Semantic Color
  const getStemIcon = () => {
    switch (stem.stemKey) {
      case 'vocals':
        return <Mic2 className="w-4 h-4 text-cyan-400" />;
      case 'drums':
        return <Drum className="w-4 h-4 text-amber-400" />;
      case 'bass':
        return <Disc3 className="w-4 h-4 text-violet-400" />;
      case 'no_vocals':
        return <Music2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Radio className="w-4 h-4 text-pink-400" />;
    }
  };

  // Initialize WaveSurfer for this stem
  useEffect(() => {
    if (!containerRef.current) return;

    const fullAudioUrl = stem.url.startsWith('http')
      ? stem.url
      : `${apiBaseUrl}${stem.url}`;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(148, 163, 184, 0.25)',
      progressColor: stem.color || '#06B6D4',
      cursorColor: '#ffffff',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 60,
      normalize: true,
      url: fullAudioUrl,
    });

    ws.on('ready', () => {
      setIsLoaded(true);
      onWaveSurferReady(stem.stemKey, ws);
    });

    // Handle user clicking directly on the waveform to seek
    ws.on('interaction', (newTime) => {
      onSeekRequested(newTime);
    });

    waveSurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [stem.url, stem.stemKey, stem.color, apiBaseUrl]);

  // Compute and apply actual effective volume
  useEffect(() => {
    if (!waveSurferRef.current || !isLoaded) return;

    let effectiveVol = 0;
    if (anySoloActive) {
      // If any solo is active, only soloed tracks make sound
      effectiveVol = controlState.isSolo ? controlState.volume * masterVolume : 0;
    } else {
      // Normal mute/volume logic
      effectiveVol = controlState.isMuted ? 0 : controlState.volume * masterVolume;
    }

    const safeVol = Math.max(0, Math.min(1.0, Number.isFinite(effectiveVol) ? effectiveVol : 0));
    try {
      waveSurferRef.current.setVolume(safeVol);
    } catch (err) {
      console.warn('Failed to set stem volume:', err);
    }
  }, [controlState.volume, controlState.isMuted, controlState.isSolo, anySoloActive, masterVolume, isLoaded]);

  const toggleMute = () => {
    onControlChange(stem.stemKey, { isMuted: !controlState.isMuted });
  };

  const toggleSolo = () => {
    onControlChange(stem.stemKey, { isSolo: !controlState.isSolo });
  };

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onControlChange(stem.stemKey, { volume: val });
  };

  const handlePanSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onControlChange(stem.stemKey, { pan: val });
  };

  const downloadUrl = stem.url.startsWith('http') ? stem.url : `${apiBaseUrl}${stem.url}`;

  return (
    <div className="relative group bg-[#0F172A]/80 border border-white/10 rounded-2xl p-4 transition-all duration-200 hover:border-white/20 hover:bg-[#0F172A]/95 shadow-md">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* Track Header / Controls Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 flex items-center justify-between border-b md:border-b-0 md:border-r border-white/10 pb-3 md:pb-0 md:pr-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: `${stem.color}15`,
                borderColor: `${stem.color}35`,
              }}
            >
              {getStemIcon()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center space-x-1.5">
                <span>{stem.name}</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {stem.format.toUpperCase()} Lossless
              </span>
            </div>
          </div>

          {/* Solo / Mute Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={toggleMute}
              title={controlState.isMuted ? 'Unmute Channel' : 'Mute Channel'}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                controlState.isMuted
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 border border-white/10'
              }`}
            >
              M
            </button>

            <button
              type="button"
              onClick={toggleSolo}
              title={controlState.isSolo ? 'Disable Solo' : 'Solo Channel'}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                controlState.isSolo
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-1 ring-amber-300 font-extrabold'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 border border-white/10'
              }`}
            >
              S
            </button>
          </div>
        </div>

        {/* Volume & Pan Slider Controls */}
        <div className="hidden lg:flex items-center space-x-4 border-r border-white/10 pr-4">
          {/* Volume */}
          <div className="flex flex-col space-y-1 w-24">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>VOL</span>
              <span>{Math.round(controlState.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={controlState.volume}
              onChange={handleVolumeSlider}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Pan */}
          <div className="flex flex-col space-y-1 w-20">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>PAN</span>
              <span>
                {controlState.pan === 0
                  ? 'C'
                  : controlState.pan < 0
                  ? `L${Math.round(Math.abs(controlState.pan) * 100)}`
                  : `R${Math.round(controlState.pan * 100)}`}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={controlState.pan}
              onChange={handlePanSlider}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Interactive Wavesurfer Waveform Display */}
        <div className="flex-1 min-w-0 relative bg-slate-950/40 rounded-xl p-2 border border-white/5">
          <div ref={containerRef} className="w-full h-[60px]" />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-xl">
              <span className="text-[11px] font-mono text-cyan-400 animate-pulse">
                Rendering stem peaks...
              </span>
            </div>
          )}
        </div>

        {/* Quick Stem Download */}
        <div className="flex items-center justify-end flex-shrink-0 pl-2">
          <a
            href={downloadUrl}
            download={`${stem.name}.wav`}
            title={`Download ${stem.name} WAV`}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WAV</span>
          </a>
        </div>
      </div>
    </div>
  );
}
