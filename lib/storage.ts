import { createHash } from "crypto";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import Image, { type IImage } from "@/models/Image";
import { connectDB } from "@/lib/db";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data";

const FORMAT_TO_EXT: Record<string, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  gif: "gif",
  avif: "avif",
};

const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export const ALLOWED_MIMES = new Set(Object.values(FORMAT_TO_MIME));
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

export function resolveDiskPath(rel: string): string {
  return path.join(UPLOAD_DIR, rel);
}

export async function saveUpload(
  buffer: Buffer,
  originalName: string
): Promise<IImage & { _id: unknown }> {
  await connectDB();

  const meta = await sharp(buffer).metadata();
  if (!meta.format || !FORMAT_TO_EXT[meta.format]) {
    throw new Error(`Unsupported image format: ${meta.format ?? "unknown"}`);
  }
  if (!meta.width || !meta.height) {
    throw new Error("Cannot read image dimensions");
  }

  const ext = FORMAT_TO_EXT[meta.format];
  const mime = FORMAT_TO_MIME[meta.format];
  const hash = createHash("sha256").update(buffer).digest("hex");

  const existing = await Image.findOne({ hash }).lean<IImage & { _id: unknown }>();
  if (existing) return existing;

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const relDir = path.posix.join("uploads", yyyy, mm);
  const storedRel = path.posix.join(relDir, `${hash}.${ext}`);
  const thumbRel = path.posix.join(relDir, `${hash}_thumb.webp`);

  const absDir = resolveDiskPath(relDir);
  await mkdir(absDir, { recursive: true });

  await writeFile(resolveDiskPath(storedRel), buffer);
  await sharp(buffer)
    .rotate()
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(resolveDiskPath(thumbRel));

  const created = await Image.create({
    hash,
    ext,
    mime,
    size: buffer.byteLength,
    width: meta.width,
    height: meta.height,
    originalName: originalName || "",
    storedPath: storedRel,
    thumbPath: thumbRel,
  });

  return created.toObject() as IImage & { _id: unknown };
}

export async function deleteImage(doc: IImage): Promise<void> {
  for (const rel of [doc.storedPath, doc.thumbPath]) {
    try {
      await unlink(resolveDiskPath(rel));
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== "ENOENT") throw err;
    }
  }
}

export async function readStored(rel: string): Promise<Buffer> {
  return await readFile(resolveDiskPath(rel));
}
