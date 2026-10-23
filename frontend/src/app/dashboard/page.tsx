'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Crown,
  Layers,
  Clock,
  AudioWaveform,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  Sparkles,
} from 'lucide-react';

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
    if (user) {
      setNewName(user.name);
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          password: newPassword || undefined,
        }),
      });

      const data = await res.json();
      setIsUpdating(false);

      if (res.ok) {
        setFeedback({ type: 'success', message: 'Profile updated successfully.' });
        setNewPassword('');
        refreshUser();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update profile.' });
      }
    } catch (err: any) {
      setIsUpdating(false);
      setFeedback({ type: 'error', message: err.message || 'Connection error' });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const pkg = user.packageDetails;
  const trackLimit = pkg?.trackLimit ?? (user.packageSlug === 'studio' ? -1 : user.packageSlug === 'pro' ? 50 : 5);
  const used = user.separationsThisMonth || 0;
  const pct = trackLimit === -1 ? 100 : Math.min(100, Math.round((used / trackLimit) * 100));

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col text-slate-100 font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Welcome, {user.name}
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                {user.email} • Role: <span className="uppercase text-cyan-400">{user.role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Go to Studio</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Package Card */}
          <div className="lg:col-span-2 bg-[#0F172A]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <Crown className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Current Active Package</h2>
              </div>
              <span
                className={`text-xs font-mono font-extrabold px-3 py-1 rounded-full uppercase ${
                  user.packageSlug === 'studio'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : user.packageSlug === 'pro'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {pkg?.name || user.packageSlug.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              {pkg?.description ||
                'High-fidelity Demucs neural separation with lossless WAV & ZIP exports.'}
            </p>

            {/* Quota Usage Bar */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-white/5 space-y-3 mb-6">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Monthly Separation Usage:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {used} / {trackLimit === -1 ? '∞ Unlimited' : `${trackLimit} tracks`}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${trackLimit === -1 ? 100 : pct}%` }}
                />
              </div>
            </div>

            {/* Plan Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-1">Max Track Length</span>
                <span className="font-bold text-white font-mono">
                  {pkg?.maxDuration ? `${Math.round(pkg.maxDuration / 60)} Minutes` : '10 Minutes'}
                </span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-1">Processing Queue</span>
                <span className="font-bold text-cyan-400 font-mono">
                  {user.packageSlug === 'free' ? 'Standard CPU' : 'DirectML GPU Priority'}
                </span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-1">Allowed Modes</span>
                <span className="font-bold text-violet-300 font-mono">
                  {pkg?.allowedModes?.join(', ') || '2-stem, 4-stem'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <p className="text-xs text-slate-500">
                Want longer durations or dedicated GPU clusters?
              </p>
              <Link
                href="/pricing"
                className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                <span>Upgrade Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Profile Settings Card */}
          <div className="bg-[#0F172A]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center space-x-2.5 mb-4">
              <Settings className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Account Settings</h2>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 border ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 px-3 text-xs text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Change Password (Optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
