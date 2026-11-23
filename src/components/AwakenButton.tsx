import React from 'react';
import { ConnectionState, VisualAesthetic } from '../types/index.ts';
import { THEMES } from './AestheticThemes.ts';
import { Mic, MicOff, Power, Sparkles, Volume2 } from 'lucide-react';

interface AwakenButtonProps {
  state: ConnectionState;
  aesthetic: VisualAesthetic;
  onToggleConnection: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const AwakenButton: React.FC<AwakenButtonProps> = ({
  state,
  aesthetic,
  onToggleConnection,
  isMuted,
  onToggleMute,
}) => {
  const theme = THEMES[aesthetic] || THEMES['cyber-magenta'];
  const isConnected = state === 'listening' || state === 'speaking' || state === 'interrupted';

  return (
    <div className="relative flex items-center justify-end gap-2.5">
      {/* Ambient Breathing Anime Glow matching Aira's pink aesthetic */}
      <div
        className="absolute -inset-1 rounded-full opacity-70 blur-xl pointer-events-none transition-all duration-700"
        style={{
          background: isConnected
            ? `radial-gradient(circle, ${theme.primaryColor}88 0%, rgba(244, 114, 182, 0.3) 60%, transparent 80%)`
            : 'radial-gradient(circle, rgba(244, 114, 182, 0.4) 0%, rgba(168, 85, 247, 0.25) 50%, transparent 80%)',
          transform: isConnected ? 'scale(1.2)' : 'scale(1.05)',
        }}
      />

      {/* Anime Cyber-Luxe Action Button */}
      <button
        onClick={onToggleConnection}
        aria-label={isConnected ? 'End session' : 'Awaken Aira'}
        className={`group relative flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400/50 active:scale-[0.96] hover:-translate-y-0.5 shadow-2xl backdrop-blur-2xl touch-manipulation select-none ${
          isConnected
            ? 'bg-gradient-to-r from-[#140b20]/95 via-[#1d102e]/95 to-[#12091c]/95 border border-pink-400/60 shadow-[0_0_30px_rgba(244,114,182,0.45)]'
            : 'bg-gradient-to-r from-[#120a1b]/95 via-[#1c0f2a]/95 to-[#120a1b]/95 hover:from-[#190d26] hover:via-[#241338] hover:to-[#190d26] border border-pink-400/40 hover:border-pink-300 shadow-[0_0_24px_rgba(244,114,182,0.3)]'
        }`}
      >
        {/* Top Crystal Specular Highlight */}
        <div className="absolute inset-x-3 top-0 h-[45%] rounded-t-full bg-gradient-to-b from-white/25 via-pink-200/10 to-transparent pointer-events-none" />

        {/* Diagonal Laser Light Sweep on Hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-pink-300/20 to-transparent pointer-events-none" />

        {/* Left Anime Crystal Jewel Emblem */}
        <div
          className="relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 group-hover:scale-105 shrink-0"
          style={{
            background: isConnected
              ? 'radial-gradient(circle, rgba(244,114,182,0.4) 0%, rgba(18,10,27,0.95) 75%)'
              : 'radial-gradient(circle, rgba(244,114,182,0.25) 0%, rgba(20,12,30,0.9) 75%)',
            borderColor: isConnected ? '#f472b6' : 'rgba(244,114,182,0.5)',
            boxShadow: '0 0 12px rgba(244,114,182,0.4), inset 0 0 8px rgba(244,114,182,0.2)',
          }}
        >
          {state === 'disconnected' && (
            <Sparkles className="w-4 h-4 text-pink-300 group-hover:text-pink-100 transition-colors animate-pulse" />
          )}
          {state === 'connecting' && (
            <Sparkles className="w-4 h-4 text-fuchsia-300 animate-spin" />
          )}
          {state === 'listening' && (
            <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
          )}
          {state === 'speaking' && (
            <Volume2 className="w-4 h-4 text-pink-300 animate-bounce" />
          )}
          {state === 'interrupted' && (
            <Mic className="w-4 h-4 text-amber-300" />
          )}
          {state === 'error' && (
            <Power className="w-4 h-4 text-red-400" />
          )}
        </div>

        {/* Center Anime Cyber Typography */}
        <div className="flex flex-col items-start justify-center text-left select-none">
          {state === 'disconnected' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-['Orbitron',sans-serif] font-bold tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-white to-pink-300 group-hover:to-pink-100 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]">
                  AWAKEN AIRA
                </span>
              </div>
              <span className="text-[8.5px] font-['Space_Grotesk',sans-serif] font-medium tracking-[0.16em] text-pink-300/80 group-hover:text-pink-200 transition-colors uppercase">
                Tap to connect
              </span>
            </>
          )}

          {state === 'connecting' && (
            <>
              <span className="text-[11px] sm:text-xs font-['Orbitron',sans-serif] font-bold tracking-[0.2em] uppercase text-fuchsia-300 animate-pulse drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
                LINKING AIRA...
              </span>
              <span className="text-[8.5px] font-['Space_Grotesk',sans-serif] font-medium tracking-[0.16em] text-pink-300/70 uppercase">
                Establishing neural stream
              </span>
            </>
          )}

          {state === 'listening' && (
            <>
              <span className="text-[11px] sm:text-xs font-['Orbitron',sans-serif] font-bold tracking-[0.2em] uppercase text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.5)]">
                AIRA LISTENING
              </span>
              <span className="text-[8.5px] font-['Space_Grotesk',sans-serif] font-medium tracking-[0.16em] text-pink-300/70 group-hover:text-pink-200 transition-colors uppercase">
                Tap to put in standby
              </span>
            </>
          )}

          {state === 'speaking' && (
            <>
              <span className="text-[11px] sm:text-xs font-['Orbitron',sans-serif] font-bold tracking-[0.2em] uppercase text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]">
                AIRA SPEAKING
              </span>
              <span className="text-[8.5px] font-['Space_Grotesk',sans-serif] font-medium tracking-[0.16em] text-pink-300/70 group-hover:text-pink-200 transition-colors uppercase">
                Interrupt anytime • Tap to sleep
              </span>
            </>
          )}

          {state === 'interrupted' && (
            <>
              <span className="text-[11px] sm:text-xs font-['Orbitron',sans-serif] font-bold tracking-[0.2em] uppercase text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]">
                INTERRUPTED
              </span>
              <span className="text-[8.5px] font-['Space_Grotesk',sans-serif] font-medium tracking-[0.16em] text-pink-300/70 uppercase">
                Listening back to you
              </span>
            </>
          )}

          {state === 'error' && (
            <>
              <span className="text-[11px] sm:text-xs font-['Orbitron',sans-serif] font-bold tracking-[0.2em] uppercase text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]">
                LINK OFFLINE
              </span>
              <span className="text-[8.5px] font-['Space_Grotesk',sans-serif] font-medium tracking-[0.16em] text-red-300 uppercase">
                Tap to retry
              </span>
            </>
          )}
        </div>

        {/* Right Diamond Jewel Beacon (matching Aira's costume diamonds) */}
        <div className="flex items-center gap-1.5 pl-1 shrink-0">
          {isConnected ? (
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 h-full rounded-full bg-pink-400 animate-[pulse_0.6s_ease-in-out_infinite]" />
              <span className="w-0.5 h-2 rounded-full bg-pink-300 animate-[pulse_0.8s_ease-in-out_infinite_0.2s]" />
              <span className="w-0.5 h-full rounded-full bg-pink-400 animate-[pulse_0.7s_ease-in-out_infinite_0.4s]" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-gradient-to-br from-pink-300 to-purple-400 shadow-[0_0_10px_#f472b6] animate-pulse" />
              <span className="absolute w-3.5 h-3.5 rotate-45 rounded-[2px] border border-pink-400/50 animate-ping opacity-60 pointer-events-none" />
            </div>
          )}
        </div>
      </button>

      {/* Quick Mute Satellite Button (when connected) */}
      {isConnected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          title={isMuted ? 'Unmute Aira audio' : 'Mute Aira audio'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="p-2.5 sm:p-3 rounded-full bg-[#140b20]/95 hover:bg-[#1f1032] border border-pink-400/50 text-pink-200 hover:text-white shadow-xl backdrop-blur-xl transition-all active:scale-95 shrink-0"
          style={{
            borderColor: isMuted ? 'rgba(239,68,68,0.6)' : 'rgba(244,114,182,0.5)',
            boxShadow: isMuted ? '0 0 15px rgba(239,68,68,0.4)' : '0 0 15px rgba(244,114,182,0.3)',
          }}
        >
          {isMuted ? (
            <MicOff className="w-4 h-4 text-red-400" />
          ) : (
            <Mic className="w-4 h-4 text-emerald-400" />
          )}
        </button>
      )}
    </div>
  );
};
