import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getRecordingById, updateRecording } from "@/lib/db";
import {
  transcribeAudioWithGemini,
  summarizeTranscriptWithGemini,
  isGeminiConfigured,
} from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recording = getRecordingById(id);
    if (!recording) {
      return NextResponse.json(
        { success: false, error: "Recording not found" },
        { status: 404 }
      );
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is not configured in .env.local. Please set your key first.",
        },
        { status: 400 }
      );
    }

    const audioFilePath = path.join(process.cwd(), "uploads", recording.audio_file_path);
    if (!fs.existsSync(audioFilePath)) {
      return NextResponse.json(
        { success: false, error: "Underlying audio file not found on server" },
        { status: 404 }
      );
    }

    // Set status to processing
    updateRecording(id, { status: "processing", error_message: null });

    // Step 1: Transcription (if missing or if previous attempt failed at STT)
    let transcript = recording.transcript;
    if (!transcript || recording.status === "failed_transcription") {
      try {
        console.log(`Retrying transcription for ${id}...`);
        const mimeType = recording.audio_file_path.endsWith(".mp4") ? "audio/mp4" : "audio/webm";
        transcript = await transcribeAudioWithGemini(audioFilePath, mimeType);
        updateRecording(id, { transcript });
      } catch (sttErr: any) {
        console.error("Retry STT failed:", sttErr);
        const updated = updateRecording(id, {
          status: "failed_transcription",
          error_message: `Retry transcription error: ${sttErr.message}`,
        });
        return NextResponse.json({
          success: false,
          recording: updated,
          error: `Transcription failed: ${sttErr.message}`,
        });
      }
    }

    // Step 2: Summarization
    try {
      console.log(`Retrying summarization for ${id}...`);
      const summaryObj = await summarizeTranscriptWithGemini(transcript);
      const summaryJson = JSON.stringify(summaryObj);

      const updated = updateRecording(id, {
        summary: summaryJson,
        status: "completed",
        error_message: null,
      });

      return NextResponse.json({
        success: true,
        recording: updated,
      });
    } catch (sumErr: any) {
      console.error("Retry summary failed:", sumErr);
      const updated = updateRecording(id, {
        status: "failed_summary",
        transcript,
        error_message: `Retry summary error: ${sumErr.message}`,
      });
      return NextResponse.json({
        success: false,
        recording: updated,
        error: `Summary failed: ${sumErr.message}`,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
