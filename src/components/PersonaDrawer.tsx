import React from 'react';
import { X, Sparkles, Mic, Zap, Globe, MessageSquare, HeartHandshake } from 'lucide-react';

interface PersonaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonaDrawer: React.FC<PersonaDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-3xl bg-neutral-900 border border-white/15 p-4 sm:p-6 shadow-2xl text-neutral-100 overflow-hidden max-h-[88vh] max-h-[88dvh] overflow-y-auto">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-500 text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-['Orbitron',sans-serif] font-black tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]">
                Meet Aira
              </h2>
              <p className="text-[11px] text-pink-300/80 font-['Space_Grotesk',sans-serif] font-medium tracking-[0.14em] uppercase">
                Voice-to-Voice Real-Time Companion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-sm text-neutral-300 font-['Space_Grotesk',sans-serif]">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="flex items-center gap-2 font-bold text-pink-300 text-xs uppercase tracking-[0.18em] mb-1.5 font-['Orbitron',sans-serif]">
              <HeartHandshake className="w-4 h-4 text-pink-400" />
              The Persona
            </h3>
            <p className="text-xs leading-relaxed text-neutral-300 font-['Space_Grotesk',sans-serif]">
              Aira is a young, confident, witty, and playful female persona conceptualized and developed by <strong className="text-pink-300 font-semibold">Aryan Nikam</strong>. She talks casually with light sarcasm, teasing remarks, and bold one-liners like a close girlfriend. She is emotionally responsive, candid, and warm—never clinical or robotic.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="flex items-center gap-2 font-bold text-emerald-400 text-xs uppercase tracking-[0.18em] mb-1.5 font-['Orbitron',sans-serif]">
              <Zap className="w-4 h-4 text-emerald-400" />
              Live Audio-to-Audio Engine
            </h3>
            <ul className="text-xs space-y-1.5 text-neutral-300 font-['Space_Grotesk',sans-serif]">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>No text chat:</strong> Pure real-time bidirectional audio streaming via WebSockets.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Input:</strong> Mic captures 16kHz PCM16 low-latency chunks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Output:</strong> High-fidelity 24kHz Web Audio API playback with gapless scheduling.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Interruption handling:</strong> Speak anytime while Aira is talking to interrupt instantly.</span>
              </li>
            </ul>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="flex items-center gap-2 font-bold text-cyan-400 text-xs uppercase tracking-[0.18em] mb-1.5 font-['Orbitron',sans-serif]">
              <Globe className="w-4 h-4 text-cyan-400" />
              Real-Time Browser Tools
            </h3>
            <ul className="text-xs space-y-1.5 text-neutral-300 font-['Space_Grotesk',sans-serif]">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>openWebsite:</strong> Ask Aira to open Spotify, YouTube, Google, or any URL, and she will execute the action in real-time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>triggerReaction:</strong> Displays holographic emoji reaction badges to match her witty remarks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>changeAesthetic:</strong> Ask her to change the neon aura theme to cyan, violet, matrix green, or gold.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-400 hover:to-fuchsia-400 text-black font-['Orbitron',sans-serif] font-bold text-xs tracking-[0.18em] uppercase transition-all shadow-lg active:scale-95"
          >
            Got it, Let&apos;s Talk
          </button>
        </div>
      </div>
    </div>
  );
};
