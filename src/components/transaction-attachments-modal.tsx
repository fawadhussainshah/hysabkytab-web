"use client";

import { useCallback, useEffect, useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { useSignedObjectUrls } from "@/hooks/use-signed-object-urls";

type Props = {
  open: boolean;
  onClose: () => void;
  objectKeys: string[];
  title?: string;
};

export function TransactionAttachmentsModal({ open, onClose, objectKeys, title }: Props) {
  const { urls, loading, error } = useSignedObjectUrls(open ? objectKeys : []);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setLightbox(null);
  }, [open]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox) setLightbox(null);
        else onClose();
      }
    },
    [lightbox, onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-[70] max-h-[85vh] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/10 px-5 py-4">
          <h3 className="text-lg font-bold text-on-surface">{title ?? "Attachments"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low"
            aria-label="Close dialog"
          >
            <MaterialIcon name="close" />
          </button>
        </div>
        <div className="max-h-[calc(85vh-4rem)] overflow-y-auto p-5">
          {loading ? (
            <p className="text-center text-sm text-on-surface-variant">Loading images…</p>
          ) : error ? (
            <p className="rounded-lg bg-error-container px-4 py-3 text-center text-sm text-on-error-container">
              {error}
            </p>
          ) : urls.length === 0 ? (
            <p className="text-center text-sm text-on-surface-variant">No images to show.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {urls.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  className="group relative overflow-hidden rounded-xl ring-1 ring-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  onClick={() => setLightbox(src)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="aspect-square w-full object-cover transition group-hover:opacity-95"
                    referrerPolicy="no-referrer"
                  />
                  <span className="sr-only">View image {i + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
          aria-label="Close full image"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
          <p className="mt-4 text-xs font-medium text-white/70">Click anywhere to close</p>
        </button>
      ) : null}
    </>
  );
}
