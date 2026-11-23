import React from 'react';
import { ConnectionState, VisualAesthetic } from '../types/index.ts';
import { THEMES } from './AestheticThemes.ts';
import { Sparkles, Palette, HelpCircle, Activity } from 'lucide-react';

interface HUDHeaderProps {
  state: ConnectionState;
  aesthetic: VisualAesthetic;
  onSelectAesthetic: (aesthetic: VisualAesthetic) => void;
  onOpenInfo: () => void;
  keywordControl?: React.ReactNode;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  state,
  aesthetic,
  onSelectAesthetic,
  onOpenInfo,
  keywordControl,
}) => {
  const theme = THEMES[aesthetic] || THEMES['cyber-magenta'];

  const getStatusBadge = () => {
    switch (state) {
      case 'listening':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-['Orbitron',sans-serif] font-bold tracking-[0.22em] uppercase bg-gradient-to-r from-neutral-950/90 via-emerald-950/60 to-neutral-950/90 text-emerald-300 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-xl animate-pulse">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </span>
            <span>LIVE • LISTENING</span>
          </span>
        );
      case 'speaking':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-['Orbitron',sans-serif] font-bold tracking-[0.22em] uppercase bg-gradient-to-r from-neutral-950/90 via-pink-950/60 to-neutral-950/90 text-pink-300 border border-pink-500/40 shadow-[0_0_20px_rgba(244,114,182,0.35)] backdrop-blur-xl">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-400 shadow-[0_0_8px_#f472b6]" />
            </span>
            <span>AIRA SPEAKING</span>
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-['Orbitron',sans-serif] font-bold tracking-[0.22em] uppercase bg-gradient-to-r from-neutral-950/90 via-amber-950/60 to-neutral-950/90 text-amber-300 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full border border-amber-400 border-t-transparent animate-spin" />
            <span>SYNCING LINK</span>
          </span>
        );
      case 'interrupted':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-['Orbitron',sans-serif] font-bold tracking-[0.22em] uppercase bg-gradient-to-r from-neutral-950/90 via-yellow-950/60 to-neutral-950/90 text-yellow-300 border border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.25)] backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            <span>INTERRUPTED</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-['Orbitron',sans-serif] font-bold tracking-[0.22em] uppercase bg-gradient-to-r from-neutral-950/90 via-red-950/60 to-neutral-950/90 text-red-300 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)] backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#f87171]" />
            <span>LINK OFFLINE</span>
          </span>
        );
      case 'disconnected':
      default:
        return (
          <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[10px] sm:text-[11.5px] font-['Orbitron',sans-serif] font-extrabold tracking-[0.26em] uppercase bg-gradient-to-r from-neutral-950/95 via-[#1a0f28]/95 to-neutral-950/95 border border-pink-400/40 shadow-[0_0_22px_rgba(244,114,182,0.3)] backdrop-blur-xl">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400/50 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gradient-to-r from-pink-400 to-fuchsia-400 shadow-[0_0_10px_#f472b6]" />
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-white to-pink-300 drop-shadow-[0_0_10px_rgba(244,114,182,0.6)]">
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
    <header className="relative z-30 w-full max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
      {/* Brand logo & personality tag */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 shadow-lg">
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-['Orbitron',sans-serif] font-black tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-pink-200 drop-shadow-[0_0_12px_rgba(244,114,182,0.4)]">
              AIRA
            </h1>
            <span className="text-[9px] sm:text-[10px] font-['Orbitron',sans-serif] font-bold tracking-[0.16em] text-pink-300/90 px-1.5 py-0.5 rounded-md bg-pink-500/15 border border-pink-500/30 shadow-[0_0_8px_rgba(244,114,182,0.25)] select-none">
              v1.0
            </span>
          </div>
          <p className="flex items-center text-[10px] sm:text-[10.5px] font-['Space_Grotesk',sans-serif] tracking-[0.05em] text-neutral-300">
            <span>Conceptualized &amp; Developed by <strong className="text-pink-300 font-semibold tracking-wide drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]">Aryan Nikam</strong></span>
          </p>
        </div>
      </div>

      {/* Center status indicator - Perfectly Centered */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          {getStatusBadge()}
        </div>
      </div>
      <div className="md:hidden flex items-center gap-2">
        {getStatusBadge()}
      </div>

      {/* Right control buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {keywordControl}

        {/* Aesthetic picker */}
        <div className="relative group">
          <button
            aria-label="Change aura theme"
            className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white transition-all shadow-sm"
          >
            <Palette className="w-4 h-4" style={{ color: theme.primaryColor }} />
          </button>
          
          <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col gap-1 p-2 rounded-xl bg-neutral-900/95 border border-white/15 shadow-2xl backdrop-blur-xl w-44 z-50">
            <span className="text-[9px] font-['Orbitron',sans-serif] font-bold tracking-[0.18em] text-neutral-400 uppercase px-2 py-1">
              Neon Energy Aura
            </span>
            {aestheticsList.map((aes) => {
              const th = THEMES[aes];
              const isSelected = aes === aesthetic;
              return (
                <button
                  key={aes}
                  onClick={() => onSelectAesthetic(aes)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-['Space_Grotesk',sans-serif] font-medium tracking-wide transition-colors text-left ${
                    isSelected
                      ? 'bg-white/15 text-white'
                      : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: th.primaryColor }}
                  />
                  <span>{th.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info drawer trigger */}
        <button
          onClick={onOpenInfo}
          aria-label="About Aira persona and Live architecture"
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white transition-all shadow-sm"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
