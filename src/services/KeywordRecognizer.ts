import { KeywordDetectionEvent } from '../types/index.ts';

export interface KeywordRecognizerCallbacks {
  onWakeWord: (event: KeywordDetectionEvent) => void;
  onSleepWord: (event: KeywordDetectionEvent) => void;
  onListeningChange?: (isListening: boolean) => void;
  onInterimHeard?: (transcript: string) => void;
}

const WAKE_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: /\b(aira|Aira|ira|ayra|zoe)[\s,]*wake\s*up\b/i, label: 'Aira, wake up' },
  { regex: /\bwake\s*up[\s,]*(aira|Aira|ira|ayra|zoe)\b/i, label: 'Wake up, Aira' },
  { regex: /\bhey\s+(aira|Aira|ira|ayra)\b/i, label: 'Hey Aira' },
  { regex: /\b(aira|Aira)[\s,]*online\b/i, label: 'Aira, online' },
  { regex: /\bwake\s*up\b/i, label: 'Wake up' },
];

const SLEEP_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: /\b(aira|Aira|ira|ayra|zoe)[\s,]*(go\s+to\s+)?sleep\b/i, label: 'Aira, sleep' },
  { regex: /\b(go\s+to\s+)?sleep[\s,]*(aira|Aira|ira|ayra|zoe)\b/i, label: 'Sleep, Aira' },
  { regex: /\b(aira|Aira|ira|ayra)[\s,]*standby\b/i, label: 'Aira, standby' },
  { regex: /\b(aira|Aira|ira|ayra)[\s,]*disconnect\b/i, label: 'Aira, disconnect' },
  { regex: /\bgo\s+to\s+sleep\b/i, label: 'Go to sleep' },
];

export class KeywordRecognizer {
  private recognition: any = null;
  private isEnabled = false;
  private isRunning = false;
  private callbacks: KeywordRecognizerCallbacks;
  private restartTimeout: number | null = null;
  private lastTriggeredAt = 0;

  constructor(callbacks: KeywordRecognizerCallbacks) {
    this.callbacks = callbacks;
    this.initSpeechRecognition();
  }

  public static isBrowserSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Matches any wake or sleep phrase in a transcript string
   */
  public static matchCommand(
    transcript: string
  ): { command: 'wake' | 'sleep'; matchedPhrase: string } | null {
    const clean = transcript.trim();
    if (!clean) return null;

    for (const item of SLEEP_PATTERNS) {
      if (item.regex.test(clean)) {
        return { command: 'sleep', matchedPhrase: item.label };
      }
    }

    for (const item of WAKE_PATTERNS) {
      if (item.regex.test(clean)) {
        return { command: 'wake', matchedPhrase: item.label };
      }
    }

    return null;
  }

  private initSpeechRecognition(): void {
    if (!KeywordRecognizer.isBrowserSupported()) return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRecognitionCtor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isRunning = true;
        this.callbacks.onListeningChange?.(true);
      };

      this.recognition.onresult = (event: any) => {
        let combinedTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript || '';
          combinedTranscript += piece + ' ';
        }

        const trimmed = combinedTranscript.trim();
        if (!trimmed) return;

        this.callbacks.onInterimHeard?.(trimmed);
        this.evaluateTranscript(trimmed);
      };

      this.recognition.onerror = (event: any) => {
        // If browser SpeechRecognition permission is not granted yet, pause auto-restart
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.isRunning = false;
          this.isPausedForSession = true;
          this.callbacks.onListeningChange?.(false);
        }
      };

      this.recognition.onend = () => {
        this.isRunning = false;
        if (this.isEnabled && !this.isPausedForSession) {
          this.scheduleRestart();
        } else {
          this.callbacks.onListeningChange?.(false);
        }
      };
    } catch {
      // SpeechRecognition not available
    }
  }

  private isPausedForSession = false;

  public pauseBrowserRecognition(): void {
    this.isPausedForSession = true;
    if (this.restartTimeout) {
      window.clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition && this.isRunning) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.isRunning = false;
    this.callbacks.onListeningChange?.(false);
  }

  public resumeBrowserRecognition(): void {
    this.isPausedForSession = false;
    if (this.isEnabled) {
      this.scheduleRestart();
    }
  }

  public evaluateTranscript(transcript: string): boolean {
    const now = Date.now();
    // Cooldown of 2.2 seconds to avoid duplicate firing from interim speech chunks
    if (now - this.lastTriggeredAt < 2200) return false;

    const matched = KeywordRecognizer.matchCommand(transcript);
    if (!matched) return false;

    this.lastTriggeredAt = now;
    const detectionEvent: KeywordDetectionEvent = {
      id: `kw-${now}`,
      command: matched.command,
      matchedPhrase: matched.matchedPhrase,
      transcript,
      timestamp: now,
    };

    if (matched.command === 'wake') {
      this.callbacks.onWakeWord(detectionEvent);
    } else {
      this.callbacks.onSleepWord(detectionEvent);
    }

    return true;
  }

  private scheduleRestart(): void {
    if (this.restartTimeout) {
      window.clearTimeout(this.restartTimeout);
    }
    this.restartTimeout = window.setTimeout(() => {
      if (this.isEnabled && !this.isPausedForSession && !this.isRunning && this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // Might already be started
        }
      }
    }, 350);
  }

  public start(): void {
    this.isEnabled = true;
    this.isPausedForSession = false;
    if (!this.recognition) {
      this.initSpeechRecognition();
    }
    if (this.recognition && !this.isRunning) {
      try {
        this.recognition.start();
      } catch {
        // Ignore if already started
      }
    }
  }

  public stop(): void {
    this.isEnabled = false;
    this.isPausedForSession = false;
    if (this.restartTimeout) {
      window.clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition && this.isRunning) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.isRunning = false;
    this.callbacks.onListeningChange?.(false);
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public destroy(): void {
    this.stop();
    this.recognition = null;
  }
}
