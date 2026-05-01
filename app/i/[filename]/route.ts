import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Image from "@/models/Image";
import { readStored } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THUMB_SUFFIX = "_thumb.webp";

interface ParsedName {
  hash: string;
  ext: string;
  isThumb: boolean;
}

function parseFilename(decoded: string): ParsedName | null {
  if (decoded.endsWith(THUMB_SUFFIX)) {
    const hash = decoded.slice(0, -THUMB_SUFFIX.length);
    if (!/^[a-f0-9]{64}$/.test(hash)) return null;
    return { hash, ext: "webp", isThumb: true };
  }
  const dot = decoded.lastIndexOf(".");
  if (dot <= 0) return null;
  const hash = decoded.slice(0, dot);
  const ext = decoded.slice(dot + 1).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hash)) return null;
  return { hash, ext, isThumb: false };
}

async function handle(
  request: NextRequest,
  params: Promise<{ filename: string }>,
  withBody: boolean
): Promise<Response> {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);
  const parsed = parseFilename(decoded);
  if (!parsed) {
    return new Response("Not found", { status: 404 });
  }

  await connectDB();
  const doc = await Image.findOne({ hash: parsed.hash }).lean<{
    ext: string;
    mime: string;
    storedPath: string;
    thumbPath: string;
  } | null>();
  if (!doc) {
    return new Response("Not found", { status: 404 });
  }

  if (!parsed.isThumb && parsed.ext !== doc.ext) {
    return new Response("Not found", { status: 404 });
  }

  const etag = `"${parsed.hash}${parsed.isThumb ? "-thumb" : ""}"`;
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const contentType = parsed.isThumb ? "image/webp" : doc.mime;
  const rel = parsed.isThumb ? doc.thumbPath : doc.storedPath;

  let buf: Buffer;
  try {
    buf = await readStored(rel);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Length": String(buf.byteLength),
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
  };

  return new Response(withBody ? new Uint8Array(buf) : null, {
    status: 200,
    headers,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  return handle(request, params, true);
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  return handle(request, params, false);
}
