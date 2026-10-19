import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const CONTENT_ROOT = path.join(process.cwd(), "content", "bytes");

export const dynamic = "force-static";

export async function generateStaticParams() {
  const files = await fs.readdir(CONTENT_ROOT, { recursive: true, withFileTypes: true });
  return files
    .filter((entry) => entry.isFile())
    .map((entry) => ({ path: path.relative(CONTENT_ROOT, path.join(entry.parentPath, entry.name)).split(path.sep) }))
    .filter((entry) => entry.path[1] === "media");
}

const CONTENT_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf"
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const requestedPath = path.normalize(path.join(CONTENT_ROOT, ...segments));

  if (!requestedPath.startsWith(CONTENT_ROOT + path.sep)) {
    return new NextResponse("Invalid media path", { status: 400 });
  }

  try {
    const file = await fs.readFile(requestedPath);
    const contentType = CONTENT_TYPES[path.extname(requestedPath).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(file, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=60"
      }
    });
  } catch {
    return new NextResponse("Media not found", { status: 404 });
  }
}
