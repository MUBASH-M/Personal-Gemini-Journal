import React, { useState, useEffect } from 'react';
import { EmotionalWeatherForecast } from '../types';
import { getEmotionalWeatherForecast } from '../api';
import { Sparkles, Compass, ArrowRight, X, Wind, Heart, SunMedium, Shield } from 'lucide-react';

interface EmotionalWeatherCardProps {
  onStartReflection: (prompt: string) => void;
}

export const EmotionalWeatherCard: React.FC<EmotionalWeatherCardProps> = ({
  onStartReflection,
}) => {
  const [forecast, setForecast] = useState<EmotionalWeatherForecast | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getEmotionalWeatherForecast();
        if (isMounted) setForecast(data);
      } catch (err) {
        console.error('Failed to load emotional weather forecast:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !forecast || isDismissed) return null;

  const getToneIcon = () => {
    switch (forecast.tone) {
      case 'gentle-inquiry':
        return <Wind className="w-4 h-4 text-[#8C271E]" />;
      case 'strategic-clarity':
        return <SunMedium className="w-4 h-4 text-amber-700" />;
      case 'rejuvenating':
        return <Heart className="w-4 h-4 text-[#3B5A30]" />;
      default:
        return <Compass className="w-4 h-4 text-[#1A1A1A]" />;
    }
  };

  return (
    <div className="bg-[#FAF9F7] border border-[#1A1A1A]/15 p-4 sm:p-5 text-[#1A1A1A] shadow-2xs relative group transition-all hover:border-[#1A1A1A]/30">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 pr-6 sm:pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-[#8C271E] tracking-wider">
              {getToneIcon()}
              <span>Emotional Weather Forecast</span>
            </span>

            <span className="text-[10px] font-mono text-[#1A1A1A]/40">•</span>

            <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-white border border-[#1A1A1A]/15 text-[#1A1A1A]/70">
              {forecast.disclaimer}
            </span>
          </div>

          <h3 className="text-base font-serif font-bold text-[#1A1A1A] tracking-tight">
            {forecast.headline}
          </h3>

          <p className="text-xs font-serif italic text-[#1A1A1A]/80 leading-relaxed max-w-2xl">
            "{forecast.narrative}"
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#1A1A1A]/60">
            <span>Observed cadence: {forecast.recentDominantMood}</span>
            {Array.isArray(forecast.sampleThemes) && forecast.sampleThemes.length > 0 && (
              <>
                <span>•</span>
                <span>Themes: {forecast.sampleThemes.map((t) => `#${t}`).join(' ')}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start mt-2 sm:mt-0">
          <button
            onClick={() => onStartReflection(forecast.suggestedReflectionPrompt)}
            className="h-8 px-3.5 text-[11px] uppercase tracking-wider font-bold bg-[#1A1A1A] hover:bg-black text-white transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Load this prompt into your conversation"
          >
            <Sparkles className="w-3 h-3 text-[#8C271E]" />
            <span>Reflect on This</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
            title="Dismiss forecast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
