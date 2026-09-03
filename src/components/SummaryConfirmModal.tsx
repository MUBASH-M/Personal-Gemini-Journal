import React, { useState } from 'react';
import { Sparkles, Check, X, Tag, Heart, Bookmark, Edit3, ShieldAlert } from 'lucide-react';
import { getMoodDetails } from '../utils/theme';

interface SummaryConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndPersist: (customNotes?: string) => Promise<void>;
  isLoading: boolean;
  summaryData: {
    summary: string;
    mood: string;
    themes: string[];
    keyTakeaway: string;
  } | null;
}

export const SummaryConfirmModal: React.FC<SummaryConfirmModalProps> = ({
  isOpen,
  onClose,
  onSaveAndPersist,
  isLoading,
  summaryData,
}) => {
  const [editedSummary, setEditedSummary] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const moodInfo = summaryData ? getMoodDetails(summaryData.mood) : getMoodDetails('reflective');

  const handleSave = () => {
    onSaveAndPersist(isEditing ? editedSummary : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="summary-confirm-dialog"
        className="bg-[#F9F8F6] max-w-2xl w-full p-6 sm:p-8 border border-[#1A1A1A] shadow-[0_20px_50px_rgba(0,0,0,0.25)] text-[#1A1A1A] animate-in fade-in zoom-in-95 duration-150"
      >
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center mx-auto mb-4 font-serif text-lg italic">
              G.
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Synthesizing Entry Ledger...</h3>
            <p className="text-xs text-[#1A1A1A]/70 mt-2 max-w-sm mx-auto font-serif italic">
              Extracting themes, identifying emotional tone, and formatting your personal takeaway.
            </p>
          </div>
        ) : summaryData ? (
          <div>
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#1A1A1A]/15">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-sm">
                  ¶
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]/60">
                    Galley Proof • Synthesis
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Archival Entry Record</h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] p-1.5 border border-transparent hover:border-[#1A1A1A]/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Derived Mood & Themes Chips */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 text-[10px] text-[#1A1A1A]/70 font-bold uppercase tracking-[0.15em]">
                <Heart className="w-3 h-3 text-[#8C271E]" />
                <span>Tone:</span>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold border ${moodInfo.badgeClass}`}
              >
                <span
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: moodInfo.dotColor }}
                ></span>
                {moodInfo.label}
              </span>

              <div className="flex items-center space-x-1.5 text-[10px] text-[#1A1A1A]/70 ml-3 mr-1 font-bold uppercase tracking-[0.15em]">
                <Tag className="w-3 h-3 text-[#1A1A1A]" />
                <span>Index Tags:</span>
              </div>
              {summaryData.themes.map((theme, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono bg-white text-[#1A1A1A] border border-[#1A1A1A]/15"
                >
                  #{theme}
                </span>
              ))}
            </div>

            {/* Summary Body */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/70">
                  Synthesized Text
                </label>
                <button
                  onClick={() => {
                    if (!isEditing) setEditedSummary(summaryData.summary);
                    setIsEditing(!isEditing);
                  }}
                  className="text-xs text-[#1A1A1A] hover:underline flex items-center font-serif italic"
                >
                  <Edit3 className="w-3 h-3 mr-1 text-[#8C271E]" />
                  {isEditing ? 'Discard edits' : 'Edit text'}
                </button>
              </div>

              {isEditing ? (
                <textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  rows={4}
                  className="w-full p-3.5 text-sm font-editorial text-[#1A1A1A] bg-white border border-[#1A1A1A] focus:outline-none leading-relaxed"
                />
              ) : (
                <div className="p-4 bg-white border border-[#1A1A1A]/15 text-[15px] font-editorial text-[#1A1A1A] leading-relaxed shadow-2xs">
                  {summaryData.summary}
                </div>
              )}
            </div>

            {/* Key Takeaway as Editorial Pull Quote */}
            {summaryData.keyTakeaway && (
              <div className="mt-4 p-4 bg-[#F2EFE9] border-l-2 border-[#1A1A1A] text-xs text-[#1A1A1A]">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/70 block mb-1">
                  Essential Takeaway
                </span>
                <p className="font-serif italic text-[13px] leading-relaxed text-[#1A1A1A]">
                  "{summaryData.keyTakeaway}"
                </p>
              </div>
            )}

            {/* Storage Colophon Notice */}
            <div className="mt-5 text-[10px] text-[#1A1A1A]/60 bg-white p-2.5 border border-[#1A1A1A]/10 flex items-center space-x-2 font-mono">
              <span className="uppercase font-bold text-[#1A1A1A] bg-[#F2EFE9] px-1.5 py-0.5 border border-[#1A1A1A]/20">
                PER-USER VAULT
              </span>
              <span>Encrypted deposit to /users/{'{uid}'}/entries with zero cross-tenant leakage.</span>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-[#1A1A1A]/15">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs uppercase tracking-wider font-bold text-[#1A1A1A]/70 hover:text-[#1A1A1A] border border-transparent hover:border-[#1A1A1A]/20 transition-colors"
              >
                Return to Transcript
              </button>
              <button
                id="confirm-save-entry-btn"
                onClick={handleSave}
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] hover:bg-black text-white border border-[#1A1A1A] transition-all shadow-xs"
              >
                <Check className="w-3.5 h-3.5 text-[#8C271E]" />
                <span>Deposit into Archive</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
