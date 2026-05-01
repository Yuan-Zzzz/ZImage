"use client";

import { useEffect, useState } from "react";
import Win95Button from "@/components/win95/Win95Button";
import ImageCard from "./ImageCard";

export interface ImageItem {
  _id: string;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  originalName: string;
  storedPath: string;
  thumbPath: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initial: ImageItem[];
  initialTotal: number;
  pageSize: number;
}

export default function ImageGrid({ initial, initialTotal, pageSize }: Props) {
  const [items, setItems] = useState<ImageItem[]>(initial);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onUploaded(e: Event) {
      const detail = (e as CustomEvent<ImageItem>).detail;
      if (!detail) return;
      setItems((prev) => {
        if (prev.find((p) => p._id === detail._id)) return prev;
        return [detail, ...prev];
      });
      setTotal((t) => t + 1);
    }
    window.addEventListener("zimages:uploaded", onUploaded as EventListener);
    return () =>
      window.removeEventListener("zimages:uploaded", onUploaded as EventListener);
  }, []);

  async function loadPage(target: number) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/images?page=${target}&pageSize=${pageSize}`
      );
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setTotal(json.data.total);
        setPage(target);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((it) => it._id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3 font-sans text-sm">
      {items.length === 0 ? (
        <div className="win95-inset bg-win95-panel p-4 text-center text-xs">
          No images yet. Upload above to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it) => (
            <ImageCard key={it._id} item={it} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-2 text-xs font-mono">
        <span>
          {total} image{total === 1 ? "" : "s"} · page {page}/{totalPages}
        </span>
        <div className="flex gap-1">
          <Win95Button
            onClick={() => loadPage(page - 1)}
            disabled={loading || page <= 1}
          >
            ← Prev
          </Win95Button>
          <Win95Button
            onClick={() => loadPage(page + 1)}
            disabled={loading || page >= totalPages}
          >
            Next →
          </Win95Button>
        </div>
      </div>
    </div>
  );
}
