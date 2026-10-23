'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Waves,
  Layers,
  Mic2,
  Key,
  Shield,
  User as UserIcon,
  LogOut,
  Sparkles,
  LayoutDashboard,
  Crown,
  ChevronDown,
} from 'lucide-react';
import { StemMode } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  mode?: StemMode;
  onModeChange?: (mode: StemMode) => void;
  isProcessing?: boolean;
  onOpenAiSettings?: () => void;
  hasCloudKey?: boolean;
}

export function Header({
  mode = '4-stem',
  onModeChange,
  isProcessing = false,
  onOpenAiSettings,
  hasCloudKey = false,
}: HeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, isSuperadmin, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isStudioPage = pathname === '/';

  return (
    <header className="w-full border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-3.5 group">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Waves className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                SONIC<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">SPLIT</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-medium">
                AI DEMUCS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal hidden sm:block">
              Neural Audio Stem Isolation Studio
            </p>
          </div>
        </Link>

        {/* Global Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
          <Link
            href="/"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              pathname === '/'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Studio
          </Link>
          <Link
            href="/pricing"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              pathname === '/pricing'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Pricing & Plans
          </Link>
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                pathname === '/dashboard'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              My Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-cyan-400 hover:bg-cyan-500/10'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Mode Selector Pill (Only shown on Studio Page) */}
        {isStudioPage && onModeChange && (
          <div className="hidden xl:flex items-center bg-slate-900/90 p-1.5 rounded-xl border border-white/10 shadow-inner">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onModeChange('2-stem')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
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
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                mode === '4-stem'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Splitter AI (4 Stems)</span>
            </button>
          </div>
        )}

        {/* Right Section: Cloud Key + Auth State */}
        <div className="flex items-center space-x-3 text-xs">
          {/* AI Cloud Key Button (Studio) */}
          {onOpenAiSettings && (
            <button
              type="button"
              onClick={onOpenAiSettings}
              className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all duration-200 active:scale-95 ${
                hasCloudKey
                  ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800/80 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-xs">
                {hasCloudKey ? 'AI Key: Active' : 'Set AI Key'}
              </span>
            </button>
          )}

          {/* User Authentication Menu */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 pr-3 bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 rounded-2xl transition-all"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span className="truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                        user.packageSlug === 'studio'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : user.packageSlug === 'pro'
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {user.packageSlug}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate font-mono">{user.email}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Current Plan:</span>
                      <span className="font-bold text-cyan-400 uppercase">{user.packageSlug}</span>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                    <span>User Dashboard</span>
                  </Link>

                  <Link
                    href="/pricing"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Upgrade Plan</span>
                  </Link>

                  {(isAdmin || isSuperadmin) && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/20 my-1 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>Superadmin Portal</span>
                    </Link>
                  )}

                  <div className="border-t border-white/10 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/auth/signin"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-md shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
