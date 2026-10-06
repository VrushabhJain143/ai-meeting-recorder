"use client";

import { useState } from "react";
import { Key, X, Check, AlertCircle, Loader2 } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
  maskedKey: string | null;
  onKeyUpdated: () => void;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  isConfigured,
  maskedKey,
  onKeyUpdated,
}: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save API key");
      }
      setSavedSuccess(true);
      setKeyInput("");
      onKeyUpdated();
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">Google Gemini API Key</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 border border-slate-200">
            <div className="flex items-center justify-between">
              <span>Current Status:</span>
              {isConfigured ? (
                <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <Check className="w-3.5 h-3.5 mr-1" /> Configured ({maskedKey})
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> Not Configured
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              You can also configure this in <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.env.local</code> as:
              <br />
              <code className="font-mono text-[11px] text-indigo-600">GEMINI_API_KEY=your_gemini_key_here</code>
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {isConfigured ? "Update API Key" : "Enter Gemini API Key"}
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {savedSuccess && (
              <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700 flex items-center">
                <Check className="w-4 h-4 mr-1.5 shrink-0" />
                <span>API Key saved successfully!</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !keyInput.trim()}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl inline-flex items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Key"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
