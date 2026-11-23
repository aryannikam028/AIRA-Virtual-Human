import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';

interface PromptChipsProps {
  onSelectPrompt?: (text: string) => void;
  isVirtualMic?: boolean;
  disabled?: boolean;
}

const SAMPLE_PROMPTS = [
  "Roast my day like a close friend",
  "Give me a flirty confidence boost",
  "Open Spotify for late night study vibes",
  "What is the current time and weather?",
  "Tell me a spicy unpopular opinion",
  "Switch the vibe to neon cyan",
  "Show me in portrait mode",
];

export const PromptChips: React.FC<PromptChipsProps> = ({
  onSelectPrompt,
  isVirtualMic,
  disabled = false,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-1 select-none">
      <div className="flex items-center justify-center gap-1.5 mb-1.5 text-neutral-400 text-[10px] sm:text-xs font-['Space_Grotesk',sans-serif] tracking-wider uppercase">
        <Sparkles className="w-3 h-3 text-pink-400" />
        <span>
          {isVirtualMic
            ? 'Virtual Voice Bridge • Tap to speak'
            : 'Spoken Prompts (Say or Tap)'}
        </span>
      </div>

      {/* Horizontal scroll on mobile screens, flex wrap on desktop */}
      <div className="flex items-center sm:justify-center overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pb-1 px-1 touch-pan-x">
        {SAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt?.(prompt)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] sm:text-xs font-['Space_Grotesk',sans-serif] backdrop-blur-md shrink-0 transition-all select-none ${
              disabled
                ? 'opacity-50 cursor-not-allowed bg-neutral-900/60 border border-white/5 text-neutral-500'
                : 'bg-neutral-900/80 hover:bg-neutral-800/90 active:scale-95 border border-white/10 hover:border-pink-500/50 text-neutral-200 hover:text-white shadow-sm cursor-pointer'
            }`}
          >
            <MessageCircle className="w-3 h-3 text-pink-400/80 shrink-0" />
            <span className="whitespace-nowrap">&ldquo;{prompt}&rdquo;</span>
          </button>
        ))}
      </div>
    </div>
  );
};
