import React, { useState } from 'react';
import { JournalEdition, JournalEntry } from '../types';
import {
  BookOpen,
  Sparkles,
  Plus,
  Check,
  Calendar,
  X,
  Layers,
  History,
  ArrowRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useTheme } from '../utils/themeContext';

interface EditionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editions: JournalEdition[];
  activeEditionId: string;
  onSelectEdition: (editionId: string) => void;
  onCreateEdition: (edition: {
    issueNumber: string;
    title: string;
    subtitle: string;
    period: string;
    description: string;
  }) => void;
  entries: JournalEntry[];
}

export const EditionSelectorModal: React.FC<EditionSelectorModalProps> = ({
  isOpen,
  onClose,
  editions,
  activeEditionId,
  onSelectEdition,
  onCreateEdition,
  entries,
}) => {
  const { isDark } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [newIssueNumber, setNewIssueNumber] = useState(`Issue No. 0${editions.length + 3}`);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newPeriod, setNewPeriod] = useState('2026 Volume III');
  const [newDescription, setNewDescription] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newIssueNumber.trim()) return;

    onCreateEdition({
      issueNumber: newIssueNumber.trim(),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Custom Curated Collection',
      period: newPeriod.trim() || 'Current Volume',
      description:
        newDescription.trim() ||
        'An original curated volume for reflective inquiries, thoughts, and realizations.',
    });

    setIsCreating(false);
    setNewTitle('');
    setNewSubtitle('');
    setNewDescription('');
  };

  const archivalEditions = editions.filter((e) => !e.isNewEdition);
  const newEditions = editions.filter((e) => e.isNewEdition);

  const getEntryCountForEdition = (editionId: string) => {
    return entries.filter((ent) => {
      if (ent.editionId) return ent.editionId === editionId;
      if (editionId === 'ed_archival_04') {
        const year = ent.createdAt ? new Date(ent.createdAt).getFullYear() : 2026;
        return year <= 2025;
      }
      if (editionId === 'ed_new_05') {
        const year = ent.createdAt ? new Date(ent.createdAt).getFullYear() : 2026;
        return year > 2025;
      }
      return false;
    }).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="edition-selector-modal"
        className="relative w-full max-w-2xl bg-white border border-[#1A1A1A]/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors"
      >
        {/* Editorial Masthead Header */}
        <div className="px-6 py-4 border-b border-[#1A1A1A]/15 bg-[#F9F8F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-sm italic font-bold">
              J.
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#8C271E]">
                Editorial Registry
              </div>
              <h2 className="text-xl font-serif font-bold text-[#1A1A1A] tracking-tight">
                Journal Editions &amp; Folios
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#1A1A1A]/60 hover:text-[#1A1A1A] border border-transparent hover:border-[#1A1A1A]/20 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#1A1A1A]">
          {/* Overview Statement */}
          <div className="p-3.5 bg-[#F9F8F6] border border-[#1A1A1A]/15 text-xs text-[#1A1A1A]/80 font-serif leading-relaxed flex items-start gap-3">
            <BookOpen className="w-4 h-4 text-[#8C271E] shrink-0 mt-0.5" />
            <div>
              <span>
                Personal reflections are structured into periodic editorial volumes. You can inspect
                the historical <strong>Archival Edition</strong> or switch between active{' '}
                <strong>New Editions</strong> for real-time journaling.
              </span>
            </div>
          </div>

          {/* New Editions Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8C271E]" />
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#1A1A1A]">
                  New Editions (Active &amp; Living Folios)
                </h3>
              </div>
              {!isCreating && (
                <button
                  id="btn-curate-new-edition"
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#1A1A1A]/30 hover:border-[#1A1A1A] text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A] transition-all shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-[#8C271E]" />
                  <span>Curate New Edition</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {newEditions.map((ed) => {
                const isActive = ed.id === activeEditionId;
                const count = getEntryCountForEdition(ed.id);
                return (
                  <div
                    key={ed.id}
                    id={`edition-card-${ed.id}`}
                    onClick={() => {
                      onSelectEdition(ed.id);
                      onClose();
                    }}
                    className={`p-4 border text-left cursor-pointer transition-all relative ${
                      isActive
                        ? 'border-[#8C271E] bg-[#FDFBF7] shadow-sm ring-1 ring-[#8C271E]/30'
                        : 'border-[#1A1A1A]/15 bg-white hover:border-[#1A1A1A] hover:bg-[#F9F8F6]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-[#8C271E] uppercase tracking-wider">
                            {ed.issueNumber}
                          </span>
                          <span className="px-1.5 py-0.5 text-[8px] uppercase tracking-widest font-bold bg-[#8C271E] text-white">
                            New Edition
                          </span>
                          <span className="text-[10px] text-[#1A1A1A]/50 font-serif italic">
                            • {ed.period}
                          </span>
                        </div>
                        <h4 className="text-base font-serif font-bold text-[#1A1A1A]">
                          {ed.title}
                        </h4>
                        <p className="text-xs text-[#1A1A1A]/70 font-serif italic">
                          {ed.subtitle}
                        </p>
                        <p className="text-[11px] text-[#1A1A1A]/60 font-serif leading-relaxed line-clamp-2 mt-1">
                          {ed.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-[#8C271E] bg-[#8C271E]/10 px-2 py-0.5 border border-[#8C271E]/20">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/60 group-hover:text-[#1A1A1A] border border-[#1A1A1A]/20 px-2 py-0.5 bg-white"
                          >
                            Select
                          </button>
                        )}
                        <span className="text-[10px] font-mono text-[#1A1A1A]/50 bg-[#F9F8F6] px-2 py-0.5 border border-[#1A1A1A]/10">
                          {count} {count === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to Curate New Edition */}
          {isCreating && (
            <div className="p-4 border-2 border-dashed border-[#8C271E]/40 bg-[#FDFBF7] space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#8C271E]/20 pb-2">
                <span className="text-xs uppercase tracking-[0.15em] font-bold text-[#8C271E] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Curate &amp; Mint New Edition</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/70 mb-1">
                      Issue Designation
                    </label>
                    <input
                      id="input-edition-issue"
                      type="text"
                      required
                      value={newIssueNumber}
                      onChange={(e) => setNewIssueNumber(e.target.value)}
                      placeholder="e.g. Issue No. 07"
                      className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/25 text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#8C271E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/70 mb-1">
                      Period / Cycle
                    </label>
                    <input
                      id="input-edition-period"
                      type="text"
                      required
                      value={newPeriod}
                      onChange={(e) => setNewPeriod(e.target.value)}
                      placeholder="e.g. 2026 Autumn Solstice"
                      className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/25 text-xs font-serif text-[#1A1A1A] focus:outline-none focus:border-[#8C271E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/70 mb-1">
                    Edition Title
                  </label>
                  <input
                    id="input-edition-title"
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Metacognitive Frontiers"
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/25 text-xs font-serif font-bold text-[#1A1A1A] focus:outline-none focus:border-[#8C271E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/70 mb-1">
                    Subtitle / Focus
                  </label>
                  <input
                    id="input-edition-subtitle"
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="e.g. Dedicated to long-arc architecture and creative focus"
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/25 text-xs font-serif italic text-[#1A1A1A] focus:outline-none focus:border-[#8C271E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/70 mb-1">
                    Curator’s Prologue Note
                  </label>
                  <textarea
                    id="input-edition-desc"
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="A brief opening statement for this volume's inquiry..."
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/25 text-xs font-serif text-[#1A1A1A] focus:outline-none focus:border-[#8C271E]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-1.5 border border-[#1A1A1A]/20 bg-white text-xs font-mono text-[#1A1A1A]/70"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-save-new-edition"
                    type="submit"
                    className="px-4 py-1.5 bg-[#8C271E] hover:bg-[#6E1F18] text-white text-xs uppercase tracking-wider font-bold font-mono transition-colors"
                  >
                    Publish &amp; Mint Edition
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Archival Editions Section */}
          <div className="pt-2 border-t border-[#1A1A1A]/15">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-3.5 h-3.5 text-[#1A1A1A]/60" />
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/70">
                Archival Editions (Preserved Retrospectives)
              </h3>
            </div>

            <div className="space-y-3">
              {archivalEditions.map((ed) => {
                const isActive = ed.id === activeEditionId;
                const count = getEntryCountForEdition(ed.id);
                return (
                  <div
                    key={ed.id}
                    id={`edition-card-${ed.id}`}
                    onClick={() => {
                      onSelectEdition(ed.id);
                      onClose();
                    }}
                    className={`p-4 border text-left cursor-pointer transition-all ${
                      isActive
                        ? 'border-[#1A1A1A] bg-[#F2EFE9] shadow-sm'
                        : 'border-[#1A1A1A]/15 bg-[#F9F8F6] hover:border-[#1A1A1A] hover:bg-[#EFECE6]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-[#1A1A1A]/70 uppercase tracking-wider">
                            {ed.issueNumber}
                          </span>
                          <span className="px-1.5 py-0.5 text-[8px] uppercase tracking-widest font-bold bg-[#1A1A1A]/20 text-[#1A1A1A]">
                            Archival
                          </span>
                          <span className="text-[10px] text-[#1A1A1A]/50 font-serif italic">
                            • {ed.period}
                          </span>
                        </div>
                        <h4 className="text-base font-serif font-bold text-[#1A1A1A]">
                          {ed.title}
                        </h4>
                        <p className="text-xs text-[#1A1A1A]/70 font-serif italic">
                          {ed.subtitle}
                        </p>
                        <p className="text-[11px] text-[#1A1A1A]/60 font-serif leading-relaxed line-clamp-2 mt-1">
                          {ed.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A] bg-white px-2 py-0.5 border border-[#1A1A1A]/20">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/60 group-hover:text-[#1A1A1A] border border-[#1A1A1A]/20 px-2 py-0.5 bg-white"
                          >
                            Select
                          </button>
                        )}
                        <span className="text-[10px] font-mono text-[#1A1A1A]/50 bg-white px-2 py-0.5 border border-[#1A1A1A]/10">
                          {count} {count === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F9F8F6] border-t border-[#1A1A1A]/15 flex items-center justify-between text-xs">
          <span className="font-serif italic text-[11px] text-[#1A1A1A]/60">
            Current Active Volume: {editions.find((e) => e.id === activeEditionId)?.title || 'Living Horizon'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1A1A1A] text-white hover:bg-black text-[10px] uppercase tracking-widest font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
