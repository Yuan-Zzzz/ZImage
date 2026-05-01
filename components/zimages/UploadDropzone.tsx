"use client";

import { useEffect, useRef, useState } from "react";
import Win95Button from "@/components/win95/Win95Button";

interface QueueItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

function uniqueId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function uploadOne(file: File, onProgress: (p: number) => void): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("files", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/images");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (!json.success) return reject(new Error(json.error || "Upload failed"));
        const errs = json.data?.errors;
        if (Array.isArray(errs) && errs.length > 0) {
          return reject(new Error(errs[0].error || "Upload rejected"));
        }
        const uploaded = json.data?.uploaded;
        if (!Array.isArray(uploaded) || uploaded.length === 0) {
          return reject(new Error("No upload result"));
        }
        resolve(uploaded[0]);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Bad response"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export default function UploadDropzone() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function enqueue(files: File[]) {
    const accepted = files.filter((f) => ALLOWED.has(f.type));
    const rejected = files.filter((f) => !ALLOWED.has(f.type));

    const items: QueueItem[] = accepted.map((file) => ({
      id: uniqueId(),
      file,
      status: "pending",
      progress: 0,
    }));
    setQueue((q) => [...items, ...q]);

    if (rejected.length > 0) {
      const names = rejected.map((f) => f.name || "(unnamed)").join(", ");
      console.warn(`Skipped non-image files: ${names}`);
    }

    items.forEach((item) => {
      setQueue((q) =>
        q.map((it) =>
          it.id === item.id ? { ...it, status: "uploading" } : it
        )
      );
      uploadOne(item.file, (p) =>
        setQueue((q) =>
          q.map((it) => (it.id === item.id ? { ...it, progress: p } : it))
        )
      )
        .then((result) => {
          setQueue((q) =>
            q.map((it) =>
              it.id === item.id
                ? { ...it, status: "done", progress: 1 }
                : it
            )
          );
          window.dispatchEvent(
            new CustomEvent("zimages:uploaded", { detail: result })
          );
        })
        .catch((err: Error) => {
          setQueue((q) =>
            q.map((it) =>
              it.id === item.id
                ? { ...it, status: "error", error: err.message }
                : it
            )
          );
        });
    });
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === "file") {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        enqueue(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  function clearDone() {
    setQueue((q) => q.filter((it) => it.status !== "done"));
  }

  return (
    <div className="space-y-3 font-sans text-sm">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0) enqueue(files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`${dragOver ? "win95-outset" : "win95-inset"} bg-win95-panel cursor-pointer p-6 text-center`}
      >
        <p className="font-bold">Drop images here</p>
        <p className="text-xs text-win95-darkgray">
          or click to browse · paste from clipboard supported
        </p>
        <p className="text-xs text-win95-darkgray mt-1">
          jpg / png / webp / gif / avif · max 20 MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={Array.from(ALLOWED).join(",")}
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) enqueue(files);
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <div className="win95-inset bg-win95-white p-2 space-y-1 max-h-48 overflow-auto">
          {queue.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between gap-2 text-xs font-mono"
            >
              <span className="truncate flex-1">{it.file.name}</span>
              {it.status === "uploading" && (
                <span>{Math.round(it.progress * 100)}%</span>
              )}
              {it.status === "done" && (
                <span className="text-win95-darkgreen">✓ done</span>
              )}
              {it.status === "error" && (
                <span className="text-win95-red" title={it.error}>
                  ✗ {it.error}
                </span>
              )}
              {it.status === "pending" && <span>queued</span>}
            </div>
          ))}
          <div className="flex justify-end pt-1">
            <Win95Button onClick={clearDone}>Clear done</Win95Button>
          </div>
        </div>
      )}
    </div>
  );
}
