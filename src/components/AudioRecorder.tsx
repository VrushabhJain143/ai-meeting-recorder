"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Pause,
  Play,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Radio,
  Sparkles,
  Volume2
} from "lucide-react";
import { Recording } from "@/lib/db";

interface AudioRecorderProps {
  onRecordingComplete: (recording: Recording) => void;
  isGeminiConfigured: boolean;
  onOpenSettings: () => void;
}

type RecordingState = "idle" | "recording" | "paused" | "saving" | "processing";

export function AudioRecorder({
  onRecordingComplete,
  isGeminiConfigured,
  onOpenSettings,
}: AudioRecorderProps) {
  const [recordState, setRecordState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0); // in seconds
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 for visualizer
  const [pipelineStep, setPipelineStep] = useState<number>(0); // 1: Audio Saved, 2: Transcribing, 3: Summarizing

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const cleanupAudio = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute average volume level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn("Audio visualizer not supported or failed to initialize:", e);
    }
  };

  const handleStartRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    // Verify browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Audio recording is not supported in this browser. Please use Chrome, Edge, Safari, or Firefox.");
      return;
    }

    try {
      // 1. Request microphone permission with noise suppression, echo cancellation, auto gain
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // 2. Select optimal audio MIME type
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else {
          mimeType = ""; // Default browser fallback
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        handleRecordingComplete();
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setErrorMessage("Microphone recording encountered an error.");
        cleanupAudio();
        setRecordState("idle");
      };

      // Start capturing chunks every 1 second
      recorder.start(1000);
      setRecordState("recording");
      setDuration(0);
      durationRef.current = 0;

      // Start visualizer
      startVisualizer(stream);

      // Start duration timer
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        durationRef.current = elapsed;
      }, 250);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Microphone permission was denied. Please allow microphone access in your browser address bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No microphone detected on this device. Please connect a microphone and try again.");
      } else {
        setErrorMessage(`Unable to access microphone: ${err.message || "Unknown error"}`);
      }
      cleanupAudio();
      setRecordState("idle");
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordState("paused");
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      pausedTimeRef.current = Date.now();
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordState("recording");

      // Adjust startTime by the paused duration
      const pauseDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pauseDuration;

      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        durationRef.current = elapsed;
      }, 250);
    }
  };

  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      setRecordState("saving");
      mediaRecorderRef.current.stop();
    }
  };

  const handleRecordingComplete = async () => {
    setRecordState("processing");
    setPipelineStep(1); // Audio Saved stage

    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

    // Stop streams to turn off device mic LED indicator immediately
    cleanupAudio();

    if (audioBlob.size === 0) {
      setErrorMessage("No audio data was recorded. Please try again.");
      setRecordState("idle");
      return;
    }

    try {
      // Calculate exact recorded duration
      const finalDuration = durationRef.current > 0
        ? durationRef.current
        : Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      // Create FormData
      const formData = new FormData();
      formData.append("audio", audioBlob, `meeting_${Date.now()}.${mimeType.includes("mp4") ? "mp4" : "webm"}`);
      formData.append("duration", finalDuration.toString());

      // Advance simulated step indicator as backend operates
      const stepTimer1 = setTimeout(() => setPipelineStep(2), 1500); // STT step
      const stepTimer2 = setTimeout(() => setPipelineStep(3), 3500); // Summary step

      console.log(`Uploading ${audioBlob.size} bytes (${finalDuration}s)...`);
      const response = await fetch("/api/recordings", {
        method: "POST",
        body: formData,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process audio");
      }

      if (data.recording) {
        onRecordingComplete(data.recording);
      }
    } catch (err: any) {
      console.error("Upload/Processing failed:", err);
      setErrorMessage(err.message || "Network or server error during upload.");
      setRecordState("idle");
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Error Banner */}
      {errorMessage && (
        <div className="w-full mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold">Recording Notice</h4>
            <p className="text-xs mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Recording Console Card */}
      <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
        {/* API Key Status Pill */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onOpenSettings}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors inline-flex items-center space-x-1 ${
              isGeminiConfigured
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isGeminiConfigured ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>{isGeminiConfigured ? "Gemini Ready" : "Set API Key"}</span>
          </button>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">
            AI MEETING RECORDER
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Place device between Sales Rep & Client • Captures English, Hindi & Hinglish
          </p>
        </div>

        {/* State 1: IDLE */}
        {recordState === "idle" && (
          <div className="flex flex-col items-center space-y-6 w-full my-4">
            {/* Timer display */}
            <div className="px-8 py-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="font-mono text-4xl md:text-5xl font-bold tracking-widest text-slate-800">
                00:00:00
              </span>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartRecording}
              className="group relative inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-red-600 text-white font-bold text-base md:text-lg shadow-lg hover:bg-red-700 active:scale-95 transition-all w-full max-w-xs"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white mr-3 animate-pulse" />
              <span>START RECORDING</span>
            </button>

            <p className="text-xs text-slate-400">
              Browser will request microphone access when you start
            </p>
          </div>
        )}

        {/* State 2 & 3: RECORDING & PAUSED */}
        {(recordState === "recording" || recordState === "paused") && (
          <div className="flex flex-col items-center space-y-6 w-full my-2">
            {/* Live Indicator Pill */}
            <div className="flex items-center space-x-2">
              {recordState === "recording" ? (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 mr-2 animate-ping" />
                  <span>RECORDING</span>
                </div>
              ) : (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase tracking-wider">
                  <Pause className="w-3 h-3 mr-1.5" />
                  <span>PAUSED</span>
                </div>
              )}
            </div>

            {/* Live Digital Timer */}
            <div className="px-8 py-4 bg-slate-900 rounded-2xl shadow-inner border border-slate-800">
              <span className="font-mono text-4xl md:text-5xl font-bold tracking-widest text-white">
                {formatTimer(duration)}
              </span>
            </div>

            {/* Audio Wave Visualizer Bars */}
            <div className="w-full max-w-xs h-12 flex items-center justify-center space-x-1.5 px-4 bg-slate-50 rounded-xl border border-slate-100">
              {recordState === "recording" ? (
                [18, 45, 75, 95, 60, 30, 80, 50, 20, 90, 40].map((h, i) => {
                  const dynamicHeight = Math.max(
                    15,
                    Math.min(100, (audioLevel * (h / 60)) + Math.random() * 15)
                  );
                  return (
                    <div
                      key={i}
                      className="w-1.5 bg-red-500 rounded-full transition-all duration-75"
                      style={{ height: `${dynamicHeight}%` }}
                    />
                  );
                })
              ) : (
                <span className="text-xs text-slate-400">Audio input paused</span>
              )}
            </div>

            {/* Controls: Pause / Resume / Stop */}
            <div className="flex items-center justify-center space-x-4 w-full pt-2">
              {recordState === "recording" ? (
                <button
                  onClick={handlePauseRecording}
                  className="flex-1 max-w-[140px] inline-flex items-center justify-center px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  <Pause className="w-4 h-4 mr-2 text-slate-600" />
                  PAUSE
                </button>
              ) : (
                <button
                  onClick={handleResumeRecording}
                  className="flex-1 max-w-[140px] inline-flex items-center justify-center px-4 py-3 rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold text-sm hover:bg-indigo-100 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2 text-indigo-600" />
                  RESUME
                </button>
              )}

              <button
                onClick={handleStopRecording}
                className="flex-1 max-w-[140px] inline-flex items-center justify-center px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-black transition-colors shadow-md"
              >
                <Square className="w-4 h-4 mr-2 fill-current text-white" />
                STOP
              </button>
            </div>
          </div>
        )}

        {/* State 4 & 5: SAVING & PROCESSING */}
        {(recordState === "saving" || recordState === "processing") && (
          <div className="flex flex-col items-center space-y-6 w-full my-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold uppercase tracking-wider">
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-indigo-600" />
              <span>Processing Recording...</span>
            </div>

            {/* Pipeline Checklist */}
            <div className="w-full max-w-sm rounded-2xl bg-slate-50 p-5 border border-slate-200 text-left space-y-3.5">
              {/* Step 1: Audio Saved */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800">Audio Saved</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">✓ Done</span>
              </div>

              {/* Step 2: Transcript Generated */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2.5">
                  {pipelineStep >= 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                  )}
                  <span className={`font-medium ${pipelineStep >= 2 ? "text-slate-800" : "text-slate-600"}`}>
                    {pipelineStep >= 2 ? "Transcript Generated" : "Generating Transcript..."}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {pipelineStep >= 2 ? "✓ Done" : "⏳ Multilingual STT"}
                </span>
              </div>

              {/* Step 3: Summary Generated */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2.5">
                  {pipelineStep >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                  )}
                  <span className={`font-medium ${pipelineStep >= 3 ? "text-slate-800" : "text-slate-600"}`}>
                    {pipelineStep >= 3 ? "Summary Generated" : "Generating Summary..."}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {pipelineStep >= 3 ? "✓ Done" : "⏳ Gemini AI"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Audio is securely saved to disk first. Processing will complete shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
