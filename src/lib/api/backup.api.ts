import { apiClient, extractData } from "./client";

export interface BackupRun {
  id: string;
  trigger: "manual" | "daily";
  status: "success" | "failed";
  fileName: string | null;
  driveLink: string | null;
  bytes: number;
  counts: Record<string, number> | null;
  error: string | null;
  createdAt: string;
}

export interface BackupStatus {
  configured: boolean;
  dailyEnabled: boolean;
  folder: string;
  lastSuccess: BackupRun | null;
  recent: BackupRun[];
}

export const backupApi = {
  status: () => apiClient.get<{ data: BackupStatus }>("/backup").then(extractData),
  /** Backs up to Google Drive now; can take a few seconds. */
  run: () => apiClient.post<{ data: BackupStatus }>("/backup/run", {}, { timeout: 120000 }).then(extractData),
  setDaily: (dailyEnabled: boolean) =>
    apiClient.patch<{ data: BackupStatus }>("/backup/settings", { dailyEnabled }).then(extractData),
};
