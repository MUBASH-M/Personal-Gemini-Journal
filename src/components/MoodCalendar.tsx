import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { getMoodDetails } from '../utils/theme';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  Tag,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

interface MoodCalendarProps {
  entries: JournalEntry[];
}

export const MoodCalendar: React.FC<MoodCalendarProps> = ({ entries }) => {
  // Current reference date (defaults to today or latest entry date)
  const today = useMemo(() => new Date(), []);
  
  // Navigation state for month/year view
  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth()); // 0-indexed
  const [viewMode, setViewMode] = useState<'month' | 'rolling30'>('month');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Group all entries by YYYY-MM-DD
  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    const safeEntries = Array.isArray(entries) ? entries : [];
    for (const entry of safeEntries) {
      if (!entry.createdAt) continue;
      const d = new Date(entry.createdAt);
      if (isNaN(d.getTime())) continue;
      // Format as YYYY-MM-DD in local time
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      const existing = map.get(dateKey) || [];
      existing.push(entry);
      map.set(dateKey, existing);
    }
    return map;
  }, [entries]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDateKey(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDateKey(null);
  };

  const handleResetToCurrent = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateKey(null);
  };

  // Month metadata
  const monthName = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Generate days for Month Grid
  const calendarDays = useMemo(() => {
    if (viewMode === 'rolling30') {
      // Past 30 rolling days
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        const dayEntries = entriesByDate.get(dateKey) || [];
        days.push({
          date: d,
          dateKey,
          dayNumber: d.getDate(),
          isCurrentMonth: true,
          isToday: d.toDateString() === today.toDateString(),
          entries: dayEntries,
        });
      }
      return days;
    }

    // Classic monthly calendar
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Determine day of week offset (Monday = 0, ..., Sunday = 6)
    // getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday moved to end

    const days = [];

    // Pad days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      const dateKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
      days.push({
        date: prevDate,
        dateKey,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: prevDate.toDateString() === today.toDateString(),
        entries: entriesByDate.get(dateKey) || [],
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const thisDate = new Date(currentYear, currentMonth, day);
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: thisDate,
        dateKey,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: thisDate.toDateString() === today.toDateString(),
        entries: entriesByDate.get(dateKey) || [],
      });
    }

    // Pad remaining slots to complete grid (up to multiple of 7)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remainingDays = totalCells - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const dateKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      days.push({
        date: nextDate,
        dateKey,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: nextDate.toDateString() === today.toDateString(),
        entries: entriesByDate.get(dateKey) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, viewMode, entriesByDate, today]);

  // Calculate month statistics
  const monthStats = useMemo(() => {
    let daysWithEntries = 0;
    let totalMonthEntries = 0;
    const moodCounts: Record<string, number> = {};

    calendarDays.forEach((cell) => {
      if (cell.isCurrentMonth && cell.entries.length > 0) {
        daysWithEntries++;
        totalMonthEntries += cell.entries.length;
        cell.entries.forEach((e) => {
          const m = e.mood.toLowerCase();
          moodCounts[m] = (moodCounts[m] || 0) + 1;
        });
      }
    });

    // Find dominant mood in this month
    let topMood = 'N/A';
    let topCount = 0;
    for (const [m, count] of Object.entries(moodCounts)) {
      if (count > topCount) {
        topCount = count;
        topMood = m;
      }
    }

    return {
      daysWithEntries,
      totalMonthEntries,
      topMood,
      topMoodCount: topCount,
    };
  }, [calendarDays]);

  // Selected day entries
  const selectedEntries = useMemo(() => {
    if (!selectedDateKey) return null;
    return entriesByDate.get(selectedDateKey) || [];
  }, [selectedDateKey, entriesByDate]);

  // Selected date formatted
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDateKey) return '';
    const [year, month, day] = selectedDateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDateKey]);

  // Mood Legend items
  const moodLegend = [
    { mood: 'calm', label: 'Calm' },
    { mood: 'reflective', label: 'Reflective' },
    { mood: 'optimistic', label: 'Optimistic' },
    { mood: 'excited', label: 'Excited' },
    { mood: 'creative', label: 'Creative' },
    { mood: 'grateful', label: 'Grateful' },
    { mood: 'stressed', label: 'Stressed' },
    { mood: 'anxious', label: 'Anxious' },
    { mood: 'overwhelmed', label: 'Overwhelmed' },
  ];

  return (
    <div className="bg-white border border-[#1A1A1A]/15 shadow-2xs p-6 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1A1A1A]/10">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-[#8C271E] shrink-0" />
            <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">
              Cadence & Mood Almanac
            </h3>
          </div>
          <p className="text-xs font-serif italic text-[#1A1A1A]/60 mt-1">
            Day-by-day emotional topography rendered from your private archival records
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* View Mode Toggle */}
          <div className="inline-flex bg-[#F9F8F6] border border-[#1A1A1A]/20 p-0.5 text-[11px] font-mono">
            <button
              onClick={() => {
                setViewMode('month');
                setSelectedDateKey(null);
              }}
              className={`px-2.5 py-1 transition-colors ${
                viewMode === 'month'
                  ? 'bg-[#1A1A1A] text-white font-bold'
                  : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              }`}
            >
              Calendar Month
            </button>
            <button
              onClick={() => {
                setViewMode('rolling30');
                setSelectedDateKey(null);
              }}
              className={`px-2.5 py-1 transition-colors ${
                viewMode === 'rolling30'
                  ? 'bg-[#1A1A1A] text-white font-bold'
                  : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              }`}
            >
              Past 30 Days
            </button>
          </div>

          {/* Month Stepper (only in month view) */}
          {viewMode === 'month' && (
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevMonth}
                title="Previous Month"
                className="h-7 w-7 flex items-center justify-center border border-[#1A1A1A]/20 bg-white hover:bg-[#F2EFE9] text-[#1A1A1A] transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetToCurrent}
                title="Return to Current Month"
                className="h-7 px-2.5 text-[10px] uppercase font-mono tracking-wider font-bold border border-[#1A1A1A]/20 bg-white hover:bg-[#F2EFE9] text-[#1A1A1A] transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                title="Next Month"
                className="h-7 w-7 flex items-center justify-center border border-[#1A1A1A]/20 bg-white hover:bg-[#F2EFE9] text-[#1A1A1A] transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Month Label & Key Performance Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9F8F6] p-3.5 border border-[#1A1A1A]/10">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-[0.2em] font-bold text-[#1A1A1A]/50">
            {viewMode === 'month' ? 'Active Folio Period' : 'Rolling Interval'}
          </div>
          <div className="text-base font-serif font-bold text-[#1A1A1A]">
            {viewMode === 'month' ? monthName : 'Chronological Last 30 Days'}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="border-r border-[#1A1A1A]/15 pr-4">
            <span className="text-[#1A1A1A]/50 block text-[9px] uppercase tracking-wider">Entries Logged</span>
            <span className="font-bold text-[#1A1A1A] text-sm">{monthStats.totalMonthEntries}</span>
          </div>
          <div className="border-r border-[#1A1A1A]/15 pr-4">
            <span className="text-[#1A1A1A]/50 block text-[9px] uppercase tracking-wider">Days Active</span>
            <span className="font-bold text-[#1A1A1A] text-sm">{monthStats.daysWithEntries} days</span>
          </div>
          <div>
            <span className="text-[#1A1A1A]/50 block text-[9px] uppercase tracking-wider">Dominant Sentiment</span>
            <span className="font-bold capitalize text-[#8C271E] text-sm">
              {monthStats.topMood !== 'N/A' ? monthStats.topMood : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[540px]">
          {/* Weekday column headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const hasEntries = cell.entries.length > 0;
              const primaryMood = hasEntries ? cell.entries[0].mood : null;
              const moodInfo = primaryMood ? getMoodDetails(primaryMood) : null;
              const isSelected = selectedDateKey === cell.dateKey;

              return (
                <button
                  key={`${cell.dateKey}-${idx}`}
                  type="button"
                  onClick={() => {
                    if (hasEntries) {
                      setSelectedDateKey(isSelected ? null : cell.dateKey);
                    }
                  }}
                  disabled={!hasEntries}
                  className={`min-h-[76px] p-2 text-left border transition-all relative flex flex-col justify-between ${
                    cell.isCurrentMonth
                      ? hasEntries
                        ? `${moodInfo?.bgClass} ${moodInfo?.borderClass} hover:border-[#1A1A1A] hover:shadow-xs cursor-pointer`
                        : 'bg-white border-[#1A1A1A]/10 text-[#1A1A1A]/40 cursor-default'
                      : 'bg-[#F9F8F6]/60 border-[#1A1A1A]/5 text-[#1A1A1A]/25 cursor-default'
                  } ${
                    isSelected
                      ? 'ring-2 ring-[#1A1A1A] border-[#1A1A1A] shadow-xs z-10'
                      : ''
                  } ${
                    cell.isToday
                      ? 'border-t-2 border-t-[#8C271E]'
                      : ''
                  }`}
                >
                  {/* Cell Header: Day Number + Tags */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-bold ${
                        cell.isToday
                          ? 'text-[#8C271E]'
                          : hasEntries
                          ? 'text-[#1A1A1A]'
                          : 'text-[#1A1A1A]/40'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      {cell.isToday && (
                        <span className="text-[8px] font-mono uppercase tracking-wider text-[#8C271E] font-bold">
                          Today
                        </span>
                      )}

                      {cell.entries.length > 1 && (
                        <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] text-white px-1 leading-tight">
                          {cell.entries.length}x
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cell Body: Mood Indicators */}
                  {hasEntries && moodInfo ? (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center space-x-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: moodInfo.dotColor }}
                        ></span>
                        <span className="text-[10px] font-serif font-bold capitalize text-[#1A1A1A] truncate leading-tight">
                          {moodInfo.label}
                        </span>
                      </div>

                      {/* Small multiple entry dots if > 1 */}
                      {cell.entries.length > 1 && (
                        <div className="flex items-center gap-1 pt-0.5">
                          {cell.entries.slice(0, 4).map((entry, eIdx) => {
                            const info = getMoodDetails(entry.mood);
                            return (
                              <span
                                key={eIdx}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: info.dotColor }}
                                title={entry.mood}
                              ></span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-4"></div>
                  )}

                  {/* Visual bottom bar for recorded days */}
                  {hasEntries && moodInfo && (
                    <div
                      className="w-full h-0.5 mt-1 rounded-full opacity-60"
                      style={{ backgroundColor: moodInfo.dotColor }}
                    ></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mood Legend Bar */}
      <div className="pt-2 border-t border-[#1A1A1A]/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/50">
            Sentiment Index:
          </span>
          <div className="flex items-center gap-3 flex-wrap text-[11px] font-mono">
            {moodLegend.map((item) => {
              const details = getMoodDetails(item.mood);
              return (
                <div key={item.mood} className="flex items-center space-x-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: details.dotColor }}
                  ></span>
                  <span className="text-[#1A1A1A]/70 capitalize">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Inspection Card (Opens when clicking any recorded day) */}
      {selectedEntries && selectedEntries.length > 0 && (
        <div className="bg-[#FAF9F7] border border-[#1A1A1A]/20 p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1A1A1A]/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-xs font-bold">
                ¶
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-[0.2em] font-bold text-[#1A1A1A]/50">
                  Day Journal Inspection
                </span>
                <h4 className="text-sm font-serif font-bold text-[#1A1A1A]">
                  {selectedDateFormatted}
                </h4>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-[#1A1A1A]/70 bg-white px-2.5 py-1 border border-[#1A1A1A]/15">
                {selectedEntries.length} reflection{selectedEntries.length > 1 ? 's' : ''} recorded
              </span>
              <button
                onClick={() => setSelectedDateKey(null)}
                className="text-xs text-[#1A1A1A]/50 hover:text-[#1A1A1A] px-2 py-1 underline font-mono"
              >
                Close
              </button>
            </div>
          </div>

          {/* List of reflections on this date */}
          <div className="space-y-3">
            {selectedEntries.map((entry, idx) => {
              const mood = getMoodDetails(entry.mood);
              const timeFormatted = entry.createdAt
                ? new Date(entry.createdAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '';

              return (
                <div
                  key={entry.entryId || idx}
                  className="bg-white border border-[#1A1A1A]/15 p-4 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${mood.badgeClass}`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full mr-1.5"
                          style={{ backgroundColor: mood.dotColor }}
                        ></span>
                        {mood.label}
                      </span>
                      {timeFormatted && (
                        <span className="text-[11px] font-mono text-[#1A1A1A]/50 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {timeFormatted}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-[#1A1A1A]/40 flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {entry.turnCount} turns
                    </span>
                  </div>

                  <p className="text-xs font-serif text-[#1A1A1A] leading-relaxed">
                    "{entry.summary}"
                  </p>

                  {entry.keyTakeaway && (
                    <div className="p-2.5 bg-[#F9F8F6] border-l-2 border-[#1A1A1A] text-[11px] font-serif italic text-[#1A1A1A]/80">
                      <span className="font-bold font-mono text-[9px] uppercase tracking-wider block text-[#1A1A1A] not-italic mb-0.5">
                        Key Realization:
                      </span>
                      {entry.keyTakeaway}
                    </div>
                  )}

                  {entry.themes && entry.themes.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <Tag className="w-3 h-3 text-[#1A1A1A]/40 mr-0.5" />
                      {entry.themes.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-mono text-[#1A1A1A]/70 bg-[#F9F8F6] px-1.5 py-0.5 border border-[#1A1A1A]/10"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
