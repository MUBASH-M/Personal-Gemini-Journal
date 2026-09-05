import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useTheme } from '../utils/themeContext';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  ArrowRight,
  UserCheck,
  Sun,
  Moon,
  Mail,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
} from 'lucide-react';

interface AuthScreenProps {
  personas: UserProfile[];
  onLoginPersona: (uid: string) => Promise<void>;
  onLoginEmail: (email: string, password?: string) => Promise<void>;
  onRegister: (email: string, displayName: string, password?: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  personas,
  onLoginPersona,
  onLoginEmail,
  onRegister,
  isLoading,
  error,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPersonas, setShowPersonas] = useState(false);
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const { isDark, toggleTheme } = useTheme();

  const activeError = error && error !== dismissedError ? error : null;

  // Detect email domain for friendly user feedback
  const getEmailProviderBadge = (val: string) => {
    const lower = val.toLowerCase();
    if (lower.includes('@gmail.com') || lower.includes('@googlemail.com')) {
      return { label: 'Gmail Account Detected', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (lower.includes('@icloud.com') || lower.includes('@apple.com') || lower.includes('@me.com')) {
      return { label: 'Apple ID Detected', color: 'text-slate-800 bg-slate-100 border-slate-300' };
    }
    if (lower.includes('@outlook.com') || lower.includes('@hotmail.com') || lower.includes('@live.com') || lower.includes('@msn.com')) {
      return { label: 'Microsoft Outlook Detected', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    }
    if (lower.includes('@yahoo.com') || lower.includes('@ymail.com')) {
      return { label: 'Yahoo Mail Detected', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    }
    if (lower.includes('@proton.me') || lower.includes('@protonmail.com')) {
      return { label: 'Proton Mail Detected', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    }
    if (lower.includes('@') && lower.includes('.')) {
      return { label: 'Custom / Organization Mail', color: 'text-[#1A1A1A] bg-[#F2EFE9] border-[#1A1A1A]/20' };
    }
    return null;
  };

  const badge = getEmailProviderBadge(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (mode === 'signin') {
      onLoginEmail(email.trim(), password);
    } else {
      if (!displayName.trim()) return;
      onRegister(email.trim(), displayName.trim(), password);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative transition-colors">
      {/* Top Floating Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
        <button
          id="auth-theme-toggle-btn"
          type="button"
          onClick={toggleTheme}
          title={
            isDark
              ? 'Switch to Daylight Folio (Paper Cream)'
              : 'Switch to Night Ledger (Deep Paper-Ink Palette)'
          }
          aria-label={isDark ? 'Switch to Daylight Folio' : 'Switch to Night Ledger'}
          className="flex items-center gap-1.5 h-9 px-3 bg-white border border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-[#1A1A1A] text-xs transition-colors shadow-2xs font-mono"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider font-bold">Folio</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />
              <span className="text-[10px] uppercase tracking-wider font-bold">Night Ledger</span>
            </>
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 border border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs mb-3 font-serif text-xl italic font-bold">
          J.
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]/60 mb-1">
          Issue No. 05 • Living Journal Edition
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
          Personal Gemini Journal<span className="text-[#8C271E]">.</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#1A1A1A]/70 max-w-sm mx-auto font-serif italic leading-relaxed">
          Provably isolated, multi-turn intellectual reflection. Sign in to access your confidential
          vault and editorial editions.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        {/* Main Auth Container */}
        <div className="bg-white py-7 px-6 sm:px-9 border border-[#1A1A1A]/20 shadow-[0_8px_30px_rgba(26,26,26,0.04)]">
          {activeError && (
            <div className="mb-5 p-3.5 border border-rose-400 bg-[#FCF4F3] text-[#6E2B29] text-xs font-mono flex items-start justify-between gap-2.5 animate-in fade-in">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertCircle className="w-4 h-4 text-[#8C271E] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold">Authentication notice: </span>
                  <span className="break-words">{activeError}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDismissedError(error || null)}
                className="text-[#6E2B29]/60 hover:text-[#6E2B29] p-0.5 shrink-0 transition-colors"
                title="Dismiss notice"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sign In / Sign Up toggle */}
          <div className="flex border border-[#1A1A1A]/20 p-1 mb-5 bg-[#F9F8F6]">
            <button
              id="auth-mode-signin"
              type="button"
              onClick={() => setMode('signin')}
              className={`w-1/2 py-1.5 text-[11px] uppercase tracking-[0.15em] font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-mode-signup"
              type="button"
              onClick={() => setMode('signup')}
              className={`w-1/2 py-1.5 text-[11px] uppercase tracking-[0.15em] font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/70 mb-1">
                  Full Name or Pen Name
                </label>
                <input
                  id="signup-name-input"
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-[#1A1A1A]/25 text-sm font-serif text-[#1A1A1A] focus:outline-none focus:border-[#8C271E]"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/70">
                  Mail ID (Email Address)
                </label>
                {badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 border ${badge.color} transition-all`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="name@gmail.com, name@icloud.com, name@company.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-[#1A1A1A]/25 text-sm font-mono text-[#1A1A1A] focus:outline-none focus:border-[#8C271E]"
                />
                <Mail className="w-4 h-4 text-[#1A1A1A]/30 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              <p className="text-[10px] text-[#1A1A1A]/50 font-serif italic mt-1">
                Accepts any valid mail provider (Gmail, Apple iCloud, Outlook, Yahoo, Proton, corporate domains).
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/70">
                  Password
                </label>
                <span className="text-[9px] text-[#1A1A1A]/40 font-mono">
                  Client-side protected token
                </span>
              </div>
              <input
                id="auth-password-input"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-[#1A1A1A]/25 text-sm font-mono text-[#1A1A1A] focus:outline-none focus:border-[#8C271E]"
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-11 inline-flex items-center justify-center gap-2 px-4 border border-[#1A1A1A] text-xs uppercase tracking-[0.2em] font-bold text-white bg-[#1A1A1A] hover:bg-black focus:outline-none transition-colors disabled:opacity-50 shadow-xs"
            >
              {isLoading ? (
                <span>Authenticating Ledger...</span>
              ) : (
                <>
                  <span>
                    {mode === 'signin' ? 'Sign In with Mail ID' : 'Initialize Account with Mail ID'}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </form>

          {/* Test Personas Section (1-Click PRD Demo) */}
          <div className="mt-7 pt-5 border-t border-[#1A1A1A]/15">
            <button
              type="button"
              onClick={() => setShowPersonas(!showPersonas)}
              className="w-full flex items-center justify-between text-left group"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/70 flex items-center gap-1.5 group-hover:text-[#1A1A1A]">
                <UserCheck className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span>Test Personas (PRD Demo Fast Access)</span>
              </span>
              <div className="flex items-center gap-1 text-[10px] font-mono text-[#1A1A1A]/50 group-hover:text-[#1A1A1A]">
                <span>{showPersonas ? 'Hide' : 'Show 3 Personas'}</span>
                {showPersonas ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </button>

            {showPersonas && (
              <div className="grid grid-cols-1 gap-2 mt-3 animate-in fade-in">
                {personas.map((p) => (
                  <button
                    key={p.uid}
                    id={`persona-btn-${p.uid}`}
                    type="button"
                    onClick={() => onLoginPersona(p.uid)}
                    disabled={isLoading}
                    className="flex items-center justify-between gap-3 p-2.5 border border-[#1A1A1A]/15 bg-[#F9F8F6] hover:bg-[#F2EFE9] hover:border-[#1A1A1A] text-left transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="font-serif font-bold text-xs text-[#1A1A1A] group-hover:text-black truncate">
                        {p.displayName}
                      </div>
                      <div className="text-[10px] text-[#1A1A1A]/60 font-serif italic truncate">
                        {p.role}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-mono bg-white px-2 py-0.5 border border-[#1A1A1A]/20 text-[#1A1A1A]">
                        {p.uid}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Colophon */}
        <div className="mt-5 bg-[#F9F8F6] p-3.5 border border-[#1A1A1A]/15 text-xs text-[#1A1A1A]/80 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#8C271E] shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]">
              Security &amp; Isolation Architecture
            </p>
            <p className="text-[11px] text-[#1A1A1A]/70 leading-relaxed font-serif">
              Every journal operation enforces token UID containment at{' '}
              <code className="font-mono bg-white px-1 py-0.2 border border-[#1A1A1A]/15">
                /users/{'{uid}'}/entries
              </code>
              . The Gemini API key is managed server-side and never exposed to the client.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
