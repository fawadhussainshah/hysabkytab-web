"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PendingImagePreview = {
  id: string;
  file: File;
  url: string;
};

function nextId(file: File) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Local file picks with stable object URLs. Revokes URLs on remove, clear, and unmount
 * so thumbnails stay valid (avoids useMemo + effect churn revoking URLs too early).
 */
export function usePendingImagePreviews() {
  const [previews, setPreviews] = useState<PendingImagePreview[]>([]);
  const previewsRef = useRef<PendingImagePreview[]>([]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  const appendFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const additions: PendingImagePreview[] = Array.from(files, (file) => ({
      id: nextId(file),
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...additions]);
  }, []);

  const removeById = useCallback((id: string) => {
    setPreviews((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
  }, []);

  return { previews, appendFiles, removeById, clear };
}
