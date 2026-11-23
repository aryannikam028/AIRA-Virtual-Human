import React, { useState, useEffect } from 'react';
import { KeywordDetectionEvent, ConnectionState } from '../types/index.ts';
import { Radio, Ear, EarOff, Sparkles, Moon, Sun, CheckCircle2, X, Play } from 'lucide-react';

interface KeywordStatusHUDProps {
  isEnabled: boolean;
  isListening: boolean;
  isSupported: boolean;
  connectionState: ConnectionState;
  lastEvent: KeywordDetectionEvent | null;
  interimHeard: string;
  onToggleEnabled: () => void;
  onSimulatePhrase: (phrase: string) => void;
  onDismissEvent: () => void;
}

export const KeywordStatusHUD: React.FC<KeywordStatusHUDProps> = ({
  isEnabled,
  isListening,
  isSupported,
  connectionState,
  lastEvent,
  interimHeard,
  onToggleEnabled,
  onSimulatePhrase,
  onDismissEvent,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Auto-dismiss detection toast after 4.5s
  useEffect(() => {
    if (!lastEvent) return;
    const timer = setTimeout(() => {
      onDismissEvent();
    }, 4500);
    return () => clearTimeout(timer);
  }, [lastEvent, onDismissEvent]);

  const isConnected =
    connectionState === 'listening' ||
    connectionState === 'speaking' ||
    connectionState === 'interrupted';

  return (
    <>
      {/* Header Control Pill */}
      <div className="relative">
        <button
          onClick={() => setIsPopoverOpen((prev) => !prev)}
          aria-label="Hands-free voice keyword recognition settings"
          title="Hands-free Keyword Spotting ('Aira, wake up' / 'Aira, sleep')"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] sm:text-[9.5px] font-['Orbitron',sans-serif] font-bold tracking-[0.16em] uppercase transition-all shadow-sm ${
            isEnabled
              ? 'bg-pink-500/15 border-pink-500/40 text-pink-300 hover:bg-pink-500/25 shadow-[0_0_15px_rgba(244,114,182,0.2)]'
              : 'bg-neutral-900/80 border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          {isEnabled ? (
            <Ear className={`w-3.5 h-3.5 text-pink-400 ${isListening ? 'animate-pulse' : ''}`} />
          ) : (
            <EarOff className="w-3.5 h-3.5 text-neutral-500" />
          )}
          <span className="hidden md:inline">
            {isEnabled ? 'Wake Guard: ON' : 'Wake Guard: OFF'}
          </span>
          {isEnabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        {/* Keyword Sentinel Popover */}
        {isPopoverOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-neutral-900/95 border border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.85)] backdrop-blur-xl p-4 text-neutral-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-['Orbitron',sans-serif] font-bold uppercase tracking-[0.18em] text-white">
                    Voice Keyword Sentinel
                  </h4>
                  <p className="text-[10px] text-pink-300/80 font-['Space_Grotesk',sans-serif] tracking-wide">
                    Hands-free wake &amp; sleep trigger
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPopoverOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 mb-3 font-['Space_Grotesk',sans-serif]">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">
                  Hands-Free Keyword Spotting
                </span>
                <span className="text-[10px] text-neutral-400">
                  {isSupported
                    ? isListening
                      ? 'Actively scanning microphone stream'
                      : isConnected
                      ? 'Active via Gemini Live stream'
                      : 'Paused'
                    : 'Using Gemini Live stream + Simulator'}
                </span>
              </div>
              <button
                onClick={onToggleEnabled}
                className={`px-3 py-1 rounded-lg text-[9.5px] font-['Orbitron',sans-serif] uppercase font-bold tracking-wider transition-colors ${
                  isEnabled
                    ? 'bg-emerald-500 text-black'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                {isEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Active Trigger Phrases */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <div className="flex items-center gap-1.5 text-emerald-400 font-['Orbitron',sans-serif] font-bold uppercase text-[9.5px] tracking-wider mb-1">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Wake Phrases</span>
                </div>
                <ul className="space-y-1 text-neutral-200 text-xs font-['Space_Grotesk',sans-serif]">
                  <li>&ldquo;Aira, wake up&rdquo;</li>
                  <li>&ldquo;Hey Aira&rdquo;</li>
                  <li>&ldquo;Aira, online&rdquo;</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25">
                <div className="flex items-center gap-1.5 text-purple-300 font-['Orbitron',sans-serif] font-bold uppercase text-[9.5px] tracking-wider mb-1">
                  <Moon className="w-3.5 h-3.5" />
                  <span>Sleep Phrases</span>
                </div>
                <ul className="space-y-1 text-neutral-200 text-xs font-['Space_Grotesk',sans-serif]">
                  <li>&ldquo;Aira, sleep&rdquo;</li>
                  <li>&ldquo;Aira, standby&rdquo;</li>
                  <li>&ldquo;Go to sleep&rdquo;</li>
                </ul>
              </div>
            </div>

            {/* Live Acoustic Monitor */}
            <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 mb-3">
              <div className="flex items-center justify-between text-[9.5px] font-['Orbitron',sans-serif] text-neutral-400 uppercase tracking-widest mb-1">
                <span>Acoustic Buffer</span>
                <span className="text-pink-400 font-bold">{isEnabled ? 'MONITORING' : 'IDLE'}</span>
              </div>
              <p className="text-neutral-300 truncate italic text-xs font-['Space_Grotesk',sans-serif]">
                {interimHeard ? `"${interimHeard}"` : 'Say "Aira, wake up" or "Aira, sleep"...'}
              </p>
            </div>

            {/* Quick Voice Command Simulator for Instant Verification */}
            <div className="pt-2 border-t border-white/10">
              <span className="block text-[9.5px] font-['Orbitron',sans-serif] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Test Voice Trigger Instantly
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onSimulatePhrase('Aira, wake up');
                    setIsPopoverOpen(false);
                  }}
                  disabled={isConnected || connectionState === 'connecting'}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 disabled:pointer-events-none border border-emerald-500/40 text-emerald-300 text-xs font-['Space_Grotesk',sans-serif] font-semibold transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>&ldquo;Aira, wake up&rdquo;</span>
                </button>

                <button
                  onClick={() => {
                    onSimulatePhrase('Aira, sleep');
                    setIsPopoverOpen(false);
                  }}
                  disabled={!isConnected}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-40 disabled:pointer-events-none border border-purple-500/40 text-purple-300 text-xs font-['Space_Grotesk',sans-serif] font-semibold transition-all"
                >
                  <Moon className="w-3 h-3" />
                  <span>&ldquo;Aira, sleep&rdquo;</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Detection Notification Banner */}
      {lastEvent && (
        <div
          onClick={onDismissEvent}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 cursor-pointer animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-full border backdrop-blur-xl shadow-2xl ${
              lastEvent.command === 'wake'
                ? 'bg-emerald-950/90 border-emerald-400/50 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                : 'bg-purple-950/90 border-purple-400/50 text-purple-100 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
            }`}
          >
            <div
              className={`p-1.5 rounded-full ${
                lastEvent.command === 'wake'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-purple-500/20 text-purple-300'
              }`}
            >
              {lastEvent.command === 'wake' ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </div>
            <div className="flex flex-col pr-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-current" />
                <span className="text-[9.5px] font-['Orbitron',sans-serif] font-bold uppercase tracking-[0.18em] opacity-90">
                  Voice Keyword Recognized
                </span>
              </div>
              <span className="text-xs font-['Space_Grotesk',sans-serif] font-semibold">
                &ldquo;{lastEvent.matchedPhrase}&rdquo; &rarr;{' '}
                {lastEvent.command === 'wake' ? 'Awakening Neural Link' : 'Entering Sleep Standby'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
