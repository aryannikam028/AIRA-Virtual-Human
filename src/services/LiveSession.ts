import { AudioStreamer } from './AudioStreamer.ts';
import {
  ConnectionState,
  ServerToClientMessage,
  ClientToServerMessage,
  ToolCallItem,
  ReactionData,
  WebsiteActionData,
  VisualAesthetic,
} from '../types/index.ts';
import { useCharacterStore, CameraFraming } from '../state/useCharacterStore.ts';

export interface LiveSessionCallbacks {
  onStateChange: (state: ConnectionState) => void;
  onError: (errorMessage: string) => void;
  onReaction?: (reaction: ReactionData) => void;
  onWebsiteAction?: (action: WebsiteActionData) => void;
  onAestheticChange?: (theme: VisualAesthetic) => void;
  onCameraModeChange?: (mode: CameraFraming) => void;
  onInputTranscript?: (transcript: string) => void;
  onSleepRequested?: (reason: string) => void;
  onMicModeChange?: (isHardwareMic: boolean, reason?: string) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private audioStreamer: AudioStreamer;
  private state: ConnectionState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private isIntentionalDisconnect = false;
  private isAiraResponding = false;
  private isServerTurnComplete = false;
  private finishTimeout: ReturnType<typeof setTimeout> | null = null;
  private safetyGateTimeout: ReturnType<typeof setTimeout> | null = null;

  private armSafetyGateWatchdog(): void {
    if (this.safetyGateTimeout) clearTimeout(this.safetyGateTimeout);
    this.safetyGateTimeout = setTimeout(() => {
      if (this.state !== 'disconnected' && this.audioStreamer.getIsMicGated() && !this.audioStreamer.getIsSpeaking()) {
        console.warn('Safety watchdog: un-gating mic after silence timeout');
        this.isAiraResponding = false;
        this.isServerTurnComplete = false;
        this.audioStreamer.setMicGated(false);
        this.setState('listening');
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'response_complete' }));
        }
      }
    }, 12000);
  }

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
    this.audioStreamer = new AudioStreamer({
      onSpeakingChange: (isSpeaking) => {
        if (this.state === 'disconnected' || this.state === 'connecting') return;
        if (isSpeaking) {
          this.isAiraResponding = true;
          this.audioStreamer.setMicGated(true);
          this.setState('speaking');
        } else {
          this.checkIfResponseFullyComplete();
        }
      },
      onUserSpeakingChange: (_isUserSpeaking) => {
        // Strictly non-interruptible: never interrupt AIRA while she is processing or responding
      },
    });
  }

  public getAudioStreamer(): AudioStreamer {
    return this.audioStreamer;
  }

  public setOutputVolume(volume: number): void {
    this.audioStreamer.setOutputVolume(volume);
  }

  public getOutputVolume(): number {
    return this.audioStreamer.getOutputVolumeSetting();
  }

  public async resumeAudioContext(): Promise<void> {
    await this.audioStreamer.resumeAudioContext();
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public getIsResponding(): boolean {
    return this.isAiraResponding;
  }

  private setState(newState: ConnectionState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  private checkIfResponseFullyComplete(): void {
    if (
      this.isServerTurnComplete &&
      !this.audioStreamer.getIsSpeaking() &&
      this.audioStreamer.getActiveSourceCount() === 0
    ) {
      if (this.finishTimeout) clearTimeout(this.finishTimeout);
      // Wait 300ms cooldown buffer so audio playback has completely finished and speaker echo clears
      this.finishTimeout = setTimeout(() => {
        if (this.safetyGateTimeout) clearTimeout(this.safetyGateTimeout);
        if (
          !this.audioStreamer.getIsSpeaking() &&
          this.audioStreamer.getActiveSourceCount() === 0
        ) {
          this.isAiraResponding = false;
          this.isServerTurnComplete = false;
          this.audioStreamer.setMicGated(false);
          this.setState('listening');
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'response_complete' }));
          }
        }
      }, 300);
    }
  }

  private sendAudioChunk = (base64PCM: string): void => {
    // If AIRA is processing, generating, or speaking: DISCARD mic audio completely
    if (
      this.isAiraResponding ||
      this.state === 'speaking' ||
      this.audioStreamer.getIsSpeaking() ||
      this.audioStreamer.getIsMicGated()
    ) {
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg: ClientToServerMessage = {
        type: 'audio',
        audio: base64PCM,
      };
      this.ws.send(JSON.stringify(msg));
    }
  };

  /**
   * Re-attempts hardware microphone initialization while session is active
   */
  public async retryHardwareMic(): Promise<boolean> {
    const status = await this.audioStreamer.startRecording(this.sendAudioChunk);
    this.callbacks.onMicModeChange?.(status.hardwareMic, status.fallbackReason);
    return status.hardwareMic;
  }

  /**
   * Sends a spoken prompt to Aira (used in Virtual Voice Bridge mode or quick voice starters)
   */
  public sendVoicePrompt(prompt: string): void {
    if (!prompt.trim()) return;
    // Do not accept any new voice prompt while Aira is still responding to the previous instruction
    if (
      this.isAiraResponding ||
      this.state === 'speaking' ||
      this.audioStreamer.getIsSpeaking()
    ) {
      console.log('Voice prompt ignored: AIRA is currently responding to a previous instruction.');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.isAiraResponding = true;
      this.isServerTurnComplete = false;
      this.audioStreamer.setMicGated(true);
      this.setState('speaking');

      const msg: ClientToServerMessage = {
        type: 'voice_prompt',
        prompt: prompt.trim(),
      };
      this.ws.send(JSON.stringify(msg));
    }
  }

  /**
   * Connects to the server WebSocket and starts Live Audio session
   */
  public async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'listening' || this.state === 'speaking') {
      return;
    }

    this.isIntentionalDisconnect = false;
    this.setState('connecting');

    try {
      // Request mic inside the direct user gesture before awaiting WebSocket handshake
      const micStatus = await this.audioStreamer.startRecording(this.sendAudioChunk);
      this.callbacks.onMicModeChange?.(micStatus.hardwareMic, micStatus.fallbackReason);

      // Dynamic WebSocket URL resolution: supports remote Render backend via VITE_WS_URL,
      // while preserving standard relative host connection for localhost development.
      const envWsUrl = import.meta.env.VITE_WS_URL;
      let wsUrl: string;

      if (envWsUrl && typeof envWsUrl === 'string' && envWsUrl.trim().length > 0) {
        let clean = envWsUrl.trim().replace(/\/+$/, '');
        if (clean.startsWith('https://')) {
          clean = clean.replace('https://', 'wss://');
        } else if (clean.startsWith('http://')) {
          clean = clean.replace('http://', 'ws://');
        } else if (!clean.startsWith('wss://') && !clean.startsWith('ws://')) {
          clean = `wss://${clean}`;
        }
        wsUrl = clean.endsWith('/live') ? clean : `${clean}/live`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/live`;
      }
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send client temporal context immediately upon connection
        const now = new Date();
        const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
        const clientDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const clientTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: 'client_init',
              clientTimeZone,
              clientDate,
              clientTime,
              clientTimestamp: now.getTime(),
            })
          );
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data: ServerToClientMessage = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (err) {
          console.warn('Failed to parse incoming WebSocket message:', err);
        }
      };

      this.ws.onerror = () => {
        this.callbacks.onError('Neural link connection interrupted');
        this.setState('error');
      };

      this.ws.onclose = (event) => {
        if (!this.isIntentionalDisconnect) {
          this.callbacks.onError(event.reason || 'Connection closed');
        }
        this.teardown();
        this.setState('disconnected');
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      this.callbacks.onError(errorMsg);
      this.setState('error');
      this.teardown();
    }
  }

  private handleServerMessage(data: ServerToClientMessage): void {
    switch (data.type) {
      case 'status':
        if (this.state === 'connecting') {
          this.setState('listening');
        }
        break;

      case 'model_turn_start':
        this.isAiraResponding = true;
        this.isServerTurnComplete = false;
        this.audioStreamer.setMicGated(true);
        this.setState('speaking');
        this.armSafetyGateWatchdog();
        break;

      case 'audio':
        if (data.audio) {
          this.isAiraResponding = true;
          this.isServerTurnComplete = false;
          this.audioStreamer.setMicGated(true);
          this.audioStreamer.playAudioChunk(data.audio);
          this.armSafetyGateWatchdog();
        }
        break;

      case 'interrupted':
        // Interruption is disabled: AIRA must not be interrupted while responding
        break;

      case 'turn_complete':
        this.isServerTurnComplete = true;
        this.checkIfResponseFullyComplete();
        break;

      case 'tool_call':
        if (data.calls && data.calls.length > 0) {
          this.executeToolCalls(data.calls);
        }
        break;

      case 'input_transcript':
        if (data.transcript) {
          this.callbacks.onInputTranscript?.(data.transcript);
        }
        break;

      case 'error':
        this.callbacks.onError(data.message || 'Live session error occurred');
        break;
    }
  }

  /**
   * Executes tools requested by Aira and immediately returns results
   */
  private async executeToolCalls(calls: ToolCallItem[]): Promise<void> {
    for (const call of calls) {
      try {
        let result: Record<string, unknown> = { success: true };

        if (call.name === 'openWebsite') {
          const url = (call.args.url as string) || '';
          const title = (call.args.title as string) || (call.args.label as string) || 'Website';
          
          if (url) {
            this.callbacks.onWebsiteAction?.({
              id: call.id,
              url,
              title,
              timestamp: Date.now(),
            });

            // Safely open website in new window/tab
            try {
              window.open(url, '_blank', 'noopener,noreferrer');
            } catch (err) {
              console.warn('Popup blocked, action will be shown in UI:', err);
            }
            result = { success: true, opened: url, title };
          }
        } else if (call.name === 'triggerReaction') {
          const type = (call.args.type as ReactionData['type']) || 'smirk';
          const remark = (call.args.remark as string) || (call.args.caption as string) || '';
          const gesture = call.args.gesture as any;
          
          this.callbacks.onReaction?.({
            id: call.id,
            type,
            remark,
            gesture,
            timestamp: Date.now(),
          });
          result = { success: true, displayed: type, remark, gesture };
        } else if (call.name === 'changeAesthetic') {
          const theme = (call.args.theme as VisualAesthetic) || (call.args.mood as VisualAesthetic) || 'cyber-magenta';
          this.callbacks.onAestheticChange?.(theme);
          result = { success: true, appliedTheme: theme };
        } else if (call.name === 'sleepSession') {
          const reason = (call.args.reason as string) || 'Aira, sleep';
          this.callbacks.onSleepRequested?.(reason);
          result = { success: true, action: 'sleep' };
        } else if (call.name === 'getCurrentDateTime') {
          const now = new Date();
          const tz = (call.args.timeZone as string) || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
          const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz });
          const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: tz });
          result = {
            success: true,
            currentDate: dateStr,
            currentTime: timeStr,
            timeZone: tz,
            iso: now.toISOString(),
          };
        } else if (call.name === 'setCameraMode') {
          const rawMode = ((call.args.mode || call.args.framing || '') as string).toLowerCase();
          const targetMode: CameraFraming =
            rawMode.includes('portrait') || rawMode.includes('face') || rawMode.includes('zoom-in')
              ? 'portrait'
              : 'full-body';
          useCharacterStore.getState().setCameraFraming(targetMode);
          this.callbacks.onCameraModeChange?.(targetMode);
          result = { success: true, cameraFraming: targetMode };
        }

        // Return tool response immediately to Live API
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const responseMsg: ClientToServerMessage = {
            type: 'tool_response',
            toolResponse: {
              id: call.id,
              name: call.name,
              response: result,
            },
          };
          this.ws.send(JSON.stringify(responseMsg));
        }
      } catch (err) {
        console.error('Error executing tool call:', call.name, err);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: 'tool_response',
              toolResponse: {
                id: call.id,
                name: call.name,
                response: { error: 'Failed to execute tool' },
              },
            })
          );
        }
      }
    }
  }

  /**
   * Handles user interruption or server interruption signal
   */
  private handleInterruption(_notifyServer: boolean): void {
    // Interruption is intentionally disabled: AIRA must complete her full response uninterrupted.
  }

  private teardown(): void {
    if (this.finishTimeout) {
      clearTimeout(this.finishTimeout);
      this.finishTimeout = null;
    }
    if (this.safetyGateTimeout) {
      clearTimeout(this.safetyGateTimeout);
      this.safetyGateTimeout = null;
    }
    this.isAiraResponding = false;
    this.isServerTurnComplete = false;
    this.audioStreamer.setMicGated(false);
    this.audioStreamer.stopRecording();
    this.audioStreamer.interrupt();
  }

  /**
   * Gracefully disconnects the session
   */
  public disconnect(): void {
    this.isIntentionalDisconnect = true;
    this.teardown();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'User ended session');
      }
      this.ws = null;
    }

    this.setState('disconnected');
  }

  public destroy(): void {
    this.disconnect();
    this.audioStreamer.destroy();
  }
}
