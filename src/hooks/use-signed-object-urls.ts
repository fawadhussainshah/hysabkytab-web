"use client";

import { useEffect, useState } from "react";
import { uploadsApi } from "@/lib/api/uploads.api";

export function useSignedObjectUrls(objectKeys: string[]) {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!objectKeys.length) {
      setUrls([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all(objectKeys.map((key) => uploadsApi.getGetPresignedUrl(key).then((r) => r.url)))
      .then((next) => {
        if (!cancelled) setUrls(next);
      })
      .catch(() => {
        if (!cancelled) {
          setUrls([]);
          setError("Could not load images. Check storage configuration or try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [objectKeys.join("|")]);

  return { urls, loading, error };
}
