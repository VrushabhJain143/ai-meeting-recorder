"use client";

import { useState, useEffect } from "react";
import { Mic, Sparkles, Key, RefreshCw } from "lucide-react";
import { Recording } from "@/lib/db";
import { AudioRecorder } from "@/components/AudioRecorder";
import { MeetingSummaryView } from "@/components/MeetingSummaryView";
import { RecordingHistory } from "@/components/RecordingHistory";
import { ApiKeyModal } from "@/components/ApiKeyModal";

export default function Home() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isGeminiConfigured, setIsGeminiConfigured] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial recordings and config
  useEffect(() => {
    fetchConfig();
    fetchRecordings();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setIsGeminiConfigured(Boolean(data.configured));
        setMaskedKey(data.maskedKey || null);
      }
    } catch (e) {
      console.warn("Could not check config status:", e);
    }
  };

  const fetchRecordings = async () => {
    try {
      const res = await fetch("/api/recordings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.recordings)) {
          setRecordings(data.recordings);
        }
      }
    } catch (e) {
      console.error("Error fetching recordings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = (newRecording: Recording) => {
    setRecordings((prev) => [newRecording, ...prev.filter((r) => r.id !== newRecording.id)]);
    setSelectedRecording(newRecording);
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/recordings/${id}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.recording) {
        setRecordings((prev) =>
          prev.map((r) => (r.id === id ? data.recording : r))
        );
        if (selectedRecording && selectedRecording.id === id) {
          setSelectedRecording(data.recording);
        }
      }
      if (!data.success && data.error) {
        alert(data.error);
      }
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/recordings/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecordings((prev) => prev.filter((r) => r.id !== id));
        if (selectedRecording && selectedRecording.id === id) {
          setSelectedRecording(null);
        }
      }
    } catch (e) {
      console.error("Failed to delete recording:", e);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => setSelectedRecording(null)}
            className="flex items-center space-x-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                AI Meeting Recorder
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sales & Client Recording Pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isGeminiConfigured ? "API Settings" : "Configure Gemini"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {selectedRecording ? (
          /* View Structured Summary & Audio Player for Active Recording */
          <MeetingSummaryView
            recording={selectedRecording}
            onRecordNew={() => setSelectedRecording(null)}
            onRetry={handleRetry}
            isRetrying={retryingId === selectedRecording.id}
          />
        ) : (
          /* Direct Recording Page */
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            isGeminiConfigured={isGeminiConfigured}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Recording History Section */}
        <RecordingHistory
          recordings={recordings}
          onSelectRecording={(rec) => setSelectedRecording(rec)}
          onRetry={handleRetry}
          onDelete={handleDelete}
          retryingId={retryingId}
        />
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400">
        AI Meeting Recorder • Built for Sales Calls • Supports English, Hindi & Hinglish
      </footer>

      {/* Settings Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isConfigured={isGeminiConfigured}
        maskedKey={maskedKey}
        onKeyUpdated={() => {
          fetchConfig();
        }}
      />
    </div>
  );
}
