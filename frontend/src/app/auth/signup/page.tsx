'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Waves, Mail, Lock, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'free';

  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service to continue.');
      return;
    }

    setIsLoading(true);
    const res = await signUp(name, email, password, selectedPlan);
    setIsLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="w-full max-w-md bg-[#0F172A]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Your Account</h2>
        <p className="text-xs text-slate-400 mt-1">
          Join thousands of music producers isolating lossless audio stems with AI.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-2xl flex items-center space-x-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Producer"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@studio.com"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
        </div>

        {/* Selected Package Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Select Initial Tier
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { slug: 'free', label: 'Free', price: '$0' },
              { slug: 'pro', label: 'Creator Pro', price: '$15/mo' },
              { slug: 'studio', label: 'Studio', price: '$39/mo' },
            ].map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setSelectedPlan(p.slug)}
                className={`py-2 px-2.5 rounded-xl text-center border text-xs transition-all ${
                  selectedPlan === p.slug
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold">{p.label}</div>
                <div className="text-[10px] text-cyan-400">{p.price}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Password (min. 6 characters)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Confirm Password
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

        <div className="flex items-center space-x-2 pt-1">
          <input
            id="terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
          />
          <label htmlFor="terms" className="text-xs text-slate-400">
            I agree to the Terms of Service & Privacy Policy
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 via-violet-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Sign Up & Start Separating</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        <span>Already have an account? </span>
        <Link
          href="/auth/signin"
          className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-violet-600/15 to-transparent blur-3xl pointer-events-none" />

      {/* Top Brand Link */}
      <Link href="/" className="flex items-center space-x-3 mb-6 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
          <Waves className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white font-sans">
          SONIC<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">SPLIT</span> AI
        </span>
      </Link>

      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <SignUpContent />
      </Suspense>
    </div>
  );
}
