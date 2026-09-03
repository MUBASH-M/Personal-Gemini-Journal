import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { getMoodDetails, formatDate } from '../utils/theme';
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
} from 'lucide-react';

interface EntryHistoryProps {
  entries: JournalEntry[];
  onDeleteEntry: (entryId: string) => Promise<void>;
  onStartNewSession: () => void;
  isLoading: boolean;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  entries,
  onDeleteEntry,
  onStartNewSession,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [showFullTranscript, setShowFullTranscript] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesMood = selectedMoodFilter === 'all' || entry.mood.toLowerCase() === selectedMoodFilter.toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !query ||
      entry.summary.toLowerCase().includes(query) ||
      entry.themes.some((t) => t.toLowerCase().includes(query)) ||
      (entry.keyTakeaway && entry.keyTakeaway.toLowerCase().includes(query));
    return matchesMood && matchesSearch;
  });

  const uniqueMoods: string[] = Array.from(new Set(entries.map((e) => e.mood.toLowerCase())));

  const exportEntries = (format: 'json' | 'md') => {
    let content = '';
    let filename = `journal-vault-${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      content = JSON.stringify(entries, null, 2);
      filename += '.json';
    } else {
      content = entries
        .map(
          (e) =>
            `# Journal Reflection - ${formatDate(e.createdAt)}\n\n**Mood**: ${e.mood} | **Themes**: ${e.themes.join(', ')}\n\n### Summary\n${e.summary}\n\n${
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
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-[#1A1A1A]/15">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#1A1A1A]/50 mb-1">
            Archival Catalog • Volume I
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight flex items-center">
            The Personal Chronicle<span className="text-[#8C271E]">.</span>
          </h1>
          <p className="text-xs font-serif italic text-[#1A1A1A]/60 mt-1">
            Persisted exclusively under your verified cryptographic UID path in Cloud Firestore
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {entries.length > 0 && (
            <div className="flex items-center space-x-1 bg-white border border-[#1A1A1A]/20 p-1 text-xs text-[#1A1A1A] shadow-2xs">
              <span className="text-[10px] uppercase tracking-wider px-2 font-bold text-[#1A1A1A]/50">Export:</span>
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
                Markdown
              </button>
            </div>
          )}

          <button
            id="start-session-from-history-btn"
            onClick={onStartNewSession}
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] hover:bg-black text-[#F9F8F6] border border-[#1A1A1A] transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8C271E]" />
            <span>New Transcript</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-84">
          <Search className="w-3.5 h-3.5 text-[#1A1A1A]/40 absolute left-3.5 top-3" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search chronicles, themes, takeaways..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#1A1A1A]/20 text-xs font-serif text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none focus:border-[#1A1A1A]"
          />
        </div>

        {/* Mood filter chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1">
          <span className="text-[10px] font-bold text-[#1A1A1A]/50 uppercase tracking-[0.2em] mr-1 flex items-center shrink-0">
            <Filter className="w-3 h-3 mr-1 text-[#1A1A1A]/40" /> Filter:
          </span>
          <button
            onClick={() => setSelectedMoodFilter('all')}
            className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors border ${
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
                className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors border ${
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
      </div>

      {/* Entries List */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-[#1A1A1A]/60 font-serif italic text-sm">
            Retrieving vault chronicles...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white p-12 text-center border border-[#1A1A1A]/15 shadow-2xs">
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
                onClick={onStartNewSession}
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] hover:bg-black text-white border border-[#1A1A1A] shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8C271E]" />
                <span>Begin First Reflection</span>
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const moodInfo = getMoodDetails(entry.mood);
            const isExpanded = expandedId === entry.entryId;

            return (
              <div
                key={entry.entryId}
                id={`entry-card-${entry.entryId}`}
                className="bg-white border border-[#1A1A1A]/15 shadow-2xs hover:border-[#1A1A1A]/40 transition-all overflow-hidden"
              >
                {/* Entry Card Header */}
                <div
                  onClick={() => toggleExpand(entry.entryId)}
                  className="p-5 sm:p-6 flex items-start justify-between cursor-pointer hover:bg-[#FAF9F7] transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${moodInfo.badgeClass}`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full mr-1.5"
                          style={{ backgroundColor: moodInfo.dotColor }}
                        ></span>
                        {moodInfo.label}
                      </span>

                      <span className="text-[11px] font-mono text-[#1A1A1A]/60 flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-[#1A1A1A]/40" />
                        {formatDate(entry.createdAt)}
                      </span>

                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#1A1A1A]/40 flex items-center">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {entry.turnCount} turns
                      </span>
                    </div>

                    <p className={`text-[15px] font-editorial text-[#1A1A1A] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {entry.summary}
                    </p>

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

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEntryToDelete(entry);
                      }}
                      className="p-1.5 text-[#1A1A1A]/40 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                      title="Delete chronicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      className="p-1.5 text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-3 border-t border-[#1A1A1A]/10 bg-[#FAF9F7] space-y-4">
                    {entry.keyTakeaway && (
                      <div className="p-4 bg-[#F2EFE9] border-l-2 border-[#1A1A1A] text-xs text-[#1A1A1A]">
                        <span className="font-bold text-[#1A1A1A] block mb-1 uppercase tracking-[0.2em] text-[10px]">
                          Reflective Takeaway
                        </span>
                        <p className="font-serif italic text-[13px] leading-relaxed">{entry.keyTakeaway}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[10px] font-mono text-[#1A1A1A]/50 flex items-center space-x-1">
                        <Key className="w-3 h-3 text-[#1A1A1A]/30" />
                        <span>/users/{entry.uid}/entries/{entry.entryId}</span>
                      </div>

                      {entry.messages && entry.messages.length > 0 && (
                        <button
                          onClick={() =>
                            setShowFullTranscript(showFullTranscript === entry.entryId ? null : entry.entryId)
                          }
                          className="text-xs uppercase tracking-wider font-bold text-[#1A1A1A] hover:underline"
                        >
                          {showFullTranscript === entry.entryId ? 'Close Transcript' : 'Review Full Transcript'}
                        </button>
                      )}
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
                                ? 'bg-[#F9F8F6] text-[#1A1A1A] ml-6 border-[#1A1A1A]/15'
                                : 'bg-white text-[#1A1A1A] mr-6 border-[#1A1A1A]/10 font-editorial text-[13px]'
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
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal in Editorial Style */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F9F8F6] max-w-md w-full p-6 border border-[#1A1A1A] shadow-2xl text-[#1A1A1A] animate-in fade-in zoom-in-95">
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-rose-700 mb-1">
              Destructive Purge
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Permanently Delete Chronicle?</h3>
            <p className="text-xs text-[#1A1A1A]/70 mt-2 font-serif italic leading-relaxed">
              This entry will be immediately expunged from your isolated Firestore vault. Per the cryptographic security policy, this deletion is irreversible.
            </p>
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-[#1A1A1A]/15">
              <button
                onClick={() => setEntryToDelete(null)}
                className="px-4 py-2 text-xs uppercase tracking-wider font-bold text-[#1A1A1A]/70 hover:text-[#1A1A1A] border border-transparent hover:border-[#1A1A1A]/20"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-entry-btn"
                onClick={async () => {
                  await onDeleteEntry(entryToDelete.entryId);
                  setEntryToDelete(null);
                }}
                className="px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold bg-[#8C271E] hover:bg-[#6E1F18] text-white border border-[#8C271E] shadow-2xs"
              >
                Purge Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
