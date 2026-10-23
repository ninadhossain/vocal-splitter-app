'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { MailServer, Package, User } from '@/types';
import {
  Server,
  Layers,
  Users,
  BarChart3,
  Mail,
  Send,
  Edit,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Plus,
  RefreshCw,
  Lock,
  Globe,
  Sliders,
  Power,
  X,
  ExternalLink,
} from 'lucide-react';

// SMTP Presets matching user request and screenshot
const PRESETS = [
  {
    label: 'Gmail SMTP',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    defaultSender: 'noreply@yourcompany.com',
  },
  {
    label: 'Office 365 / Outlook',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    defaultSender: 'noreply@yourcompany.com',
  },
  {
    label: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    defaultSender: 'noreply@yourcompany.com',
  },
  {
    label: 'Amazon SES',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    defaultSender: 'noreply@yourcompany.com',
  },
  {
    label: 'Custom SMTP',
    host: '',
    port: 587,
    secure: false,
    defaultSender: '',
  },
];

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isAdmin, isSuperadmin, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'smtp' | 'packages' | 'users' | 'stats'>('smtp');

  // Mail Server state
  const [mailServers, setMailServers] = useState<MailServer[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('Gmail SMTP');
  const [serverLabel, setServerLabel] = useState('Gmail SMTP');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState(587);
  const [username, setUsername] = useState('babylonresources@gmail.com');
  const [password, setPassword] = useState('');
  const [senderEmail, setSenderEmail] = useState('noreply@yourcompany.com');
  const [useSsl, setUseSsl] = useState(false);
  const [setActiveNow, setSetActiveNow] = useState(true);
  const [isSavingServer, setIsSavingServer] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Test Email Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testTargetEmail, setTestTargetEmail] = useState('');
  const [testServerId, setTestServerId] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Packages state
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  // Users state
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Stats state
  const [stats, setStats] = useState<any>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (!isAdmin && !isSuperadmin))) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, isAdmin, isSuperadmin, router]);

  // Load initial data
  useEffect(() => {
    if (token) {
      loadMailServers();
      loadPackages();
      loadUsers();
      loadStats();
    }
  }, [token]);

  const loadMailServers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/mail-servers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMailServers(data);
      }
    } catch {}
  };

  const loadPackages = async () => {
    setIsLoadingPackages(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/packages/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch {}
    setIsLoadingPackages(false);
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch {}
    setIsLoadingUsers(false);
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  };

  // Preset selector
  const handlePresetSelect = (presetName: string) => {
    setSelectedPreset(presetName);
    const p = PRESETS.find((x) => x.label === presetName);
    if (p) {
      setServerLabel(p.label);
      setSmtpHost(p.host);
      setPort(p.port);
      setUseSsl(p.secure);
      if (p.defaultSender && !senderEmail) {
        setSenderEmail(p.defaultSender);
      }
    }
  };

  // Toggle SSL/TLS switch
  const handleToggleSsl = () => {
    const nextVal = !useSsl;
    setUseSsl(nextVal);
    if (nextVal) {
      setPort(465);
    } else {
      setPort(587);
    }
  };

  // Save & Verify Mail Server
  const handleSaveMailServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingServer(true);
    setSmtpFeedback(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/mail-servers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: serverLabel,
          host: smtpHost,
          port: Number(port),
          username,
          password,
          fromEmail: senderEmail,
          secure: useSsl,
          isActive: setActiveNow,
        }),
      });

      const data = await res.json();
      setIsSavingServer(false);

      if (res.ok) {
        setSmtpFeedback({
          type: 'success',
          message: data.message || 'Mail server successfully saved and verified.',
        });
        setPassword('');
        loadMailServers();
        loadStats();
      } else {
        setSmtpFeedback({
          type: 'error',
          message: data.error || 'Failed to save mail server.',
        });
      }
    } catch (err: any) {
      setIsSavingServer(false);
      setSmtpFeedback({
        type: 'error',
        message: err.message || 'Connection error while saving mail server.',
      });
    }
  };

  // Set active mail server
  const handleActivateServer = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/mail-servers/${id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadMailServers();
        loadStats();
      }
    } catch {}
  };

  // Delete mail server
  const handleDeleteServer = async (id: string) => {
    if (!confirm('Are you sure you want to remove this mail server?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/mail-servers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadMailServers();
        loadStats();
      }
    } catch {}
  };

  // Open Test Mail modal
  const openTestMailModal = (serverId: string) => {
    setTestServerId(serverId);
    setTestTargetEmail(user?.email || '');
    setTestFeedback(null);
    setIsTestModalOpen(true);
  };

  // Dispatch live test email
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestFeedback(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/mail-servers/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toEmail: testTargetEmail,
          serverId: testServerId,
        }),
      });

      const data = await res.json();
      setIsSendingTest(false);

      if (res.ok) {
        setTestFeedback({
          type: 'success',
          message: `Test email dispatched to ${testTargetEmail}!`,
        });
      } else {
        setTestFeedback({
          type: 'error',
          message: data.error || 'Failed to send test email',
        });
      }
    } catch (err: any) {
      setIsSendingTest(false);
      setTestFeedback({
        type: 'error',
        message: err.message || 'Connection error',
      });
    }
  };

  // Toggle package active status
  const handleTogglePackageActive = async (pkg: Package) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/packages/${pkg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !pkg.isActive }),
      });
      if (res.ok) loadPackages();
    } catch {}
  };

  // Update user role or status
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) loadUsers();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col text-slate-100 font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-white/10 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  Superadmin Portal
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-bold uppercase">
                  Privileged
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage SMTP mail connections, active subscription packages, users, and platform infrastructure.
              </p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-inner overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('smtp')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'smtp'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>SMTP Mail Server</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('packages')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'packages'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Active Packages</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Directory</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>System Stats</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SMTP MAIL SERVER CONFIGURATION (MATCHING USER SCREENSHOT)          */}
        {/* ========================================================================= */}
        {activeTab === 'smtp' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Feedback Banner */}
            {smtpFeedback && (
              <div
                className={`p-4 rounded-2xl text-xs flex items-center space-x-3 border ${
                  smtpFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                }`}
              >
                {smtpFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                )}
                <span>{smtpFeedback.message}</span>
              </div>
            )}

            {/* CARD 1: Add New Mail Server */}
            <div className="bg-[#0F172A]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
              <div className="flex items-center space-x-2.5 mb-1 text-slate-100">
                <Server className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold">Add New Mail Server</h2>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Configure SMTP credentials to register a new mail server connection.
              </p>

              {/* Quick Presets */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.label;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePresetSelect(preset.label)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-[#00574B] text-white border-emerald-500/40 shadow-md shadow-emerald-950/50'
                            : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-slate-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Fields Grid */}
              <form onSubmit={handleSaveMailServer} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Server Label / Name */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Server Label / Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={serverLabel}
                      onChange={(e) => setServerLabel(e.target.value)}
                      placeholder="Gmail SMTP"
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* SMTP Host */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      SMTP Host <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Port */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Port <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      placeholder="587"
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Username / Email */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Username / Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="babylonresources@gmail.com"
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Password / App Password */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Password / App Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Sender Email (From) */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sender Email (From)
                    </label>
                    <input
                      type="text"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="noreply@yourcompany.com"
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* Toggles & Submit Button row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-6">
                    {/* Toggle: Use SSL/TLS Security */}
                    <div className="flex items-center space-x-2.5">
                      <button
                        type="button"
                        onClick={handleToggleSsl}
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                          useSsl ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            useSsl ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs text-slate-300 select-none">
                        Use SSL/TLS Security (Port 465)
                      </span>
                    </div>

                    {/* Checkbox: Set as Active immediately */}
                    <div className="flex items-center space-x-2">
                      <input
                        id="setActiveCheck"
                        type="checkbox"
                        checked={setActiveNow}
                        onChange={(e) => setSetActiveNow(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                      />
                      <label htmlFor="setActiveCheck" className="text-xs text-slate-300 select-none cursor-pointer">
                        Set as Active Mail Server immediately
                      </label>
                    </div>
                  </div>

                  {/* Save & Verify Button */}
                  <button
                    type="submit"
                    disabled={isSavingServer}
                    className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#00695C] hover:bg-[#00796B] text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-950/60 transition-all active:scale-98 disabled:opacity-50"
                  >
                    {isSavingServer ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying & Saving...</span>
                      </>
                    ) : (
                      <>
                        <Server className="w-4 h-4" />
                        <span>Save & Verify Mail Server</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* CARD 2: Saved Mail Servers */}
            <div className="bg-[#0F172A]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2.5">
                  <Server className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">
                    Saved Mail Servers ({mailServers.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={loadMailServers}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                List of registered mail server connections. Activate any server to make it the primary SMTP provider.
              </p>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px] uppercase">
                      <th className="py-3 px-4">Server Info</th>
                      <th className="py-3 px-4">Host & Port</th>
                      <th className="py-3 px-4">Username & Sender</th>
                      <th className="py-3 px-4">Security</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {mailServers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No mail servers registered yet. Use the form above to add an SMTP server.
                        </td>
                      </tr>
                    ) : (
                      mailServers.map((s) => (
                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Server Info */}
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg border border-cyan-500/30 bg-cyan-950/30 flex items-center justify-center text-cyan-400">
                                <Server className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-white text-xs">{s.label}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{s.host}</div>
                              </div>
                            </div>
                          </td>

                          {/* Host & Port */}
                          <td className="py-4 px-4 font-mono text-slate-300">
                            {s.host}:{s.port}
                          </td>

                          {/* Username & Sender */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5 text-xs text-slate-200">
                                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>{s.fromEmail || s.username}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                User: {s.username}
                              </div>
                            </div>
                          </td>

                          {/* Security badge */}
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-white/10 uppercase">
                              {s.secure ? 'SSL/TLS' : 'STARTTLS'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {s.isActive ? (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-white/5">
                                <span>Inactive</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {s.isActive ? (
                                <span className="text-[11px] text-emerald-400 font-semibold px-2 py-1">
                                  ✓ Active Server
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleActivateServer(s.id)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-lg transition-all"
                                >
                                  Activate
                                </button>
                              )}

                              {/* Send Test Email button */}
                              <button
                                type="button"
                                onClick={() => openTestMailModal(s.id)}
                                title="Send live test email"
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteServer(s.id)}
                                title="Delete server"
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ACTIVE PACKAGES MANAGEMENT                                         */}
        {/* ========================================================================= */}
        {activeTab === 'packages' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Active Packages & Tiers</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage separation limits, monthly/yearly pricing, and allowed stem modes for users.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id || pkg.slug}
                  className={`bg-[#0F172A]/90 border rounded-3xl p-6 relative flex flex-col justify-between ${
                    pkg.isActive ? 'border-white/10' : 'border-rose-500/20 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                          pkg.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {pkg.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 min-h-[32px] mb-4">{pkg.description}</p>

                    <div className="flex items-baseline space-x-1 mb-4">
                      <span className="text-3xl font-extrabold text-white">${pkg.priceMonthly}</span>
                      <span className="text-xs text-slate-400">/ mo (${pkg.priceYearly}/yr)</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl space-y-1.5 text-xs text-slate-300 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Track Limit:</span>
                        <span className="font-bold font-mono">
                          {pkg.trackLimit === -1 ? 'Unlimited' : `${pkg.trackLimit} / mo`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Audio Length:</span>
                        <span className="font-bold font-mono">{Math.round(pkg.maxDuration / 60)} mins</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Allowed Modes:</span>
                        <span className="font-bold text-cyan-400 font-mono">
                          {pkg.allowedModes.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTogglePackageActive(pkg)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                        pkg.isActive
                          ? 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/60'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
                      }`}
                    >
                      {pkg.isActive ? 'Deactivate Package' : 'Activate Package'}
                    </button>
                    <Link
                      href="/pricing"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      View on Pricing Page →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: USER DIRECTORY                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="bg-[#0F172A]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Registered Users ({usersList.length})</h2>
                <p className="text-xs text-slate-400 mt-1">
                  View and manage registered user accounts, active packages, and role permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-[10px] text-white">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                            u.role === 'superadmin'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                              : u.role === 'admin'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.packageSlug}
                          onChange={(e) => handleUpdateUser(u.id, { packageSlug: e.target.value })}
                          className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="studio">Studio</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            u.status === 'active'
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-rose-950 text-rose-300'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'superadmin' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateUser(u.id, {
                                status: u.status === 'active' ? 'suspended' : 'active',
                              })
                            }
                            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SYSTEM STATS & METRICS                                             */}
        {/* ========================================================================= */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-6">
                <span className="text-xs text-slate-400 font-mono uppercase block mb-1">
                  Total Users
                </span>
                <span className="text-3xl font-extrabold text-white">
                  {stats?.totalUsers ?? usersList.length}
                </span>
              </div>
              <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-6">
                <span className="text-xs text-slate-400 font-mono uppercase block mb-1">
                  Active Packages
                </span>
                <span className="text-3xl font-extrabold text-cyan-400">
                  {stats?.activePackagesCount ?? packages.length}
                </span>
              </div>
              <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-6">
                <span className="text-xs text-slate-400 font-mono uppercase block mb-1">
                  Separation Runs
                </span>
                <span className="text-3xl font-extrabold text-violet-400">
                  {stats?.totalJobs ?? 0}
                </span>
              </div>
              <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-6">
                <span className="text-xs text-slate-400 font-mono uppercase block mb-1">
                  Primary SMTP Server
                </span>
                <span className="text-sm font-bold text-emerald-400 block truncate">
                  {stats?.activeMailServer?.label || 'None Active'}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* TEST EMAIL MODAL                                                          */}
      {/* ========================================================================= */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsTestModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <Send className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Dispatch Live Test Email</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Send a test delivery to confirm your SMTP credentials and delivery path.
            </p>

            {testFeedback && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 border ${
                  testFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                }`}
              >
                {testFeedback.message}
              </div>
            )}

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={testTargetEmail}
                  onChange={(e) => setTestTargetEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="flex items-center space-x-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
