import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  ShieldCheck,
  BookOpen,
  LineChart,
  PenLine,
  FileText,
  LogOut,
  Users,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  currentTab: 'session' | 'history' | 'insights' | 'security' | 'legal';
  onSelectTab: (tab: 'session' | 'history' | 'insights' | 'security' | 'legal') => void;
  onSignOut: () => void;
  personas: UserProfile[];
  onSwitchUser: (uid: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTab,
  onSelectTab,
  onSignOut,
  personas,
  onSwitchUser,
}) => {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  return (
    <header id="app-header" className="bg-[#F9F8F6] text-[#1A1A1A] border-b border-[#1A1A1A]/15 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      {/* Top Editorial Masthead Sub-Bar */}
      <div className="border-b border-[#1A1A1A]/10 px-4 sm:px-8 py-1.5 hidden md:flex items-center justify-between text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]/60">
        <div>Issue No. 04 • Archival Edition</div>
        <div className="font-serif italic capitalize tracking-normal text-[#1A1A1A]/70 text-xs">
          Personal Reflection &amp; Provable Privacy
        </div>
        <div>Volume I / 2024–2026</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & App Title in Editorial Serif */}
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-base italic shadow-xs">
              J.
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-xl sm:text-2xl tracking-tighter font-bold text-[#1A1A1A]">
                  Personal Gemini Journal<span className="text-[#8C271E]">.</span>
                </span>
                <span className="hidden lg:inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] font-bold border border-[#1A1A1A]/20 bg-[#E5E3DF]/50 text-[#1A1A1A]/80">
                  Provably Isolated
                </span>
              </div>
              <p className="text-[11px] text-[#1A1A1A]/60 font-serif italic hidden sm:block">
                A private study in thought, structured reflection, and aesthetic permanence
              </p>
            </div>
          </div>

          {/* Nav Tabs styled as Editorial Section Index */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              id="tab-session-btn"
              onClick={() => onSelectTab('session')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border ${
                currentTab === 'session'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-transparent text-[#1A1A1A]/70 border-transparent hover:border-[#1A1A1A]/20 hover:text-[#1A1A1A]'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Journal</span>
              <span className="md:hidden">Session</span>
            </button>

            <button
              id="tab-history-btn"
              onClick={() => onSelectTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border ${
                currentTab === 'history'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-transparent text-[#1A1A1A]/70 border-transparent hover:border-[#1A1A1A]/20 hover:text-[#1A1A1A]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Archive</span>
              <span className="md:hidden">History</span>
            </button>

            <button
              id="tab-insights-btn"
              onClick={() => onSelectTab('insights')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border ${
                currentTab === 'insights'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-transparent text-[#1A1A1A]/70 border-transparent hover:border-[#1A1A1A]/20 hover:text-[#1A1A1A]'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Analytics</span>
              <span className="md:hidden">Trends</span>
            </button>

            <button
              id="tab-security-btn"
              onClick={() => onSelectTab('security')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border ${
                currentTab === 'security'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-transparent text-[#1A1A1A]/70 border-transparent hover:border-[#1A1A1A]/20 hover:text-[#1A1A1A]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Constitution</span>
              <span className="md:hidden">Security</span>
            </button>

            <button
              id="tab-legal-btn"
              onClick={() => onSelectTab('legal')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border ${
                currentTab === 'legal'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-transparent text-[#1A1A1A]/70 border-transparent hover:border-[#1A1A1A]/20 hover:text-[#1A1A1A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Codex</span>
            </button>
          </nav>

          {/* User Account & Persona Switcher */}
          <div className="relative">
            <div className="flex items-center space-x-2">
              <button
                id="user-menu-btn"
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-[#1A1A1A] text-xs transition-colors shadow-2xs"
              >
                <div className="w-5 h-5 bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] font-serif font-bold">
                  {user.displayName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-xs leading-tight">{user.displayName}</div>
                  <div className="text-[9px] text-[#1A1A1A]/50 font-mono">{user.uid}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-[#1A1A1A]/50" />
              </button>

              <button
                id="sign-out-btn"
                onClick={onSignOut}
                title="Sign out"
                className="p-2 text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#E5E3DF]/60 transition-colors border border-transparent hover:border-[#1A1A1A]/10"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown for Switch User */}
            {showSwitchMenu && (
              <div
                id="user-switch-dropdown"
                className="absolute right-0 mt-2 w-76 bg-[#F9F8F6] text-[#1A1A1A] shadow-2xl border border-[#1A1A1A] p-3 z-50 text-sm animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3 py-2 border-b border-[#1A1A1A]/15 pb-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/50">Active Provenance</p>
                  <p className="font-serif text-base font-bold text-[#1A1A1A] mt-0.5">{user.displayName}</p>
                  <p className="text-xs text-[#1A1A1A]/60 font-mono">{user.email}</p>
                  <p className="text-[10px] font-mono text-[#1A1A1A] mt-1.5 bg-white px-2 py-1 border border-[#1A1A1A]/15">
                    Path: /users/{user.uid}/entries
                  </p>
                </div>

                <div className="pt-3">
                  <p className="px-3 text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/50 mb-2 flex items-center">
                    <Users className="w-3 h-3 mr-1" /> Switch Persona (Test Isolation)
                  </p>
                  {personas.map((p) => (
                    <button
                      key={p.uid}
                      onClick={() => {
                        onSwitchUser(p.uid);
                        setShowSwitchMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors border-b border-[#1A1A1A]/5 last:border-b-0 ${
                        p.uid === user.uid
                          ? 'bg-[#1A1A1A] font-bold text-[#F9F8F6]'
                          : 'hover:bg-[#E5E3DF]/70 text-[#1A1A1A]'
                      }`}
                    >
                      <div>
                        <div className="font-medium font-serif">{p.displayName}</div>
                        <div className={`text-[10px] font-mono ${p.uid === user.uid ? 'text-slate-300' : 'text-slate-500'}`}>{p.uid}</div>
                      </div>
                      {p.uid === user.uid && (
                        <span className="text-[9px] uppercase tracking-widest font-bold bg-white text-[#1A1A1A] px-1.5 py-0.5">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-[#1A1A1A]/15">
                  <button
                    onClick={() => {
                      setShowSwitchMenu(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center space-x-2 font-bold uppercase tracking-wider"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
