import mysql, { Pool, RowDataPacket } from "mysql2/promise";
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

    // Auto-seed existing test meetings if database is empty
    try {
      const countRow = sqliteDb.prepare("SELECT count(*) as cnt FROM recordings").get() as any;
      if (!countRow || countRow.cnt === 0) {
        const insertStmt = sqliteDb.prepare(`
          INSERT INTO recordings (id, created_at, duration, audio_file_path, transcript, summary, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        insertStmt.run(
          "rec_1788863273211_di3zj",
          "2026-09-08T10:27:53.224Z",
          105,
          "rec_1788863273211_di3zj.webm",
          "Client: Hello.\nSales Person: Hello. Good afternoon, ma'am.\nClient: Good afternoon.\nSales Person: Ma'am, is Srishti Vats from Shripal Shanti here?\nClient: Yes.\nSales Person: Ma'am, aapki inquiry receive hui thi Shripal Shanti mein property purchase karne ka plan kar rahe ho?\nClient: Ah, ha.\nSales Person: Kya dekh rahe ho ma'am, aise? Aur kya aapke paas options hain?\nClient: One BHK, two BHK, dono options hain ma'am. Aap kya dekh rahe ho?\nSales Person: Um, actually main three BHK dekh rahi hoon. Aisa kuch option hai aapke paas?\nClient: Aur three BHK ma'am, hamare paas Jodi options aapko mil jayenge.\nSales Person: Okay, great.\nSales Person: Ma'am, aap kahan rehte ho?\nClient: Main Virar mein rehti hoon, Ekta mein.\nSales Person: Okay, toh ye aapke paas hi ma'am, aap Vaikenagar location pe hamara project hai. Tanjali Road pe aapko idea hoga.\nClient: Ha, ha, idea toh hai.\nSales Person: Toh ma'am, ye directly builder office se stand hoti hai na?\nClient: Ha, builder office se baat kar rahi hoon ma'am main.\nSales Person: Achcha, theek hai.\nSales Person: Toh abhi under construction hai ma'am, 20 slab tak ready ho chuka hai.\nClient: Hmm.\nSales Person: Aapko next year June-July tak possession mil jayega.\nClient: Okay.\nSales Person: Toh abhi plan kar rahe ho na visit ke liye, aaj possible hai kya?\nClient: Aaj toh possible nahi hai, main aapko Sunday ko batati hoon.\nSales Person: Okay, chalega ma'am. Apna seven days office chalu rehta hai.\nClient: Hmm.\nSales Person: Kabhi bhi aap aao, direct aana ma'am. Main builder office se baat kar rahi hoon.\nClient: Hmm.\nSales Person: Usme kya aapko pricing benefit milta hai.\nClient: Arre, mereko na ek CP ne bhi approach kiya tha. Matlab aapke project ke liye approach kiya tha.\nSales Person: Ma'am, woh channel partners rehte hain hamare.\nClient: Ha.\nSales Person: But main direct builder office se baat kar rahi hoon. Aap mera number save kar lijiye.\nClient: Hmm.\nSales Person: Jab bhi aayenge toh mujhe call kar dijiyega. Hamara pickup bhi rehta hai, main car bhi bhej dunga Ekta ki building ke paas.\nClient: Okay. But agar main CP ke saath aaungi toh koi dikkat hai kya?\nSales Person: Wohi mujhe dikha rahe the.\nClient: Hmm.\nSales Person: Direct aayenge toh ma'am, main aapko discount karke de sakti hoon.\nClient: On table.\nSales Person: Aap direct aaoge toh.\nClient: Achcha, matlab CP ke saath aate hain toh matlab mujhe CP ko pay karna padega, aisa?\nSales Person: Hmm.\nClient: Theek hai.\nSales Person: Theek hai.",
          JSON.stringify({
            pitch_score: 9.0,
            pitch_percentage: 90,
            overall_summary: "This meeting was a follow-up sales call from Shripal Shanti builder office to a client inquiring about purchasing property in Virar. The discussion covered available configurations (1 BHK, 2 BHK, and Jodi 3 BHK options), construction status (20 slabs ready), and the benefits of direct visits without channel partners.",
            key_discussion_points: [
              "Client interested in property purchase, looking for 3 BHK Jodi options in Virar (Ekta area).",
              "Project location at Vaikenagar, Tanjali Road; 20 slabs ready with possession expected next year June-July.",
              "Sales representative offered car pickup service from Ekta building and on-table discount for direct builder visits.",
              "Client to confirm site visit on Sunday."
            ]
          }),
          "completed"
        );
        insertStmt.run(
          "rec_1788862633941_smjxt",
          "2026-09-08T10:17:13.947Z",
          65,
          "rec_1788862633941_smjxt.webm",
          "Speaker 1: Hello everyone. Today we are analyzing why sales have dropped this quarter.\nSpeaker 2: Yes, looking at the data, lead response time increased from 5 minutes to 45 minutes.\nSpeaker 1: That is critical. We need to implement automated lead routing immediately.",
          JSON.stringify({
            pitch_score: 8.2,
            pitch_percentage: 82,
            overall_summary: "The meeting focused on analyzing sales performance and addressing the recent decline in conversion rates.",
            key_discussion_points: [
              "Analysis of quarterly sales drop and response time delay from 5 to 45 minutes.",
              "Agreement to implement automated lead routing immediately."
            ]
          }),
          "completed"
        );
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
