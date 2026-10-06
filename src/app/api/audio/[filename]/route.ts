import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), "uploads", safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Audio file not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.get("range");

    const mimeType = safeFilename.endsWith(".mp4") ? "audio/mp4" : "audio/webm";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      const headers = new Headers({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": mimeType,
      });

      // Stream to web standard ReadableStream
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(stream, { status: 206, headers });
    } else {
      const fileStream = fs.createReadStream(filePath);
      const headers = new Headers({
        "Content-Length": fileSize.toString(),
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
      });

      const stream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(stream, { headers });
    }
  } catch (error: any) {
    return new NextResponse(error.message || "Failed to serve audio", { status: 500 });
  }
}
