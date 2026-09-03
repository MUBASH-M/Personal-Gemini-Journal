import React from 'react';
import { InsightsData } from '../types';
import { getMoodDetails } from '../utils/theme';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  Sparkles,
  TrendingUp,
  Activity,
  Flame,
  MessageCircle,
  Hash,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface InsightsViewProps {
  insights: InsightsData | null;
  onStartNewSession: () => void;
  isLoading: boolean;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  insights,
  onStartNewSession,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-[#1A1A1A]/60 font-serif italic text-sm">
        <Sparkles className="w-6 h-6 text-[#8C271E] animate-spin mx-auto mb-3" />
        Synthesizing longitudinal trends and emotional cadence...
      </div>
    );
  }

  if (!insights || insights.empty) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-[#1A1A1A]">
        <div className="bg-white p-12 border border-[#1A1A1A]/15 shadow-2xs">
          <div className="w-14 h-14 border border-[#1A1A1A]/20 bg-[#F9F8F6] text-[#1A1A1A] flex items-center justify-center mx-auto mb-4 font-serif text-xl italic">
            §
          </div>
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]/50 mb-1">
            Statistical Analysis
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">No Trend Metrics Recorded</h2>
          <p className="text-xs font-serif italic text-[#1A1A1A]/70 mt-2 max-w-md mx-auto leading-relaxed">
            Your private Mood & Theme Folio is calculated exclusively from your own completed sessions. 
            Once you record one or two reflections, trajectory diagrams and topic distributions will render here automatically.
          </p>
          <div className="mt-5 inline-flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A] bg-[#F9F8F6] px-3 py-1 border border-[#1A1A1A]/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cryptographically Isolated • Zero Aggregation</span>
          </div>
          <div className="mt-6">
            <button
              onClick={onStartNewSession}
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] hover:bg-black text-[#F9F8F6] border border-[#1A1A1A] shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8C271E]" />
              <span>Open Inaugural Reflection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dominantMoodDetails = getMoodDetails(insights.dominantMood);

  // Custom Recharts Tooltip
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const moodInfo = getMoodDetails(data.mood);
      return (
        <div className="bg-[#F9F8F6] p-3 border border-[#1A1A1A] shadow-lg text-xs space-y-1 text-[#1A1A1A]">
          <p className="font-serif font-bold text-[#1A1A1A]">
            Session #{data.sessionIndex} • {data.date}
          </p>
          <div className="flex items-center space-x-1.5 font-mono text-[11px]">
            <span className="text-[#1A1A1A]/60">Tone:</span>
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: moodInfo.dotColor }}
            ></span>
            <span className="font-bold capitalize">{data.mood}</span>
          </div>
          <p className="text-[#1A1A1A]/70 font-serif italic">Topic: #{data.primaryTheme}</p>
          <p className="text-[#1A1A1A]/50 font-mono text-[10px]">{data.turns} dialogue exchanges</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-[#1A1A1A]/15">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#1A1A1A]/50 mb-1">
            Analytical Folio • Section III
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            Sentiment & Theme Patterns<span className="text-[#8C271E]">.</span>
          </h1>
          <p className="text-xs font-serif italic text-[#1A1A1A]/60 mt-1">
            Longitudinal intelligence computed strictly from your private encrypted entries
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white border border-[#1A1A1A]/20 text-[#1A1A1A] px-3 py-1.5 text-xs shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="font-mono text-[10px] uppercase tracking-wider">Zero Cross-Tenant Pooling</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-[#1A1A1A]/15 shadow-2xs">
          <div className="flex items-center justify-between text-[#1A1A1A]/60 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Total Entries</span>
            <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#1A1A1A]">{insights.totalEntries}</div>
          <p className="text-[10px] font-mono text-[#1A1A1A]/50 mt-1">Archived reflections</p>
        </div>

        <div className="bg-white p-5 border border-[#1A1A1A]/15 shadow-2xs">
          <div className="flex items-center justify-between text-[#1A1A1A]/60 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Consistency</span>
            <Flame className="w-3.5 h-3.5 text-[#8C271E]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#1A1A1A]">
            {insights.reflectionStreakDays}{' '}
            <span className="text-xs font-serif font-normal text-[#1A1A1A]/60 italic">days</span>
          </div>
          <p className="text-[10px] font-mono text-[#1A1A1A]/50 mt-1">Check-in cadence</p>
        </div>

        <div className="bg-white p-5 border border-[#1A1A1A]/15 shadow-2xs">
          <div className="flex items-center justify-between text-[#1A1A1A]/60 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Primary Tone</span>
            <Activity className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider border capitalize ${dominantMoodDetails.badgeClass}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ backgroundColor: dominantMoodDetails.dotColor }}
              ></span>
              {insights.dominantMood}
            </span>
          </div>
          <p className="text-[10px] font-mono text-[#1A1A1A]/50 mt-2">Modal emotional baseline</p>
        </div>

        <div className="bg-white p-5 border border-[#1A1A1A]/15 shadow-2xs">
          <div className="flex items-center justify-between text-[#1A1A1A]/60 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Dialogue Depth</span>
            <MessageCircle className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#1A1A1A]">
            {insights.averageTurns}{' '}
            <span className="text-xs font-serif font-normal text-[#1A1A1A]/60 italic">turns/avg</span>
          </div>
          <p className="text-[10px] font-mono text-[#1A1A1A]/50 mt-1">{insights.totalTurns} total exchanges</p>
        </div>
      </div>

      {/* Longitudinal Insight Synthesis */}
      <div className="bg-[#F2EFE9] p-6 border-l-2 border-[#1A1A1A] border-y border-r border-[#1A1A1A]/15 flex items-start space-x-4">
        <div className="w-8 h-8 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center shrink-0 font-serif text-sm">
          ¶
        </div>
        <div className="flex-1">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/60">
            Editorial Marginalia • Longitudinal Synthesis
          </h3>
          <p className="text-[14px] font-editorial text-[#1A1A1A] mt-1.5 leading-relaxed">
            {insights.growthObservation}
          </p>
        </div>
      </div>

      {/* Mood Over Time Area / Line Chart */}
      <div className="bg-white p-6 border border-[#1A1A1A]/15 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A1A1A]/10">
          <div>
            <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">
              Emotional Cadence Over Time
            </h3>
            <p className="text-xs font-serif italic text-[#1A1A1A]/60">
              Trajectory plotted across chronological journal sessions
            </p>
          </div>
          <div className="text-[10px] font-mono text-[#1A1A1A]/60 bg-[#F9F8F6] px-2.5 py-1 border border-[#1A1A1A]/15">
            Index: 1 (Stressed) → 5 (Serene)
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={insights.timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="editorialMoodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E5E5E0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} />
              <YAxis domain={[0.5, 5.5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} />
              <Tooltip content={<CustomTimelineTooltip />} />
              <Area
                type="monotone"
                dataKey="moodScore"
                stroke="#1A1A1A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#editorialMoodGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Breakdown: Themes & Mood Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Recurring Themes */}
        <div className="bg-white p-6 border border-[#1A1A1A]/15 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A1A1A]/10">
            <div>
              <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">
                Leading Topical Threads
              </h3>
              <p className="text-xs font-serif italic text-[#1A1A1A]/60">Recurring thematic areas explored</p>
            </div>
            <Hash className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
          </div>

          <div className="space-y-3.5">
            {insights.themeFrequency.length === 0 ? (
              <p className="text-xs font-serif italic text-[#1A1A1A]/50">No themes recorded yet.</p>
            ) : (
              insights.themeFrequency.slice(0, 5).map((item, idx) => {
                const maxCount = insights.themeFrequency[0]?.count || 1;
                const percentage = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-serif text-[#1A1A1A]">
                      <span className="font-mono text-[11px] font-bold">#{item.theme}</span>
                      <span className="text-[11px] font-mono text-[#1A1A1A]/60">{item.count} session{item.count > 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-[#F2EFE9] h-1.5 overflow-hidden">
                      <div
                        className="bg-[#1A1A1A] h-1.5 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="bg-white p-6 border border-[#1A1A1A]/15 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A1A1A]/10">
            <div>
              <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">
                Sentiment Spectrum
              </h3>
              <p className="text-xs font-serif italic text-[#1A1A1A]/60">Proportional classification breakdown</p>
            </div>
            <Activity className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
          </div>

          <div className="space-y-2.5">
            {Object.entries(insights.moodDistribution).map(([mood, count], i) => {
              const info = getMoodDetails(mood);
              const countNum = Number(count) || 0;
              const percent = Math.round((countNum / insights.totalEntries) * 100);
              return (
                <div key={i} className="flex items-center justify-between p-2.5 border border-[#1A1A1A]/10 hover:bg-[#FAF9F7] transition-colors">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: info.dotColor }}
                    ></span>
                    <span className="text-xs font-serif font-bold text-[#1A1A1A] capitalize">{mood}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-[#1A1A1A]/60">{count} times</span>
                    <span className="text-[10px] font-mono font-bold bg-[#F9F8F6] px-2 py-0.5 border border-[#1A1A1A]/15 text-[#1A1A1A]">
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
