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

    // Auto-seed the two recorded test meetings if database is empty
    try {
      const countRow = dbInstance.prepare("SELECT count(*) as cnt FROM recordings").get() as any;
      if (!countRow || countRow.cnt === 0) {
        const insertStmt = dbInstance.prepare(`
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
