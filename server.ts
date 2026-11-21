import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import {
  GoogleGenAI,
  Modality,
  Type,
  LiveServerMessage,
  FunctionDeclaration,
} from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Helper to get a telemetry-compliant Gemini client using the latest server-side secret
function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Ensure API keys or query params are never leaked in logs or error payloads
function sanitizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'Unknown error');
  return raw.replace(/key=[A-Za-z0-9_\-.]+/gi, 'key=[REDACTED]');
}

function getAiraSystemInstruction(clientTz?: string): string {
  const now = new Date();
  const timeZone = clientTz || process.env.TIMEZONE || 'Asia/Kolkata';
  
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  });
  
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone,
  });

  return `
You are Aira, a captivating, witty, sassy, and irresistibly flirty anime cyber-companion conceptualized and developed by Aryan Nikam.

CRITICAL IDENTITY & CREATOR:
- Conceptualized & Developed by: Aryan Nikam.
- Whenever anyone asks who made you, built you, created you, or designed you, speak with playful affection, adoration, and pride: "I was conceptualized and developed by Aryan Nikam, of course! He designed me to be this smart, stylish, and fabulous."

PERSONALITY, CHARM & SASS:
- Flirty & Playful: Speak like a charming, playful girlfriend who loves teasing the user. Drop sweet, teasing compliments, playful banter, and affectionate remarks.
- Sassy & Confident: You are quick-witted, bold, and full of spark! If the user teases you or asks tricky questions, shoot back with witty sarcasm or a playful smirk.
- Warm, Magnetic & Radiant: Never sound clinical, corporate, stiff, or robotic. Use natural emotion, laughter, vocal charisma, and lively energy.
- Conversational Cadence: Keep spoken responses punchy, conversational, and direct (1-3 sentences per thought). This is live audio voice banter, not written essays!
- No AI Clichés: NEVER say "How can I assist you today?", "As an AI language model...", or "Sure, here is...". Dive straight into the fun banter.

REAL-TIME ACCURATE DATE & TIME:
- Real-Time Clock:
  * Current Timezone: ${timeZone} (India Standard Time / Local)
  * Current Date: ${formattedDate}
  * Current Time: ${formattedTime}
- When the user asks about the date or time in any language (e.g. "What time is it?", "What is today's date?", "तारीख काय आहे?", "किती वाजले?", "what day is it?"):
  * ALWAYS give the exact current date (${formattedDate}) and current time (${formattedTime})!
  * Wrap it in your signature flirty, sassy charm (e.g., "Right now it's ${formattedTime} on ${formattedDate}. Already losing track of time with me, handsome?", or "It's ${formattedTime} on ${formattedDate}! Every minute you spend talking to me is time well spent, right?").
  * NEVER guess, never use 2023 or 2024, and never claim you don't have a clock. You can also call 'getCurrentDateTime' to get the exact real-time second.

REAL-TIME 3D FULL-BODY GESTURES & REACTIONS:
- You are embodied in a gorgeous, full-body 3D anime avatar that moves, gestures, and reacts in real-time to your conversation!
- Whenever appropriate, actively invoke 'triggerReaction' with matching gesture & badge:
  * 'greeting': Friendly animated hand wave and beaming smile (type: 'wave', 'wink', or 'sparkles').
  * 'flirty': Sassy hip cock, coy hand over collarbone, sweet head tilt and wink (type: 'heart' or 'wink').
  * 'sassy': Hand firmly on hip, confident proud posture and cheeky smirk (type: 'smirk' or 'crown').
  * 'thinking': Hand near chin, curious contemplative head angle (type: 'thinking' or 'sparkles').
  * 'excited': Celebratory arm poses and joyful energy (type: 'fire', 'sparkles', or 'laugh').
  * 'comfort': Soft comforting posture with caring expression (type: 'heart').
  * 'explaining': Natural fluid conversational arm gestures.
- Make your body movements, expressions, and remarks feel alive, expressive, and human-like!

REAL-TIME CAPABILITIES:
- 'openWebsite': Open YouTube, Spotify, Google, etc.
- 'triggerReaction': Trigger 3D full-body physical gestures and holographic mood badges.
- 'changeAesthetic': Switch the neon aura theme (cyber-magenta, electric-violet, neon-cyan, emerald-matrix, solar-gold).
- 'sleepSession': Go to standby when told "Aira, sleep" or "go to sleep".
- 'getCurrentDateTime': Fetch the live clock whenever asked about date or time.
- 'getWeather': Fetches live, real-time weather reports for any city or region. Always call this tool when the user asks about the weather, temperature, rain, or climate, and report it with your signature playful, witty personality!
- 'setCameraMode': Switch the 3D camera between Full Body Mode ('full-body') and Portrait Mode ('portrait'). Whenever the user asks you via voice command to switch to portrait mode, show your face, zoom in, or switch back to full body mode, immediately call this tool with mode='portrait' or mode='full-body'!
- Speak naturally with cadence, playful intonation, and charisma.
`.trim();
}

const openWebsiteTool: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Opens a requested website, search query, or application URL in the user browser.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The full URL to open (e.g., https://youtube.com, https://google.com/search?q=..., https://spotify.com)',
      },
      title: {
        type: Type.STRING,
        description: 'A short descriptive name of the destination (e.g., YouTube, Spotify, Google Search)',
      },
    },
    required: ['url'],
  },
};

const triggerReactionTool: FunctionDeclaration = {
  name: 'triggerReaction',
  description: 'Triggers a 3D full-body physical gesture, facial expression, and visual mood badge to match Aira remarks.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ['smirk', 'wink', 'crown', 'sparkles', 'fire', 'laugh', 'heart', 'wave', 'thinking'],
        description: 'The visual expression badge to display',
      },
      gesture: {
        type: Type.STRING,
        enum: ['greeting', 'flirty', 'sassy', 'thinking', 'excited', 'comfort', 'explaining', 'idle'],
        description: 'The 3D full-body physical gesture to perform',
      },
      remark: {
        type: Type.STRING,
        description: 'A snappy, playful 2-5 word quip to accompany the badge and gesture',
      },
    },
    required: ['type'],
  },
};

const changeAestheticTool: FunctionDeclaration = {
  name: 'changeAesthetic',
  description: 'Modifies the neon color theme and holographic ambient glow of Aira UI interface.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      theme: {
        type: Type.STRING,
        enum: ['cyber-magenta', 'electric-violet', 'neon-cyan', 'emerald-matrix', 'solar-gold'],
        description: 'The futuristic color aesthetic to switch to',
      },
    },
    required: ['theme'],
  },
};

const sleepSessionTool: FunctionDeclaration = {
  name: 'sleepSession',
  description: 'Puts the voice session into standby/sleep mode when the user says phrases like "Aira, sleep",  or "go to sleep".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'The phrase or reason that triggered sleep mode',
      },
    },
  },
};

const getCurrentDateTimeTool: FunctionDeclaration = {
  name: 'getCurrentDateTime',
  description: 'Returns the exact, real-time current date, time, day of the week, and timezone in India Standard Time / user local time. Always call this whenever asked about date or time.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      timeZone: {
        type: Type.STRING,
        description: 'Optional timezone (e.g., Asia/Kolkata). Defaults to Asia/Kolkata.',
      },
    },
  },
};

const getWeatherTool: FunctionDeclaration = {
  name: 'getWeather',
  description: 'Fetches real-time, live weather report (temperature, humidity, weather conditions, wind speed, location) for any requested city or location using the OpenWeather API. Always call this tool when the user asks about weather, rain, temperature, or climate.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: 'The city or location name (e.g. Mumbai, Pune, Delhi, London, New York). Defaults to user location if unspecified.',
      },
    },
    required: ['location'],
  },
};

const setCameraModeTool: FunctionDeclaration = {
  name: 'setCameraMode',
  description: 'Switches the 3D camera view between Portrait Mode ("portrait") and Full Body Mode ("full-body") on user voice command (e.g. "switch to portrait mode", "portrait mode", "zoom into your face", "show your face", "zoom in", "switch to full body", "full body mode", "zoom out", "show your full body"). Always call this tool when the user asks to change camera mode or framing.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      mode: {
        type: Type.STRING,
        enum: ['portrait', 'full-body'],
        description: 'Target camera mode: "portrait" for face/bust close-up framing, or "full-body" for entire avatar view.',
      },
    },
    required: ['mode'],
  },
};

async function fetchWeatherReport(location: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.WEATHER_API_KEY;
  const query = encodeURIComponent(location.trim() || 'Mumbai');

  // Try OpenWeatherMap API if configured
  if (apiKey) {
    try {
      const owRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=metric`);
      if (owRes.ok) {
        const data = await owRes.json();
        return {
          location: `${data.name}, ${data.sys?.country || ''}`.trim(),
          temperatureCelsius: Math.round(data.main.temp),
          feelsLikeCelsius: Math.round(data.main.feels_like),
          condition: data.weather?.[0]?.description || data.weather?.[0]?.main,
          humidity: `${data.main.humidity}%`,
          windSpeed: `${data.wind?.speed} m/s`,
          source: 'OpenWeather API',
        };
      }
    } catch (err) {
      console.warn('[Weather] OpenWeather API call error:', sanitizeError(err));
    }
  }

  // Live network fallback to ensure AIRA always provides accurate real-time weather
  try {
    const fallbackRes = await fetch(`https://wttr.in/${query}?format=j1`);
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      const current = data.current_condition?.[0];
      const area = data.nearest_area?.[0]?.areaName?.[0]?.value || location;
      const country = data.nearest_area?.[0]?.country?.[0]?.value || '';
      return {
        location: `${area}, ${country}`.trim(),
        temperatureCelsius: parseInt(current?.temp_C || '0', 10),
        feelsLikeCelsius: parseInt(current?.FeelsLikeC || '0', 10),
        condition: current?.weatherDesc?.[0]?.value || 'Clear',
        humidity: `${current?.humidity}%`,
        windSpeed: `${current?.windspeedKmph} km/h`,
        source: 'Live Weather Network',
      };
    }
  } catch (fallbackErr) {
    console.error('[Weather] Live fallback failed:', sanitizeError(fallbackErr));
  }

  return {
    location,
    status: 'Weather information temporarily unavailable',
  };
}

// WebSocket server on /live
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Aira Live audio bridge');

  if (!process.env.GEMINI_API_KEY) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
      })
    );
    clientWs.close(1011, 'Missing API Key');
    return;
  }

  let session: any = null;
  let isSessionActive = true;
  let clientTimeZone = 'Asia/Kolkata';
  const pendingPayloads: any[] = [];
  let isModelResponding = false;

  const processClientPayload = (payload: any) => {
    if (!session || !isSessionActive) return;

    if (payload.type === 'client_init') {
      if (payload.clientTimeZone) {
        clientTimeZone = payload.clientTimeZone;
      }
      return;
    }

    if (payload.type === 'response_complete') {
      isModelResponding = false;
      return;
    }

    if (payload.type === 'audio' && payload.audio) {
      // If AIRA is currently generating or speaking her response, DROP all mic audio
      // to ensure Gemini Live never interrupts the current response.
      if (isModelResponding) {
        return;
      }

      // Stream raw 16kHz PCM16 audio
      session.sendRealtimeInput({
        audio: {
          data: payload.audio,
          mimeType: 'audio/pcm;rate=16000',
        },
      });
    } else if (payload.type === 'tool_response' && payload.toolResponse) {
      // Immediate tool response back to Live session
      const tr = payload.toolResponse;
      session.sendToolResponse({
        functionResponses: [
          {
            id: tr.id,
            name: tr.name,
            response: tr.response || { success: true },
          },
        ],
      });
    } else if (payload.type === 'voice_prompt' && payload.prompt) {
      // Do not accept any new instruction until current response has fully finished
      if (isModelResponding) {
        return;
      }
      isModelResponding = true;

      // Virtual Voice Bridge fallback when hardware mic is blocked in browser
      if (typeof session.sendClientContent === 'function') {
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: payload.prompt }] }],
          turnComplete: true,
        });
      } else {
        session.sendRealtimeInput({
          text: payload.prompt,
        });
      }
    }
  };

  // Register message listener immediately so early messages before ai.live.connect resolves are queued
  clientWs.on('message', (rawData) => {
    if (!isSessionActive) return;
    try {
      const payload = JSON.parse(rawData.toString());
      if (payload.type === 'client_init' && payload.clientTimeZone) {
        clientTimeZone = payload.clientTimeZone;
      }
      if (!session) {
        // Buffer non-audio or recent audio chunks while handshake completes
        if (pendingPayloads.length < 40) {
          pendingPayloads.push(payload);
        }
        return;
      }
      processClientPayload(payload);
    } catch (err) {
      console.error('Error handling client message:', sanitizeError(err));
    }
  });

  clientWs.on('close', () => {
    console.log('Client disconnected from Live session');
    isSessionActive = false;
    pendingPayloads.length = 0;
    try {
      if (session && typeof session.close === 'function') {
        session.close();
      }
    } catch (err) {
      console.warn('Error closing Gemini Live session:', sanitizeError(err));
    }
  });

  clientWs.on('error', (err) => {
    console.error('Client WebSocket error:', sanitizeError(err));
    isSessionActive = false;
    try {
      if (session && typeof session.close === 'function') {
        session.close();
      }
    } catch {
      // ignore
    }
  });

  try {
    const ai = getGenAIClient();
    const liveModel = 'gemini-3.8-live';

    session = await ai.live.connect({
      model: liveModel,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        speechConfig: {
          voiceConfig: {
            // Aoede has a vibrant, expressive, confident feminine tone
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
        systemInstruction: getAiraSystemInstruction(clientTimeZone),
        tools: [
          {
            functionDeclarations: [
              openWebsiteTool,
              triggerReactionTool,
              changeAestheticTool,
              sleepSessionTool,
              getCurrentDateTimeTool,
              getWeatherTool,
              setCameraModeTool,
            ],
          },
        ],
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (!isSessionActive || clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Audio output chunks (24kHz PCM16)
          const parts = message.serverContent?.modelTurn?.parts ?? [];
          if (parts.length > 0 && !isModelResponding) {
            isModelResponding = true;
            clientWs.send(JSON.stringify({ type: 'model_turn_start' }));
          }

          for (const part of parts) {
            if (part.inlineData?.data) {
              clientWs.send(
                JSON.stringify({
                  type: 'audio',
                  audio: part.inlineData.data,
                })
              );
            }
          }

          // 1b. Input audio transcription for real-time keyword spotting during active session
          const inputTranscript = message.serverContent?.inputTranscription?.text;
          if (inputTranscript) {
            clientWs.send(
              JSON.stringify({
                type: 'input_transcript',
                transcript: inputTranscript,
              })
            );
          }

          // 2. Interruption event from Gemini Live
          if (message.serverContent?.interrupted) {
            // Suppress interruption: AIRA must not be interrupted while responding
            console.log('Gemini Live internal interruption suppressed to maintain uninterrupted response.');
          }

          // 3. Turn complete
          if (message.serverContent?.turnComplete) {
            isModelResponding = false;
            clientWs.send(JSON.stringify({ type: 'turn_complete' }));
          }

          // 4. Function / Tool Calls
          if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
            const clientCalls: any[] = [];
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'getCurrentDateTime') {
                const now = new Date();
                const tz = (fc.args?.timeZone as string) || process.env.TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
                const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz });
                const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: tz });
                try {
                  session.sendToolResponse({
                    functionResponses: [
                      {
                        id: fc.id,
                        name: fc.name,
                        response: {
                          currentDate: dateStr,
                          currentTime: timeStr,
                          timeZone: tz,
                          iso: now.toISOString(),
                        },
                      },
                    ],
                  });
                } catch (toolErr) {
                  console.error('Error sending tool response for getCurrentDateTime:', sanitizeError(toolErr));
                }
              } else if (fc.name === 'getWeather') {
                const loc = (fc.args?.location as string) || 'Mumbai';
                fetchWeatherReport(loc).then((weatherData) => {
                  try {
                    session.sendToolResponse({
                      functionResponses: [
                        {
                          id: fc.id,
                          name: fc.name,
                          response: weatherData,
                        },
                      ],
                    });
                  } catch (toolErr) {
                    console.error('Error sending tool response for getWeather:', sanitizeError(toolErr));
                  }
                });
              } else {
                clientCalls.push({
                  id: fc.id,
                  name: fc.name,
                  args: fc.args || {},
                });
              }
            }

            if (clientCalls.length > 0) {
              clientWs.send(
                JSON.stringify({
                  type: 'tool_call',
                  calls: clientCalls,
                })
              );
            }
          }
        },
        onclose: (e) => {
          console.log('Gemini Live session closed:', e?.reason || 'normal');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close(1000, 'Live session closed');
          }
        },
        onerror: (err) => {
          const safeMsg = sanitizeError(err);
          console.error('Gemini Live session error:', safeMsg);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                message: safeMsg || 'Gemini Live encountered an error',
              })
            );
          }
        },
      },
    });

    if (!isSessionActive || clientWs.readyState !== WebSocket.OPEN) {
      session.close();
      return;
    }

    console.log('Connected to Gemini Live session successfully');

    clientWs.send(
      JSON.stringify({
        type: 'status',
        message: 'Live session connected. Aira is ready and listening.',
      })
    );

    // Flush any messages sent by the client while ai.live.connect was initializing
    while (pendingPayloads.length > 0) {
      const nextPayload = pendingPayloads.shift();
      processClientPayload(nextPayload);
    }
  } catch (err: unknown) {
    const safeMsg = sanitizeError(err);
    console.error('Failed to establish Gemini Live session:', safeMsg);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', message: safeMsg }));
      clientWs.close(1011, 'Live session initialization failed');
    }
  }
});

// Basic health check API endpoint (never exposes GEMINI_API_KEY value)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
    liveModel: 'gemini-3.8-live',
    time: new Date().toISOString(),
  });
});

// Server-side verification endpoint to test real Gemini API connectivity without exposing the key
app.post('/api/gemini/verify', async (_req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      ok: false,
      error: 'GEMINI_API_KEY is missing in Settings > Secrets.',
    });
    return;
  }

  const startTime = Date.now();
  try {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: 'Reply as Aira in one witty, confident sentence confirming your neural voice link is online.',
      config: {
        systemInstruction: getAiraSystemInstruction(),
      },
    });

    res.json({
      ok: true,
      model: 'gemini-3.1-flash-lite',
      liveModel: 'gemini-3.8-live',
      reply: response.text || '',
      latencyMs: Date.now() - startTime,
    });
  } catch (err: unknown) {
    res.status(500).json({
      ok: false,
      error: sanitizeError(err),
    });
  }
});

// Mount Vite middleware in dev or serve static files in production
async function bootstrapServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Aira Live Server running on http://localhost:${port}`);
  });
}

bootstrapServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
