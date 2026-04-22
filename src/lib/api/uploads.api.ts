import { authStorage } from "../auth-storage";
import { API_BASE_URL, apiClient, extractData } from "./client";

export type UploadPurpose = "receipt" | "avatar";

export const uploadsApi = {
  /**
   * Upload via API (same origin) so the browser never needs S3 CORS for PUT.
   */
  uploadDirect: async (blob: Blob, fileName: string, uploadPurpose: UploadPurpose) => {
    const fd = new FormData();
    fd.append("file", blob, fileName);
    fd.append("purpose", uploadPurpose);
    const token = authStorage.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/uploads/direct`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const json = (await res.json()) as {
      success?: boolean;
      data?: { objectKey: string };
      message?: string | string[];
    };
    if (!res.ok) {
      const m = json.message;
      const msg = Array.isArray(m) ? m.join(". ") : m;
      throw new Error(msg || `Upload failed (${res.status})`);
    }
    const objectKey = json.data?.objectKey;
    if (!objectKey) throw new Error("Invalid upload response");
    return { objectKey };
  },

  getPutPresignedUrl: (
    fileName: string,
    contentType: string,
    uploadPurpose: UploadPurpose = "receipt",
  ) =>
    apiClient
      .post<{ data: { uploadUrl: string; objectKey: string; expiresIn: number } }>(
        "/uploads/presigned-url",
        { fileName, contentType, method: "PUT", uploadPurpose },
      )
      .then(extractData),

  getGetPresignedUrl: (objectKey: string) =>
    apiClient
      .post<{ data: { url: string; expiresIn: number } }>("/uploads/presigned-url", {
        method: "GET",
        objectKey,
      })
      .then(extractData),

  uploadToS3: async (uploadUrl: string, body: Blob, contentType: string) => {
    let res: Response;
    try {
      res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body,
      });
    } catch (e) {
      const hint =
        e instanceof TypeError
          ? " Could not reach storage (check network or S3 bucket CORS for browser uploads)."
          : "";
      throw new Error(`Upload to storage failed.${hint}`);
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Upload to storage failed (${res.status} ${res.statusText})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      );
    }
  },
};
