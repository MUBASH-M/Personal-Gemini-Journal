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
} from 'lucide-react';

interface AuthScreenProps {
  personas: UserProfile[];
  onLoginPersona: (uid: string) => Promise<void>;
  onLoginGoogle: () => Promise<void>;
  onLoginApple: () => Promise<void>;
  onLoginEmail: (email: string, password?: string) => Promise<void>;
  onRegister: (email: string, displayName: string, password?: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  personas,
  onLoginPersona,
  onLoginGoogle,
  onLoginApple,
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
  const { isDark, toggleTheme } = useTheme();

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
          {error && (
            <div className="mb-5 p-3.5 border border-rose-400 bg-[#FCF4F3] text-[#6E2B29] text-xs font-mono flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#8C271E] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold">Authentication notice: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Social / Single Sign-On Providers: Google & Apple */}
          <div className="space-y-2.5 mb-6">
            {/* Google / Gmail ID Button */}
            <button
              id="btn-login-google"
              type="button"
              disabled={isLoading}
              onClick={onLoginGoogle}
              className="w-full h-11 flex items-center justify-center gap-3 px-4 border border-[#1A1A1A]/25 bg-[#FDFBF7] hover:bg-white hover:border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold font-serif tracking-wide transition-all shadow-2xs group disabled:opacity-60"
            >
              {/* Google G Multi-Color Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google (Gmail ID)</span>
            </button>

            {/* Apple ID Button */}
            <button
              id="btn-login-apple"
              type="button"
              disabled={isLoading}
              onClick={onLoginApple}
              className="w-full h-11 flex items-center justify-center gap-3 px-4 border border-[#1A1A1A] bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold font-serif tracking-wide transition-all shadow-xs group disabled:opacity-60"
            >
              {/* Apple Icon */}
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.79-11.88-14.24-6.3-9.59-11.31-20.73-15.02-33.43-3.71-12.7-5.57-24.78-5.57-36.24 0-14.04 3.36-26.01 10.07-35.91 6.72-9.9 15.42-14.96 26.11-15.19 4.35 0 9.42 1.14 15.22 3.44 5.8 2.29 9.5 3.49 11.09 3.59 2.03-.13 6.01-1.39 11.96-3.8 5.94-2.41 10.95-3.5 15.02-3.26 12.16.65 21.84 4.88 29.04 12.7-10.43 6.32-15.54 15.11-15.34 26.37.2 9.79 3.99 17.84 11.37 24.16 4.7 4.13 10.08 7.02 16.14 8.68-2.61 8.28-6.09 16.71-10.45 25.32zM119.22 33.34c0-7.39 2.65-14.35 7.95-20.87 5.3-6.52 11.97-10.68 20.02-12.47.22 1.52.33 2.94.33 4.25 0 7.39-2.76 14.47-8.28 21.23-5.52 6.75-12.24 10.97-20.15 12.65-.43-1.52-.65-3.12-.65-4.79z" />
              </svg>
              <span>Continue with Apple ID</span>
            </button>
          </div>

          {/* Editorial Divider */}
          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-[#1A1A1A]/15"></div>
            <span className="flex-shrink mx-3 text-[9px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]/50 bg-white px-2">
              Or Authenticate with Any Mail ID
            </span>
            <div className="flex-grow border-t border-[#1A1A1A]/15"></div>
          </div>

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
