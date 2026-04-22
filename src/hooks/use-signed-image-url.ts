"use client";

import { useEffect, useState } from "react";
import { uploadsApi } from "@/lib/api/uploads.api";
import { needsSignedUrl } from "@/lib/utils/media-url";

export type SignedImageUrlState = {
  url: string;
  loading: boolean;
  error: boolean;
};

export function useSignedImageUrl(stored: string | null | undefined): SignedImageUrlState {
  const [state, setState] = useState<SignedImageUrlState>({ url: "", loading: false, error: false });

  useEffect(() => {
    let cancelled = false;
    const raw = stored?.trim();
    if (!raw) {
      setState({ url: "", loading: false, error: false });
      return;
    }
    if (!needsSignedUrl(raw)) {
      setState({ url: raw, loading: false, error: false });
      return;
    }
    setState({ url: "", loading: true, error: false });
    uploadsApi
      .getGetPresignedUrl(raw)
      .then((r) => {
        const u = r?.url?.trim();
        if (cancelled) return;
        if (u) setState({ url: u, loading: false, error: false });
        else setState({ url: "", loading: false, error: true });
      })
      .catch(() => {
        if (!cancelled) setState({ url: "", loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [stored]);

  return state;
}
