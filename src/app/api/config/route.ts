import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { isGeminiConfigured } from "@/lib/ai";

export async function GET() {
  const configured = isGeminiConfigured();
  const rawKey = process.env.GEMINI_API_KEY || "";
  const maskedKey = configured
    ? `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}`
    : null;

  return NextResponse.json({
    configured,
    maskedKey,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return NextResponse.json({ success: false, error: "API key cannot be empty" }, { status: 400 });
    }

    const trimmed = apiKey.trim();
    process.env.GEMINI_API_KEY = trimmed;

    // Persist to .env.local
    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    if (envContent.includes("GEMINI_API_KEY=")) {
      envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${trimmed}`);
    } else {
      envContent += `\nGEMINI_API_KEY=${trimmed}\n`;
    }

    fs.writeFileSync(envPath, envContent.trim() + "\n", "utf-8");

    return NextResponse.json({
      success: true,
      configured: true,
      maskedKey: `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
