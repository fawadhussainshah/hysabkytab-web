"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import dayjs from "dayjs";
import { MaterialIcon } from "@/components/material-icon";
import { backupApi } from "@/lib/api/backup.api";

const size = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Back up to Google Drive now, switch the daily backup on or off, and see recent runs. */
export function BackupCard() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["backup"], queryFn: backupApi.status });
  const run = useMutation({
    mutationFn: backupApi.run,
    onSettled: () => qc.invalidateQueries({ queryKey: ["backup"] }),
  });
  const daily = useMutation({
    mutationFn: backupApi.setDaily,
    onSuccess: (d) => qc.setQueryData(["backup"], d),
  });

  const last = data?.lastSuccess;
  const failed = data?.recent?.[0]?.status === "failed" ? data.recent[0] : null;
  const runError = run.isError
    ? isAxiosError(run.error) && run.error.response?.data?.message
      ? String(run.error.response.data.message)
      : "Could not reach the server. Try again."
    : null;

  return (
    <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-on-surface">
        <MaterialIcon name="cloud_upload" /> Backup to Google Drive
      </h3>
      <p className="mb-5 text-sm text-on-surface-variant">
        Saves a complete copy of your accounts, categories, transactions, budgets and goals, plus a spreadsheet-ready list of
        transactions, to your Google Drive.
      </p>

      {isLoading && <p className="text-sm text-on-surface-variant">Loading…</p>}
      {isError && <p className="text-sm font-medium text-error">Could not load backup status.</p>}
      {data && !data.configured && (
        <p className="text-sm text-on-surface-variant">Google Drive access is not set up on the server, so backups are unavailable right now.</p>
      )}

      {data?.configured && (
        <>
          <div className="mb-4 rounded-xl bg-surface-container-low p-4">
            <p className="text-sm font-bold text-on-surface">
              {last ? `Last backup: ${dayjs(last.createdAt).format("ddd, MMM D · h:mm A")}` : "No backup yet"}
              {last && <span className="font-medium text-on-surface-variant"> ({last.trigger === "daily" ? "automatic" : "manual"})</span>}
            </p>
            {last && (
              <p className="mt-1 text-xs text-on-surface-variant">
                {last.counts?.transactions ?? 0} transactions · {last.counts?.accounts ?? 0} accounts · {size(last.bytes)}
                {last.driveLink && (
                  <>
                    {" · "}
                    <a href={last.driveLink} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
                      Open in Google Drive
                    </a>
                  </>
                )}
              </p>
            )}
            {failed && (
              <p className="mt-2 text-xs font-medium text-error">
                Last attempt failed ({dayjs(failed.createdAt).format("MMM D, h:mm A")}): {failed.error}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={run.isPending}
              onClick={() => run.mutate()}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary disabled:opacity-60"
            >
              {run.isPending ? "Backing up…" : "Back up now"}
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-on-surface">
              <input
                type="checkbox"
                checked={data.dailyEnabled}
                disabled={daily.isPending}
                onChange={(e) => daily.mutate(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Back up every day (after 3 AM)
            </label>
          </div>
          {runError && <p className="mt-3 text-sm font-medium text-error">{runError}</p>}
          {run.isSuccess && !runError && <p className="mt-3 text-sm font-medium text-secondary">Backed up to Google Drive.</p>}
          <p className="mt-3 text-xs text-on-surface-variant">
            Stored in the “{data.folder}” folder. The last 35 days are kept.
          </p>

          {data.recent.length > 0 && (
            <ul className="mt-4 divide-y divide-outline-variant/10 text-sm">
              {data.recent.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex items-center gap-2 text-on-surface">
                    <MaterialIcon name={r.status === "success" ? "check_circle" : "error_outline"} className={r.status === "success" ? "text-secondary" : "text-error"} />
                    {dayjs(r.createdAt).format("MMM D, h:mm A")} · {r.trigger === "daily" ? "automatic" : "manual"}
                  </span>
                  <span className="text-xs text-on-surface-variant">{r.status === "success" ? size(r.bytes) : "failed"}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
