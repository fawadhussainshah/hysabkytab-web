"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { categoriesApi } from "@/lib/api/categories.api";
import type { CategoryType } from "@/lib/types/category.types";

const TYPES: CategoryType[] = ["expense", "income", "both"];

const PRESET_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#52B788",
  "#F4A261",
  "#9B72CF",
];

const SUGGESTIONS: Array<{ name: string; type: CategoryType; color: string }> = [
  { name: "Parking & Tolls", type: "expense", color: "#5499C7" },
  { name: "Hobbies & Sports", type: "expense", color: "#48C9B0" },
  { name: "Streaming & Media", type: "expense", color: "#AF7AC5" },
  { name: "Medical (out of pocket)", type: "expense", color: "#FF8B94" },
  { name: "Loan repayment", type: "expense", color: "#85929E" },
  { name: "Household supplies", type: "expense", color: "#73C6B6" },
  { name: "Tips & gratuities", type: "expense", color: "#E59866" },
  { name: "Side project", type: "income", color: "#76D7C4" },
  { name: "Gift money received", type: "income", color: "#F1948A" },
  { name: "Reimbursements", type: "both", color: "#AEB6BF" },
];

export default function NewCategoryPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("expense");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => categoriesApi.create({ name: name.trim(), type, color }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
      router.push("/categories");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Enter a category name.");
      return;
    }
    mut.mutate();
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/categories" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
        <MaterialIcon name="arrow_back" /> Back
      </Link>
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
        <h2 className="mb-2 text-2xl font-black text-on-surface">New category</h2>
        <p className="mb-6 text-sm text-on-surface-variant">
          Custom categories are private to your account. Tap a suggestion to fill the form.
        </p>

        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-on-surface-variant">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.name}
                type="button"
                className="rounded-full border-2 px-3 py-1.5 text-left text-xs font-semibold text-on-surface transition hover:bg-surface-container-low"
                style={{ borderColor: s.color }}
                onClick={() => {
                  setName(s.name);
                  setType(s.type);
                  setColor(s.color);
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
            {error}
          </p>
        )}

        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
              placeholder="e.g. Petrol"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CategoryType)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Color</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-surface-container-lowest transition ${
                    color === c ? "ring-primary" : "ring-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={mut.isPending}
            className="w-full rounded-xl bg-primary py-3 font-bold text-on-primary disabled:opacity-60"
          >
            {mut.isPending ? "Saving…" : "Create category"}
          </button>
        </form>
      </div>
    </div>
  );
}
