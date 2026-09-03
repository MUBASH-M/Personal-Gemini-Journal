import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, Sparkles, Lock, ArrowRight, UserCheck, KeyRound } from 'lucide-react';

interface AuthScreenProps {
  personas: UserProfile[];
  onLoginPersona: (uid: string) => Promise<void>;
  onLoginEmail: (email: string) => Promise<void>;
  onRegister: (email: string, displayName: string) => Promise<void>;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      if (!email.trim()) return;
      onLoginEmail(email.trim());
    } else {
      if (!email.trim() || !displayName.trim()) return;
      onRegister(email.trim(), displayName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 border border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs mb-4 font-serif text-xl italic font-bold">
          J.
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#1A1A1A]/60 mb-2">
          Private Journal • Issue No. 04
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1A1A1A] tracking-tighter">
          Personal Gemini Journal<span className="text-[#8C271E]">.</span>
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-[#1A1A1A]/70 max-w-sm mx-auto font-serif italic leading-relaxed">
          The provably private, AI-native space to think out loud. Structured reflection backed by verified cryptographic isolation.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        {/* Main Auth Card in Editorial Parchment Box */}
        <div className="bg-white py-8 px-6 sm:px-10 border border-[#1A1A1A]/20 shadow-[0_8px_30px_rgba(26,26,26,0.04)]">
          {/* Sign In / Sign Up toggle */}
          <div className="flex border border-[#1A1A1A]/20 p-1 mb-6 bg-[#F9F8F6]">
            <button
              id="auth-mode-signin"
              onClick={() => setMode('signin')}
              className={`w-1/2 py-2 text-xs uppercase tracking-[0.15em] font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-mode-signup"
              onClick={() => setMode('signup')}
              className={`w-1/2 py-2 text-xs uppercase tracking-[0.15em] font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-rose-400 bg-[#FCF4F3] text-[#6E2B29] text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/70 mb-1">
                  Your Full Name or Pen Name
                </label>
                <input
                  id="signup-name-input"
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-[#1A1A1A]/25 text-sm font-serif text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/70 mb-1">
                Email Address
              </label>
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="author@journal.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-[#1A1A1A]/25 text-sm font-serif text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/70 mb-1">
                Password <span className="text-[#1A1A1A]/40 font-normal font-sans">(Client-side token authentication)</span>
              </label>
              <input
                id="auth-password-input"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-[#1A1A1A]/25 text-sm font-mono text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 flex items-center justify-center px-4 py-3 border border-[#1A1A1A] text-xs uppercase tracking-[0.2em] font-bold text-white bg-[#1A1A1A] hover:bg-black focus:outline-none transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating Ledger...</span>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Access Private Vault' : 'Initialize Protected Vault'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Persona Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-[#1A1A1A]/15">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/70 flex items-center">
                <UserCheck className="w-3.5 h-3.5 mr-1 text-[#1A1A1A]" /> Test Personas (From PRD)
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 font-bold">1-Click Sign-in</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {personas.map((p) => (
                <button
                  key={p.uid}
                  id={`persona-btn-${p.uid}`}
                  onClick={() => onLoginPersona(p.uid)}
                  disabled={isLoading}
                  className="flex items-center justify-between p-3 border border-[#1A1A1A]/15 bg-[#F9F8F6] hover:bg-[#F2EFE9] hover:border-[#1A1A1A] text-left transition-all group"
                >
                  <div>
                    <div className="font-serif font-bold text-sm text-[#1A1A1A] group-hover:text-black">
                      {p.displayName}
                    </div>
                    <div className="text-[11px] text-[#1A1A1A]/60 font-serif italic">{p.role}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono bg-white px-2 py-0.5 border border-[#1A1A1A]/20 text-[#1A1A1A]">
                      {p.uid}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Constitution Colophon */}
        <div className="mt-6 bg-[#F9F8F6] p-4 border border-[#1A1A1A]/15 text-xs text-[#1A1A1A]/80 flex items-start space-x-3">
          <ShieldCheck className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]">Security-First Editorial Colophon</p>
            <p className="text-[11px] text-[#1A1A1A]/70 leading-relaxed font-serif">
              Every journal transaction enforces verified token UID boundaries (<code className="font-mono bg-white px-1 py-0.5 border border-[#1A1A1A]/15">/users/{'{uid}'}/entries</code>). 
              The Gemini API key is housed exclusively server-side via Secret Manager and is <strong>never transmitted to the client</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
