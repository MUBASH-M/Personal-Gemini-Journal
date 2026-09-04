import React, { useState, useEffect } from 'react';
import { MemoryConsentItem } from '../types';
import { getMemoryConsentLedger, toggleMemoryConsent } from '../api';
import { formatDate } from '../utils/theme';
import {
  Brain,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  FileText,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Terminal,
} from 'lucide-react';

interface MemoryConsentLedgerModalProps {
  onClose: () => void;
  onConsentUpdated?: () => void;
}

export const MemoryConsentLedgerModal: React.FC<MemoryConsentLedgerModalProps> = ({
  onClose,
  onConsentUpdated,
}) => {
  const [items, setItems] = useState<MemoryConsentItem[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showPromptInspector, setShowPromptInspector] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      const data = await getMemoryConsentLedger();
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems(list);
      setTotalActive(typeof data?.totalActiveMemories === 'number' ? data.totalActiveMemories : list.filter(i => i.isConsented).length);
      setTotalTokens(typeof data?.totalTokensInjected === 'number' ? data.totalTokensInjected : 0);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const safeItems = Array.isArray(items) ? items : [];

  const handleToggle = async (entryId: string, currentConsented: boolean) => {
    setTogglingId(entryId);
    const newConsent = !currentConsented;
    try {
      await toggleMemoryConsent(entryId, newConsent);
      setItems((prev) =>
        (prev || []).map((item) => (item.entryId === entryId ? { ...item, isConsented: newConsent } : item))
      );
      setTotalActive((prev) => (newConsent ? prev + 1 : Math.max(0, prev - 1)));
      setTotalTokens((prev) => {
        const item = safeItems.find((i) => i.entryId === entryId);
        const delta = item ? item.tokenEstimate : 40;
        return newConsent ? prev + delta : Math.max(0, prev - delta);
      });
      if (onConsentUpdated) onConsentUpdated();
    } catch (err) {
      console.error('Failed to toggle consent:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const consentedItems = safeItems.filter((i) => i.isConsented);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F7] max-w-3xl w-full border border-[#1A1A1A] shadow-2xl text-[#1A1A1A] animate-in fade-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1A1A1A] text-[#F9F8F6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#8C271E]" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] font-bold font-mono">
                AI Memory Consent Ledger
              </div>
              <div className="text-[10px] text-white/60 font-serif italic">
                Transparent Control Over What Gemini Remembers
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Bar */}
        <div className="px-6 py-3 bg-[#F2EFE9] border-b border-[#1A1A1A]/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#1A1A1A]/50 mr-1.5">
                Active In Context:
              </span>
              <span className="font-bold text-[#1A1A1A]">
                {totalActive} of {items.length} Memories
              </span>
            </div>
            <div className="hidden sm:inline text-[#1A1A1A]/30">•</div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#1A1A1A]/50 mr-1.5">
                Injected Context Footprint:
              </span>
              <span className="font-bold text-[#8C271E]">~{totalTokens} Tokens</span>
            </div>
          </div>

          <button
            onClick={() => setShowPromptInspector(!showPromptInspector)}
            className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A] hover:underline flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-[#8C271E]" />
            <span>{showPromptInspector ? 'Hide Injected Prompt' : 'Inspect Injected System Prompt'}</span>
          </button>
        </div>

        {/* Prompt Inspector Drawer */}
        {showPromptInspector && (
          <div className="px-6 py-4 bg-[#1A1A1A] text-white/90 text-xs font-mono space-y-2 border-b border-[#1A1A1A] max-h-56 overflow-y-auto shrink-0 animate-in fade-in">
            <div className="flex items-center justify-between text-[10px] text-white/50 uppercase tracking-widest font-bold">
              <span>Server-Side System Instruction Context Header</span>
              <span>Runtime Verification</span>
            </div>
            <pre className="text-[11px] leading-relaxed text-[#F9F8F6] whitespace-pre-wrap bg-black/40 p-3 border border-white/10">
{`--- MEMORY CONSENT LEDGER CONTEXT ---
The user has explicitly consented to granting you access to the following historical journal memory snippets:
${
  consentedItems.length === 0
    ? '[NO MEMORIES PERMITTED - ZERO CONTEXT INJECTED]'
    : consentedItems
        .map(
          (m, idx) =>
            `[Memory #${idx + 1} | ${new Date(m.createdAt).toLocaleDateString()}]: ${m.extractedMemory}`
        )
        .join('\n')
}
Use these memories subtly to foster empathetic continuity when relevant, but never force them unnecessarily.`}
            </pre>
          </div>
        )}

        {/* List of Memories */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="text-xs font-serif italic text-[#1A1A1A]/70 leading-relaxed">
            Every session distilled into your archive produces an extracted memory card. Unlike closed AI
            platforms where context retrieval is an opaque black box, you maintain strict granular control:
            toggle off any memory to immediately expunge it from future Gemini conversation prompts.
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs font-serif italic text-[#1A1A1A]/60">
              Retrieving memory consent ledger...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-xs font-serif italic text-[#1A1A1A]/60 bg-white border border-[#1A1A1A]/15">
              No memories registered yet. Complete a session to populate your consent ledger.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.entryId}
                  className={`p-4 border transition-all ${
                    item.isConsented
                      ? 'bg-white border-[#1A1A1A]/20 hover:border-[#1A1A1A]/50'
                      : 'bg-[#F5F4F0] border-dashed border-[#1A1A1A]/25 opacity-70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#1A1A1A]/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/50">
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FAF9F7] border border-[#1A1A1A]/15 text-[#1A1A1A] font-bold">
                        Mood: {item.mood}
                      </span>
                      <span className="text-[10px] font-mono text-[#1A1A1A]/40">
                        ~{item.tokenEstimate} tokens
                      </span>
                    </div>

                    {/* Toggle Control */}
                    <button
                      onClick={() => handleToggle(item.entryId, item.isConsented)}
                      disabled={togglingId === item.entryId}
                      className={`h-8 px-3 text-[11px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all shrink-0 ${
                        item.isConsented
                          ? 'bg-[#EBF1E8] border-[#3B5A30]/40 text-[#1F301A] hover:bg-[#DFE9DC]'
                          : 'bg-[#1A1A1A] text-white border-[#1A1A1A] hover:bg-black'
                      }`}
                    >
                      {item.isConsented ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-[#3B5A30]" />
                          <span>Consent: Active In AI</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-white/70" />
                          <span>Excluded / Forgotten</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#8C271E] block mb-1">
                      Gemini Extracted Memory Representation:
                    </span>
                    <p className="text-[13px] font-serif italic text-[#1A1A1A] leading-relaxed">
                      "{item.extractedMemory}"
                    </p>
                  </div>

                  <div className="mt-2 text-[11px] font-mono text-[#1A1A1A]/50 truncate">
                    Origin Entry: /users/{item.entryId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-[#1A1A1A]/15 flex items-center justify-between shrink-0">
          <div className="text-[10px] font-serif italic text-[#1A1A1A]/60 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3B5A30]" />
            <span>Zero Unconsented Context Leakage • Enforced Server-Side</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 px-4 text-xs uppercase tracking-wider font-bold bg-[#1A1A1A] text-white hover:bg-black transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
