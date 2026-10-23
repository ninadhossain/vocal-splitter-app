'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Volume2,
  Download,
  RotateCcw,
  Sparkles,
  Music,
  Share2,
  Sliders,
} from 'lucide-react';
import { Job, StemInfo, ChannelControlState } from '@/types';
import { ChannelStrip } from './ChannelStrip';

interface MultiTrackPlayerProps {
  job: Job;
  apiBaseUrl?: string;
  onReset: () => void;
}

export function MultiTrackPlayer({
  job,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  onReset,
}: MultiTrackPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);

  // Store channel states (volume, pan, mute, solo)
  const [channelStates, setChannelStates] = useState<Record<string, ChannelControlState>>(() => {
    const initial: Record<string, ChannelControlState> = {};
    if (job.stems) {
      Object.keys(job.stems).forEach((key) => {
        initial[key] = {
          volume: 1.0,
          pan: 0,
          isMuted: false,
          isSolo: false,
        };
      });
    }
    return initial;
  });

  const waveSurfersRef = useRef<Record<string, WaveSurfer>>({});
  const primaryKeyRef = useRef<string | null>(null);

  // Is any track currently soloed?
  const anySoloActive = Object.values(channelStates).some((state) => state.isSolo);

  // Format seconds to MM:SS.ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00.00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Register WaveSurfer instance when ready
  const handleWaveSurferReady = useCallback((stemKey: string, ws: WaveSurfer) => {
    waveSurfersRef.current[stemKey] = ws;

    if (!primaryKeyRef.current) {
      primaryKeyRef.current = stemKey;

      ws.on('timeupdate', (t) => {
        setCurrentTime(t);
      });

      ws.on('ready', () => {
        setDuration(ws.getDuration());
      });

      ws.on('finish', () => {
        if (isLooping) {
          handleSeek(0);
          handlePlayAll();
        } else {
          setIsPlaying(false);
        }
      });
    }
  }, [isLooping]);

  // Master Play/Pause toggle
  const togglePlayPause = () => {
    if (isPlaying) {
      handlePauseAll();
    } else {
      handlePlayAll();
    }
  };

  const handlePlayAll = () => {
    Object.values(waveSurfersRef.current).forEach((ws) => {
      try {
        ws.play();
      } catch (err) {
        console.error('Play error:', err);
      }
    });
    setIsPlaying(true);
  };

  const handlePauseAll = () => {
    Object.values(waveSurfersRef.current).forEach((ws) => {
      try {
        ws.pause();
      } catch (err) {
        console.error('Pause error:', err);
      }
    });
    setIsPlaying(false);
  };

  const handleStopAll = () => {
    handlePauseAll();
    handleSeek(0);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    Object.values(waveSurfersRef.current).forEach((ws) => {
      try {
        ws.setTime(time);
      } catch (err) {
        console.error('Seek error:', err);
      }
    });
  };

  const handleControlChange = (stemKey: string, updates: Partial<ChannelControlState>) => {
    setChannelStates((prev) => ({
      ...prev,
      [stemKey]: {
        ...prev[stemKey],
        ...updates,
      },
    }));
  };

  // Keyboard shortcut: Spacebar toggles Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const stemsList = Object.values(job.stems || {});
  const zipDownloadUrl = `${apiBaseUrl}/api/stems/${job.jobId}/download-all`;

  return (
    <div className="w-full max-w-6xl mx-auto my-8 px-4 space-y-6">
      {/* Track Information Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <Music className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold tracking-tight text-white truncate max-w-md">
                {job.originalFileName}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono">
                {job.mode.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
              <span>{stemsList.length} Isolated Stems</span>
              <span>•</span>
              <span className="font-mono">{formatTime(duration)}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">Lossless Master</span>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-3 self-stretch md:self-auto justify-end">
          <a
            href={zipDownloadUrl}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all duration-200 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download All Stems (ZIP)</span>
          </a>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New File</span>
          </button>
        </div>
      </div>

      {/* AI Intelligence & Lyrics Card (OpenAI GPT-4o-mini & Whisper) */}
      {job.aiAnalysis && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-violet-500/20 bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h4 className="text-sm font-bold text-violet-300">OpenAI Track Intelligence & Mastering Insights</h4>
            </div>
            {job.aiAnalysis.genre && (
              <span className="px-2.5 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 text-[11px] font-mono">
                {job.aiAnalysis.genre}
              </span>
            )}
          </div>
          {job.aiAnalysis.aiNotes && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-black/30 p-3 rounded-xl border border-white/5">
              💡 {job.aiAnalysis.aiNotes}
            </p>
          )}
          {job.aiAnalysis.lyrics && (
            <details className="text-xs text-slate-400 cursor-pointer">
              <summary className="hover:text-slate-200 transition-colors font-medium">
                View Transcribed Lyrics (Whisper AI)
              </summary>
              <p className="mt-2 text-slate-300 whitespace-pre-wrap font-mono text-[11px] p-3 rounded-xl bg-black/40 border border-white/5 max-h-48 overflow-y-auto">
                {job.aiAnalysis.lyrics}
              </p>
            </details>
          )}
        </div>
      )}

      {/* Master Transport & Playback Control Bar */}
      <div className="glass-panel-glow rounded-3xl p-5 sticky top-24 z-40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Transport Buttons */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-xl shadow-cyan-500/30 transition-transform active:scale-90"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleStopAll}
              title="Stop & Return to Zero"
              className="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-all active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              title={isLooping ? 'Disable Loop' : 'Enable Loop'}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                isLooping
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-slate-800/90 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Precision Digital Timecode Display */}
          <div className="flex items-center space-x-2 bg-slate-950/80 border border-white/10 px-5 py-2.5 rounded-2xl font-mono shadow-inner">
            <span className="text-lg font-bold text-cyan-400 tracking-wider">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-slate-500 font-semibold">/</span>
            <span className="text-xs text-slate-400 font-medium">
              {formatTime(duration)}
            </span>
          </div>

          {/* Master Volume Slider */}
          <div className="flex items-center space-x-3 w-full sm:w-52">
            <Volume2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono text-xs text-slate-400 w-10 text-right">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stem Isolation & Audition Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Isolate Single Stem:</span>
          <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">(Click to solo and audition individual instrument)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stemsList.map((stem) => {
            const isSolo = channelStates[stem.stemKey]?.isSolo;
            return (
              <button
                key={stem.stemKey}
                type="button"
                id={`solo-btn-${stem.stemKey}`}
                onClick={() => {
                  setChannelStates((prev) => {
                    const next: Record<string, ChannelControlState> = {};
                    Object.keys(prev).forEach((key) => {
                      next[key] = {
                        ...prev[key],
                        isSolo: key === stem.stemKey ? !isSolo : false,
                        isMuted: false,
                      };
                    });
                    return next;
                  });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  isSolo
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 ring-2 ring-amber-300 font-extrabold scale-105'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/10'
                }`}
              >
                <span>{stem.name}</span>
                {isSolo && <span className="text-[10px] bg-slate-950 text-amber-300 px-1 py-0.5 rounded font-mono">SOLOED</span>}
              </button>
            );
          })}
          {anySoloActive && (
            <button
              type="button"
              onClick={() => {
                setChannelStates((prev) => {
                  const next: Record<string, ChannelControlState> = {};
                  Object.keys(prev).forEach((key) => {
                    next[key] = { ...prev[key], isSolo: false };
                  });
                  return next;
                });
              }}
              className="px-3 py-1.5 rounded-xl text-xs text-rose-400 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 transition-all font-semibold"
            >
              Reset to Full Mix
            </button>
          )}
        </div>
      </div>

      {/* Stem Channel Strips Container */}
      <div className="space-y-3.5">
        {stemsList.map((stem) => (
          <ChannelStrip
            key={stem.stemKey}
            stem={stem}
            apiBaseUrl={apiBaseUrl}
            controlState={
              channelStates[stem.stemKey] || {
                volume: 1.0,
                pan: 0,
                isMuted: false,
                isSolo: false,
              }
            }
            anySoloActive={anySoloActive}
            masterVolume={masterVolume}
            currentTime={currentTime}
            duration={duration}
            onControlChange={handleControlChange}
            onSeekRequested={handleSeek}
            onWaveSurferReady={handleWaveSurferReady}
          />
        ))}
      </div>
    </div>
  );
}
