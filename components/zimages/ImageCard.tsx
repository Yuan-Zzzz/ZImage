"use client";

import Win95Button from "@/components/win95/Win95Button";
import type { ImageItem } from "./ImageGrid";

interface Props {
  item: ImageItem;
  onDeleted: (id: string) => void;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

export default function ImageCard({ item, onDeleted }: Props) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/i/${item.hash}.${item.ext}`
      : `/i/${item.hash}.${item.ext}`;
  const thumbUrl = `/i/${item.hash}_thumb.webp`;

  async function handleDelete() {
    if (!confirm(`Delete ${item.originalName || item.hash}?`)) return;
    const res = await fetch(`/api/images/${item._id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!json?.success) {
      alert(json?.error || "Delete failed");
      return;
    }
    onDeleted(item._id);
  }

  return (
    <div className="win95-outset bg-win95-bg p-2 space-y-2">
      <div className="win95-inset bg-win95-white aspect-square overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl}
          alt={item.originalName || item.hash}
          className="max-h-full max-w-full"
        />
      </div>
      <div className="text-xs font-mono space-y-0.5">
        <div className="truncate" title={item.originalName}>
          {item.originalName || `${item.hash.slice(0, 8)}.${item.ext}`}
        </div>
        <div className="text-win95-darkgray">
          {item.width}×{item.height} · {fmtBytes(item.size)} · {item.ext}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Win95Button
          onClick={() =>
            copy(`![${item.originalName || ""}](${url})`)
          }
        >
          Copy MD
        </Win95Button>
        <Win95Button onClick={() => copy(url)}>Copy URL</Win95Button>
        <Win95Button
          onClick={() =>
            copy(
              `<img src="${url}" width="${item.width}" height="${item.height}" alt="${item.originalName || ""}">`
            )
          }
        >
          Copy HTML
        </Win95Button>
        <Win95Button variant="danger" onClick={handleDelete}>
          Delete
        </Win95Button>
      </div>
    </div>
  );
}
