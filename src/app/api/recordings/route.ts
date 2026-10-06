import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import {
  getAllRecordings,
  createRecording,
  updateRecording,
  getRecordingById,
} from "@/lib/db";
import {
  transcribeAudioWithGemini,
  summarizeTranscriptWithGemini,
  isGeminiConfigured,
} from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recordings = getAllRecordings();
    return NextResponse.json({ success: true, recordings });
  } catch (error: any) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch recordings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let recordingId = "";
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const durationRaw = formData.get("duration") as string | null;
    const duration = durationRaw ? Math.round(parseFloat(durationRaw)) : 0;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "No audio file provided in upload" },
        { status: 400 }
      );
    }

    // Step 1: Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique ID and filename
    recordingId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const extension = audioFile.type.includes("mp4") ? "mp4" : "webm";
    const filename = `${recordingId}.${extension}`;
    const filePath = path.join(uploadsDir, filename);

    // Step 2: SAVE THE AUDIO FILE FIRST (Data Safety Priority)
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    console.log(`✓ Audio safely saved: ${filePath} (${buffer.length} bytes)`);

    // Step 3: Insert initial record in Database
    const initialRecording = createRecording({
      id: recordingId,
      duration,
      audio_file_path: filename,
      status: "processing",
    });

    // Check if Gemini API key is configured
    if (!isGeminiConfigured()) {
      const errMsg =
        "GEMINI_API_KEY is not configured in .env.local. Audio was saved safely. Add your API key and click Retry to process.";
      const updated = updateRecording(recordingId, {
        status: "failed_transcription",
        error_message: errMsg,
      });
      return NextResponse.json({
        success: true,
        recording: updated,
        warning: errMsg,
      });
    }

    // Step 4: Run Gemini Speech-to-Text Transcription
    let transcript = "";
    try {
      console.log(`Transcribing audio for ${recordingId}...`);
      transcript = await transcribeAudioWithGemini(filePath, audioFile.type || "audio/webm");
      updateRecording(recordingId, {
        transcript,
        status: "processing", // Still processing summary
      });
      console.log(`✓ Transcript generated for ${recordingId}`);
    } catch (sttError: any) {
      console.error("STT Error:", sttError);
      const updated = updateRecording(recordingId, {
        status: "failed_transcription",
        error_message: `Transcription error: ${sttError.message}`,
      });
      return NextResponse.json({
        success: true,
        recording: updated,
        error: `Transcription failed: ${sttError.message}. Audio is saved and can be retried.`,
      });
    }

    // Step 5: Run Gemini Summarization
    try {
      console.log(`Summarizing transcript for ${recordingId}...`);
      const summaryObj = await summarizeTranscriptWithGemini(transcript);
      const summaryJson = JSON.stringify(summaryObj);

      const finalRecording = updateRecording(recordingId, {
        summary: summaryJson,
        status: "completed",
        error_message: null,
      });
      console.log(`✓ Summary generated for ${recordingId}`);

      return NextResponse.json({
        success: true,
        recording: finalRecording,
      });
    } catch (sumError: any) {
      console.error("Summarization Error:", sumError);
      const updated = updateRecording(recordingId, {
        status: "failed_summary",
        transcript, // keep the transcript!
        error_message: `Summary error: ${sumError.message}`,
      });
      return NextResponse.json({
        success: true,
        recording: updated,
        error: `Summary failed: ${sumError.message}. Transcript and audio were saved.`,
      });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    if (recordingId) {
      updateRecording(recordingId, {
        status: "failed_transcription",
        error_message: error.message || "Failed to process audio",
      });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process audio recording" },
      { status: 500 }
    );
  }
}
