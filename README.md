# AIRA — 3D Virtual Human AI Companion

<div align="center">

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19.0.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3.5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![VRM](https://img.shields.io/badge/Pixiv_VRM-3.5.5-0096FA)](https://vrm.dev/)
[![Gemini Live](https://img.shields.io/badge/Google_Gemini-3.8_Live-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel Deployment](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel&logoColor=white)](https://aira-virtual-human.vercel.app/)

**An embodied, real-time voice-to-voice 3D virtual human companion with a witty, confident, and charismatic persona.**  
Powered by the **Google Gemini Live API**, **Three.js VRM avatar rendering**, and high-performance **Web Audio PCM streaming**.

---

### 🌐 Live Demo & Official Website
### 🚀 **[aira-virtual-human.vercel.app](https://aira-virtual-human.vercel.app/)** 🚀

*Hosted and served worldwide on **Vercel**.*

---

[Repository](https://github.com/aryannikam028/AIRA-Virtual-Human) • [Features](#features) • [Architecture](#architecture) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Deployment](#deployment) • [Author](#author)

</div>

---

## Overview

**AIRA** (Adaptive Intelligent Reactive Assistant) is a next-generation 3D AI companion that bridges the gap between conversational AI and realistic virtual human embodiment. Unlike conventional text-based chatbots, AIRA delivers a continuous, natural, bidirectional audio conversation with near-zero latency, synchronized lip-syncing, life-like procedural animations, and context-aware full-body physical gestures.

AIRA pairs an authentic **VRM 3D anime avatar** with the **Gemini 3.8 Live API**, allowing her to listen, speak, gesture, express emotions, check real-time weather, navigate web applications, and adapt her visual atmosphere dynamically during live conversation.

- **Official Live Website (Vercel):** [https://aira-virtual-human.vercel.app/](https://aira-virtual-human.vercel.app/)
- **Source Code Repository:** [https://github.com/aryannikam028/AIRA-Virtual-Human](https://github.com/aryannikam028/AIRA-Virtual-Human)

---

## Features

### 🎙️ Real-Time Bidirectional Voice (Gemini Live)
- **Direct 16kHz PCM Audio Streaming:** Bidirectional WebSocket audio pipe between the browser Web Audio API and Google's Gemini 3.8 Live multimodal model.
- **Ultra-Low Latency:** Natural conversation cadence with instantaneous turn-taking and smooth audio playback.
- **Echo Prevention & Mic Gating:** Built-in hardware echo-cancellation and intelligent mic gating preventing feedback loops while AIRA speaks.

### 💃 3D Full-Body VRM Embodiment
- **Authentic VRM Avatar:** Rendered in Three.js using `@pixiv/three-vrm` with fallback `.glb` asset support.
- **Procedural Life-Like Physics:** Natural breathing bone simulations, dynamic eye blinking, and continuous head-tracking that organically follows user mouse movement.
- **Dynamic Camera Framing:** Seamless voice-controlled switching between **Full-Body Mode** (head-to-toe staging) and **Portrait Mode** (expressive facial close-up).

### 👄 Audio-Driven Viseme Lip-Sync
- Real-time frequency and amplitude analysis through Web Audio API analyzers.
- Direct mathematical mapping of live speech waveforms to VRM blendshapes (`aa`, `ih`, `ou`, `ee`, `oh`) for tight phoneme synchronization.

### 🎭 Expressive Reactions & Physical Gestures
- **Context-Aware Physical Gestures:** Dynamic body animations including `waving`, `sassy`, `thinking`, `handOnHeart`, `explaining`, `nodding`, and `headTilt`.
- **Holographic Mood Badges:** Floating cyberpunk badges matching AIRA's remarks (`smirk`, `wink`, `crown`, `sparkles`, `fire`, `laugh`, `heart`, `wave`, `thinking`).

### 🛠️ Real-Time Tool Calling & Function Execution
- **Live Weather Reporting (`getWeather`):** Live meteorological queries (temperature, humidity, wind, and conditions) via OpenWeatherMap API.
- **Real-Time Clock & Timezone (`getCurrentDateTime`):** Accurate time and date grounding localized to India Standard Time (`Asia/Kolkata`) or user client timezone.
- **Autonomous Web Navigation (`openWebsite`):** Voice-triggered web navigation for Spotify, YouTube, Google Search, and web destinations with visual toast confirmations.
- **Dynamic HUD Aesthetics (`changeAesthetic`):** 5 switchable cyberpunk neon visual themes (`cyber-magenta`, `electric-violet`, `neon-cyan`, `emerald-matrix`, `solar-gold`).
- **Camera View Control (`setCameraMode`):** Voice-activated transition between Portrait and Full-Body views.
- **Voice Standby / Sleep (`sleepSession`):** Hands-free standby trigger on phrases like *"Aira, sleep"* or *"go to sleep"*.

### ⚡ Cyberpunk HUD & Audio Visualization
- **Aura Orb Visualizer:** Neon particle core pulsating in response to voice amplitude and connection states.
- **Live Waveform Display:** Oscilloscope canvas reflecting real-time microphone input and AI vocalization harmonics.
- **Continuous Hotword Recognition:** Built-in Web Speech API detection for hands-free wake and sleep voice commands.
- **Persona Drawer:** Cyberpunk drawer displaying character personality traits, lore, diagnostics, and keyboard shortcuts.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                              │
│             Live at: https://aira-virtual-human.vercel.app/            │
│                                                                        │
│   User Microphone ───► Web Audio API (16kHz PCM) ───┐                  │
│                                                     │                  │
│   Web Speech API ────► Keyword Recognizer           ▼                  │
│                                              LiveSession (WebSocket)   │
│   Three.js Canvas ◄─── Viseme Analyzer  ◄───        │                  │
│   (@pixiv/three-vrm)   (AudioStreamer)              │                  │
│                                                     ▲                  │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      │  JSON & Audio
                                                      │  WebSocket
                                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js / Express)                     │
│                                                                        │
│   WebSocket Server (ws) ───► Gemini Live Session                       │
│     • Audio In/Out           (@google/genai Live API: gemini-3.8-live) │
│     • Tool Calling Handler                                             │
│         ├── getWeather           ───► OpenWeatherMap API               │
│         ├── getCurrentDateTime   ───► Localized Date/Time Clock        │
│         ├── openWebsite          ───► Client Action Dispatcher         │
│         ├── changeAesthetic      ───► Theme State Dispatcher           │
│         └── setCameraMode        ───► 3D Camera Controller             │
│                                                                        │
│   REST API:                                                            │
│     • GET  /api/health           ───► Service & Key Status             │
│     • POST /api/gemini/verify    ───► Live API Connectivity Check      │
│     • Static /dist Serving       ───► Production Client SPA            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Domain | Technology / Library | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | [React](https://react.dev/) | `^19.0.1` | Core UI component hierarchy and reactive state |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^7.0.2` | End-to-end static typing and interface definitions |
| **Build Tool** | [Vite](https://vitejs.dev/) | `^8.3.0` | Ultra-fast client bundler and dev server |
| **3D Rendering** | [Three.js](https://threejs.org/) | `^0.186.1` | WebGL scene, lighting, materials, and renderer |
| **Avatar Engine** | [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) | `^3.5.5` | Humanoid VRM loading, bone control, blendshapes |
| **3D Ecosystem** | [@react-three/fiber](https://r3f.docs.pmnd.rs/) & [drei](https://github.com/pmndrs/drei) | `^9.8.2` / `^10.7.9` | Declarative 3D scene scaffolding |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & [@tailwindcss/vite](https://tailwindcss.com/docs/vite) | `^4.3.3` | Modern utility-first CSS engine |
| **State Management**| [Zustand](https://github.com/pmndrs/zustand) | `^5.0.16` | Lightweight character and HUD state store |
| **UI Motion** | [Motion](https://motion.dev/) | `^12.23.24` | Cyberpunk HUD animations and transitions |
| **Iconography** | [Lucide React](https://lucide.dev/) | `^0.546.0` | Clean iconography for HUD controls |
| **AI Integration** | [@google/genai](https://www.npmjs.com/package/@google/genai) | `^2.32.0` | Official Google Gemini SDK for Gemini Live |
| **Backend Runtime** | [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) | `^4.21.2` | Backend server and API layer |
| **WebSockets** | [ws](https://github.com/websockets/ws) | `^8.22.0` | Bidirectional real-time audio and event transport |
| **TypeScript Exec** | [tsx](https://github.com/privatenumber/tsx) | `^4.21.0` | Real-time TypeScript execution for server |
| **Bundler Core** | [esbuild](https://esbuild.github.io/) | `^0.28.0` | High-speed JavaScript/TypeScript bundler |
| **Frontend Hosting**| [Vercel](https://vercel.com/) | Production | Global edge hosting for React single-page application |

---

## Project Structure

```text
AIRA-Virtual-Human/
├── public/
│   ├── assets/
│   │   └── aistudio/
│   │       └── AIRA_CHARACTER_ONLY_e93dcf0e.zip   # Preserved asset archive
│   └── models/
│       ├── aira.vrm                               # Primary 3D VRM avatar model
│       └── aira.glb                               # Fallback GLB 3D model
├── src/
│   ├── components/                                # UI & HUD components
│   │   ├── three/
│   │   │   ├── AnimeGirlModel.ts                  # Procedural animation fallback
│   │   │   ├── AnimeScene3D.tsx                   # 3D canvas container
│   │   │   └── proceduralTextures.ts              # Procedural shader materials
│   │   ├── AestheticThemes.ts                     # Cyberpunk visual color palettes
│   │   ├── AuraOrb.tsx                            # Pulsing neon holographic orb
│   │   ├── AwakenButton.tsx                       # Voice session trigger button
│   │   ├── CharacterModel.tsx                     # VRM loader, bone physics, lip-sync
│   │   ├── CyberPedestal.tsx                      # Sci-fi holographic staging platform
│   │   ├── DateTimeHUD.tsx                        # Live localized date/time widget
│   │   ├── DeviceEnergyMonitor.tsx                # System telemetry HUD
│   │   ├── HUDHeader.tsx                          # Top control panel (framing, themes, audio)
│   │   ├── KeywordStatusHUD.tsx                   # Hotword recognition indicator
│   │   ├── PersonaDrawer.tsx                      # Sliding character lore & diagnostics
│   │   ├── PersonalityReaction.tsx                # Floating mood badges & remarks
│   │   ├── PromptChips.tsx                        # Quick conversational starter chips
│   │   ├── Scene.tsx                              # Three.js scene, lighting & camera setup
│   │   ├── WaveformVisualizer.tsx                 # Oscilloscope audio visualizer
│   │   └── WebsiteActionToast.tsx                 # Voice navigation toast notifications
│   ├── config/
│   │   └── character.ts                           # 3D camera, framing & avatar coordinates
│   ├── services/                                  # Audio & network services
│   │   ├── AudioStreamer.ts                       # PCM audio playback & mic gating
│   │   ├── audioUtils.ts                          # Float32/Int16 PCM conversion helpers
│   │   ├── ConversationContextAnalyzer.ts         # Sentiment & conversational tracking
│   │   ├── KeywordRecognizer.ts                   # Speech recognition for wake/sleep words
│   │   └── LiveSession.ts                         # WebSocket Gemini Live communication
│   ├── state/
│   │   └── useCharacterStore.ts                   # Global Zustand character state store
│   ├── types/
│   │   └── index.ts                               # TypeScript types & interface contracts
│   ├── App.tsx                                    # Primary application orchestration
│   ├── index.css                                  # Tailwind CSS imports & custom styles
│   └── main.tsx                                   # React DOM root entry point
├── .env.example                                   # Safe environment configuration template
├── .gitignore                                     # Git exclusion rules (secrets, build, cache)
├── index.html                                     # HTML entry point with metadata
├── package.json                                   # Dependencies & project scripts
├── package-lock.json                              # Locked dependency tree
├── server.ts                                      # Express & WebSocket Gemini Live server
├── tsconfig.json                                  # TypeScript configuration
├── vercel.json                                    # Vercel deployment & SPA rewrite routing
└── vite.config.ts                                 # Vite plugins & path resolution
```

---

## Getting Started

### Prerequisites
- **Node.js:** `v20.x` or higher (LTS recommended)
- **npm:** `v10.x` or higher
- **Google Gemini API Key:** An active key from [Google AI Studio](https://aistudio.google.com/) with access to Gemini Live.
- **OpenWeatherMap API Key (Optional):** Free tier API key from [OpenWeatherMap](https://openweathermap.org/api) for live weather data.

### 1. Clone the Repository
```bash
git clone https://github.com/aryannikam028/AIRA-Virtual-Human.git
cd AIRA-Virtual-Human
```

### 2. Install Dependencies
```bash
npm install
```
*(Or use `npm ci` for an exact, clean install matching `package-lock.json`.)*

### 3. Configure Environment Variables
Create your local `.env` file from the provided template:

```bash
cp .env.example .env
```

Open `.env` in your editor and configure the variables:
```env
# Required for Gemini Live AI Voice-to-Voice
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Optional: Real-time live weather tool
WEATHER_API_KEY="your_openweather_api_key_here"

# Local Server Configuration
PORT=3001
APP_URL="http://localhost:3001"
TIMEZONE="Asia/Kolkata"

# Leave empty for localhost development (uses relative WebSocket connection)
VITE_WS_URL=""
```

> [!IMPORTANT]
> Never commit `.env` or `.env.local` to Git. The `.gitignore` file is configured to exclude all environment and secret files.

### 4. Run the Development Server
```bash
npm run dev
```

The application will start on **`http://localhost:3001`**. Open this URL in a modern Chromium-based browser (Google Chrome, Microsoft Edge, or Brave) for the best Web Audio and Web Speech API performance.

### 5. Build for Production
```bash
# Type check TypeScript
npm run lint

# Compile production bundle to /dist
npm run build
```

---

## Environment Variables Reference

| Variable | Environment | Required | Description |
| :--- | :--- | :---: | :--- |
| `GEMINI_API_KEY` | Backend Server | **Yes** | Google Gemini API key used server-side for `gemini-3.8-live` WebSockets. Never exposed to the frontend. |
| `WEATHER_API_KEY` | Backend Server | No | OpenWeatherMap API key used server-side for the `getWeather` tool. |
| `PORT` | Backend Server | No | Port on which the Express and WebSocket server listens (defaults to `3001`). |
| `APP_URL` | Backend Server | No | Application URL origin for logging and validation. |
| `TIMEZONE` | Backend Server | No | Local timezone fallback for date/time conversational grounding (default: `Asia/Kolkata`). |
| `VITE_WS_URL` | Frontend Client | No | WebSocket URL pointing to your deployed backend (e.g. `wss://aira-backend.onrender.com`). Left empty for local dev. |

---

## Deployment

AIRA is architected with a decoupled frontend and backend:
- **Frontend Hosting (Vercel):** Serves the compiled React, Three.js, and VRM single-page application at global edge locations.
  - **Official Production Site:** [https://aira-virtual-human.vercel.app/](https://aira-virtual-human.vercel.app/)
- **Backend WebSocket Service:** Runs the continuous Node.js server bridging client audio streams to Google's Gemini Live API.

### A. Frontend on Vercel (Official Live Deployment)
The frontend is deployed on **Vercel** connected directly to the `main` branch of this repository:
1. **Framework Preset:** Vite
2. **Build Command:** `npm run build`
3. **Output Directory:** `dist`
4. **SPA Rewrites:** Managed automatically via [`vercel.json`](vercel.json)
5. **Live URL:** [https://aira-virtual-human.vercel.app/](https://aira-virtual-human.vercel.app/)

To connect the Vercel frontend to a remote backend, set `VITE_WS_URL` in **Vercel Project Settings > Environment Variables** (e.g. `wss://your-backend.onrender.com`).

### B. Backend on Cloud Services (Render / Railway / Cloud Run)
To host the persistent WebSocket server:
1. Create a **Web Service** connecting to this GitHub repository.
2. Settings:
   - **Environment:** `Node`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start` (executes `tsx server.ts`)
3. Set environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `WEATHER_API_KEY`: (Optional) OpenWeatherMap API key.
   - `PORT`: `10000` (or platform default).
   - `NODE_ENV`: `production`
4. Provide the deployed service's `wss://` URL as `VITE_WS_URL` on Vercel.

---

## Visual Showcase & Interface

| Component | Description |
| :--- | :--- |
| **Full-Body 3D Avatar** | Rendered with Three.js & `@pixiv/three-vrm`, featuring natural breathing, posture blending, and eye-contact tracking. |
| **Portrait Mode Framing** | Dynamic camera zoom tailored for intimate facial interaction, showcasing viseme lip-sync and mood expressions. |
| **Aesthetic Themes** | Instant UI mood shifts across 5 cybernetic palettes: Cyber Magenta, Electric Violet, Neon Cyan, Emerald Matrix, and Solar Gold. |
| **Waveform Visualizer** | Real-time oscilloscope reflecting microphone input levels and AI vocalization harmonics. |
| **Personality Badges** | Reactive floating HUD badges that accompany AIRA's witty quips and remarks in real-time. |

---

## Author

- **Developer:** Aryan Nikam
- **Live Website:** [https://aira-virtual-human.vercel.app/](https://aira-virtual-human.vercel.app/)
- **GitHub Repository:** [https://github.com/aryannikam028/AIRA-Virtual-Human](https://github.com/aryannikam028/AIRA-Virtual-Human)
- **GitHub Profile:** [@aryannikam028](https://github.com/aryannikam028)
- **LinkedIn:** [Aryan Nikam](https://www.linkedin.com/in/aryan-nikam-525029414/)

---

## License

This project is licensed under the **[Apache License 2.0](https://opensource.org/licenses/Apache-2.0)** — see source headers for details.
