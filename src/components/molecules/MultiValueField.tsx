"use client";

import { Button, Icon, Input } from "@/components/atoms";
import { useId, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from "react";

export type MultiValueFieldProps = {
  name: string;
  defaultValue?: string[];
  placeholder?: string;
  addLabel?: string;
  emptyLabel?: string;
  duplicateLabel?: string;
  invalidLabel?: string;
  dir?: "ltr" | "rtl";
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  normalize?: (value: string) => string;
  formatInput?: (value: string) => string;
  formatValue?: (value: string) => string;
  id?: string;
};

function defaultNormalize(value: string) {
  return value.trim();
}

export function MultiValueField({
  name,
  defaultValue = [],
  placeholder = "مقدار جدید",
  addLabel = "افزودن",
  emptyLabel = "موردی ثبت نشده",
  duplicateLabel = "این مورد از قبل هست",
  invalidLabel = "مقدار نامعتبر است",
  dir = "rtl",
  inputMode,
  maxLength,
  normalize = defaultNormalize,
  formatInput,
  formatValue,
  id,
}: MultiValueFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState(() => unique(defaultValue.map(normalize).filter(Boolean)));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pendingDraft = normalize(draft);

  function add() {
    if (!draft.trim()) {
      setError(null);
      return;
    }
    const next = normalize(draft);
    if (!next) {
      setError(invalidLabel);
      return;
    }
    if (values.includes(next)) {
      setError(duplicateLabel);
      return;
    }
    setValues((current) => [...current, next]);
    setDraft("");
    setError(null);
    inputRef.current?.focus();
  }

  function remove(value: string) {
    setValues((current) => current.filter((item) => item !== value));
    setError(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopPropagation();
    add();
  }

  return (
    <div className="grid gap-2">
      {values.map((item) => (
        <input key={item} type="hidden" name={name} value={item} />
      ))}
      {pendingDraft && !values.includes(pendingDraft) ? (
        <input type="hidden" name={name} value={pendingDraft} />
      ) : null}
      {values.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-border bg-surface-muted px-3 py-2 text-xs text-ink-faint">
          {emptyLabel}
        </p>
      ) : (
        <ul className="grid gap-1.5">
          {values.map((item) => (
            <li
              key={item}
              className="flex min-h-[var(--touch)] items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-ink" dir={dir}>
                {formatValue ? formatValue(item) : item}
              </span>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full text-ink-faint hover:bg-danger-soft hover:text-danger"
                aria-label={`حذف ${item}`}
                onClick={() => remove(item)}
              >
                <Icon name="close" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-stretch gap-2">
        <Input
          ref={inputRef}
          id={inputId}
          value={draft}
          onChange={(event) => {
            setDraft(formatInput ? formatInput(event.target.value) : event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          dir={dir}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete="off"
          className="min-w-[12rem] flex-1"
        />
        <Button type="button" variant="secondary" onClick={add} className="shrink-0">
          {addLabel}
        </Button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

function unique(values: string[]) {
  return [...new Set(values)];
}
