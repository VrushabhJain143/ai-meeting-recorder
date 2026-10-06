"use client";

import { useState } from "react";
import { X, Copy, Check, FileText } from "lucide-react";

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string | null;
  recordingId: string;
}

export function TranscriptModal({
  isOpen,
  onClose,
  transcript,
  recordingId,
}: TranscriptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to parse transcript lines into speaker-formatted elements
  const renderFormattedTranscript = () => {
    if (!transcript || !transcript.trim()) {
      return (
        <div className="text-center py-10 text-slate-400 italic">
          No transcript available for this recording.
        </div>
      );
    }

    const lines = transcript.split("\n").filter((l) => l.trim().length > 0);

    return (
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const speakerMatch = line.match(/^(Speaker\s*\d+|Person\s*\d+|Sales\s*Person|Client):?\s*(.*)$/i);

          if (speakerMatch) {
            const speaker = speakerMatch[1];
            const text = speakerMatch[2];
            const isSpeaker1 = speaker.toLowerCase().includes("1") || speaker.toLowerCase().includes("sales");

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border ${
                  isSpeaker1
                    ? "bg-blue-50/70 border-blue-100"
                    : "bg-emerald-50/70 border-emerald-100"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      isSpeaker1
                        ? "bg-blue-200 text-blue-800"
                        : "bg-emerald-200 text-emerald-800"
                    }`}
                  >
                    {speaker}
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed pl-1">{text}</p>
              </div>
            );
          }

          return (
            <p key={idx} className="text-sm text-slate-700 leading-relaxed py-1">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Full Meeting Transcript</h3>
              <p className="text-xs text-slate-500 font-mono">ID: {recordingId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Copy Transcript
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-xs text-slate-500 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Multilingual Speech-to-Text with Speaker Identification</span>
            <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              English • Hindi • Hinglish
            </span>
          </div>

          {renderFormattedTranscript()}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
