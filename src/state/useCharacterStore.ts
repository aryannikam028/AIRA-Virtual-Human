import { create } from 'zustand';

export type CharacterStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
export type CharacterExpression =
  | 'neutral'
  | 'happy'
  | 'smile'
  | 'smirk'
  | 'surprised'
  | 'teasing'
  | 'thinking'
  | 'concerned'
  | 'shy'
  | 'proud'
  | 'wink'
  | 'laugh';

export type CharacterGesture =
  | 'idle'
  | 'listening'
  | 'nod'
  | 'headTilt'
  | 'thinking'
  | 'explaining'
  | 'talking'
  | 'sassy'
  | 'waving'
  | 'handOnHeart'
  | 'curious'
  | 'laughing';

export type CameraFraming = 'full-body' | 'portrait';
export type SupportedLanguage = 'en' | 'hi' | 'mr';
export type AnimationQuality = 'low' | 'medium' | 'high';
export type ViewMode = 'fullscreen' | 'chat-focused';

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: SupportedLanguage;
  timestamp: number;
  sources?: SearchSource[];
}

interface CharacterStore {
  // Character states
  status: CharacterStatus;
  expression: CharacterExpression;
  currentGesture: CharacterGesture;
  cameraFraming: CameraFraming;
  audioAmplitude: number;
  currentViseme: string;
  
  // Settings & Configuration
  currentLanguage: SupportedLanguage;
  animationQuality: AnimationQuality;
  viewMode: ViewMode;
  memoryEnabled: boolean;
  speechRate: number;
  voicePitch: number;
  isMicActive: boolean;

  // Chat & History
  messages: ChatMessage[];
  activeSources: SearchSource[];
  isSearching: boolean;
  errorMessage: string | null;

  // Actions
  setStatus: (status: CharacterStatus) => void;
  setExpression: (expression: CharacterExpression) => void;
  setGesture: (gesture: CharacterGesture) => void;
  setCameraFraming: (framing: CameraFraming) => void;
  setAudioAmplitude: (amplitude: number) => void;
  setCurrentViseme: (viseme: string) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setAnimationQuality: (quality: AnimationQuality) => void;
  setViewMode: (mode: ViewMode) => void;
  setMemoryEnabled: (enabled: boolean) => void;
  setSpeechRate: (rate: number) => void;
  setVoicePitch: (pitch: number) => void;
  setMicActive: (active: boolean) => void;
  setIsSearching: (searching: boolean) => void;
  setErrorMessage: (msg: string | null) => void;
  
  // Message Management
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  appendChunkToLastMessage: (chunk: string) => void;
  finalizeLastMessage: (fullText: string, sources?: SearchSource[]) => void;
  clearMessages: () => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  status: 'idle',
  expression: 'neutral',
  currentGesture: 'idle',
  cameraFraming: 'full-body',
  audioAmplitude: 0,
  currentViseme: 'neutral',
  currentLanguage: 'en',
  animationQuality: 'high',
  viewMode: 'fullscreen',
  memoryEnabled: true,
  speechRate: 1.05,
  voicePitch: 1.28,
  isMicActive: false,
  messages: [
    {
      id: 'welcome_1',
      role: 'assistant',
      content: "Hello Aryan! I'm AIRA, your anime companion. I'm so happy to talk with you! How was your day? You can speak or write to me in English, Hindi, or Marathi, and I'm always here for you.",
      language: 'en',
      timestamp: Date.now(),
    },
  ],
  activeSources: [],
  isSearching: false,
  errorMessage: null,

  setStatus: (status) =>
    set((state) => {
      // Automatically map status to corresponding natural expression & gesture
      let expression: CharacterExpression = state.expression;
      let currentGesture: CharacterGesture = state.currentGesture;

      if (status === 'idle') {
        expression = 'neutral';
        currentGesture = 'idle';
      } else if (status === 'listening') {
        expression = 'smile';
        currentGesture = 'listening';
      } else if (status === 'thinking') {
        expression = 'thinking';
        currentGesture = 'thinking';
      } else if (status === 'speaking') {
        expression = 'happy';
        currentGesture = 'talking';
      } else if (status === 'error') {
        expression = 'concerned';
        currentGesture = 'idle';
      }

      return { status, expression, currentGesture };
    }),

  setExpression: (expression) => set({ expression }),
  setGesture: (currentGesture) => set({ currentGesture }),
  setCameraFraming: (cameraFraming) => set({ cameraFraming }),
  setAudioAmplitude: (audioAmplitude) => set({ audioAmplitude }),
  setCurrentViseme: (currentViseme) => set({ currentViseme }),
  setLanguage: (currentLanguage) => set({ currentLanguage }),
  setAnimationQuality: (animationQuality) => set({ animationQuality }),
  setViewMode: (viewMode) => set({ viewMode }),
  setMemoryEnabled: (memoryEnabled) => set({ memoryEnabled }),
  setSpeechRate: (speechRate) => set({ speechRate }),
  setVoicePitch: (voicePitch) => set({ voicePitch }),
  setMicActive: (isMicActive) => set({ isMicActive }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),

  addMessage: (msg) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMessage: ChatMessage = {
      ...msg,
      id,
      timestamp: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
    return id;
  },

  appendChunkToLastMessage: (chunk) =>
    set((state) => {
      if (state.messages.length === 0) return state;
      const updated = [...state.messages];
      const lastIndex = updated.length - 1;
      const last = updated[lastIndex];
      if (last.role === 'assistant') {
        updated[lastIndex] = {
          ...last,
          content: last.content + chunk,
        };
      }
      return { messages: updated };
    }),

  finalizeLastMessage: (fullText, sources) =>
    set((state) => {
      if (state.messages.length === 0) return state;
      const updated = [...state.messages];
      const lastIndex = updated.length - 1;
      const last = updated[lastIndex];
      if (last.role === 'assistant') {
        updated[lastIndex] = {
          ...last,
          content: fullText || last.content,
          sources: sources || last.sources,
        };
      }
      return { messages: updated, activeSources: sources || [] };
    }),

  clearMessages: () => set({ messages: [] }),
}));
