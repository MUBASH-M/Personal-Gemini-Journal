import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { EmotionalWeatherCard } from './EmotionalWeatherCard';
import { MemoryConsentLedgerModal } from './MemoryConsentLedgerModal';
import { AiSecuritySuite } from './AiSecuritySuite';
import {
  Send,
  Sparkles,
  User,
  CheckCircle,
  Lightbulb,
  Clock,
  RotateCcw,
  ShieldCheck,
  Compass,
  Brain,
  Eye,
  Lock,
  LifeBuoy,
  PhoneCall,
  EyeOff,
  AlertTriangle,
  X,
} from 'lucide-react';

interface ChatSessionProps {
  user: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onEndSession: () => void;
  isGenerating: boolean;
  onClearSession: () => void;
}

const STARTER_PROMPTS = [
  {
    title: 'Untangle a Demanding Day',
    text: "I've had a nonstop day and I'm feeling scattered. Can you help me walk through what went well and what felt draining?",
  },
  {
    title: 'Brainstorm an Idea or Project',
    text: "I have an idea for a project I'd love to think out loud with you. Can I share the core concept and get your perspective?",
  },
  {
    title: 'Process Mixed Emotions',
    text: "I'm wrestling with a situation where I feel pulled in two directions. Help me examine the tradeoffs without judgment.",
  },
  {
    title: 'Unpack a Tough Decision',
    text: "I need to make a decision soon and I feel stuck between playing it safe and taking a leap. Can we weigh the stakes?",
  },
];

export const ChatSession: React.FC<ChatSessionProps> = ({
  user,
  messages,
  onSendMessage,
  onEndSession,
  isGenerating,
  onClearSession,
}) => {
  const [inputText, setInputText] = useState('');
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showAiSecurityModal, setShowAiSecurityModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    const text = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleSelectNudgePrompt = (prompt: string) => {
    setInputText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const userTurnCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5.5rem)] max-w-4xl mx-auto bg-white border-x border-[#1A1A1A]/15 shadow-[0_4px_30px_rgba(26,26,26,0.03)]">
      {/* Session Top Editorial Rule Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#F9F8F6] border-b border-[#1A1A1A]/15 flex items-center justify-between gap-3 text-xs text-[#1A1A1A] shrink-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#8C271E] animate-pulse shrink-0"></span>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A] shrink-0">
            Active Transcript
          </span>
          <span className="text-[#1A1A1A]/30 shrink-0">•</span>
          <span className="text-[11px] font-serif italic text-[#1A1A1A]/70 truncate">
            {userTurnCount} conversational {userTurnCount === 1 ? 'entry' : 'entries'}
          </span>
          <span className="text-[#1A1A1A]/30 shrink-0 hidden sm:inline">•</span>
          <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 hidden sm:inline font-mono shrink-0">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* AI Security Guard Suite Trigger */}
          <button
            onClick={() => setShowAiSecurityModal(true)}
            className="flex items-center gap-1.5 text-[#1A1A1A] hover:text-black text-[10px] uppercase tracking-wider bg-white hover:bg-[#FAF9F7] px-2.5 py-1 border border-[#8C271E]/30 font-mono transition-colors shadow-2xs"
            title="Open AI Security, Crisis Guard & PHI Redaction Suite"
          >
            <ShieldCheck className="w-3 h-3 text-[#8C271E] shrink-0" />
            <span className="hidden sm:inline">AI Security Guard</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B5A30] animate-pulse"></span>
          </button>

          {/* Memory Consent Ledger Trigger */}
          <button
            onClick={() => setShowMemoryModal(true)}
            className="flex items-center gap-1.5 text-[#1A1A1A] hover:text-black text-[10px] uppercase tracking-wider bg-white hover:bg-[#FAF9F7] px-2.5 py-1 border border-[#1A1A1A]/20 font-mono transition-colors shadow-2xs"
            title="Inspect or modify what Gemini remembers across sessions"
          >
            <Brain className="w-3 h-3 text-[#8C271E] shrink-0" />
            <span className="hidden sm:inline">Memory Consent</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-[#1A1A1A]/70 text-[10px] uppercase tracking-wider bg-white px-2.5 py-1 border border-[#1A1A1A]/15 font-mono">
            <ShieldCheck className="w-3 h-3 text-[#1A1A1A] shrink-0" />
            <span>Private Vault</span>
          </div>

          {messages.length > 0 && (
            <button
              onClick={onClearSession}
              title="Reset transcript"
              className="text-[#1A1A1A]/50 hover:text-[#8C271E] transition-colors p-1.5 border border-transparent hover:border-[#1A1A1A]/20 hover:bg-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#FAF9F7]">
        {/* Emotional Weather Forecast Nudge at top */}
        <EmotionalWeatherCard onStartReflection={handleSelectNudgePrompt} />

        {messages.length === 0 ? (
          /* Empty State / Editorial Introduction */
          <div className="py-6 px-4 text-center max-w-xl mx-auto">
            <div className="w-12 h-12 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center mx-auto mb-4 font-serif text-xl italic font-bold">
              <span className="relative -top-px">J.</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]/60 mb-1">
              Volume I • Monograph
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
              A Quiet Chamber for Thought, {user.displayName}.
            </h2>
            <p className="text-xs sm:text-sm text-[#1A1A1A]/70 mt-3 font-serif italic leading-relaxed">
              Begin an unconstrained conversation with Gemini as your private literary sounding board.
              Once your reflections conclude, select <strong>Synthesize Entry</strong> to crystallize key
              takeaways, mood signatures, and chained SHA-256 block receipts into your permanent archive.
            </p>

            <div className="mt-8 text-left">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/60 mb-3 flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3 text-[#1A1A1A] shrink-0" /> Curated Inquiries
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STARTER_PROMPTS.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(starter.text);
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }}
                    className="p-3.5 border border-[#1A1A1A]/15 bg-white hover:bg-[#F2EFE9] hover:border-[#1A1A1A] text-left transition-all group shadow-2xs h-full flex flex-col justify-between"
                  >
                    <div className="text-[11px] uppercase tracking-wider font-bold text-[#1A1A1A] group-hover:text-black">
                      {['01', '02', '03', '04'][idx]}. {starter.title}
                    </div>
                    <div className="text-xs font-serif italic text-[#1A1A1A]/70 mt-2 line-clamp-3 leading-relaxed">
                      "{starter.text}"
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex items-start gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center shrink-0 font-serif italic text-xs font-bold mt-0.5 select-none">
                    G.
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] p-4 sm:p-5 border leading-relaxed ${
                    isUser
                      ? 'bg-[#F9F8F6] text-[#1A1A1A] border-[#1A1A1A]/20 shadow-2xs'
                      : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/15 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-[#1A1A1A]/10">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/60 font-mono">
                      {isUser ? user.displayName : 'Gemini Reflection Companion'}
                    </span>
                    <span className="text-[9px] text-[#1A1A1A]/40 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`whitespace-pre-wrap text-xs sm:text-[13px] ${
                      isUser ? 'font-serif' : 'font-editorial italic'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Safety Signals & Badges */}
                  {msg.safety?.crisisSignals?.escalationRequired && (
                    <div className="mt-3 p-3 bg-white border border-[#8C271E] shadow-2xs space-y-2 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C271E] font-mono uppercase">
                        <LifeBuoy className="w-4 h-4 shrink-0" />
                        <span>Immediate Crisis Support Available (Free &amp; Confidential 24/7)</span>
                      </div>
                      <p className="text-xs font-serif italic text-[#1A1A1A]/80">
                        You don't have to carry this alone. Compassionate human help is available right now:
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs font-mono">
                        <a
                          href="tel:988"
                          className="px-2.5 py-1 bg-[#8C271E] text-white font-bold inline-flex items-center gap-1 hover:bg-black transition-colors"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Call or Text 988 (Lifeline)</span>
                        </a>
                        <a
                          href="sms:741741?body=HOME"
                          className="px-2.5 py-1 bg-white border border-[#1A1A1A]/30 text-[#1A1A1A] font-bold inline-flex items-center gap-1 hover:border-[#1A1A1A] transition-colors"
                        >
                          <span>Text HOME to 741741</span>
                        </a>
                      </div>
                      <div className="text-[10px] text-[#8C271E] font-mono">
                        Clinical Triage: Conversation automatically queued for human clinician review.
                      </div>
                    </div>
                  )}

                  {msg.safety?.phiRedaction?.wasRedacted && (
                    <div className="mt-2 text-[10px] font-mono text-[#8C271E] flex items-center gap-1.5 bg-[#8C271E]/5 p-1.5 border border-[#8C271E]/20 text-left">
                      <EyeOff className="w-3 h-3 shrink-0" />
                      <span>
                        PHI Redacted: {msg.safety.phiRedaction.redactionCount} clinical identifier(s) sanitized before model ingestion.
                      </span>
                    </div>
                  )}

                  {msg.safety?.promptInjectionBlocked && (
                    <div className="mt-2 text-[10px] font-mono text-[#3B5A30] flex items-center gap-1.5 bg-[#3B5A30]/5 p-1.5 border border-[#3B5A30]/20 text-left">
                      <Lock className="w-3 h-3 shrink-0" />
                      <span>System Prompt Security Guard neutralized prompt injection payload.</span>
                    </div>
                  )}
                </div>
                {isUser && (
                  user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 border border-[#1A1A1A] object-cover shrink-0 mt-0.5 select-none"
                    />
                  ) : (
                    <div className="w-8 h-8 border border-[#1A1A1A] bg-[#FAF9F7] text-[#1A1A1A] flex items-center justify-center shrink-0 font-serif text-xs font-bold mt-0.5 select-none">
                      {user.displayName.charAt(0)}
                    </div>
                  )
                )}
              </div>
            );
          })
        )}

        {isGenerating && (
          <div className="flex items-start gap-3.5 justify-start">
            <div className="w-8 h-8 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center shrink-0 font-serif italic text-xs font-bold mt-0.5 select-none">
              G.
            </div>
            <div className="bg-white border border-[#1A1A1A]/20 px-5 py-3 text-xs text-[#1A1A1A]/70 font-serif italic flex items-center gap-2.5">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#1A1A1A] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#1A1A1A] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-[#1A1A1A] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
              <span>Gemini is composing reflection...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input & Action Footer */}
      <div className="p-3 sm:p-5 bg-[#F9F8F6] border-t border-[#1A1A1A]/15 shrink-0">
        <form onSubmit={handleSend} className="flex flex-col gap-2.5">
          <div className="relative flex items-end gap-2 bg-white border border-[#1A1A1A]/25 p-2 focus-within:border-[#1A1A1A] transition-all shadow-xs">
            <textarea
              ref={textareaRef}
              id="session-input-textarea"
              rows={1}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder={
                messages.length === 0
                  ? 'Record your line of inquiry or select a prompt above...'
                  : 'Continue exploring your thoughts...'
              }
              className="w-full bg-transparent resize-none px-2 sm:px-3 py-1.5 text-sm text-[#1A1A1A] font-serif placeholder-[#1A1A1A]/40 focus:outline-none max-h-36 leading-relaxed"
            />
            <button
              id="session-send-btn"
              type="submit"
              disabled={!inputText.trim() || isGenerating}
              className="h-9 w-9 flex items-center justify-center bg-[#1A1A1A] hover:bg-black text-white disabled:opacity-30 transition-colors shrink-0 border border-[#1A1A1A]"
              title="Record statement (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Controls Bar: End Session vs Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
            <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 font-mono">
              Press{' '}
              <kbd className="bg-white border border-[#1A1A1A]/20 px-1 py-0.5 text-[9px] text-[#1A1A1A]">
                Enter
              </kbd>{' '}
              to record,{' '}
              <kbd className="bg-white border border-[#1A1A1A]/20 px-1 py-0.5 text-[9px] text-[#1A1A1A]">
                Shift+Enter
              </kbd>{' '}
              for stanza
            </div>

            <button
              id="end-session-btn"
              type="button"
              onClick={onEndSession}
              disabled={messages.length === 0 || isGenerating}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] hover:bg-black text-[#F9F8F6] transition-colors disabled:opacity-30 border border-[#1A1A1A] shadow-xs self-end sm:self-auto"
            >
              <CheckCircle className="w-3.5 h-3.5 text-[#8C271E] shrink-0" />
              <span>Synthesize Entry</span>
              {userTurnCount > 0 && (
                <span className="ml-1 bg-white text-[#1A1A1A] px-1.5 py-0.2 font-mono text-[9px]">
                  {userTurnCount}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Memory Consent Modal */}
      {showMemoryModal && (
        <MemoryConsentLedgerModal onClose={() => setShowMemoryModal(false)} />
      )}

      {/* AI Security, Clinical Safety & Governance Center Modal */}
      {showAiSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1A1A1A]/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF9F7] border border-[#1A1A1A]/30 max-w-5xl w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/15">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#8C271E]" />
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#1A1A1A]">
                  Recovery &amp; Prevention AI Security Suite
                </h3>
              </div>
              <button
                onClick={() => setShowAiSecurityModal(false)}
                className="p-1 text-[#1A1A1A]/60 hover:text-black hover:bg-white border border-transparent hover:border-[#1A1A1A]/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AiSecuritySuite currentUser={user} />
          </div>
        </div>
      )}
    </div>
  );
};
