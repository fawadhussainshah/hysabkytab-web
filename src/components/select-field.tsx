"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MaterialIcon } from "@/components/material-icon";

export interface SelectOption {
  value: string;
  label: string;
}

/** Above this many options the dropdown gets a search box. */
const TYPEAHEAD_THRESHOLD = 10;

/**
 * A dropdown that stays a plain native <select> for short lists and becomes a searchable
 * typeahead list for long ones (accounts, categories, countries…). `className` styles the field itself.
 */
export function SelectField({
  value,
  onChange,
  options,
  className = "",
  required,
  id,
  ariaLabel,
  searchPlaceholder = "Type to search…",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  required?: boolean;
  id?: string;
  ariaLabel?: string;
  searchPlaceholder?: string;
}) {
  if (options.length <= TYPEAHEAD_THRESHOLD) {
    return (
      <select
        id={id}
        aria-label={ariaLabel}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <Typeahead
      value={value}
      onChange={onChange}
      options={options}
      className={className}
      required={required}
      id={id}
      ariaLabel={ariaLabel}
      searchPlaceholder={searchPlaceholder}
    />
  );
}

function Typeahead({
  value,
  onChange,
  options,
  className,
  required,
  id,
  ariaLabel,
  searchPlaceholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className: string;
  required?: boolean;
  id?: string;
  ariaLabel?: string;
  searchPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [alignRight, setAlignRight] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const openList = () => {
    // Open towards whichever side has room, so the list never runs off the screen.
    const r = root.current?.getBoundingClientRect();
    if (r) setAlignRight(r.left + 288 > window.innerWidth - 8 && r.right - 288 >= 8);
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const choose = (o: SelectOption) => {
    onChange(o.value);
    setOpen(false);
  };

  return (
    <div ref={root} className="relative min-w-0">
      {required && (
        // Lets the browser's own "required" validation work for a custom control.
        <input tabIndex={-1} aria-hidden required value={value} onChange={() => undefined} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />
      )}
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        className={`flex items-center justify-between gap-2 text-left ${className}`}
      >
        <span className="min-w-0 truncate">{selected?.label ?? ""}</span>
        <MaterialIcon name="chevron_right" className="shrink-0 rotate-90 text-base text-on-surface-variant" />
      </button>
      {open && (
        <div
          className={`absolute top-full z-30 mt-1 w-max min-w-full max-w-[min(18rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-outline-variant/20 bg-white shadow-xl ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(shown.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (shown[active]) choose(shown[active]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
            placeholder={searchPlaceholder}
            aria-label="Search options"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            className="w-full min-w-[14rem] border-b border-outline-variant/15 bg-surface-container-low px-3 py-2.5 text-sm outline-none"
          />
          <ul ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {shown.length === 0 && <li className="px-3 py-2 text-sm text-on-surface-variant">No matches</li>}
            {shown.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
                className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-surface-container-low" : ""} ${
                  o.value === value ? "font-bold text-primary" : "text-on-surface"
                }`}
              >
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
