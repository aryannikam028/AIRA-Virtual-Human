/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ConnectionState,
  VisualAesthetic,
  ReactionData,
  WebsiteActionData,
  KeywordDetectionEvent,
} from './types/index.ts';
import { THEMES } from './components/AestheticThemes.ts';
import { LiveSession } from './services/LiveSession.ts';
import { AudioStreamer } from './services/AudioStreamer.ts';
import { KeywordRecognizer } from './services/KeywordRecognizer.ts';
import { AuraOrb } from './components/AuraOrb.tsx';
import { WaveformVisualizer } from './components/WaveformVisualizer.tsx';
import { HUDHeader } from './components/HUDHeader.tsx';
import { AwakenButton } from './components/AwakenButton';
import { PersonalityReaction } from './components/PersonalityReaction.tsx';
import { WebsiteActionToast } from './components/WebsiteActionToast.tsx';
import { PersonaDrawer } from './components/PersonaDrawer.tsx';
import { DeviceEnergyMonitor } from './components/DeviceEnergyMonitor.tsx';
import { KeywordStatusHUD } from './components/KeywordStatusHUD.tsx';
import { DateTimeHUD } from './components/DateTimeHUD.tsx';
import { useCharacterStore } from './state/useCharacterStore.ts';
import { ConversationContextAnalyzer } from './services/ConversationContextAnalyzer.ts';
import { AlertCircle, RefreshCw, VolumeX, Mic, Eye } from 'lucide-react';

export default function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [aesthetic, setAesthetic] = useState<VisualAesthetic>('cyber-magenta');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [reaction, setReaction] = useState<ReactionData | null>(null);
  const [websiteAction, setWebsiteAction] = useState<WebsiteActionData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  // Microphone Mode State (Hardware vs Virtual Voice Bridge fallback)
  const [isHardwareMic, setIsHardwareMic] = useState<boolean>(true);
  const [micFallbackReason, setMicFallbackReason] = useState<string | null>(null);

  // Keyword Recognition State
  const [keywordEnabled, setKeywordEnabled] = useState<boolean>(true);
  const [keywordListening, setKeywordListening] = useState<boolean>(false);
  const [lastKeywordEvent, setLastKeywordEvent] = useState<KeywordDetectionEvent | null>(null);
  const [interimHeard, setInterimHeard] = useState<string>('');

  const liveSessionRef = useRef<LiveSession | null>(null);
  const keywordRecognizerRef = useRef<KeywordRecognizer | null>(null);
  const connectionStateRef = useRef<ConnectionState>('disconnected');
  const transcriptWindowRef = useRef<string>('');
  const pendingPromptRef = useRef<string | null>(null);
  const [audioStreamer, setAudioStreamer] = useState<AudioStreamer | null>(null);

  // Keep ref synced with latest connection state to avoid stale closures in voice callbacks
  useEffect(() => {
    connectionStateRef.current = connectionState;

    // Sync 3D character status with AIRA connection state
    const charStore = useCharacterStore.getState();
    switch (connectionState) {
      case 'disconnected':
        charStore.setStatus('idle');
        charStore.setAudioAmplitude(0);
        break;
      case 'connecting':
        charStore.setStatus('thinking');
        break;
      case 'listening':
      case 'interrupted':
        charStore.setStatus('listening');
        charStore.setAudioAmplitude(0);
        break;
      case 'speaking':
        charStore.setStatus('speaking');
        break;
      case 'error':
        charStore.setStatus('error');
        charStore.setAudioAmplitude(0);
        break;
    }
  }, [connectionState]);

  // Sync 3D character facial expression and full-body gesture with Aira's reactions
  useEffect(() => {
    const charStore = useCharacterStore.getState();
    if (!reaction) {
      return;
    }

    if (reaction.gesture) {
      charStore.setGesture(reaction.gesture);
    } else if (reaction.type === 'heart') {
      charStore.setGesture('handOnHeart');
    } else if (reaction.type === 'smirk' || reaction.type === 'crown') {
      charStore.setGesture('sassy');
    } else if (reaction.type === 'sparkles' || reaction.type === 'fire' || reaction.type === 'laugh') {
      charStore.setGesture('laughing');
    } else if (reaction.type === 'wave') {
      charStore.setGesture('waving');
    } else if (reaction.type === 'thinking') {
      charStore.setGesture('thinking');
    }

    if (reaction.type === 'sparkles' || reaction.type === 'fire') {
      charStore.setExpression('surprised');
    } else if (reaction.type === 'smirk') {
      charStore.setExpression('smirk');
    } else if (reaction.type === 'thinking') {
      charStore.setExpression('thinking');
    } else {
      charStore.setExpression('happy');
    }
  }, [reaction]);

  // Real-time 60fps lip-sync loop driving 3D VRM mouth blendshapes from AudioStreamer output volume
  useEffect(() => {
    if (!audioStreamer) return;
    let rafId: number;

    const updateLipSync = () => {
      if (connectionStateRef.current === 'speaking') {
        const outVol = audioStreamer.getOutputVolume();
        useCharacterStore.getState().setAudioAmplitude(outVol);
      } else if (useCharacterStore.getState().audioAmplitude !== 0) {
        useCharacterStore.getState().setAudioAmplitude(0);
      }
      rafId = requestAnimationFrame(updateLipSync);
    };

    rafId = requestAnimationFrame(updateLipSync);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [audioStreamer]);

  // Initialize LiveSession and KeywordRecognizer
  useEffect(() => {
    const session = new LiveSession({
      onStateChange: (state) => {
        connectionStateRef.current = state;
        setConnectionState(state);
        if (state === 'listening' || state === 'speaking') {
          setErrorMessage(null);
          if (state === 'listening' && pendingPromptRef.current) {
            const promptToSend = pendingPromptRef.current;
            pendingPromptRef.current = null;
            setTimeout(() => {
              session.sendVoicePrompt(promptToSend);
            }, 250);
          }
        }
        if (state === 'disconnected') {
          setMicFallbackReason(null);
          keywordRecognizerRef.current?.resumeBrowserRecognition();
        }
      },
      onError: (msg) => {
        setErrorMessage(msg);
      },
      onReaction: (rx) => {
        setReaction(rx);
      },
      onWebsiteAction: (action) => {
        setWebsiteAction(action);
      },
      onAestheticChange: (newTheme) => {
        setAesthetic(newTheme);
      },
      onCameraModeChange: (mode) => {
        useCharacterStore.getState().setCameraFraming(mode);
      },
      onMicModeChange: (hardwareMic, reason) => {
        setIsHardwareMic(hardwareMic);
        setMicFallbackReason(hardwareMic ? null : reason || null);
      },
      onInputTranscript: (chunk) => {
        // Accumulate rolling window of live spoken input transcript
        const updated = (transcriptWindowRef.current + ' ' + chunk).slice(-120).trim();
        transcriptWindowRef.current = updated;
        setInterimHeard(updated);

        // Voice command to switch between Full Body Mode and Portrait Mode
        const lowerTranscript = (chunk + ' ' + updated).toLowerCase();
        if (
          /\b(switch\s+to\s+portrait|change\s+to\s+portrait|portrait\s+mode|portrait\s+view|zoom\s+in|show\s+your\s+face|close\s*up)\b/i.test(
            lowerTranscript
          )
        ) {
          if (useCharacterStore.getState().cameraFraming !== 'portrait') {
            useCharacterStore.getState().setCameraFraming('portrait');
          }
        } else if (
          /\b(switch\s+to\s+full\s*body|change\s+to\s+full\s*body|full\s*body\s+mode|full\s*body\s+view|zoom\s+out|show\s+full\s*body)\b/i.test(
            lowerTranscript
          )
        ) {
          if (useCharacterStore.getState().cameraFraming !== 'full-body') {
            useCharacterStore.getState().setCameraFraming('full-body');
          }
        }

        // Real-time conversation context understanding: adapt gestures and expressions immediately
        const contextReaction = ConversationContextAnalyzer.analyzeTranscript(chunk || updated);
        if (contextReaction) {
          const charStore = useCharacterStore.getState();
          charStore.setExpression(contextReaction.expression);
          charStore.setGesture(contextReaction.gesture);
          if (contextReaction.badge) {
            setReaction({
              id: `ctx-${Date.now()}`,
              type: contextReaction.badge,
              remark: contextReaction.remark,
              timestamp: Date.now(),
            });
          }
        }

        if (connectionStateRef.current !== 'speaking' && keywordRecognizerRef.current?.getIsEnabled()) {
          const matched = KeywordRecognizer.matchCommand(updated);
          if (matched && matched.command === 'sleep') {
            transcriptWindowRef.current = '';
            keywordRecognizerRef.current.evaluateTranscript(updated);
          }
        }
      },
      onSleepRequested: (reason) => {
        // Triggered if the Gemini Live model invokes the `sleepSession` tool
        const now = Date.now();
        setLastKeywordEvent({
          id: `kw-tool-${now}`,
          command: 'sleep',
          matchedPhrase: reason || 'Aira, sleep',
          transcript: reason || 'Aira, sleep',
          timestamp: now,
        });
        session.disconnect();
      },
    });

    liveSessionRef.current = session;
    setAudioStreamer(session.getAudioStreamer());

    const recognizer = new KeywordRecognizer({
      onWakeWord: (event) => {
        setLastKeywordEvent(event);
        const current = connectionStateRef.current;
        if (current === 'disconnected' || current === 'error') {
          setErrorMessage(null);
          recognizer.pauseBrowserRecognition();
          session.connect();
        }
      },
      onSleepWord: (event) => {
        setLastKeywordEvent(event);
        const current = connectionStateRef.current;
        if (
          current === 'listening' ||
          current === 'speaking' ||
          current === 'interrupted' ||
          current === 'connecting'
        ) {
          session.disconnect();
        }
      },
      onListeningChange: (listening) => {
        setKeywordListening(listening);
      },
      onInterimHeard: (transcript) => {
        setInterimHeard(transcript);
      },
    });

    keywordRecognizerRef.current = recognizer;
    recognizer.start();

    return () => {
      recognizer.destroy();
      session.destroy();
    };
  }, []);

  const handleToggleConnection = useCallback(async () => {
    if (!liveSessionRef.current) return;

    if (connectionState === 'disconnected' || connectionState === 'error') {
      setErrorMessage(null);
      keywordRecognizerRef.current?.pauseBrowserRecognition();
      await liveSessionRef.current.connect();
    } else {
      liveSessionRef.current.disconnect();
    }
  }, [connectionState]);

  const handleRetryHardwareMic = useCallback(async () => {
    if (!liveSessionRef.current) return;
    await liveSessionRef.current.retryHardwareMic();
  }, []);

  const handleSelectPrompt = useCallback(
    async (promptText: string) => {
      if (!liveSessionRef.current) return;
      // Do not accept any new instructions until current response is fully completed
      if (connectionState === 'speaking') {
        return;
      }
      setInterimHeard(promptText);

      // Adapt character gesture and expression to prompt context immediately
      const contextReaction = ConversationContextAnalyzer.analyzeTranscript(promptText);
      if (contextReaction) {
        const charStore = useCharacterStore.getState();
        charStore.setExpression(contextReaction.expression);
        charStore.setGesture(contextReaction.gesture);
        if (contextReaction.badge) {
          setReaction({
            id: `ctx-${Date.now()}`,
            type: contextReaction.badge,
            remark: contextReaction.remark,
            timestamp: Date.now(),
          });
        }
      }

      // Check if prompt itself is a wake/sleep command
      if (keywordRecognizerRef.current?.evaluateTranscript(promptText)) {
        return;
      }

      if (connectionState === 'disconnected' || connectionState === 'error') {
        pendingPromptRef.current = promptText;
        setErrorMessage(null);
        keywordRecognizerRef.current?.pauseBrowserRecognition();
        await liveSessionRef.current.connect();
      } else {
        liveSessionRef.current.sendVoicePrompt(promptText);
      }
    },
    [connectionState]
  );

  const handleToggleMute = useCallback(() => {
    if (!liveSessionRef.current) return;
    const streamer = liveSessionRef.current.getAudioStreamer();
    const newMuted = !streamer.getMuted();
    streamer.setMuted(newMuted);
    setIsMuted(newMuted);
  }, []);

  const handleToggleKeywordEnabled = useCallback(() => {
    if (!keywordRecognizerRef.current) return;
    if (keywordEnabled) {
      keywordRecognizerRef.current.stop();
      setKeywordEnabled(false);
    } else {
      keywordRecognizerRef.current.start();
      setKeywordEnabled(true);
    }
  }, [keywordEnabled]);

  const handleSimulateKeyword = useCallback((phrase: string) => {
    if (!keywordRecognizerRef.current) return;
    setInterimHeard(phrase);
    keywordRecognizerRef.current.evaluateTranscript(phrase);
  }, []);

  const currentTheme = THEMES[aesthetic] || THEMES['cyber-magenta'];
  const isConnected =
    connectionState === 'listening' ||
    connectionState === 'speaking' ||
    connectionState === 'interrupted';

  return (
    <div className="relative h-screen h-dvh w-full bg-neutral-950 text-neutral-100 flex flex-col justify-between overflow-hidden select-none selection:bg-pink-500 selection:text-white">
      {/* Dynamic Futuristic Ambient Glow Aura */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000 z-0"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${currentTheme.glowColor} 0%, rgba(10, 10, 15, 0.95) 70%, #050508 100%)`,
        }}
      />

      {/* Cyber Grid Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* FULL-SCREEN 3D CHARACTER & AURA STAGE */}
      <AuraOrb
        state={connectionState}
        aesthetic={aesthetic}
        audioStreamer={audioStreamer}
      />

      {/* Floating Mood Reaction from Aira */}
      <PersonalityReaction
        reaction={reaction}
        onDismiss={() => setReaction(null)}
      />

      {/* Tool Action Toast (e.g. Website opened) */}
      <WebsiteActionToast
        action={websiteAction}
        onDismiss={() => setWebsiteAction(null)}
      />

      {/* FLOATING HUD INTERFACE OVERLAY */}
      <div className="relative z-20 h-full w-full flex flex-col justify-between pointer-events-none">
        {/* Top Header */}
        <div className="pointer-events-auto w-full">
          <HUDHeader
            state={connectionState}
            aesthetic={aesthetic}
            onSelectAesthetic={setAesthetic}
            onOpenInfo={() => setIsInfoOpen(true)}
            keywordControl={
              <KeywordStatusHUD
                isEnabled={keywordEnabled}
                isListening={keywordListening}
                isSupported={KeywordRecognizer.isBrowserSupported()}
                connectionState={connectionState}
                lastEvent={lastKeywordEvent}
                interimHeard={interimHeard}
                onToggleEnabled={handleToggleKeywordEnabled}
                onSimulatePhrase={handleSimulateKeyword}
                onDismissEvent={() => setLastKeywordEvent(null)}
              />
            }
          />
        </div>

        {/* Center Notifications (Error / Mic Fallback) */}
        <div className="w-full max-w-lg mx-auto px-4 flex flex-col items-center gap-2 pointer-events-none">
          {/* Error Notification Banner */}
          {errorMessage && (
            <div className="pointer-events-auto w-full p-3 rounded-2xl bg-red-950/85 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md animate-in fade-in">
              <div className="flex items-center gap-2 font-['Space_Grotesk',sans-serif]">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={handleToggleConnection}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-800 hover:bg-red-700 text-white font-['Orbitron',sans-serif] text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Virtual Voice Bridge Banner (when browser blocks hardware microphone) */}
          {isConnected && !isHardwareMic && micFallbackReason && (
            <div className="pointer-events-auto w-full px-3.5 py-2 rounded-2xl bg-amber-950/75 border border-amber-500/35 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-in fade-in">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-['Space_Grotesk',sans-serif]">{micFallbackReason}</span>
              </div>
              <button
                onClick={handleRetryHardwareMic}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-['Orbitron',sans-serif] text-[10px] uppercase font-bold tracking-wider shrink-0 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Enable Mic</span>
              </button>
            </div>
          )}
        </div>

        {/* Floating Side Status Pill - Stylish, small, and positioned safely on the side */}
        <div className="pointer-events-auto absolute bottom-14 sm:bottom-16 left-4 sm:left-6 z-30 max-w-[320px] sm:max-w-md select-none animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-neutral-950/90 via-[#160c22]/90 to-neutral-950/90 backdrop-blur-xl border border-pink-400/25 shadow-[0_0_15px_rgba(244,114,182,0.15)]">
            <span className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-400 shadow-[0_0_6px_#f472b6]" />
            </span>
            <p className="text-[9px] sm:text-[9.5px] font-['Space_Grotesk',sans-serif] tracking-[0.14em] uppercase text-neutral-300 leading-none whitespace-nowrap">
              {connectionState === 'disconnected' && (
                <>
                  <span className="text-pink-300 font-['Orbitron',sans-serif] font-bold tracking-[0.18em]">STANDBY</span>
                  <span className="text-neutral-500 mx-1.5">•</span>
                  <span>Say <strong className="text-white font-medium">&ldquo;Aira, wake up&rdquo;</strong> or tap <strong className="text-pink-300 font-semibold">Awaken</strong></span>
                </>
              )}
              {connectionState === 'connecting' && (
                <>
                  <span className="text-fuchsia-300 font-['Orbitron',sans-serif] font-bold tracking-[0.18em] animate-pulse">LINKING</span>
                  <span className="text-neutral-500 mx-1.5">•</span>
                  <span>Establishing neural stream...</span>
                </>
              )}
              {connectionState === 'listening' && (
                <>
                  <span className="text-emerald-300 font-['Orbitron',sans-serif] font-bold tracking-[0.18em]">LISTENING</span>
                  <span className="text-neutral-500 mx-1.5">•</span>
                  <span>Say &ldquo;Aira, sleep&rdquo; anytime</span>
                </>
              )}
              {connectionState === 'speaking' && (
                <>
                  <span className="text-pink-300 font-['Orbitron',sans-serif] font-bold tracking-[0.18em] animate-pulse">AIRA SPEAKING</span>
                  <span className="text-neutral-500 mx-1.5">•</span>
                  <span>Answering</span>
                </>
              )}
              {connectionState === 'interrupted' && (
                <>
                  <span className="text-amber-300 font-['Orbitron',sans-serif] font-bold tracking-[0.18em]">INTERRUPTED</span>
                  <span className="text-neutral-500 mx-1.5">•</span>
                  <span>Listening back to you</span>
                </>
              )}
              {connectionState === 'error' && (
                <>
                  <span className="text-red-400 font-['Orbitron',sans-serif] font-bold tracking-[0.18em]">OFFLINE</span>
                  <span className="text-neutral-500 mx-1.5">•</span>
                  <span>Tap Retry to reconnect</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Floating Side Action Dock - Positioned on the RIGHT side to leave Aira completely clear */}
        <div className="pointer-events-auto absolute bottom-14 sm:bottom-16 right-4 sm:right-6 z-30 flex flex-col items-end gap-1.5 select-none animate-in fade-in duration-300">
          {/* Oscilloscope Waveform Visualizer (compact sleek soundwave above the button) */}
          <div className="w-44 sm:w-56 h-6 sm:h-7 relative flex items-center justify-end pointer-events-none opacity-85">
            <WaveformVisualizer
              state={connectionState}
              aesthetic={aesthetic}
              audioStreamer={audioStreamer}
            />
          </div>

          {/* Anime Cyber-Luxe Awaken Button */}
          <AwakenButton
            state={connectionState}
            aesthetic={aesthetic}
            onToggleConnection={handleToggleConnection}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />

          {/* Muted Warning Indicator */}
          {isMuted && connectionState !== 'disconnected' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-200 text-[10px] font-['Space_Grotesk',sans-serif] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg">
              <VolumeX className="w-3.5 h-3.5" />
              <span>Audio output muted</span>
            </div>
          )}
        </div>

        {/* Bottom Minimal HUD Telemetry & Status bar */}
        <div className="pointer-events-auto w-full">
          <footer className="relative z-20 w-full max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-[10.5px] font-['Space_Grotesk',sans-serif] tracking-[0.14em] uppercase text-neutral-300 bg-neutral-950/40 backdrop-blur-md border-t border-white/5 sm:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899]" />
              <span className="font-semibold text-neutral-200">Gemini Live Audio</span>
            </div>

            {/* Live Accurate Chronometer HUD */}
            <div className="flex items-center mx-auto sm:mx-0">
              <DateTimeHUD />
            </div>

            <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
              {/* Full-Body / Portrait Camera Angle Toggle */}
              <button
                onClick={() => {
                  const current = useCharacterStore.getState().cameraFraming;
                  useCharacterStore.getState().setCameraFraming(current === 'full-body' ? 'portrait' : 'full-body');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-pink-300 transition-all font-semibold tracking-wider text-[10px]"
                title="Toggle between Full-Body 3D view and Portrait camera view"
              >
                <Eye className="w-3 h-3 text-pink-400" />
                <span>{useCharacterStore((s) => s.cameraFraming) === 'full-body' ? 'Full Body' : 'Portrait'}</span>
              </button>

              <DeviceEnergyMonitor
                connectionState={connectionState}
                primaryColor={currentTheme.primaryColor}
              />
            </div>
          </footer>
        </div>
      </div>

      {/* Information Modal */}
      <PersonaDrawer
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
