import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
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

  const userTurnCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] max-w-4xl mx-auto bg-white border-x border-[#1A1A1A]/15 shadow-[0_4px_30px_rgba(26,26,26,0.03)]">
      {/* Session Top Editorial Rule Bar */}
      <div className="px-6 py-3 bg-[#F9F8F6] border-b border-[#1A1A1A]/15 flex items-center justify-between text-xs text-[#1A1A1A]">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#8C271E] animate-pulse"></span>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]">Active Transcript</span>
          <span className="text-[#1A1A1A]/30">•</span>
          <span className="text-[11px] font-serif italic text-[#1A1A1A]/70">
            {userTurnCount} conversational entry{userTurnCount === 1 ? '' : 'ies'}
          </span>
          <span className="text-[#1A1A1A]/30">•</span>
          <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 hidden sm:inline font-mono">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1 text-[#1A1A1A]/70 text-[10px] uppercase tracking-wider bg-white px-2 py-0.5 border border-[#1A1A1A]/15 font-mono">
            <ShieldCheck className="w-3 h-3 text-[#1A1A1A]" />
            <span>Private Vault</span>
          </div>

          {messages.length > 0 && (
            <button
              onClick={onClearSession}
              title="Reset transcript"
              className="text-[#1A1A1A]/50 hover:text-[#8C271E] transition-colors p-1 border border-transparent hover:border-[#1A1A1A]/20 hover:bg-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#FAF9F7]">
        {messages.length === 0 ? (
          /* Empty State / Editorial Introduction */
          <div className="py-8 px-4 text-center max-w-xl mx-auto">
            <div className="w-12 h-12 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center mx-auto mb-4 font-serif text-xl italic font-bold">
              J.
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]/60 mb-1">
              Volume I • Monograph
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
              A Quiet Chamber for Thought, {user.displayName}.
            </h2>
            <p className="text-xs sm:text-sm text-[#1A1A1A]/70 mt-3 font-serif italic leading-relaxed">
              Begin an unconstrained conversation with Gemini as your private literary sounding board.
              Once your reflections conclude, select <strong>Synthesize Entry</strong> to crystallize key takeaways, mood signatures, and thematic index tags into your permanent archive.
            </p>

            <div className="mt-10 text-left">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/60 mb-3 flex items-center">
                <Lightbulb className="w-3 h-3 mr-1.5 text-[#1A1A1A]" /> Curated Inquiries
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
                    className="p-3.5 border border-[#1A1A1A]/15 bg-white hover:bg-[#F2EFE9] hover:border-[#1A1A1A] text-left transition-all group shadow-2xs"
                  >
                    <div className="text-[11px] uppercase tracking-wider font-bold text-[#1A1A1A] group-hover:text-black">
                      {['01', '02', '03', '04'][idx]}. {starter.title}
                    </div>
                    <div className="text-xs font-serif italic text-[#1A1A1A]/70 mt-1.5 line-clamp-2 leading-relaxed">
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
                className={`flex items-start space-x-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center shrink-0 font-serif italic text-xs font-bold mt-1">
                    G.
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] px-5 py-4 leading-relaxed ${
                    isUser
                      ? 'bg-[#1A1A1A] text-[#F9F8F6] shadow-sm text-sm font-sans'
                      : 'bg-white text-[#1A1A1A] border border-[#1A1A1A]/15 text-[15px] font-editorial shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {isUser && (
                  <div className="w-8 h-8 border border-[#1A1A1A]/30 bg-white text-[#1A1A1A] flex items-center justify-center shrink-0 font-serif text-xs font-bold mt-1">
                    {user.displayName.charAt(0)}
                  </div>
                )}
              </div>
            );
          })
        )}

        {isGenerating && (
          <div className="flex items-start space-x-3.5 justify-start">
            <div className="w-8 h-8 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center shrink-0 font-serif italic text-xs font-bold mt-1">
              G.
            </div>
            <div className="bg-white border border-[#1A1A1A]/20 px-5 py-3 text-xs text-[#1A1A1A]/70 font-serif italic flex items-center space-x-2.5">
              <span className="flex space-x-1.5">
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
      <div className="p-4 sm:p-5 bg-[#F9F8F6] border-t border-[#1A1A1A]/15">
        <form onSubmit={handleSend} className="flex flex-col space-y-3">
          <div className="relative flex items-end bg-white border border-[#1A1A1A]/25 p-2 focus-within:border-[#1A1A1A] transition-all shadow-xs">
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
                  ? "Record your line of inquiry or select a prompt above..."
                  : 'Continue exploring your thoughts...'
              }
              className="w-full bg-transparent resize-none px-3 py-2 text-sm text-[#1A1A1A] font-serif placeholder-[#1A1A1A]/40 focus:outline-none max-h-36 leading-relaxed"
            />
            <button
              id="session-send-btn"
              type="submit"
              disabled={!inputText.trim() || isGenerating}
              className="p-2.5 bg-[#1A1A1A] hover:bg-black text-white disabled:opacity-30 transition-colors shrink-0 ml-1 border border-[#1A1A1A]"
              title="Record statement (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Controls Bar: End Session vs Status */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 font-mono">
              Press <kbd className="bg-white border border-[#1A1A1A]/20 px-1 py-0.5 text-[9px] text-[#1A1A1A]">Enter</kbd> to record,{' '}
              <kbd className="bg-white border border-[#1A1A1A]/20 px-1 py-0.5 text-[9px] text-[#1A1A1A]">Shift+Enter</kbd> for stanza
            </div>

            <button
              id="end-session-btn"
              type="button"
              onClick={onEndSession}
              disabled={messages.length === 0 || isGenerating}
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] hover:bg-black text-[#F9F8F6] transition-colors disabled:opacity-30 border border-[#1A1A1A] shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 text-[#8C271E]" />
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
    </div>
  );
};
