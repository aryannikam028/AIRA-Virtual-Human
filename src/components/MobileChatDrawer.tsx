import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Sparkles, Volume2, Mic, ChevronDown } from 'lucide-react';
import { useCharacterStore } from '../state/useCharacterStore.ts';
import { ConnectionState, VisualAesthetic } from '../types/index.ts';
import { THEMES } from './AestheticThemes.ts';
import { PromptChips } from './PromptChips.tsx';

interface MobileChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendPrompt: (promptText: string) => void;
  connectionState: ConnectionState;
  aesthetic: VisualAesthetic;
  isVirtualMic: boolean;
}

export const MobileChatDrawer: React.FC<MobileChatDrawerProps> = ({
  isOpen,
  onClose,
  onSendPrompt,
  connectionState,
  aesthetic,
  isVirtualMic,
}) => {
  const [inputText, setInputText] = useState('');
  const messages = useCharacterStore((state) => state.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = THEMES[aesthetic] || THEMES['cyber-magenta'];

  const isSpeaking = connectionState === 'speaking';
  const isConnecting = connectionState === 'connecting';

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSpeaking || isConnecting) return;
    onSendPrompt(trimmed);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Tap outside backdrop area to close */}
      <div className="flex-1 w-full" onClick={onClose} />

      {/* Main Drawer Container - Handles dynamic viewport height & mobile keyboard */}
      <div className="relative w-full max-w-2xl mx-auto rounded-t-3xl bg-neutral-950/95 border-t border-x border-white/15 p-3 sm:p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col max-h-[82vh] max-h-[82dvh] animate-in slide-in-from-bottom duration-300">
        {/* Glow Line */}
        <div
          className="absolute inset-x-12 top-0 h-[1.5px] rounded-full blur-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.primaryColor} 50%, transparent 100%)`,
          }}
        />

        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-['Orbitron',sans-serif] font-bold tracking-[0.16em] uppercase text-white">
                AIRA Live Dialogue
              </h3>
              <p className="text-[10px] text-pink-300/80 font-['Space_Grotesk',sans-serif] tracking-wide">
                Type or tap prompts to speak with Aira
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Spoken Voice Suggestions Carousel */}
        <div className="py-2 border-b border-white/5 shrink-0">
          <PromptChips
            onSelectPrompt={(text) => {
              onSendPrompt(text);
              onClose();
            }}
            isVirtualMic={isVirtualMic}
            disabled={isSpeaking || isConnecting}
          />
        </div>

        {/* Message History Transcript */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 min-h-[140px] max-h-[40vh]">
          {messages.length === 0 ? (
            <div className="text-center py-6 text-neutral-400 text-xs font-['Space_Grotesk',sans-serif]">
              Say &ldquo;Hello Aira&rdquo; or type a message below to start talking!
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-pink-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs font-['Space_Grotesk',sans-serif] leading-relaxed ${
                      isUser
                        ? 'bg-pink-600/90 text-white rounded-tr-none shadow-md'
                        : 'bg-white/10 text-neutral-200 rounded-tl-none border border-white/10 shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Status / Speaking Indicator */}
        {isSpeaking && (
          <div className="py-1 px-3 mb-2 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center gap-2 text-pink-300 text-[11px] font-['Space_Grotesk',sans-serif] animate-pulse">
            <Volume2 className="w-3.5 h-3.5 text-pink-400" />
            <span>AIRA is speaking... Input paused to avoid accidental interruption</span>
          </div>
        )}

        {/* Interactive Chat Form Input */}
        <form onSubmit={handleSubmit} className="pt-2 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              disabled={isSpeaking || isConnecting}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isSpeaking
                  ? 'Aira is answering...'
                  : isConnecting
                  ? 'Establishing connection...'
                  : 'Message Aira in English, Hindi, or Marathi...'
              }
              className="w-full px-4 py-2.5 rounded-full bg-neutral-900 border border-white/15 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 text-xs sm:text-sm text-white placeholder-neutral-500 font-['Space_Grotesk',sans-serif] transition-all disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isSpeaking || isConnecting}
            aria-label="Send message to Aira"
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 active:scale-95 text-white font-['Orbitron',sans-serif] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 min-w-[42px] min-h-[42px]"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

