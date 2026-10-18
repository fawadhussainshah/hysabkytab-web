import type { Transaction } from "@/lib/types/transaction.types";

const TAGS = {
  sms: { label: "SMS", cls: "bg-tertiary/10 text-tertiary" },
  hadi: { label: "Hadi", cls: "bg-secondary/10 text-secondary" },
  manual: { label: "Manual", cls: "bg-surface-container-high text-on-surface-variant" },
} as const;

/** Where an entry came from: bank SMS captured by Hadi, a chat with Hadi, or typed in the app. */
export function SourceTag({ source }: { source?: Transaction["source"] }) {
  const tag = TAGS[source ?? "manual"] ?? TAGS.manual;
  return (
    <span className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${tag.cls}`}>
      {tag.label}
    </span>
  );
}
