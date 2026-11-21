import React from 'react';
import { ReactionData } from '../types/index.ts';
import { Sparkles, Crown, Flame, Heart, Smile, Laugh } from 'lucide-react';

interface PersonalityReactionProps {
  reaction: ReactionData | null;
  onDismiss: () => void;
}

export const PersonalityReaction: React.FC<PersonalityReactionProps> = ({
  reaction,
  onDismiss,
}) => {
  if (!reaction) return null;

  const getEmojiIcon = (type: ReactionData['type']) => {
    switch (type) {
      case 'crown':
        return <Crown className="w-5 h-5 text-amber-300" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-fuchsia-300" />;
      case 'fire':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'heart':
        return <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />;
      case 'laugh':
        return <Laugh className="w-5 h-5 text-yellow-300" />;
      case 'wink':
        return <Smile className="w-5 h-5 text-cyan-300" />;
      case 'wave':
        return <Smile className="w-5 h-5 text-emerald-300" />;
      case 'thinking':
        return <Sparkles className="w-5 h-5 text-purple-300" />;
      case 'smirk':
      default:
        return <Sparkles className="w-5 h-5 text-pink-300" />;
    }
  };

  return (
    <div
      onClick={onDismiss}
      className="fixed top-24 right-4 sm:right-8 md:right-12 z-50 cursor-pointer animate-in fade-in slide-in-from-right duration-300 max-w-xs sm:max-w-sm select-none"
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-neutral-900/90 border border-pink-500/50 shadow-[0_0_25px_rgba(236,72,153,0.4)] backdrop-blur-md text-white hover:border-pink-400 transition-colors">
        <div className="p-1.5 rounded-full bg-pink-500/20 border border-pink-500/30 shrink-0">
          {getEmojiIcon(reaction.type)}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-['Orbitron',sans-serif] font-bold tracking-[0.18em] uppercase text-pink-300">
            {reaction.type}
          </span>
          {reaction.remark && (
            <span className="text-xs text-neutral-200 italic font-['Space_Grotesk',sans-serif] break-words">
              &ldquo;{reaction.remark}&rdquo;
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
