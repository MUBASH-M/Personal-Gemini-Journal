import React, { useState } from 'react';
import { UserProfile, JournalEdition } from '../types';
import { useTheme } from '../utils/themeContext';
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
  Sun,
  Moon,
  GitBranch,
  Layers,
  User,
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  currentTab: 'session' | 'history' | 'lineage' | 'insights' | 'security' | 'legal' | 'profile';
  onSelectTab: (tab: 'session' | 'history' | 'lineage' | 'insights' | 'security' | 'legal' | 'profile') => void;
  onSignOut: () => void;
  personas: UserProfile[];
  onSwitchUser: (uid: string) => void;
  activeEdition?: JournalEdition;
  onOpenEditionModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTab,
  onSelectTab,
  onSignOut,
  personas,
  onSwitchUser,
  activeEdition,
  onOpenEditionModal,
}) => {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <header id="app-header" className="bg-[#F9F8F6] text-[#1A1A1A] border-b border-[#1A1A1A]/15 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 transition-colors">
      {/* Top Editorial Masthead Sub-Bar */}
      <div className="border-b border-[#1A1A1A]/10 px-4 sm:px-8 py-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]/60">
        <div className="flex items-center gap-2">
          <button
            id="header-edition-badge-btn"
            type="button"
            onClick={onOpenEditionModal}
            className="inline-flex items-center gap-2 px-2.5 py-0.5 border border-[#1A1A1A]/20 bg-white hover:border-[#1A1A1A] hover:bg-[#FDFBF7] text-[#1A1A1A] transition-all shadow-2xs group cursor-pointer"
            title="Click to view all Editions, switch between Archival and New Editions, or curate a new folio"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8C271E] animate-pulse" />
            <span className="font-mono tracking-wider font-bold">
              {activeEdition ? `${activeEdition.issueNumber} • ${activeEdition.title}` : 'Issue No. 05 • Living Horizon'}
            </span>
            {activeEdition?.isNewEdition ? (
              <span className="px-1.5 py-0.2 bg-[#8C271E] text-white text-[8px] font-mono uppercase font-bold">
                NEW EDITION
              </span>
            ) : (
              <span className="px-1.5 py-0.2 bg-[#1A1A1A]/15 text-[#1A1A1A] text-[8px] font-mono uppercase font-bold">
                ARCHIVAL
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-[#1A1A1A]/50 group-hover:text-[#1A1A1A]" />
          </button>
        </div>

        <div className="hidden sm:flex font-serif italic capitalize tracking-normal text-[#1A1A1A]/70 text-xs items-center gap-2">
          <span>Personal Reflection &amp; Provable Privacy</span>
          <span className="text-[#1A1A1A]/30">•</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#8C271E]">
            {isDark ? 'Night Ledger (Paper-Ink Palette)' : 'Daylight Folio'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline font-mono text-[9px] text-[#1A1A1A]/50">
            {activeEdition?.period || 'Volume I / 2024–2026'}
          </span>
          <button
            id="header-browse-editions-btn"
            type="button"
            onClick={onOpenEditionModal}
            className="text-[9px] uppercase tracking-wider text-[#8C271E] hover:underline font-bold"
          >
            Editions &amp; Folios ▾
          </button>
        </div>
      </div>

      {/* Masthead Bar: Brand Identity & User / Theme Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-3.5 gap-4">
          {/* Logo & App Title in Editorial Serif */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-base sm:text-lg italic shadow-xs shrink-0 select-none">
              <span className="relative -top-px">J.</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif text-lg sm:text-2xl tracking-tight font-bold text-[#1A1A1A] leading-tight truncate">
                  Personal Gemini Journal<span className="text-[#8C271E]">.</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] font-bold border border-[#1A1A1A]/20 bg-[#E5E3DF]/50 text-[#1A1A1A]/80 shrink-0">
                  Provably Isolated
                </span>
              </div>
              <p className="text-[11px] text-[#1A1A1A]/60 font-serif italic hidden md:block leading-tight mt-0.5">
                A private study in thought, structured reflection, and aesthetic permanence
              </p>
            </div>
          </div>

          {/* User Account, Theme Toggle & Persona Switcher */}
          <div className="relative shrink-0 flex items-center gap-2">
            {/* Deep Paper-Ink Dark Mode Theme Toggle */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              title={
                isDark
                  ? 'Switch to Daylight Folio (Paper Cream)'
                  : 'Switch to Night Ledger (Deep Paper-Ink Palette)'
              }
              aria-label={isDark ? 'Switch to Daylight Folio' : 'Switch to Night Ledger'}
              className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 bg-white border border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-[#1A1A1A] text-xs transition-colors shadow-2xs shrink-0 select-none font-mono"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-bold">
                    Folio
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />
                  <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-bold">
                    Night
                  </span>
                </>
              )}
            </button>

            {/* Active User Chip / Switcher */}
            <div className="relative">
              <button
                id="persona-switcher-btn"
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="flex items-center gap-2 h-9 px-2 sm:px-2.5 bg-white border border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-[#1A1A1A] text-xs transition-colors shadow-2xs"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover border border-[#1A1A1A]/30 shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] font-serif font-bold shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left font-serif hidden sm:block min-w-0">
                  <span className="font-bold text-xs leading-none block truncate">{user.displayName}</span>
                  <span className="text-[10px] text-[#1A1A1A]/50 font-mono block mt-0.5 truncate max-w-[110px]">
                    {user.email.split('@')[0]}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#1A1A1A]/60 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {showSwitchMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-[#FAF9F7] border border-[#1A1A1A] shadow-xl z-50 p-2 text-[#1A1A1A] animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#1A1A1A]/10 mb-1 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60">
                        Authenticated Persona
                      </p>
                      <p className="text-xs font-serif font-bold text-[#1A1A1A] mt-0.5 truncate">{user.displayName}</p>
                      <p className="text-[10px] font-mono text-[#1A1A1A]/60 truncate">{user.email}</p>
                    </div>
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-[#1A1A1A]/30 shrink-0 ml-2"
                      />
                    )}
                  </div>

                  {/* Profile & Photo Direct Action */}
                  <div className="py-1 border-b border-[#1A1A1A]/10 mb-1">
                    <button
                      id="dropdown-edit-profile-btn"
                      onClick={() => {
                        setShowSwitchMenu(false);
                        onSelectTab('profile');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-serif flex items-center justify-between hover:bg-[#F2EFE9] transition-colors font-bold text-[#8C271E]"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        <span>Profile &amp; Photo Settings</span>
                      </div>
                      <span className="text-[9px] font-mono uppercase bg-[#8C271E]/10 text-[#8C271E] px-1.5 py-0.5">
                        Edit
                      </span>
                    </button>
                  </div>

                  <div className="py-1">
                    <p className="px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/50">
                      Switch Demo Persona:
                    </p>
                    {personas.map((p) => (
                      <button
                        key={p.uid}
                        onClick={() => {
                          setShowSwitchMenu(false);
                          onSwitchUser(p.uid);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-serif flex items-center justify-between hover:bg-[#F2EFE9] transition-colors ${
                          p.uid === user.uid ? 'bg-white border-l-2 border-[#1A1A1A] font-bold' : ''
                        }`}
                      >
                        <div>
                          <span className="block text-xs font-bold text-[#1A1A1A]">{p.displayName}</span>
                          <span className="block text-[10px] text-[#1A1A1A]/60 italic">{p.personaTagline}</span>
                        </div>
                        {p.uid === user.uid && (
                          <span className="text-[9px] font-mono uppercase bg-[#1A1A1A] text-white px-1.5 py-0.5">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-[#1A1A1A]/10 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setShowSwitchMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-800 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-800" />
                      <span>Sign Out / Clear Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Ribbon: Dedicated Editorial Section Index Strip */}
      <div className="border-t border-[#1A1A1A]/10 bg-[#FAF9F7]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
            <button
              id="tab-session-btn"
              onClick={() => onSelectTab('session')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border shrink-0 ${
                currentTab === 'session'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-white/80 text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]'
              }`}
            >
              <PenLine className="w-3.5 h-3.5 shrink-0" />
              <span>Journal Session</span>
            </button>

            <button
              id="tab-history-btn"
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border shrink-0 ${
                currentTab === 'history'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-white/80 text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Archive</span>
            </button>

            {/* Feature 2: Idea Lineage Living Threads */}
            <button
              id="tab-lineage-btn"
              onClick={() => onSelectTab('lineage')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border shrink-0 ${
                currentTab === 'lineage'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-white/80 text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 shrink-0 text-[#8C271E]" />
              <span>Idea Lineage</span>
            </button>

            <button
              id="tab-insights-btn"
              onClick={() => onSelectTab('insights')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border shrink-0 ${
                currentTab === 'insights'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-white/80 text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 shrink-0" />
              <span>Sentiment Almanac</span>
            </button>

            <button
              id="tab-security-btn"
              onClick={() => onSelectTab('security')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border shrink-0 ${
                currentTab === 'security'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-white/80 text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Constitution &amp; Ledger</span>
            </button>

            <button
              id="tab-legal-btn"
              onClick={() => onSelectTab('legal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border shrink-0 ${
                currentTab === 'legal'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-white/80 text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Governance Codex</span>
            </button>

            {/* Profile & Authorship Tab */}
            <button
              id="tab-profile-btn"
              onClick={() => onSelectTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] font-bold transition-all border shrink-0 ${
                currentTab === 'profile'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] shadow-xs'
                  : 'bg-white/80 text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0 text-[#8C271E]" />
              <span>Profile</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
