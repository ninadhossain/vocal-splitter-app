'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Package } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Layers,
  Cpu,
  Clock,
  AudioWaveform,
  HelpCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const FALLBACK_PACKAGES: Package[] = [
  {
    id: 'pkg_free',
    name: 'Free Starter',
    slug: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Perfect for quick vocal removal and testing AI stem separation.',
    trackLimit: 5,
    maxDuration: 180,
    allowedModes: ['2-stem'],
    features: [
      '5 Track Separations / month',
      'Vocal Remover (Vocals & Instrumental)',
      'Up to 3-minute audio length',
      'Standard Multi-threaded CPU Queue',
      '16-bit 44.1kHz Stereo WAV Exports',
      'Web Multi-Track Waveform Audition',
    ],
    badge: 'FREE FOREVER',
    isActive: true,
    isPopular: false,
  },
  {
    id: 'pkg_pro',
    name: 'Creator Pro',
    slug: 'pro',
    priceMonthly: 15,
    priceYearly: 144, // $12/mo
    description: 'For musicians, DJs, producers, and audio engineers who need full 4-stem isolation.',
    trackLimit: 50,
    maxDuration: 600,
    allowedModes: ['2-stem', '4-stem'],
    features: [
      '50 Track Separations / month',
      'Full 4-Stem Isolation (Vocals, Drums, Bass, Other)',
      'Up to 10-minute audio length',
      'DirectML GPU Accelerated Priority Queue',
      '24-bit Lossless Studio WAV & ZIP Bundle',
      'Synchronized Multi-Track DAW with Pan & Solo',
      'AI Musical Key, BPM & Energy Analysis',
    ],
    badge: 'MOST POPULAR',
    isActive: true,
    isPopular: true,
  },
  {
    id: 'pkg_studio',
    name: 'Studio Mastering',
    slug: 'studio',
    priceMonthly: 39,
    priceYearly: 374, // $31/mo
    description: 'Unlimited high-throughput neural processing for record labels, studios, and heavy creators.',
    trackLimit: -1,
    maxDuration: 1800,
    allowedModes: ['2-stem', '4-stem', '6-stem'],
    features: [
      'Unlimited Track Separations',
      '2-Stem, 4-Stem & 6-Stem (Guitar & Piano extraction)',
      'Up to 30-minute full DJ sets / podcasts',
      'Dedicated Cloud A100 Ultra-Fast VIP Queue',
      '32-bit Float Pristine Master Quality',
      'Direct DAW Integration & Batch Processing',
      'Priority 24/7 Support & Early Access to Models',
    ],
    badge: 'VIP STUDIO',
    isActive: true,
    isPopular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, refreshUser } = useAuth();
  const [packages, setPackages] = useState<Package[]>(FALLBACK_PACKAGES);
  const [isYearly, setIsYearly] = useState(false);
  const [subscribingSlug, setSubscribingSlug] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/packages`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPackages(data);
        }
      })
      .catch(() => {});
  }, [API_BASE_URL]);

  const handleSubscribe = async (pkg: Package) => {
    if (!isAuthenticated) {
      router.push(`/auth/signup?plan=${pkg.slug}`);
      return;
    }

    setSubscribingSlug(pkg.slug);
    setActionMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/packages/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageSlug: pkg.slug,
          billingCycle: isYearly ? 'yearly' : 'monthly',
        }),
      });

      const data = await res.json();
      setSubscribingSlug(null);

      if (res.ok) {
        setActionMessage(`Successfully upgraded to ${pkg.name}!`);
        await refreshUser();
      } else {
        setActionMessage(data.error || 'Failed to update plan.');
      }
    } catch (err: any) {
      setSubscribingSlug(null);
      setActionMessage(err.message || 'Connection error');
    }
  };

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col text-slate-100 font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-violet-600/15 to-transparent blur-3xl pointer-events-none" />

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Studio-Grade Neural Processing Plans</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-sans">
            Simple, Transparent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">
              Audio AI Pricing
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Extract high-fidelity vocals and isolated stems powered by Meta Demucs v4.
            Choose the plan that fits your production workflow. Cancel or upgrade anytime.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center pt-4">
            <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setIsYearly(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  !isYearly
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setIsYearly(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isYearly
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Yearly Billing</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 font-extrabold uppercase">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className="p-3 bg-cyan-950/70 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 max-w-md mx-auto">
              {actionMessage}
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 mb-20">
          {packages.map((pkg) => {
            const isCurrentPlan = user?.packageSlug === pkg.slug;
            const price = isYearly
              ? pkg.priceYearly === 0
                ? 0
                : Math.round(pkg.priceYearly / 12)
              : pkg.priceMonthly;

            return (
              <div
                key={pkg.id || pkg.slug}
                className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                  pkg.isPopular
                    ? 'bg-gradient-to-b from-[#131B33] to-[#0F172A] border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/10 scale-105 z-10'
                    : 'bg-[#0F172A]/80 border border-white/10 hover:border-white/20'
                }`}
              >
                {/* Popular / Badge Tag */}
                {pkg.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-mono font-extrabold tracking-wider uppercase shadow-md ${
                        pkg.isPopular
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-cyan-500/30'
                          : 'bg-violet-950 border border-violet-500/40 text-violet-300'
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{pkg.name}</h3>
                    {pkg.slug === 'studio' && <Cpu className="w-5 h-5 text-amber-400" />}
                    {pkg.slug === 'pro' && <Zap className="w-5 h-5 text-cyan-400" />}
                  </div>

                  <p className="text-xs text-slate-400 min-h-[36px] leading-relaxed mb-6">
                    {pkg.description}
                  </p>

                  {/* Price display */}
                  <div className="flex items-baseline space-x-1.5 mb-6">
                    <span className="text-4xl font-extrabold text-white">${price}</span>
                    <span className="text-xs text-slate-400 font-medium">
                      / month {isYearly && pkg.priceYearly > 0 ? `(billed $${pkg.priceYearly}/yr)` : ''}
                    </span>
                  </div>

                  {/* Key Metrics Pill */}
                  <div className="grid grid-cols-2 gap-2 mb-6 p-3 bg-slate-900/60 rounded-xl border border-white/5 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Track Limit:</span>
                      <span className="font-bold text-white font-mono">
                        {pkg.trackLimit === -1 ? 'Unlimited' : `${pkg.trackLimit} / mo`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Max Duration:</span>
                      <span className="font-bold text-white font-mono">
                        {Math.round(pkg.maxDuration / 60)} mins
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 mb-8">
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      What&apos;s Included:
                    </p>
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA Button */}
                <div>
                  {isCurrentPlan ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 bg-slate-800 text-slate-400 font-bold text-xs rounded-xl border border-white/10 cursor-default"
                    >
                      ✓ Your Current Active Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSubscribe(pkg)}
                      disabled={subscribingSlug === pkg.slug}
                      className={`w-full py-3.5 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98 ${
                        pkg.isPopular
                          ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-cyan-500/25'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      }`}
                    >
                      {subscribingSlug === pkg.slug ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating Plan...</span>
                        </>
                      ) : (
                        <>
                          <span>{isAuthenticated ? `Switch to ${pkg.name}` : `Get Started with ${pkg.name}`}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="bg-[#0F172A]/80 border border-white/10 rounded-3xl p-8 mb-20">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-2xl font-bold text-white tracking-tight">Full Feature Comparison</h3>
            <p className="text-xs text-slate-400 mt-1">
              Compare features across all SonicSplit AI isolation tiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4">Free Starter</th>
                  <th className="py-3 px-4 text-cyan-400">Creator Pro</th>
                  <th className="py-3 px-4 text-violet-400">Studio Mastering</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Monthly Track Separations</td>
                  <td className="py-3.5 px-4 font-mono">5 Tracks</td>
                  <td className="py-3.5 px-4 font-mono text-cyan-300 font-bold">50 Tracks</td>
                  <td className="py-3.5 px-4 font-mono text-violet-300 font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Max Single Track Duration</td>
                  <td className="py-3.5 px-4">3 Minutes</td>
                  <td className="py-3.5 px-4 text-cyan-300">10 Minutes</td>
                  <td className="py-3.5 px-4 text-violet-300">30 Minutes</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Neural Model Modes</td>
                  <td className="py-3.5 px-4">2-Stem (Vocal Remover)</td>
                  <td className="py-3.5 px-4 text-cyan-300">2-Stem & 4-Stem (Drums, Bass)</td>
                  <td className="py-3.5 px-4 text-violet-300">2-Stem, 4-Stem & 6-Stem (Guitar/Piano)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Audio Resolution / Export</td>
                  <td className="py-3.5 px-4">16-bit 44.1kHz WAV</td>
                  <td className="py-3.5 px-4">24-bit Lossless Studio WAV</td>
                  <td className="py-3.5 px-4">32-bit Float Pristine Master WAV</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Processing Queue</td>
                  <td className="py-3.5 px-4">Standard CPU Multi-Core</td>
                  <td className="py-3.5 px-4 text-cyan-300 font-bold">DirectML GPU Priority</td>
                  <td className="py-3.5 px-4 text-violet-300 font-bold">Dedicated A100 VIP GPU</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">AI Key, BPM & Lyrics Analysis</td>
                  <td className="py-3.5 px-4 text-slate-500">—</td>
                  <td className="py-3.5 px-4"><Check className="w-4 h-4 text-cyan-400" /></td>
                  <td className="py-3.5 px-4"><Check className="w-4 h-4 text-violet-400" /></td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">DAW Mixer with Stereo Pan & Solo</td>
                  <td className="py-3.5 px-4"><Check className="w-4 h-4 text-emerald-400" /></td>
                  <td className="py-3.5 px-4"><Check className="w-4 h-4 text-cyan-400" /></td>
                  <td className="py-3.5 px-4"><Check className="w-4 h-4 text-violet-400" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white tracking-tight">Frequently Asked Questions</h3>
            <p className="text-xs text-slate-400 mt-1">Everything you need to know about SonicSplit AI.</p>
          </div>

          <div className="space-y-4 text-xs">
            {[
              {
                q: 'What is Meta Demucs v4 and how does it separate audio?',
                a: 'Demucs v4 is a deep neural network developed by Meta AI Research. It uses a hybrid architecture that processes time-domain waveforms and frequency-domain spectrograms simultaneously, producing isolated vocals, drums, bass, and instrumental tracks with minimal phase distortion.',
              },
              {
                q: 'Can I cancel or change my plan at any time?',
                a: 'Yes, you can upgrade, downgrade, or cancel your active subscription directly from your user dashboard at any time without penalties.',
              },
              {
                q: 'What audio file formats are supported for upload?',
                a: 'SonicSplit AI accepts MP3, WAV, FLAC, AAC, M4A, OGG, and AIFF files up to 100MB in size.',
              },
              {
                q: 'How does DirectML GPU acceleration work on Windows?',
                a: 'Our inference worker utilizes ONNX Runtime with DirectML execution providers, leveraging DirectX 12 hardware acceleration across NVIDIA GeForce, AMD Radeon, and Intel Arc GPUs.',
              },
            ].map((faq, i) => (
              <div key={i} className="p-5 bg-[#0F172A] border border-white/5 rounded-2xl space-y-1.5">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-slate-400 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#070A12] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400 font-medium">SonicSplit AI • Meta Demucs v4</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-slate-300 transition-colors">Studio</Link>
            <Link href="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
            <Link href="/auth/signin" className="hover:text-slate-300 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
