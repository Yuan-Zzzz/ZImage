import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Image from "@/models/Image";
import { saveUpload, ALLOWED_MIMES, MAX_UPLOAD_BYTES } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === "admin";
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || 30))
  );

  const total = await Image.countDocuments();
  const items = await Image.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return NextResponse.json({
    success: true,
    data: {
      items: JSON.parse(JSON.stringify(items)),
      total,
      page,
      pageSize,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  try {
    const form = await request.formData();
    const files = form.getAll("files").filter(
      (v): v is File => v instanceof File
    );

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided (use form field 'files')" },
        { status: 400 }
      );
    }

    const uploaded: unknown[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const file of files) {
      try {
        if (!ALLOWED_MIMES.has(file.type)) {
          throw new Error(
            `Disallowed type ${file.type || "unknown"} (allowed: jpeg, png, webp, gif, avif)`
          );
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          throw new Error(
            `File too large: ${file.size} bytes (max ${MAX_UPLOAD_BYTES})`
          );
        }
        const buf = Buffer.from(await file.arrayBuffer());
        const doc = await saveUpload(buf, file.name || "");
        uploaded.push(JSON.parse(JSON.stringify(doc)));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        errors.push({ name: file.name || "(unknown)", error: message });
      }
    }

    return NextResponse.json({
      success: true,
      data: { uploaded, errors },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
