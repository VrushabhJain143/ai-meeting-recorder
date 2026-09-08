import fs from "node:fs";

export interface MeetingSummary {
  overall_summary: string;
  key_discussion_points: string[];
  client_requirements?: string[];
  important_questions_concerns?: string[];
  action_items?: string[];
  next_steps?: string[];
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) return false;
  const lower = key.toLowerCase();
  if (lower.includes("your_") || lower.includes("placeholder") || lower.includes("your_key_here")) {
    return false;
  }
  return true;
}

/**
 * Transcribes audio file using Google Gemini
 * Supports English, Hindi, Hinglish, and Speaker 1 / Speaker 2 identification.
 */
export async function transcribeAudioWithGemini(audioFilePath: string, mimeType = "audio/webm"): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is not configured in .env.local. Please add your key to proceed.");
  }

  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found on server at: ${audioFilePath}`);
  }

  const audioBuffer = fs.readFileSync(audioFilePath);
  const base64Audio = audioBuffer.toString("base64");

  const prompt = `
You are an expert multilingual speech-to-text transcriber for business and sales meetings.
A single microphone was placed between a Sales Person and a Client.
The conversation may be in English, Hindi, Hinglish (mixed English and Hindi), or code-switched phrases.

Instructions:
1. Accurately transcribe the conversation verbatim.
2. If words are spoken in Hindi or Hinglish, transcribe them accurately as spoken (in English script/Hinglish or standard transliteration so meaning is retained).
3. Distinguish between the two people talking using speaker labels:
   Speaker 1: [What Speaker 1 said]
   Speaker 2: [What Speaker 2 said]
4. Capture natural back-and-forth dialogue accurately.
5. Do NOT summarize or omit conversation turns. Return ONLY the transcribed dialogue.
`;

  // Fast production Gemini models for audio
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "audio/webm",
                  data: base64Audio,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${model} status ${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err: any) {
      lastError = err;
      // If 404 on model name, loop to try next model
      console.warn(`Attempt with ${model} failed, trying next model:`, err.message);
    }
  }

  throw new Error(`Failed to transcribe audio with Gemini: ${lastError?.message || "Unknown error"}`);
}

/**
 * Generates structured English summary from meeting transcript using Gemini
 */
export async function summarizeTranscriptWithGemini(transcript: string): Promise<MeetingSummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is not configured in .env.local.");
  }

  const prompt = `
You are an expert sales meeting analyst.
Analyze the following meeting transcript between a Sales Person and a Client.
The conversation may have taken place in English, Hindi, Hinglish, or a mix of these.

Your task is to generate an executive-level, clear English summary of the meeting.

CRITICAL RULES:
1. Always write all summary content in clean, professional English, even if the spoken conversation was in Hindi or Hinglish.
2. NEVER invent, hallucinate, or assume details that were not discussed.
3. If a section or point was not discussed in the meeting, write exactly "Not mentioned" for that section.
4. Extract the overall meeting summary and the key discussion points in the JSON format requested below.

TRANSCRIPT:
---
${transcript}
---

Return ONLY a valid JSON object with this exact schema (no additional markdown or conversational text):
{
  "overall_summary": "1-3 clear sentences summarizing what this meeting was about, the product/service discussed, and the overall outcome. (Or 'Not mentioned')",
  "key_discussion_points": [
    "Discussion point 1",
    "Discussion point 2"
  ]
}
If there are no key discussion points, return ["Not mentioned"].
`;

  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${model} status ${res.status}): ${errText}`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Empty response from Gemini");

      // Clean markdown fences if any
      const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned) as MeetingSummary;

      // Validate and sanitize fields
      return {
        overall_summary: parsed.overall_summary || "Not mentioned",
        key_discussion_points: Array.isArray(parsed.key_discussion_points) && parsed.key_discussion_points.length > 0 ? parsed.key_discussion_points : ["Not mentioned"],
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Summary attempt with ${model} failed, trying next:`, err.message);
    }
  }

  throw new Error(`Failed to generate summary with Gemini: ${lastError?.message || "Unknown error"}`);
}

/**
 * Formats a MeetingSummary into user-friendly text
 */
export function formatSummaryAsText(summary: MeetingSummary): string {
  const formatList = (items: string[]) => {
    if (!items || items.length === 0) return "* Not mentioned";
    return items.map((it) => `* ${it}`).join("\n");
  };

  return `### MEETING SUMMARY

Summary:
${summary.overall_summary || "Not mentioned"}

Key Discussion Points:
${formatList(summary.key_discussion_points)}`;
}
