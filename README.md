# AI Meeting Recorder & Summarizer

A clean, modern, and simple web application built for Sales Persons to record meetings with clients on a single shared device (laptop or mobile), transcribe conversations (supporting **English, Hindi, and Hinglish**), and generate structured executive English summaries powered by **Google Gemini**.

---

## Key Features

- **Single Device Microphone Recording**: Real-time microphone capture via the browser MediaRecorder API with echo cancellation, noise suppression, and auto gain control.
- **Microphone Controls & Timer**:
  - `[ 🔴 START RECORDING ]`
  - High-precision digital timer (`00:00:00`)
  - Live sound wave audio level visualizer
  - `[ ⏸ PAUSE ]` and `[ ▶ RESUME ]`
  - `[ ⏹ STOP ]`
- **Data Safety First**:
  - Audio files are saved directly to `./uploads/` **before** any AI processing begins.
  - If AI processing fails or if the API key is not yet configured, the audio file is **never deleted**.
  - One-click `[ 🔄 RETRY ]` allows reprocessing failed recordings at any time.
- **Multilingual Speech-to-Text**:
  - Transcribes conversations in **English, Hindi, and Hinglish** (code-mixed Hindi-English).
  - Speaker diarization separates conversation into `Speaker 1:` and `Speaker 2:`.
- **Structured Executive English Summary**:
  Strictly extracts 6 standardized sections in clean English:
  1. **Overall Meeting Summary**
  2. **Key Discussion Points** (bulleted)
  3. **Client Requirements** (bulleted)
  4. **Important Questions / Concerns** (bulleted)
  5. **Action Items** (bulleted)
  6. **Next Steps** (bulleted)
  *(Any unmentioned topic is explicitly marked as "Not mentioned")*
- **Recording History & Playback**:
  - SQLite database stores recordings, durations, timestamps, transcripts, and summaries.
  - Built-in audio player with scrubber and speed selector (1x, 1.25x, 1.5x).
  - Full transcript viewer modal with copy-to-clipboard functionality.

---

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API routes (`/api/recordings`, `/api/audio/[filename]`, `/api/config`)
- **Database**: Local SQLite via Node.js native `node:sqlite` (zero external C++ bindings required)
- **AI Engine**: Google Gemini Multimodal API (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`)

---

## Quick Start Guide

### 1. Configure Gemini API Key

Create or edit `.env.local` in the project root:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> *Tip: You can also set or update the API key directly in the web UI using the "Configure Gemini" button in the top navigation.*

### 2. Run the Application

In your terminal:

```bash
# In the project directory:
cd C:\Users\Admin\.gemini\antigravity\scratch\ai-meeting-recorder

# Start development server:
npm run dev
```

Or for optimized production mode:

```bash
npm run build
npm start
```

### 3. Open in Browser

Open [http://localhost:3000](http://localhost:3000) in any modern desktop or mobile browser (Chrome, Edge, Firefox, Safari).

---

## Using the Application

1. **Start Recording**: Click `[ 🔴 START RECORDING ]`. When prompted, allow microphone permissions.
2. **Conduct the Meeting**: The single device captures both the Sales Person and Client speaking in the room. The timer and waveform visualizer indicate active audio capture.
3. **Pause / Resume**: Need a break or off-the-record discussion? Hit `[ ⏸ PAUSE ]`, then `[ ▶ RESUME ]`.
4. **Stop & Save**: Press `[ ⏹ STOP ]`. The audio is immediately saved locally.
5. **View Summary & Transcript**:
   - The AI generates the structured 6-section English summary.
   - Listen to the meeting with the integrated audio player.
   - Click `[ VIEW TRANSCRIPT ]` to inspect the bilingual dialogue with speaker badges.
6. **Past Recordings**: Scroll down to **Recording History** to replay or inspect any previous sales meeting.
