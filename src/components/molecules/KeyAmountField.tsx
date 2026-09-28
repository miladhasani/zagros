"use client";

import { Button, Icon, Input, MoneyInput } from "@/components/atoms";
import { formatMoneyInput } from "@/lib/format";
import { useState } from "react";

export type KeyAmountRow = { label: string; amount: string };

export function KeyAmountField({
  labelName,
  amountName,
  defaultValue = [],
  addLabel = "افزودن",
  emptyLabel = "موردی ثبت نشده",
  labelPlaceholder = "عنوان",
  amountPlaceholder = "مبلغ",
  onChange,
}: {
  labelName: string;
  amountName: string;
  defaultValue?: KeyAmountRow[];
  addLabel?: string;
  emptyLabel?: string;
  labelPlaceholder?: string;
  amountPlaceholder?: string;
  onChange?: (rows: KeyAmountRow[]) => void;
}) {
  const [rows, setRows] = useState<KeyAmountRow[]>(() =>
    defaultValue.map((row) => ({ ...row, amount: formatMoneyInput(row.amount) })),
  );
  const [draftLabel, setDraftLabel] = useState("");
  const [draftAmount, setDraftAmount] = useState("");

  function emit(next: KeyAmountRow[]) {
    setRows(next);
    onChange?.(next);
  }

  function add() {
    const label = draftLabel.trim();
    if (!label) return;
    emit([...rows, { label, amount: formatMoneyInput(draftAmount) || "0" }]);
    setDraftLabel("");
    setDraftAmount("");
  }

  return (
    <div className="grid gap-2">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`}>
          <input type="hidden" name={labelName} value={row.label} />
          <input type="hidden" name={amountName} value={row.amount} />
        </div>
      ))}
      {rows.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-border bg-surface-muted px-3 py-2 text-xs text-ink-faint">
          {emptyLabel}
        </p>
      ) : (
        <ul className="grid gap-1.5">
          {rows.map((row, index) => (
            <li
              key={`${row.label}-${index}`}
              className="flex min-h-[var(--touch)] items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{row.label}</span>
              <span className="shrink-0 text-sm tabular-nums text-ink-muted" dir="ltr">
                {formatMoneyInput(row.amount)}
              </span>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full text-ink-faint hover:bg-danger-soft hover:text-danger"
                aria-label={`حذف ${row.label}`}
                onClick={() => emit(rows.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Icon name="close" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-stretch gap-2">
        <Input
          value={draftLabel}
          onChange={(event) => setDraftLabel(event.target.value)}
          placeholder={labelPlaceholder}
          className="min-w-[10rem] flex-1"
        />
        <MoneyInput
          value={draftAmount}
          onChange={(event) => setDraftAmount(event.target.value)}
          placeholder={amountPlaceholder}
          className="w-40"
        />
        <Button type="button" variant="secondary" onClick={add} className="shrink-0">
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
