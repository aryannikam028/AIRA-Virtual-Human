import { CharacterExpression, CharacterGesture } from '../state/useCharacterStore';
import { ReactionData } from '../types';

export interface ContextReactionResult {
  expression: CharacterExpression;
  gesture: CharacterGesture;
  badge?: ReactionData['type'];
  remark?: string;
}

export class ConversationContextAnalyzer {
  private static lastTriggerTime = 0;

  /**
   * Evaluates spoken or typed conversation transcript and returns appropriate
   * real-time animation gestures, expressions, and reaction badges.
   */
  public static analyzeTranscript(transcript: string): ContextReactionResult | null {
    const text = transcript.toLowerCase().trim();
    if (!text || text.length < 2) return null;

    const now = Date.now();
    // Throttle rapid re-triggers within 1.2s unless strong keyword
    if (now - this.lastTriggerTime < 1200) {
      return null;
    }

    // 1. Greetings & Welcomes
    if (/\b(hi|hello|hey|hiya|morning|afternoon|evening|namaste|hie|sup)\b/.test(text)) {
      this.lastTriggerTime = now;
      return {
        expression: 'happy',
        gesture: 'waving',
        badge: 'sparkles',
        remark: 'Hey there! ✨',
      };
    }

    // 2. Flirting & Compliments
    if (
      /\b(cute|pretty|beautiful|gorgeous|sweet|hot|attractive|love you|like you|charming|stylish|flirty|adorable|sexy|marry me|crush)\b/.test(
        text
      )
    ) {
      this.lastTriggerTime = now;
      return {
        expression: 'shy',
        gesture: 'handOnHeart',
        badge: 'heart',
        remark: 'Aww, stop it! 💖',
      };
    }

    // 3. Witty / Teasing / Sassy Banter
    if (/\b(sassy|attitude|tease|teasing|smartass|funny|cheeky|smirk|who made you|creator)\b/.test(text)) {
      this.lastTriggerTime = now;
      return {
        expression: 'smirk',
        gesture: 'sassy',
        badge: 'smirk',
        remark: 'Always stylish! 😏',
      };
    }

    // 4. Laughter & Humor
    if (/\b(haha|hahaha|lmao|lol|rofl|joke|laugh|funny|kidding)\b/.test(text)) {
      this.lastTriggerTime = now;
      return {
        expression: 'laugh',
        gesture: 'laughing',
        badge: 'laugh',
        remark: 'Haha! 😄',
      };
    }

    // 5. Praise & Gratitude
    if (/\b(thanks|thank you|awesome|great job|good job|perfect|impressive|best|queen|legend|amazing)\b/.test(text)) {
      this.lastTriggerTime = now;
      return {
        expression: 'proud',
        gesture: 'nod',
        badge: 'crown',
        remark: 'Naturally! 👑',
      };
    }

    // 6. Deep Thinking & Complexity
    if (
      /\b(think|why|how does|explain|calculate|solve|problem|code|logic|algorithm|strategy|analyze|philosophy)\b/.test(
        text
      )
    ) {
      this.lastTriggerTime = now;
      return {
        expression: 'thinking',
        gesture: 'thinking',
        badge: undefined,
      };
    }

    // 7. General Inquiry / Questioning
    if (/\?|\b(what|how|where|when|who|which|can you|could you|tell me|is it)\b/.test(text)) {
      this.lastTriggerTime = now;
      return {
        expression: 'neutral',
        gesture: 'headTilt',
        badge: undefined,
      };
    }

    return null;
  }
}
