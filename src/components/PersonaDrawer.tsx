import React from 'react';
import { X, Sparkles, Zap, Globe, HeartHandshake, Volume2, VolumeX } from 'lucide-react';

interface PersonaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  outputVolume?: number;
  onVolumeChange?: (vol: number) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const PersonaDrawer: React.FC<PersonaDrawerProps> = ({
  isOpen,
  onClose,
  outputVolume,
  onVolumeChange,
  isMuted,
  onToggleMute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/15 p-5 sm:p-6 shadow-2xl text-neutral-100 overflow-hidden max-h-[85dvh] overflow-y-auto">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-500 text-white shadow-lg shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-['Orbitron',sans-serif] font-black tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]">
                Meet Aira
              </h2>
              <p className="text-[10px] sm:text-[11px] text-pink-300/80 font-['Space_Grotesk',sans-serif] font-medium tracking-[0.14em] uppercase">
                Voice-to-Voice Real-Time Companion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-sm text-neutral-300 font-['Space_Grotesk',sans-serif]">
          {/* Audio Output Volume Control */}
          {onVolumeChange && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-2 gap-2">
                <h3 className="flex items-center gap-2 font-bold text-pink-300 text-xs uppercase tracking-[0.18em] font-['Orbitron',sans-serif]">
                  <Volume2 className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Voice Volume</span>
                </h3>
                {onToggleMute && (
                  <button
                    onClick={onToggleMute}
                    aria-label={isMuted ? 'Unmute voice output' : 'Mute voice output'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-['Orbitron',sans-serif] uppercase tracking-wider transition-all min-h-[32px] ${
                      isMuted
                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-pink-400" />}
                    <span>{isMuted ? 'Muted' : 'Mute'}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={isMuted ? 0 : (outputVolume ?? 1.0)}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  aria-label="AIRA Voice Output Volume"
                  className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-400"
                />
                <span className="text-xs font-['Orbitron',sans-serif] font-bold text-pink-300 min-w-[50px] text-right">
                  {isMuted ? 'Muted' : `${Math.round((outputVolume ?? 1.0) * 100)}%`}
                </span>
              </div>
              <p className="mt-2 text-[10.5px] text-neutral-400 font-['Space_Grotesk',sans-serif]">
                Desktop defaults to 100% (original volume). Mobile defaults to 125% for micro-speakers. Output is managed via a soft-knee peak compressor (capped at 150%) to preserve natural voice dynamics. Does not affect mic input.
              </p>
            </div>
          )}

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

        <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-400 hover:to-fuchsia-400 text-black font-['Orbitron',sans-serif] font-bold text-xs tracking-[0.18em] uppercase transition-all shadow-lg active:scale-95 text-center min-h-[42px]"
          >
            Got it, Let&apos;s Talk
          </button>
        </div>
      </div>
    </div>
  );
};
