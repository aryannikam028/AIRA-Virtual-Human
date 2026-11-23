import {
  floatTo16BitPCM,
  resampleAudioBuffer,
  arrayBufferToBase64,
  base64ToFloat32Array
} from './audioUtils.ts';

export interface MicRecordingStatus {
  hardwareMic: boolean;
  fallbackReason?: string;
}

export class AudioStreamer {
  // Input (Mic Capture -> 16kHz PCM16)
  private inputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private isRecording = false;
  private isVirtualMic = false;
  private isMicGated = false;

  // Output (Playback -> 24kHz PCM16)
  private outputAudioContext: AudioContext | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private outputCompressor: DynamicsCompressorNode | null = null;
  private outputGainNode: GainNode | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isSpeaking = false;
  private isMuted = false;
  private volume = 1.0;
  private isMobile = false;

  // Callbacks
  private onSpeakingChange?: (isSpeaking: boolean) => void;
  private onUserSpeakingChange?: (isUserSpeaking: boolean) => void;

  constructor(callbacks?: {
    onSpeakingChange?: (isSpeaking: boolean) => void;
    onUserSpeakingChange?: (isUserSpeaking: boolean) => void;
  }) {
    this.onSpeakingChange = callbacks?.onSpeakingChange;
    this.onUserSpeakingChange = callbacks?.onUserSpeakingChange;

    if (typeof window !== 'undefined') {
      this.isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0;

      try {
        const savedVol = localStorage.getItem('aira_voice_volume');
        if (savedVol !== null) {
          const parsed = parseFloat(savedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 2.0) {
            this.volume = parsed;
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Applies the calculated gain factoring in user volume, mute state, and mobile acoustics
   */
  private applyEffectiveGain(): void {
    if (!this.outputGainNode || !this.outputAudioContext) return;
    // On mobile phone speakers in voice/communication audio routes, apply a clean 1.35x gain factor
    // protected by the broadcast dynamics compressor to prevent clipping while ensuring strong audibility.
    const mobileBoostFactor = this.isMobile ? 1.35 : 1.0;
    const targetGain = this.isMuted ? 0 : Math.max(0, Math.min(2.0, this.volume * mobileBoostFactor));
    const t = this.outputAudioContext.currentTime;
    try {
      this.outputGainNode.gain.cancelScheduledValues(t);
      this.outputGainNode.gain.setTargetAtTime(targetGain, t, 0.015);
    } catch {
      this.outputGainNode.gain.value = targetGain;
    }
  }

  /**
   * Initializes or gets the output audio context with mobile broadcast compression
   */
  public getOrCreateOutputContext(): AudioContext {
    if (!this.outputAudioContext || this.outputAudioContext.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      // Try sampleRate: 24000; gracefully fall back to native device rate if unsupported (e.g. iOS Safari)
      try {
        this.outputAudioContext = new AudioCtx({ sampleRate: 24000 });
      } catch {
        this.outputAudioContext = new AudioCtx();
      }

      this.outputAnalyser = this.outputAudioContext.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.75;

      // Professional vocal dynamics compressor tailored for clear phone speaker voice reproduction
      this.outputCompressor = this.outputAudioContext.createDynamicsCompressor();
      this.outputCompressor.threshold.setValueAtTime(-20, 0); // Gentle compression on peaks
      this.outputCompressor.knee.setValueAtTime(16, 0);       // Smooth transition
      this.outputCompressor.ratio.setValueAtTime(3.5, 0);     // 3.5:1 vocal clarity standard
      this.outputCompressor.attack.setValueAtTime(0.003, 0);  // 3ms fast response
      this.outputCompressor.release.setValueAtTime(0.18, 0);  // 180ms musical release

      this.outputGainNode = this.outputAudioContext.createGain();
      this.applyEffectiveGain();

      // Audio chain: source -> outputAnalyser -> outputCompressor -> outputGainNode -> destination
      this.outputAnalyser.connect(this.outputCompressor);
      this.outputCompressor.connect(this.outputGainNode);
      this.outputGainNode.connect(this.outputAudioContext.destination);
    }
    if (this.outputAudioContext.state === 'suspended') {
      this.outputAudioContext.resume().catch(() => {});
    }
    return this.outputAudioContext;
  }

  /**
   * Starts capturing microphone audio at 16kHz mono PCM.
   * If hardware mic permission is denied or unavailable, gracefully falls back
   * to Virtual Voice Bridge mode without throwing or logging console errors.
   */
  public async startRecording(onAudioChunk: (base64Chunk: string) => void): Promise<MicRecordingStatus> {
    if (this.isRecording && !this.isVirtualMic) {
      return { hardwareMic: true };
    }

    // Warm up 24kHz playback context while in user gesture
    this.getOrCreateOutputContext();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.isRecording = true;
      this.isVirtualMic = true;
      return {
        hardwareMic: false,
        fallbackReason: 'Microphone API unavailable in this environment — Virtual Voice Bridge active',
      };
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      // We attempt to set sampleRate to 16000, fallback resamples automatically
      try {
        this.inputAudioContext = new AudioCtx({ sampleRate: 16000 });
      } catch {
        this.inputAudioContext = new AudioCtx();
      }

      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }

      const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.inputAnalyser = this.inputAudioContext.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.inputAnalyser.smoothingTimeConstant = 0.6;

      // Buffer size 2048 gives low latency (~128ms at 16kHz)
      this.scriptProcessor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

      source.connect(this.inputAnalyser);
      this.inputAnalyser.connect(this.scriptProcessor);
      // Route through a zero-gain node before destination to prevent microphone audio
      // from playing back through mobile speakers and triggering iOS audio ducking/echo reduction.
      const muteMonitorNode = this.inputAudioContext.createGain();
      muteMonitorNode.gain.value = 0;
      this.scriptProcessor.connect(muteMonitorNode);
      muteMonitorNode.connect(this.inputAudioContext.destination);

      const sourceSampleRate = this.inputAudioContext.sampleRate;

      this.scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!this.isRecording || this.isVirtualMic || this.isSpeaking || this.isMicGated) return;
        const channelData = e.inputBuffer.getChannelData(0);

        // Check if user is actively speaking (volume threshold)
        let sumSquares = 0;
        for (let i = 0; i < channelData.length; i++) {
          sumSquares += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sumSquares / channelData.length);
        const isUserAudible = rms > 0.015;
        this.onUserSpeakingChange?.(isUserAudible);

        // Resample to 16000 if native hardware rate differs
        const resampled = resampleAudioBuffer(channelData, sourceSampleRate, 16000);
        const pcm16Buffer = floatTo16BitPCM(resampled);
        const base64 = arrayBufferToBase64(pcm16Buffer);

        onAudioChunk(base64);
      };

      this.isRecording = true;
      this.isVirtualMic = false;
      return { hardwareMic: true };
    } catch (err: unknown) {
      // Gracefully fall back to Virtual Voice Bridge instead of crashing or logging console.error
      this.cleanupInputHardware();
      this.isRecording = true;
      this.isVirtualMic = true;

      const rawMsg = err instanceof Error ? err.message : String(err);
      const isDenied =
        rawMsg.toLowerCase().includes('permission') ||
        rawMsg.toLowerCase().includes('denied') ||
        rawMsg.toLowerCase().includes('notallowed');

      return {
        hardwareMic: false,
        fallbackReason: isDenied
          ? 'Microphone access blocked by browser — Virtual Voice Bridge active (tap any voice prompt below to speak to Aira)'
          : 'No hardware microphone detected — Virtual Voice Bridge active',
      };
    }
  }

  private cleanupInputHardware(): void {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.inputAnalyser) {
      this.inputAnalyser.disconnect();
      this.inputAnalyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.inputAudioContext && this.inputAudioContext.state !== 'closed') {
      this.inputAudioContext.close().catch(() => {});
      this.inputAudioContext = null;
    }
  }

  /**
   * Stops recording audio and releases mic hardware
   */
  public stopRecording(): void {
    this.isRecording = false;
    this.isVirtualMic = false;
    this.onUserSpeakingChange?.(false);
    this.cleanupInputHardware();
  }

  public getIsVirtualMic(): boolean {
    return this.isVirtualMic;
  }

  /**
   * Plays a 24kHz PCM chunk received from the model gaplessly
   */
  public playAudioChunk(base64PCM: string): void {
    const ctx = this.getOrCreateOutputContext();
    const float32Data = base64ToFloat32Array(base64PCM);

    if (float32Data.length === 0) return;

    const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    if (this.outputAnalyser) {
      source.connect(this.outputAnalyser);
    } else {
      source.connect(ctx.destination);
    }

    const currentTime = ctx.currentTime;
    // Gapless scheduling with lag-drift protection for mobile backgrounding
    if (this.nextStartTime < currentTime - 0.25) {
      this.nextStartTime = currentTime;
    }
    const startTime = Math.max(currentTime, this.nextStartTime);
    try {
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;
      this.activeSources.push(source);
    } catch (e) {
      console.warn('AudioBufferSource start failed:', e);
      return;
    }

    if (!this.isSpeaking) {
      this.isSpeaking = true;
      this.onSpeakingChange?.(true);
    }

    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) {
        this.activeSources.splice(idx, 1);
      }
      if (this.activeSources.length === 0) {
        this.isSpeaking = false;
        this.onSpeakingChange?.(false);
      }
    };
  }

  /**
   * Immediately stops playback, clears queued chunks and resets timeline (interruption)
   */
  public interrupt(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might have already finished
      }
    }
    this.activeSources = [];
    if (this.outputAudioContext) {
      this.nextStartTime = this.outputAudioContext.currentTime;
    } else {
      this.nextStartTime = 0;
    }

    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.onSpeakingChange?.(false);
    }
  }

  /**
   * Toggles audio mute state
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.applyEffectiveGain();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Sets the playback volume level (0.0 to 1.5/2.0)
   */
  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(2.0, vol));
    try {
      localStorage.setItem('aira_voice_volume', String(this.volume));
    } catch {}
    this.applyEffectiveGain();
  }

  /**
   * Gets the current user volume setting
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Resumes suspended AudioContext (required on mobile after user interaction or tab switch)
   */
  public async resumeOutputContext(): Promise<void> {
    if (this.outputAudioContext && this.outputAudioContext.state === 'suspended') {
      try {
        await this.outputAudioContext.resume();
      } catch {}
    }
    if (this.inputAudioContext && this.inputAudioContext.state === 'suspended') {
      try {
        await this.inputAudioContext.resume();
      } catch {}
    }
  }

  /**
   * Returns current mic input audio volume (0..1)
   */
  public getInputVolume(): number {
    if (!this.inputAnalyser) return 0;
    const data = new Uint8Array(this.inputAnalyser.frequencyBinCount);
    this.inputAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length * 255);
  }

  /**
   * Returns current assistant voice output volume (0..1)
   */
  public getOutputVolume(): number {
    if (!this.outputAnalyser || !this.isSpeaking) return 0;
    const data = new Uint8Array(this.outputAnalyser.frequencyBinCount);
    this.outputAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return Math.min(1, (sum / (data.length * 255)) * 1.5);
  }

  /**
   * Copies frequency spectrum byte data for visualizations
   */
  public getOutputFrequencyData(targetArray: Uint8Array<ArrayBuffer>): void {
    if (this.outputAnalyser && this.isSpeaking) {
      this.outputAnalyser.getByteFrequencyData(targetArray);
    } else {
      targetArray.fill(0);
    }
  }

  public getInputFrequencyData(targetArray: Uint8Array<ArrayBuffer>): void {
    if (this.inputAnalyser && this.isRecording && !this.isVirtualMic) {
      this.inputAnalyser.getByteFrequencyData(targetArray);
    } else {
      targetArray.fill(0);
    }
  }

  public setMicGated(gated: boolean): void {
    this.isMicGated = gated;
  }

  public getIsMicGated(): boolean {
    return this.isMicGated;
  }

  public getActiveSourceCount(): number {
    return this.activeSources.length;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Full teardown of both input and output
   */
  public destroy(): void {
    this.stopRecording();
    this.interrupt();
    if (this.outputAudioContext && this.outputAudioContext.state !== 'closed') {
      this.outputAudioContext.close().catch(() => {});
      this.outputAudioContext = null;
    }
  }
}
