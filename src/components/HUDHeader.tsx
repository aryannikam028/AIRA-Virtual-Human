import React, { useState, useRef, useEffect } from 'react';
import { ConnectionState, VisualAesthetic } from '../types/index.ts';
import { THEMES } from './AestheticThemes.ts';
import {
  Sparkles,
  Palette,
  HelpCircle,
  Volume2,
  Volume1,
  VolumeX,
  MessageSquare,
  Check,
  Zap,
} from 'lucide-react';

interface HUDHeaderProps {
  state: ConnectionState;
  aesthetic: VisualAesthetic;
  onSelectAesthetic: (aesthetic: VisualAesthetic) => void;
  onOpenInfo: () => void;
  keywordControl?: React.ReactNode;
  volume?: number;
  isMuted?: boolean;
  onVolumeChange?: (volume: number) => void;
  onToggleMute?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  state,
  aesthetic,
  onSelectAesthetic,
  onOpenInfo,
  keywordControl,
  volume = 1.0,
  isMuted = false,
  onVolumeChange,
  onToggleMute,
  onToggleChat,
  isChatOpen = false,
}) => {
  const theme = THEMES[aesthetic] || THEMES['cyber-magenta'];
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setIsPaletteOpen(false);
      }
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
        setIsVolumeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const getStatusBadge = () => {
    switch (state) {
      case 'listening':
        return (
          <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-['Orbitron',sans-serif] font-bold tracking-[0.16em] sm:tracking-[0.22em] uppercase bg-gradient-to-r from-neutral-950/90 via-emerald-950/60 to-neutral-950/90 text-emerald-300 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-xl animate-pulse">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </span>
            <span>LIVE • LISTENING</span>
          </span>
        );
      case 'speaking':
        return (
          <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-['Orbitron',sans-serif] font-bold tracking-[0.16em] sm:tracking-[0.22em] uppercase bg-gradient-to-r from-neutral-950/90 via-pink-950/60 to-neutral-950/90 text-pink-300 border border-pink-500/40 shadow-[0_0_20px_rgba(244,114,182,0.35)] backdrop-blur-xl">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-400 shadow-[0_0_8px_#f472b6]" />
            </span>
            <span>AIRA SPEAKING</span>
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-['Orbitron',sans-serif] font-bold tracking-[0.16em] sm:tracking-[0.22em] uppercase bg-gradient-to-r from-neutral-950/90 via-amber-950/60 to-neutral-950/90 text-amber-300 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full border border-amber-400 border-t-transparent animate-spin" />
            <span>SYNCING LINK</span>
          </span>
        );
      case 'interrupted':
        return (
          <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-['Orbitron',sans-serif] font-bold tracking-[0.16em] sm:tracking-[0.22em] uppercase bg-gradient-to-r from-neutral-950/90 via-yellow-950/60 to-neutral-950/90 text-yellow-300 border border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.25)] backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            <span>INTERRUPTED</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-['Orbitron',sans-serif] font-bold tracking-[0.16em] sm:tracking-[0.22em] uppercase bg-gradient-to-r from-neutral-950/90 via-red-950/60 to-neutral-950/90 text-red-300 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)] backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#f87171]" />
            <span>OFFLINE</span>
          </span>
        );
      case 'disconnected':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-['Orbitron',sans-serif] font-extrabold tracking-[0.2em] sm:tracking-[0.26em] uppercase bg-gradient-to-r from-neutral-950/95 via-[#1a0f28]/95 to-neutral-950/95 border border-pink-400/40 shadow-[0_0_20px_rgba(244,114,182,0.25)] backdrop-blur-xl">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400/50 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gradient-to-r from-pink-400 to-fuchsia-400 shadow-[0_0_8px_#f472b6]" />
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-white to-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]">
              STANDBY
            </span>
          </span>
        );
    }
  };

  const aestheticsList: VisualAesthetic[] = [
    'cyber-magenta',
    'electric-violet',
    'neon-cyan',
    'emerald-matrix',
    'solar-gold',
  ];

  return (
    <header className="relative z-30 w-full max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
      {/* Brand logo & personality tag */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base sm:text-xl font-['Orbitron',sans-serif] font-black tracking-[0.18em] sm:tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-pink-200 drop-shadow-[0_0_12px_rgba(244,114,182,0.4)]">
              AIRA
            </h1>
            <span className="text-[8px] sm:text-[10px] font-['Orbitron',sans-serif] font-bold tracking-[0.14em] sm:tracking-[0.16em] text-pink-300/90 px-1 sm:px-1.5 py-0.2 rounded-md bg-pink-500/15 border border-pink-500/30 shadow-[0_0_8px_rgba(244,114,182,0.25)] select-none">
              v1.0
            </span>
          </div>
          <p className="flex items-center text-[9px] sm:text-[10.5px] font-['Space_Grotesk',sans-serif] tracking-[0.03em] sm:tracking-[0.05em] text-neutral-300">
            <span className="hidden sm:inline">Conceptualized &amp; Developed by <strong className="text-pink-300 font-semibold tracking-wide drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]">Aryan Nikam</strong></span>
            <span className="sm:hidden text-pink-300/90 font-medium">By Aryan Nikam</span>
          </p>
        </div>
      </div>

      {/* Center status indicator - Perfectly Centered on Desktop */}
      <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          {getStatusBadge()}
        </div>
      </div>

      {/* Mobile/Tablet inline status badge */}
      <div className="lg:hidden flex items-center">
        {getStatusBadge()}
      </div>

      {/* Right control buttons */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Hands-free Keyword Sentinel HUD */}
        {keywordControl}

        {/* User-Accessible Volume Control Popover */}
        <div className="relative" ref={volumeRef}>
          <button
            onClick={() => {
              setIsVolumeOpen((prev) => !prev);
              setIsPaletteOpen(false);
            }}
            aria-label="Aira voice volume control"
            title={`Voice Volume: ${isMuted ? 'Muted' : Math.round(volume * 100) + '%'}`}
            className={`p-2 rounded-xl border transition-all shadow-sm flex items-center justify-center min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] ${
              isVolumeOpen || volume > 1.0
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.3)]'
                : isMuted
                ? 'bg-red-500/15 border-red-500/30 text-red-300'
                : 'bg-neutral-900/80 hover:bg-neutral-800 border-white/10 text-neutral-300 hover:text-white'
            }`}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 0.6 ? (
              <Volume1 className="w-4 h-4 text-pink-300" />
            ) : (
              <Volume2 className="w-4 h-4 text-pink-300" />
            )}
          </button>

          {isVolumeOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 p-4 rounded-2xl bg-neutral-900/95 border border-white/15 shadow-[0_0_35px_rgba(0,0,0,0.85)] backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-pink-400" />
                  <span className="text-[10px] font-['Orbitron',sans-serif] font-bold tracking-[0.16em] uppercase text-white">
                    Aira Voice Volume
                  </span>
                </div>
                <span className="text-xs font-['Orbitron',sans-serif] font-bold text-pink-300">
                  {isMuted ? 'MUTED' : `${Math.round(volume * 100)}%`}
                </span>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-2 my-2">
                <div className="flex items-center justify-between text-[10px] font-['Space_Grotesk',sans-serif] text-neutral-400">
                  <span>Quiet (0%)</span>
                  <span>Standard (100%)</span>
                  <span className="text-pink-300 flex items-center gap-0.5">
                    <Zap className="w-3 h-3 text-pink-400 inline" />
                    Boost (150%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    onVolumeChange?.(newVol);
                    if (isMuted && newVol > 0) {
                      onToggleMute?.();
                    }
                  }}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none"
                />
              </div>

              {/* Quick Volume Presets */}
              <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => onToggleMute?.()}
                  className={`py-1 text-[10px] font-['Orbitron',sans-serif] font-bold rounded-lg transition-colors ${
                    isMuted ? 'bg-red-500/30 text-red-200 border border-red-500/50' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {isMuted ? 'UNMUTE' : 'MUTE'}
                </button>
                <button
                  type="button"
                  onClick={() => onVolumeChange?.(0.5)}
                  className="py-1 text-[10px] font-['Orbitron',sans-serif] font-bold rounded-lg bg-white/5 text-neutral-300 hover:bg-white/10 transition-colors"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => onVolumeChange?.(1.0)}
                  className="py-1 text-[10px] font-['Orbitron',sans-serif] font-bold rounded-lg bg-white/5 text-neutral-300 hover:bg-white/10 transition-colors"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => onVolumeChange?.(1.5)}
                  className="py-1 text-[10px] font-['Orbitron',sans-serif] font-bold rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30 transition-colors flex items-center justify-center gap-0.5"
                >
                  <Zap className="w-2.5 h-2.5" />
                  150%
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Aesthetic theme picker (Tap friendly for mobile + Desktop) */}
        <div className="relative" ref={paletteRef}>
          <button
            onClick={() => {
              setIsPaletteOpen((prev) => !prev);
              setIsVolumeOpen(false);
            }}
            aria-label="Change aura theme"
            className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white transition-all shadow-sm min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
          >
            <Palette className="w-4 h-4" style={{ color: theme.primaryColor }} />
          </button>

          {isPaletteOpen && (
            <div className="absolute right-0 top-full mt-2 flex flex-col gap-1 p-2 rounded-2xl bg-neutral-900/95 border border-white/15 shadow-2xl backdrop-blur-2xl w-48 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-[9px] font-['Orbitron',sans-serif] font-bold tracking-[0.18em] text-neutral-400 uppercase px-2 py-1">
                Neon Energy Aura
              </span>
              {aestheticsList.map((aes) => {
                const th = THEMES[aes];
                const isSelected = aes === aesthetic;
                return (
                  <button
                    key={aes}
                    onClick={() => {
                      onSelectAesthetic(aes);
                      setIsPaletteOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-['Space_Grotesk',sans-serif] font-medium tracking-wide transition-colors text-left ${
                      isSelected
                        ? 'bg-white/15 text-white'
                        : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: th.primaryColor }}
                      />
                      <span>{th.name}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-pink-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Chat / Voice Prompts Drawer Toggle */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            aria-label="Toggle voice prompts and chat"
            title="Chat & Prompt Suggestions"
            className={`p-2 rounded-xl border transition-all shadow-sm min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center ${
              isChatOpen
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.3)]'
                : 'bg-neutral-900/80 hover:bg-neutral-800 border-white/10 text-neutral-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}

        {/* Info drawer trigger */}
        <button
          onClick={onOpenInfo}
          aria-label="About Aira persona and Live architecture"
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white transition-all shadow-sm min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
