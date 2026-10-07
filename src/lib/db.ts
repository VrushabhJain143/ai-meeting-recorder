import mysql, { Pool, RowDataPacket } from "mysql2/promise";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { INITIAL_RECORDINGS } from "./seedData";

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

// Check if MySQL environment configuration is provided
export function isMySqlConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
    (process.env.MYSQL_HOST && (process.env.MYSQL_DATABASE || process.env.MYSQL_USER))
  );
}

let mysqlPool: Pool | null = null;
let sqliteDb: DatabaseSync | null = null;

// Initialize MySQL Connection Pool
async function getMySqlPool(): Promise<Pool> {
  if (!mysqlPool) {
    if (process.env.DATABASE_URL) {
      mysqlPool = mysql.createPool(process.env.DATABASE_URL);
    } else {
      mysqlPool = mysql.createPool({
        host: process.env.MYSQL_HOST || "localhost",
        port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQL_DATABASE || "ai_meeting_recorder",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      });
    }

    try {
      // Auto-create table in MySQL if it doesn't already exist
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS recordings (
          id VARCHAR(64) PRIMARY KEY,
          created_at VARCHAR(64) NOT NULL,
          duration INT NOT NULL DEFAULT 0,
          audio_file_path VARCHAR(255) NOT NULL,
          transcript LONGTEXT,
          summary LONGTEXT,
          status VARCHAR(32) NOT NULL DEFAULT 'processing',
          error_message TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log("✓ MySQL connected & 'recordings' table verified");
    } catch (err) {
      console.error("Failed to initialize MySQL schema:", err);
      throw err;
    }
  }
  return mysqlPool;
}

// Fallback SQLite Database
function getSqliteDb(): DatabaseSync {
  if (!sqliteDb) {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, "meetings.db");
    sqliteDb = new DatabaseSync(dbPath);

    // Initialize SQLite schema
    sqliteDb.exec(`
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

    // Auto-seed original test meetings if database is empty
    try {
      const countRow = sqliteDb.prepare("SELECT count(*) as cnt FROM recordings").get() as any;
      if (!countRow || countRow.cnt === 0) {
        const insertStmt = sqliteDb.prepare(`
          INSERT INTO recordings (id, created_at, duration, audio_file_path, transcript, summary, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const rec of INITIAL_RECORDINGS) {
          insertStmt.run(
            rec.id,
            rec.created_at,
            rec.duration,
            rec.audio_file_path,
            rec.transcript,
            rec.summary,
            rec.status
          );
        }
      }
    } catch (e) {
      console.warn("Auto-seed skipped or already populated:", e);
    }
  }
  return sqliteDb;
}

export async function getAllRecordings(): Promise<Recording[]> {
  if (isMySqlConfigured()) {
    try {
      const pool = await getMySqlPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM recordings ORDER BY created_at DESC"
      );
      return rows as Recording[];
    } catch (err) {
      console.error("MySQL getAllRecordings error, falling back to SQLite:", err);
    }
  }
  const db = getSqliteDb();
  const stmt = db.prepare("SELECT * FROM recordings ORDER BY created_at DESC");
  return stmt.all() as unknown as Recording[];
}

export async function getRecordingById(id: string): Promise<Recording | null> {
  if (isMySqlConfigured()) {
    try {
      const pool = await getMySqlPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM recordings WHERE id = ? LIMIT 1",
        [id]
      );
      if (rows && rows.length > 0) {
        return rows[0] as Recording;
      }
      return null;
    } catch (err) {
      console.error("MySQL getRecordingById error, falling back to SQLite:", err);
    }
  }
  const db = getSqliteDb();
  const stmt = db.prepare("SELECT * FROM recordings WHERE id = ?");
  const row = stmt.get(id);
  return (row as unknown as Recording) || null;
}

export async function createRecording(
  data: Omit<Recording, "created_at" | "transcript" | "summary" | "error_message"> & Partial<Recording>
): Promise<Recording> {
  const recording: Recording = {
    id: data.id,
    created_at: data.created_at || new Date().toISOString(),
    duration: data.duration,
    audio_file_path: data.audio_file_path,
    transcript: data.transcript || null,
    summary: data.summary || null,
    status: data.status || "processing",
    error_message: data.error_message || null,
  };

  if (isMySqlConfigured()) {
    try {
      const pool = await getMySqlPool();
      await pool.execute(
        `INSERT INTO recordings (id, created_at, duration, audio_file_path, transcript, summary, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recording.id,
          recording.created_at,
          recording.duration,
          recording.audio_file_path,
          recording.transcript,
          recording.summary,
          recording.status,
          recording.error_message,
        ]
      );
      return recording;
    } catch (err) {
      console.error("MySQL createRecording error, falling back to SQLite:", err);
    }
  }

  const db = getSqliteDb();
  const stmt = db.prepare(`
    INSERT INTO recordings (id, created_at, duration, audio_file_path, transcript, summary, status, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    recording.id,
    recording.created_at,
    recording.duration,
    recording.audio_file_path,
    recording.transcript,
    recording.summary,
    recording.status,
    recording.error_message
  );
  return recording;
}

export async function updateRecording(
  id: string,
  updates: Partial<Omit<Recording, "id">>
): Promise<Recording | null> {
  if (isMySqlConfigured()) {
    try {
      const pool = await getMySqlPool();
      const fields: string[] = [];
      const values: any[] = [];

      for (const [key, val] of Object.entries(updates)) {
        if (key !== "id" && val !== undefined) {
          fields.push(`${key} = ?`);
          values.push(val);
        }
      }

      if (fields.length > 0) {
        values.push(id);
        await pool.execute(
          `UPDATE recordings SET ${fields.join(", ")} WHERE id = ?`,
          values
        );
      }
      return await getRecordingById(id);
    } catch (err) {
      console.error("MySQL updateRecording error, falling back to SQLite:", err);
    }
  }

  const db = getSqliteDb();
  const current = db.prepare("SELECT * FROM recordings WHERE id = ?").get(id) as any;
  if (!current) return null;

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, val] of Object.entries(updates)) {
    if (key !== "id" && val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (fields.length > 0) {
    values.push(id);
    const stmt = db.prepare(`UPDATE recordings SET ${fields.join(", ")} WHERE id = ?`);
    stmt.run(...values);
  }

  const updated = db.prepare("SELECT * FROM recordings WHERE id = ?").get(id);
  return (updated as unknown as Recording) || null;
}

export async function deleteRecording(id: string): Promise<boolean> {
  if (isMySqlConfigured()) {
    try {
      const pool = await getMySqlPool();
      await pool.execute("DELETE FROM recordings WHERE id = ?", [id]);
      return true;
    } catch (err) {
      console.error("MySQL deleteRecording error, falling back to SQLite:", err);
    }
  }
  const db = getSqliteDb();
  const stmt = db.prepare("DELETE FROM recordings WHERE id = ?");
  stmt.run(id);
  return true;
}
