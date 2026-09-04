import React, { useState, useEffect } from 'react';
import { IdeaLineageThread } from '../types';
import { getIdeaLineageThreads, traceIdeaLineage } from '../api';
import { formatDate } from '../utils/theme';
import {
  GitBranch,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Search,
  Calendar,
  Layers,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Compass,
} from 'lucide-react';

interface IdeaLineageViewProps {
  onContinueIdeaInChat: (prompt: string) => void;
  onOpenEntry?: (entryId: string) => void;
}

export const IdeaLineageView: React.FC<IdeaLineageViewProps> = ({
  onContinueIdeaInChat,
  onOpenEntry,
}) => {
  const [threads, setThreads] = useState<IdeaLineageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Query State
  const [customQuery, setCustomQuery] = useState('');
  const [isTracing, setIsTracing] = useState(false);
  const [customTraceResult, setCustomTraceResult] = useState<any | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const res = await getIdeaLineageThreads();
      const list = Array.isArray(res?.threads) ? res.threads : [];
      setThreads(list);
      if (list.length > 0) {
        setActiveThreadId(list[0].id);
      }
    } catch (err) {
      console.error(err);
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const safeThreads = Array.isArray(threads) ? threads : [];
  const activeThread = safeThreads.find((t) => t.id === activeThreadId) || safeThreads[0] || null;

  const handleRunTrace = async (queryToRun?: string) => {
    const q = queryToRun || customQuery;
    if (!q.trim() || isTracing) return;
    setIsTracing(true);
    setTraceError(null);
    try {
      const res = await traceIdeaLineage(q.trim());
      setCustomTraceResult(res.trace);
    } catch (err: any) {
      setTraceError(err.message || 'Failed to trace lineage');
    } finally {
      setIsTracing(false);
    }
  };

  const SUGGESTED_INQUIRIES = [
    'Show me how my thinking on the pricing model evolved',
    'How have my digital boundaries around work changed?',
    'Trace how friction in onboarding influenced my product strategy',
    'How has my perspective on delegating tasks shifted?',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-[#1A1A1A] space-y-8">
      {/* Header */}
      <div className="border-b border-[#1A1A1A]/15 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#1A1A1A]/50 mb-1 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-[#8C271E]" />
            <span>Non-Isolated Memory • Longitudinal Intelligence</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            Idea Lineage Tracking<span className="text-[#8C271E]">.</span>
          </h1>
          <p className="text-xs font-serif italic text-[#1A1A1A]/60 mt-1 max-w-2xl leading-relaxed">
            Most journaling tools treat every conversation as an isolated island. Personal Gemini Journal
            synthesizes your reflections into living threads, mapping how an idea evolves across weeks from
            initial spark to operational breakthrough.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-white border border-[#1A1A1A]/20 text-[11px] font-mono font-bold text-[#1A1A1A] shadow-2xs">
            {safeThreads.length} Active Living {safeThreads.length === 1 ? 'Thread' : 'Threads'}
          </div>
        </div>
      </div>

      {/* Semantic Query Assistant Card */}
      <div className="bg-white border border-[#1A1A1A]/20 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#1A1A1A]">
          <Sparkles className="w-4 h-4 text-[#8C271E]" />
          <span>Ask Gemini to Trace Any Idea Across Your Archive</span>
        </div>
        <p className="text-xs text-[#1A1A1A]/70 font-serif italic">
          Ask a specific question like "how did my thoughts on pricing evolve?" and Gemini will semantically
          index your past entries to generate an interconnected timeline of your thinking.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunTrace();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#1A1A1A]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="e.g., Show me how my thinking on the pricing model evolved..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#FAF9F7] border border-[#1A1A1A]/20 text-xs font-serif text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>
          <button
            type="submit"
            disabled={isTracing || !customQuery.trim()}
            className="h-10 px-5 text-xs uppercase tracking-wider font-bold bg-[#1A1A1A] hover:bg-black text-white transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
          >
            {isTracing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Tracing Lineage...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-[#8C271E]" />
                <span>Trace Lineage</span>
              </>
            )}
          </button>
        </form>

        {/* Preset Inquiry Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/50 mr-1">
            Suggested Traces:
          </span>
          {SUGGESTED_INQUIRIES.map((inquiry, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCustomQuery(inquiry);
                handleRunTrace(inquiry);
              }}
              className="text-[11px] font-serif italic bg-[#F2EFE9] hover:bg-[#EAE6DD] text-[#1A1A1A] px-2.5 py-1 border border-[#1A1A1A]/10 transition-colors text-left"
            >
              "{inquiry}"
            </button>
          ))}
        </div>

        {traceError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
            {traceError}
          </div>
        )}

        {/* Dynamic Trace Result Drawer */}
        {customTraceResult && (
          <div className="mt-4 p-5 bg-[#FAF9F7] border-t border-[#1A1A1A]/15 space-y-4 animate-in fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#8C271E] font-mono">
                  Gemini Semantic Synthesis
                </span>
                <h3 className="text-base font-serif font-bold text-[#1A1A1A] mt-0.5">
                  {customTraceResult.title}
                </h3>
              </div>
              <button
                onClick={() =>
                  onContinueIdeaInChat(
                    `I'm looking at my idea lineage trace on "${customQuery || 'this topic'}". Let's continue building on my latest synthesis.`
                  )
                }
                className="h-8 px-3 text-[11px] uppercase tracking-wider font-bold bg-[#1A1A1A] text-white hover:bg-black transition-colors shrink-0 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3 h-3 text-[#8C271E]" />
                <span>Continue Thread</span>
              </button>
            </div>

            <p className="text-xs font-serif italic text-[#1A1A1A]/80 leading-relaxed">
              {customTraceResult.summaryNarrative}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {customTraceResult.stages.map((st: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-white border border-[#1A1A1A]/15 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#8C271E] font-bold uppercase">{st.stage}</span>
                    <span className="text-[#1A1A1A]/50">{st.date}</span>
                  </div>
                  <div className="text-xs font-serif font-bold text-[#1A1A1A]">{st.milestone}</div>
                  <p className="text-[11px] font-serif italic text-[#1A1A1A]/70">{st.shift}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-white border-l-2 border-[#1A1A1A] text-xs font-serif italic text-[#1A1A1A]">
              <span className="font-bold font-mono text-[10px] uppercase tracking-wider block mb-0.5 text-[#1A1A1A]/60">
                Longitudinal Synthesis
              </span>
              {customTraceResult.synthesis}
            </div>
          </div>
        )}
      </div>

      {/* Living Threads Explorer */}
      <div className="space-y-4">
        <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/60 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#1A1A1A]" />
          <span>Curated Living Threads</span>
        </div>

        {/* Thread Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {safeThreads.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveThreadId(t.id)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider shrink-0 transition-all border ${
                activeThreadId === t.id
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                  : 'bg-white text-[#1A1A1A]/70 border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
              }`}
            >
              <span>{t.title}</span>
              <span className="ml-2 opacity-60 text-[10px] font-mono font-normal">
                ({(t.evolutions || []).length} stages)
              </span>
            </button>
          ))}
        </div>

        {/* Active Thread Detail View */}
        {activeThread ? (
          <div className="bg-white border border-[#1A1A1A]/20 p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Thread Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#1A1A1A]/10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#FAF9F7] border border-[#1A1A1A]/15 text-[#1A1A1A]/80 font-bold">
                    {activeThread.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#3B5A30] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {Math.round(activeThread.confidenceScore * 100)}% Semantic Match
                  </span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] tracking-tight">
                  {activeThread.title}
                </h2>
                <p className="text-xs font-serif italic text-[#1A1A1A]/70 mt-1">
                  {activeThread.subtitle}
                </p>
              </div>

              <button
                onClick={() =>
                  onContinueIdeaInChat(
                    `Let's continue developing my thoughts on "${activeThread.title}". Currently, my status is: ${activeThread.currentStatus}. What's the next strategic question I should examine?`
                  )
                }
                className="h-9 px-4 text-xs uppercase tracking-wider font-bold bg-[#1A1A1A] hover:bg-black text-white transition-colors flex items-center gap-2 shrink-0 self-start shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8C271E]" />
                <span>Continue Thread in Session</span>
              </button>
            </div>

            {/* Current Status Anchor */}
            <div className="p-4 bg-[#FAF9F7] border border-[#1A1A1A]/15 flex items-start gap-3">
              <Compass className="w-4 h-4 text-[#8C271E] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#1A1A1A]/50 block">
                  Current Thread Trajectory
                </span>
                <p className="text-xs font-serif italic text-[#1A1A1A] font-bold mt-0.5">
                  {activeThread.currentStatus}
                </p>
              </div>
            </div>

            {/* Evolution Timeline Sequence */}
            <div className="space-y-6 pt-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/50">
                Longitudinal Progression Across Sessions
              </div>

              <div className="relative pl-8 space-y-6">
                {/* Continuous Timeline Vertical Spine */}
                <div className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-[#1A1A1A]/20" />

                {(activeThread.evolutions || []).map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Dot - Centered on the 2px Spine */}
                    <div className="absolute -left-[25px] top-2 w-3.5 h-3.5 rounded-full bg-[#1A1A1A] border-2 border-white ring-1 ring-[#1A1A1A] shadow-2xs z-10" />

                    <div className="bg-[#FAF9F7] border border-[#1A1A1A]/15 p-4 sm:p-5 hover:border-[#1A1A1A]/40 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 bg-white border border-[#1A1A1A]/15 text-[#8C271E]">
                            {step.stage}
                          </span>
                          <span className="text-[11px] font-mono text-[#1A1A1A]/50 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#1A1A1A]/40" />
                            {formatDate(step.date)}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono uppercase text-[#1A1A1A]/50">
                          Mood: {step.mood}
                        </span>
                      </div>

                      <p className="text-[13px] font-serif text-[#1A1A1A] leading-relaxed">
                        {step.insight}
                      </p>

                      <div className="mt-3 pt-3 border-t border-[#1A1A1A]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs font-serif italic text-[#1A1A1A]/70">
                          <span className="font-bold text-[#1A1A1A] font-mono text-[10px] uppercase mr-1.5">
                            Intellectual Shift:
                          </span>
                          "{step.evolutionNote}"
                        </div>

                        {onOpenEntry && (
                          <button
                            onClick={() => onOpenEntry(step.entryId)}
                            className="text-[11px] font-mono text-[#8C271E] hover:underline font-bold shrink-0 self-start sm:self-auto"
                          >
                            View Origin Entry →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs font-serif italic text-[#1A1A1A]/60 bg-white border border-[#1A1A1A]/15">
            No living threads identified yet. Complete several sessions to allow semantic connections to form.
          </div>
        )}
      </div>
    </div>
  );
};
