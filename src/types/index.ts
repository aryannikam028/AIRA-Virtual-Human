export type ConnectionState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'interrupted' | 'error';

import type { CharacterGesture, CharacterExpression, CameraFraming } from '../state/useCharacterStore';
export type { CharacterGesture, CharacterExpression, CameraFraming };

export type VisualAesthetic = 'cyber-magenta' | 'electric-violet' | 'neon-cyan' | 'emerald-matrix' | 'solar-gold';

export interface ToolCallItem {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ReactionData {
  id: string;
  type: 'smirk' | 'wink' | 'crown' | 'sparkles' | 'fire' | 'laugh' | 'heart' | 'wave' | 'thinking';
  remark?: string;
  gesture?: CharacterGesture;
  timestamp: number;
}

export interface WebsiteActionData {
  id: string;
  url: string;
  title?: string;
  timestamp: number;
}

export interface KeywordDetectionEvent {
  id: string;
  command: 'wake' | 'sleep';
  matchedPhrase: string;
  transcript: string;
  timestamp: number;
}

export interface ServerToClientMessage {
  type: 'audio' | 'interrupted' | 'turn_complete' | 'tool_call' | 'status' | 'error' | 'input_transcript' | 'model_turn_start';
  audio?: string;
  calls?: ToolCallItem[];
  message?: string;
  code?: string;
  transcript?: string;
}

export interface ClientToServerMessage {
  type: 'audio' | 'tool_response' | 'interrupt' | 'voice_prompt' | 'client_init' | 'response_complete';
  audio?: string;
  prompt?: string;
  toolResponse?: {
    id: string;
    name: string;
    response: Record<string, unknown>;
  };
}
