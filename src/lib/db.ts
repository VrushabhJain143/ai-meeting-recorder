import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

export interface Recording {
  id: string;
  created_at: string;
  duration: number; // in seconds
  audio_file_path: string; // filename in uploads directory
  transcript: string | null;
  summary: string | null; // JSON string or text
  status: "processing" | "completed" | "failed_transcription" | "failed_summary";
  error_message: string | null;
}

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, "meetings.db");
    dbInstance = new DatabaseSync(dbPath);

    // Initialize schema
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS recordings (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 0,
        audio_file_path TEXT NOT NULL,
        transcript TEXT,
        summary TEXT,
        status TEXT NOT NULL DEFAULT 'processing',
        error_message TEXT
      );
    `);
  }
  return dbInstance;
}

export function getAllRecordings(): Recording[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM recordings ORDER BY created_at DESC");
  return stmt.all() as unknown as Recording[];
}

export function getRecordingById(id: string): Recording | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM recordings WHERE id = ?");
  const row = stmt.get(id);
  return (row as unknown as Recording) || null;
}

export function createRecording(data: {
  id: string;
  duration: number;
  audio_file_path: string;
  status?: Recording["status"];
  created_at?: string;
}): Recording {
  const db = getDb();
  const created_at = data.created_at || new Date().toISOString();
  const status = data.status || "processing";

  const stmt = db.prepare(`
    INSERT INTO recordings (id, created_at, duration, audio_file_path, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(data.id, created_at, data.duration, data.audio_file_path, status);

  return getRecordingById(data.id)!;
}

export function updateRecording(
  id: string,
  updates: Partial<Omit<Recording, "id" | "created_at">>
): Recording | null {
  const db = getDb();
  const existing = getRecordingById(id);
  if (!existing) return null;

  const newDuration = updates.duration !== undefined ? updates.duration : existing.duration;
  const newTranscript = updates.transcript !== undefined ? updates.transcript : existing.transcript;
  const newSummary = updates.summary !== undefined ? updates.summary : existing.summary;
  const newStatus = updates.status !== undefined ? updates.status : existing.status;
  const newErrorMessage = updates.error_message !== undefined ? updates.error_message : existing.error_message;

  const stmt = db.prepare(`
    UPDATE recordings
    SET duration = ?, transcript = ?, summary = ?, status = ?, error_message = ?
    WHERE id = ?
  `);
  stmt.run(newDuration, newTranscript, newSummary, newStatus, newErrorMessage, id);

  return getRecordingById(id);
}

export function deleteRecording(id: string): boolean {
  const db = getDb();
  const stmt = db.prepare("DELETE FROM recordings WHERE id = ?");
  stmt.run(id);
  return true;
}
