'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Waves, Lock, KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const initialPin = searchParams.get('pin') || '';

  const [token, setToken] = useState(initialToken);
  const [pinCode, setPinCode] = useState(initialPin);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token || undefined,
          pinCode: pinCode || undefined,
          newPassword,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Connection error. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md bg-[#0F172A]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 text-cyan-400">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Create New Password</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter the 6-digit verification code sent via SMTP and choose your new password.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-2xl flex items-center space-x-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-5 text-center">
          <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold text-white">Password reset successfully!</span>
          </div>
          <p className="text-xs text-slate-300">
            You can now log in to your account with your newly updated credentials.
          </p>
          <Link
            href="/auth/signin"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              6-Digit Recovery PIN or Token
            </label>
            <input
              type="text"
              required
              value={pinCode || token}
              onChange={(e) => {
                setPinCode(e.target.value);
                setToken(e.target.value);
              }}
              placeholder="e.g. 481920"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 px-4 text-center font-mono text-base tracking-widest text-cyan-400 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              New Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 via-violet-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating password...</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-slate-400">
        <Link
          href="/auth/signin"
          className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
        >
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-violet-600/15 to-transparent blur-3xl pointer-events-none" />

      <Link href="/" className="flex items-center space-x-3 mb-6 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
          <Waves className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white font-sans">
          SONIC<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">SPLIT</span> AI
        </span>
      </Link>

      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
