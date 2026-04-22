"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { MaterialIcon } from "@/components/material-icon";
import { categoriesApi } from "@/lib/api/categories.api";
import type { CategoryType } from "@/lib/types/category.types";

function typeLabel(t: CategoryType) {
  if (t === "expense") return "Expense";
  if (t === "income") return "Income";
  return "Both";
}

export default function CategoriesPage() {
  const qc = useQueryClient();

  const { data: categories, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const systemCats = (categories ?? []).filter((c) => c.isSystem);
  const customCats = (categories ?? []).filter((c) => !c.isSystem);

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Categories</h2>
          <p className="mt-1 text-on-surface-variant">
            Built-in labels for everyone, plus your own custom categories.
          </p>
        </div>
        <Link
          href="/categories/new"
          className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-lg"
        >
          New category
        </Link>
      </div>

      {isLoading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : isError ? (
        <p className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
          Could not load categories.{" "}
          <button type="button" className="font-bold underline" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      ) : (
        <div className="space-y-10">
          <section>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Built-in
            </h3>
            <p className="mb-4 text-sm text-on-surface-variant">
              Use these when recording transactions — they are shared and cannot be edited or deleted.
            </p>
            {systemCats.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                No built-in categories returned. Restart the API so defaults can sync.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {systemCats.map((c) => (
                  <div
                    key={c.id}
                    className="inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-on-surface shadow-sm ring-1 ring-outline-variant/15"
                    style={{
                      backgroundColor: c.color ? `${c.color}22` : "var(--color-surface-container-high)",
                    }}
                  >
                    {c.icon ? (
                      <MaterialIcon name={c.icon as string} className="text-lg text-primary" />
                    ) : null}
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-black uppercase text-on-surface-variant">
                      {typeLabel(c.type)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Your categories
            </h3>
            {customCats.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-lowest/80 p-10 text-center">
                <MaterialIcon name="sell" className="mx-auto mb-3 text-4xl text-on-surface-variant/50" />
                <p className="font-bold text-on-surface">No custom categories yet</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Add tags for spending patterns that matter to you.
                </p>
                <Link
                  href="/categories/new"
                  className="mt-6 inline-flex rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary"
                >
                  Create one
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {customCats.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color || "var(--color-primary)" }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface">{c.name}</p>
                        <p className="text-xs text-on-surface-variant">{typeLabel(c.type)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-xs font-bold text-error hover:underline"
                      onClick={() => {
                        if (confirm(`Delete category “${c.name}”?`)) removeMut.mutate(c.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {isFetching && !isLoading ? (
            <p className="text-xs text-on-surface-variant">Refreshing…</p>
          ) : null}
        </div>
      )}
    </>
  );
}
