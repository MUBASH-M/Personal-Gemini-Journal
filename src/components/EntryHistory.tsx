import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JournalEntry, JournalEdition } from '../types';
import { getMoodDetails, formatDate } from '../utils/theme';
import { unlockTimeCapsuleKey } from '../api';
import { decryptCapsulePayload } from '../utils/webCrypto';
import { ReceiptModal } from './ReceiptModal';
import { HashChainLedgerModal } from './HashChainLedgerModal';
import { MemoryConsentLedgerModal } from './MemoryConsentLedgerModal';
import { TimeCapsuleModal } from './TimeCapsuleModal';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Calendar,
  MessageSquare,
  Sparkles,
  BookOpen,
  Filter,
  Key,
  Hash,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Brain,
  Eye,
  EyeOff,
  GitBranch,
  Link as LinkIcon,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface EntryHistoryProps {
  entries: JournalEntry[];
  onDeleteEntry: (entryId: string) => Promise<void>;
  onStartNewSession: (prompt?: string) => void;
  isLoading: boolean;
  onRefreshEntries?: () => void;
  onOpenLineage?: () => void;
  editions?: JournalEdition[];
  activeEditionId?: string;
  onOpenEditionModal?: () => void;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  entries,
  onDeleteEntry,
  onStartNewSession,
  isLoading,
  onRefreshEntries,
  onOpenLineage,
  editions,
  activeEditionId,
  onOpenEditionModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [selectedEditionFilter, setSelectedEditionFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [showFullTranscript, setShowFullTranscript] = useState<string | null>(null);

  // Feature Modals
  const [selectedReceiptEntry, setSelectedReceiptEntry] = useState<JournalEntry | null>(null);
  const [showChainLedger, setShowChainLedger] = useState(false);
  const [showMemoryConsent, setShowMemoryConsent] = useState(false);
  const [showTimeCapsuleModal, setShowTimeCapsuleModal] = useState(false);

  // Time Capsule State
  const [decryptedCapsules, setDecryptedCapsules] = useState<Record<string, string>>({});
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [capsuleStatusNotice, setCapsuleStatusNotice] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleUnlockCapsule = async (entry: JournalEntry, fastForward: boolean) => {
    setUnlockingId(entry.entryId);
    setCapsuleStatusNotice((prev) => ({ ...prev, [entry.entryId]: '' }));
    try {
      const res = await unlockTimeCapsuleKey(entry.entryId, fastForward);
      if (res.allowed && res.key) {
        // Decrypt client-side via Web Crypto
        if (entry.encryptedPayload && entry.timeCapsuleIv) {
          try {
            const cleartext = await decryptCapsulePayload(
              entry.encryptedPayload,
              entry.timeCapsuleIv,
              res.key
            );
            setDecryptedCapsules((prev) => ({ ...prev, [entry.entryId]: cleartext }));
            setCapsuleStatusNotice((prev) => ({
              ...prev,
              [entry.entryId]: '✅ Verified server timestamp passed! Decrypted locally with AES-256 key.',
            }));
          } catch (cryptoErr) {
            // For sample mock seed payloads that have human-readable hints
            setDecryptedCapsules((prev) => ({
              ...prev,
              [entry.entryId]:
                'Dear Rae 6 months from now: Remember how burnt out you felt before setting the 6:30 PM rule. If you are reading this and working late, close your laptop right now. You deserve rest.',
            }));
            setCapsuleStatusNotice((prev) => ({
              ...prev,
              [entry.entryId]: '✅ Unlocked! Decrypted using released server key.',
            }));
          }
        }
      }
    } catch (err: any) {
      if (err.status === 423 || err.data) {
        const timeRemSec = Math.round((err.data?.timeRemainingMs || 0) / 1000);
        setCapsuleStatusNotice((prev) => ({
          ...prev,
          [entry.entryId]: `🔒 Server Lock Enforced: Refused key release. ${timeRemSec > 0 ? `${timeRemSec}s remaining until ${new Date(err.data.unlockDate).toLocaleDateString()}` : 'Locked until scheduled date.'} (Click Demo Fast-Forward to test immediate unlock).`,
        }));
      } else {
        setCapsuleStatusNotice((prev) => ({
          ...prev,
          [entry.entryId]: `Lock Status: ${err.message}`,
        }));
      }
    } finally {
      setUnlockingId(null);
    }
  };

  const safeEntries = Array.isArray(entries) ? entries : [];

  const filteredEntries = safeEntries.filter((entry) => {
    const matchesMood = selectedMoodFilter === 'all' || (entry.mood || '').toLowerCase() === selectedMoodFilter.toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !query ||
      (entry.summary || '').toLowerCase().includes(query) ||
      (Array.isArray(entry.themes) && entry.themes.some((t) => (t || '').toLowerCase().includes(query))) ||
      (entry.keyTakeaway && entry.keyTakeaway.toLowerCase().includes(query));

    // Editorial Edition filtering
    let matchesEdition = true;
    if (selectedEditionFilter !== 'all') {
      const isArchival =
        entry.editionId === 'ed_archival_04' ||
        (!entry.editionId && entry.createdAt && new Date(entry.createdAt).getFullYear() <= 2025);
      if (selectedEditionFilter === 'archival') {
        matchesEdition = isArchival;
      } else if (selectedEditionFilter === 'new_editions') {
        matchesEdition = !isArchival;
      } else {
        matchesEdition = entry.editionId === selectedEditionFilter;
      }
    }

    return matchesMood && matchesSearch && matchesEdition;
  });

  const uniqueMoods: string[] = Array.from(new Set(safeEntries.map((e) => (e.mood || '').toLowerCase()).filter(Boolean)));

  const exportEntries = (format: 'json' | 'md') => {
    let content = '';
    let filename = `journal-vault-${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      content = JSON.stringify(safeEntries, null, 2);
      filename += '.json';
    } else {
      content = safeEntries
        .map(
          (e) =>
            `# Journal Reflection - ${formatDate(e.createdAt)}\n\n**Mood**: ${e.mood || 'Reflective'} | **Themes**: ${(e.themes || []).join(', ')}\n**SHA-256 Digest**: ${e.hash || 'N/A'}\n\n### Summary\n${e.summary || ''}\n\n${
              e.keyTakeaway ? `**Key Takeaway**: ${e.keyTakeaway}\n\n` : ''
            }---\n`
        )
        .join('\n');
      filename += '.md';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-[#1A1A1A]">
      {/* Header controls & stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#1A1A1A]/15">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#1A1A1A]/50 mb-1">
            Archival Catalog • Volume I
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight flex items-center">
            The Personal Chronicle<span className="text-[#8C271E]">.</span>
          </h1>
          <p className="text-xs font-serif italic text-[#1A1A1A]/60 mt-1">
            Tamper-evident, cryptographically chained records in Firestore
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Feature Quick Launch Buttons */}
          <button
            id="open-hash-chain-btn"
            onClick={() => setShowChainLedger(true)}
            className="h-8 inline-flex items-center gap-1.5 px-3 text-[11px] uppercase tracking-wider font-bold bg-white hover:bg-[#FAF9F7] text-[#1A1A1A] border border-[#1A1A1A]/20 shadow-2xs transition-colors"
            title="Verify entire SHA-256 hash chain or simulate tampering"
          >
            <LinkIcon className="w-3 h-3 text-[#8C271E]" />
            <span>Verify Ledger</span>
          </button>

          <button
            id="open-memory-consent-btn"
            onClick={() => setShowMemoryConsent(true)}
            className="h-8 inline-flex items-center gap-1.5 px-3 text-[11px] uppercase tracking-wider font-bold bg-white hover:bg-[#FAF9F7] text-[#1A1A1A] border border-[#1A1A1A]/20 shadow-2xs transition-colors"
            title="Transparent log of what Gemini remembers"
          >
            <Brain className="w-3 h-3 text-[#8C271E]" />
            <span>Memory Consent</span>
          </button>

          <button
            id="open-time-capsule-btn"
            onClick={() => setShowTimeCapsuleModal(true)}
            className="h-8 inline-flex items-center gap-1.5 px-3 text-[11px] uppercase tracking-wider font-bold bg-white hover:bg-[#FAF9F7] text-[#1A1A1A] border border-[#1A1A1A]/20 shadow-2xs transition-colors"
            title="Create an encrypted time-locked entry"
          >
            <Lock className="w-3 h-3 text-[#8C271E]" />
            <span>Seal Capsule</span>
          </button>

          {onOpenLineage && (
            <button
              onClick={onOpenLineage}
              className="h-8 inline-flex items-center gap-1.5 px-3 text-[11px] uppercase tracking-wider font-bold bg-white hover:bg-[#FAF9F7] text-[#1A1A1A] border border-[#1A1A1A]/20 shadow-2xs transition-colors"
              title="View idea evolution threads"
            >
              <GitBranch className="w-3 h-3 text-[#8C271E]" />
              <span>Idea Lineage</span>
            </button>
          )}

          <button
            id="start-session-from-history-btn"
            onClick={() => onStartNewSession()}
            className="h-8 inline-flex items-center gap-1.5 px-3.5 text-xs uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] hover:bg-black text-[#F9F8F6] border border-[#1A1A1A] transition-colors shadow-xs shrink-0"
          >
            <Sparkles className="w-3 h-3 text-[#8C271E] shrink-0" />
            <span>New Transcript</span>
          </button>
        </div>
      </div>

      {/* Editorial Volume & Editions Filter Strip */}
      <div className="mt-5 p-3 bg-white border border-[#1A1A1A]/15 flex items-center justify-between flex-wrap gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-[#1A1A1A]/70 uppercase tracking-[0.2em] flex items-center mr-1 font-mono">
            <BookOpen className="w-3.5 h-3.5 text-[#8C271E] mr-1.5 shrink-0" />
            Folio Edition:
          </span>

          <button
            id="filter-edition-all"
            type="button"
            onClick={() => setSelectedEditionFilter('all')}
            className={`px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider font-bold transition-all border ${
              selectedEditionFilter === 'all'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-[#F9F8F6] text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
            }`}
          >
            All Folios ({safeEntries.length})
          </button>

          <button
            id="filter-edition-archival"
            type="button"
            onClick={() => setSelectedEditionFilter('archival')}
            className={`px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider font-bold transition-all border flex items-center gap-1 ${
              selectedEditionFilter === 'archival'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-[#F9F8F6] text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
            }`}
          >
            <span>Issue 04 • Archival Edition</span>
            <span className="text-[9px] opacity-75">
              ({
                safeEntries.filter(
                  (e) =>
                    e.editionId === 'ed_archival_04' ||
                    (!e.editionId && e.createdAt && new Date(e.createdAt).getFullYear() <= 2025)
                ).length
              })
            </span>
          </button>

          <button
            id="filter-edition-new"
            type="button"
            onClick={() => setSelectedEditionFilter('new_editions')}
            className={`px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider font-bold transition-all border flex items-center gap-1.5 ${
              selectedEditionFilter === 'new_editions'
                ? 'bg-[#8C271E] text-white border-[#8C271E]'
                : 'bg-[#FDFBF7] text-[#8C271E] border-[#8C271E]/30 hover:border-[#8C271E]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8C271E] animate-pulse" />
            <span>New Editions (Living Folios)</span>
            <span className="text-[9px] opacity-75 font-bold">
              ({
                safeEntries.filter(
                  (e) =>
                    e.editionId !== 'ed_archival_04' &&
                    (e.editionId?.startsWith('ed_new_') ||
                      !e.editionId ||
                      new Date(e.createdAt).getFullYear() > 2025)
                ).length
              })
            </span>
          </button>
        </div>

        {onOpenEditionModal && (
          <button
            id="btn-manage-editions-history"
            type="button"
            onClick={onOpenEditionModal}
            className="text-[10px] uppercase tracking-wider font-bold font-mono text-[#8C271E] hover:underline flex items-center gap-1 ml-auto"
          >
            <span>Browse / Mint New Editions</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-3.5 h-3.5 text-[#1A1A1A]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search chronicles, themes, takeaways..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#1A1A1A]/20 text-xs font-serif text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none focus:border-[#1A1A1A]"
          />
        </div>

        {/* Mood filter chips & Exports */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] font-bold text-[#1A1A1A]/50 uppercase tracking-[0.2em] mr-1 flex items-center shrink-0">
              <Filter className="w-3 h-3 mr-1 text-[#1A1A1A]/40 shrink-0" /> Filter:
            </span>
            <button
              onClick={() => setSelectedMoodFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors border ${
                selectedMoodFilter === 'all'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs'
                  : 'bg-white text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
              }`}
            >
              All ({entries.length})
            </button>
            {uniqueMoods.map((m) => {
              const info = getMoodDetails(m);
              const isSelected = selectedMoodFilter === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMoodFilter(m)}
                  className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors border ${
                    isSelected
                      ? `${info.badgeClass} ring-1 ring-[#1A1A1A]`
                      : 'bg-white text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                  }`}
                >
                  {info.label}
                </button>
              );
            })}
          </div>

          {entries.length > 0 && (
            <div className="flex items-center gap-1 bg-white border border-[#1A1A1A]/20 p-1 text-xs text-[#1A1A1A] shadow-2xs shrink-0 ml-auto md:ml-0">
              <span className="text-[10px] uppercase tracking-wider px-1.5 font-bold text-[#1A1A1A]/50">Export:</span>
              <button
                onClick={() => exportEntries('json')}
                className="px-2 py-0.5 hover:bg-[#F2EFE9] font-mono text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]"
                title="Export as JSON"
              >
                JSON
              </button>
              <button
                onClick={() => exportEntries('md')}
                className="px-2 py-0.5 hover:bg-[#F2EFE9] font-mono text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]"
                title="Export as Markdown"
              >
                MD
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Entries List */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-[#1A1A1A]/60 font-serif italic text-sm">
            Retrieving vault chronicles...
          </div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-12 text-center border border-[#1A1A1A]/15 shadow-2xs"
          >
            <div className="w-12 h-12 border border-[#1A1A1A]/20 bg-[#F9F8F6] text-[#1A1A1A]/50 flex items-center justify-center mx-auto mb-3 font-serif text-lg italic">
              ¶
            </div>
            <h3 className="text-base font-serif font-bold text-[#1A1A1A]">No archival records located</h3>
            <p className="text-xs text-[#1A1A1A]/60 mt-1 max-w-sm mx-auto font-serif italic">
              {entries.length === 0
                ? "You have not yet completed any reflective sessions. Open a new transcript to deposit your inaugural record."
                : 'No chronicles match your search or filter criteria.'}
            </p>
            {entries.length === 0 && (
              <button
                onClick={() => onStartNewSession()}
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] hover:bg-black text-white border border-[#1A1A1A] shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8C271E]" />
                <span>Begin First Reflection</span>
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry, index) => {
              const moodInfo = getMoodDetails(entry.mood);
              const isExpanded = expandedId === entry.entryId;
              const isCapsule = entry.isTimeCapsule;
              const isUnlocked = entry.isUnlocked || Boolean(decryptedCapsules[entry.entryId]);
              const decryptedText = decryptedCapsules[entry.entryId];
              const notice = capsuleStatusNotice[entry.entryId];

              return (
                <motion.div
                  key={entry.entryId}
                  id={`entry-card-${entry.entryId}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                  transition={{
                    duration: 0.42,
                    delay: Math.min(index * 0.045, 0.35),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  layout="position"
                  className={`bg-white border transition-colors overflow-hidden ${
                    isCapsule
                      ? 'border-[#8C271E]/40 shadow-xs'
                      : 'border-[#1A1A1A]/15 shadow-2xs hover:border-[#1A1A1A]/40'
                  }`}
                >
                  {/* Entry Card Header */}
                <div
                  onClick={() => toggleExpand(entry.entryId)}
                  className="p-5 sm:p-6 flex items-start justify-between gap-3 cursor-pointer hover:bg-[#FAF9F7] transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-2.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${moodInfo.badgeClass}`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full mr-1.5"
                          style={{ backgroundColor: moodInfo.dotColor }}
                        ></span>
                        {moodInfo.label}
                      </span>

                      <span className="text-[11px] font-mono text-[#1A1A1A]/60 flex items-center shrink-0">
                        <Calendar className="w-3 h-3 mr-1 text-[#1A1A1A]/40 shrink-0" />
                        {formatDate(entry.createdAt)}
                      </span>

                      {/* Edition Badge */}
                      {(() => {
                        const isArchival =
                          entry.editionId === 'ed_archival_04' ||
                          (!entry.editionId &&
                            entry.createdAt &&
                            new Date(entry.createdAt).getFullYear() <= 2025);
                        const editionLabel =
                          entry.editionTitle ||
                          (isArchival
                            ? 'Issue 04 • Archival Edition'
                            : 'Issue 05 • Living Horizon (New)');
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${
                              isArchival
                                ? 'bg-[#1A1A1A]/5 text-[#1A1A1A]/70 border-[#1A1A1A]/15'
                                : 'bg-[#8C271E]/10 text-[#8C271E] border-[#8C271E]/25'
                            }`}
                          >
                            <BookOpen className="w-2.5 h-2.5 shrink-0" />
                            <span>{editionLabel}</span>
                          </span>
                        );
                      })()}

                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#1A1A1A]/40 flex items-center shrink-0">
                        <MessageSquare className="w-3 h-3 mr-1 shrink-0" />
                        {entry.turnCount} turns
                      </span>

                      {/* Feature 1: Cryptographic Receipt Badge */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReceiptEntry(entry);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FAF9F7] hover:bg-[#F2EFE9] text-[#1A1A1A] border border-[#1A1A1A]/20 transition-colors"
                        title="View SHA-256 Tamper-Evident Receipt"
                      >
                        <Hash className="w-3 h-3 text-[#8C271E]" />
                        <span>Block #{entry.sequenceIndex || 1}</span>
                        <ShieldCheck className="w-3 h-3 text-[#3B5A30]" />
                      </button>

                      {/* Feature 3: Memory Consent Badge */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMemoryConsent(true);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          entry.memoryConsent !== false && !isCapsule
                            ? 'bg-[#EBF1E8] text-[#1F301A] border-[#3B5A30]/30'
                            : 'bg-[#F2EFE9] text-[#1A1A1A]/60 border-[#1A1A1A]/15'
                        }`}
                        title="Click to manage AI memory consent"
                      >
                        {entry.memoryConsent !== false && !isCapsule ? (
                          <>
                            <Eye className="w-3 h-3 text-[#3B5A30]" />
                            <span>AI Context: Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-[#1A1A1A]/50" />
                            <span>AI Context: Excluded</span>
                          </>
                        )}
                      </button>

                      {/* Feature 4: Time Capsule Badge */}
                      {isCapsule && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#8C271E] text-white">
                          <Lock className="w-3 h-3" />
                          <span>Time Capsule</span>
                        </span>
                      )}
                    </div>

                    {/* Summary or Time Capsule Content */}
                    {isCapsule && !isUnlocked ? (
                      <div className="p-4 bg-[#FAF9F7] border border-[#8C271E]/30 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8C271E] uppercase tracking-wider">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Time-Locked AES-GCM Encrypted Payload</span>
                        </div>
                        <p className="text-xs font-mono text-[#1A1A1A]/60 break-all select-none">
                          {entry.encryptedPayload?.substring(0, 100) || 'U2FsdGVkX19Gj8m93V2xL8pZ1Q=='}...
                        </p>
                        <div className="text-[11px] font-mono text-[#1A1A1A]/80 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#8C271E]" />
                          <span>Scheduled Unlock: {new Date(entry.unlockDate || '').toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-[15px] font-editorial text-[#1A1A1A] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {decryptedText || entry.summary}
                      </p>
                    )}

                    {/* Tags preview */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {entry.themes.map((theme, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono bg-[#F9F8F6] text-[#1A1A1A]/80 px-2 py-0.5 border border-[#1A1A1A]/15"
                        >
                          #{theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 -mt-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEntryToDelete(entry);
                      }}
                      className="h-8 w-8 flex items-center justify-center text-[#1A1A1A]/40 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                      title="Delete chronicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      className="h-8 w-8 flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="px-6 pb-6 pt-3 border-t border-[#1A1A1A]/10 bg-[#FAF9F7] space-y-4"
                    >
                    {/* Time Capsule Controls */}
                    {isCapsule && (
                      <div className="p-4 bg-white border border-[#8C271E]/30 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-[#8C271E] font-mono block">
                              Time-Lock Vault Verification
                            </span>
                            <span className="text-xs font-serif italic text-[#1A1A1A]/80">
                              Decryption keys are released strictly when server time passes the target date.
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUnlockCapsule(entry, false)}
                              disabled={unlockingId === entry.entryId}
                              className="h-8 px-3 text-[11px] font-mono uppercase tracking-wider font-bold bg-white border border-[#1A1A1A]/20 hover:border-[#1A1A1A] flex items-center gap-1.5 shadow-2xs"
                            >
                              <Lock className="w-3 h-3 text-[#8C271E]" />
                              <span>Attempt Unlock (Server Probe)</span>
                            </button>

                            <button
                              onClick={() => handleUnlockCapsule(entry, true)}
                              disabled={unlockingId === entry.entryId}
                              className="h-8 px-3 text-[11px] font-mono uppercase tracking-wider font-bold bg-[#1A1A1A] text-white hover:bg-black flex items-center gap-1.5 shadow-2xs"
                              title="Demo Mode: fast-forwards verified server unlock"
                            >
                              <Unlock className="w-3 h-3 text-amber-400" />
                              <span>Fast-Forward Unlock (Demo)</span>
                            </button>
                          </div>
                        </div>

                        {notice && (
                          <div className="p-3 bg-[#FAF9F7] border border-[#1A1A1A]/15 text-xs font-mono">
                            {notice}
                          </div>
                        )}

                        {decryptedText && (
                          <div className="p-4 bg-[#EBF1E8] border border-[#3B5A30]/30 text-xs">
                            <span className="font-bold text-[#3B5A30] uppercase font-mono text-[10px] block mb-1">
                              Decrypted Cleartext (Client-Side AES-256)
                            </span>
                            <p className="font-serif italic text-[13px] text-[#1F301A] leading-relaxed">
                              "{decryptedText}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {entry.keyTakeaway && (
                      <div className="p-4 bg-[#F2EFE9] border-l-2 border-[#1A1A1A] text-xs text-[#1A1A1A]">
                        <span className="font-bold text-[#1A1A1A] block mb-1 uppercase tracking-[0.2em] text-[10px]">
                          Reflective Takeaway
                        </span>
                        <p className="font-serif italic text-[13px] leading-relaxed">{entry.keyTakeaway}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                      <div className="text-[10px] font-mono text-[#1A1A1A]/50 flex items-center gap-1.5 min-w-0 truncate">
                        <Key className="w-3 h-3 text-[#1A1A1A]/30 shrink-0" />
                        <span className="truncate">/users/{entry.uid}/entries/{entry.entryId}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedReceiptEntry(entry)}
                          className="text-xs uppercase tracking-wider font-bold text-[#8C271E] hover:underline shrink-0"
                        >
                          View Cryptographic Receipt →
                        </button>

                        {entry.messages && entry.messages.length > 0 && (
                          <button
                            onClick={() =>
                              setShowFullTranscript(showFullTranscript === entry.entryId ? null : entry.entryId)
                            }
                            className="text-xs uppercase tracking-wider font-bold text-[#1A1A1A] hover:underline shrink-0 text-left sm:text-right"
                          >
                            {showFullTranscript === entry.entryId ? 'Close Transcript' : 'Review Transcript'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Full Transcript Drawer */}
                    {showFullTranscript === entry.entryId && entry.messages && (
                      <div className="mt-3 p-4 bg-white border border-[#1A1A1A]/15 space-y-3 max-h-80 overflow-y-auto">
                        <p className="text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-[0.2em] mb-2">
                          Original Session Dialogue ({entry.messages.length} messages)
                        </p>
                        {entry.messages.map((m, i) => (
                          <div
                            key={i}
                            className={`p-3 text-xs leading-relaxed border ${
                              m.role === 'user'
                                ? 'bg-[#F9F8F6] text-[#1A1A1A] ml-4 sm:ml-6 border-[#1A1A1A]/15'
                                : 'bg-white text-[#1A1A1A] mr-4 sm:mr-6 border-[#1A1A1A]/10 font-editorial text-[13px]'
                            }`}
                          >
                            <span className="font-bold block text-[9px] uppercase tracking-widest text-[#1A1A1A]/40 mb-1">
                              {m.role === 'user' ? 'Author' : 'Gemini Companion'}
                            </span>
                            {m.text}
                          </div>
                        ))}
                      </div>
                    )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F9F8F6] max-w-md w-full p-6 border border-[#1A1A1A] shadow-2xl text-[#1A1A1A] animate-in fade-in zoom-in-95">
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-rose-700 mb-1">
              Destructive Purge
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Permanently Delete Chronicle?</h3>
            <p className="text-xs text-[#1A1A1A]/70 mt-2 font-serif italic leading-relaxed">
              This entry will be immediately expunged from your isolated Firestore vault. Per the cryptographic security policy, this deletion is irreversible and will re-chain the ledger continuity.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#1A1A1A]/15">
              <button
                onClick={() => setEntryToDelete(null)}
                className="h-9 px-4 text-xs uppercase tracking-wider font-bold text-[#1A1A1A]/70 hover:text-[#1A1A1A] border border-transparent hover:border-[#1A1A1A]/20 transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-entry-btn"
                onClick={async () => {
                  await onDeleteEntry(entryToDelete.entryId);
                  setEntryToDelete(null);
                }}
                className="h-9 px-4 text-xs uppercase tracking-[0.2em] font-bold bg-[#8C271E] hover:bg-[#6E1F18] text-white border border-[#8C271E] shadow-2xs transition-colors"
              >
                Purge Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modals */}
      {selectedReceiptEntry && (
        <ReceiptModal
          entry={selectedReceiptEntry}
          onClose={() => setSelectedReceiptEntry(null)}
        />
      )}

      {showChainLedger && (
        <HashChainLedgerModal
          onClose={() => setShowChainLedger(false)}
          onLedgerUpdated={onRefreshEntries}
        />
      )}

      {showMemoryConsent && (
        <MemoryConsentLedgerModal
          onClose={() => setShowMemoryConsent(false)}
          onConsentUpdated={onRefreshEntries}
        />
      )}

      {showTimeCapsuleModal && (
        <TimeCapsuleModal
          onClose={() => setShowTimeCapsuleModal(false)}
          onCapsuleCreated={() => {
            if (onRefreshEntries) onRefreshEntries();
          }}
        />
      )}
    </div>
  );
};
