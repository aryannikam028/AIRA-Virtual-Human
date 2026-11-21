import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';

interface PromptChipsProps {
  onSelectPrompt?: (text: string) => void;
  isVirtualMic?: boolean;
}

const SAMPLE_PROMPTS = [
  "Roast my day like a close friend",
  "Give me a flirty confidence boost",
  "Open Spotify for late night study vibes",
  "Tell me a spicy unpopular opinion",
  "Switch the vibe to neon cyan",
];

export const PromptChips: React.FC<PromptChipsProps> = ({
  onSelectPrompt,
  isVirtualMic,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-2">
      <div className="flex items-center justify-center gap-1.5 mb-2 text-neutral-400 text-xs font-mono">
        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
        <span>
          {isVirtualMic
            ? 'Virtual Voice Bridge • Tap any voice prompt to speak to Aira'
            : 'Spoken Voice Suggestions (Say or Tap)'}
        </span>
      </div>

      <div className="flex items-center justify-center flex-wrap gap-2">
        {SAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt?.(prompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/70 border border-white/10 text-xs text-neutral-300 backdrop-blur-sm select-none hover:border-pink-500/50 hover:bg-pink-500/10 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <MessageCircle className="w-3 h-3 text-pink-400/80" />
            <span>&ldquo;{prompt}&rdquo;</span>
          </button>
        ))}
      </div>
    </div>
  );
};
