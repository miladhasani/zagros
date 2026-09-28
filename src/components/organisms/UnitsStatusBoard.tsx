"use client";

import { Button, DateSpan, Icon } from "@/components/atoms";
import { faDigits, faMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useEffect, useMemo, useRef, useState } from "react";

export type UnitStatusRow = {
  id: string;
  number: string;
  floor: number | null;
  area: string | null;
  residents: number;
  owners: string;
  tenants: string;
  parking: number;
  storage: number;
  amenities: string;
  phones: string;
  notes: string | null;
  chargeOps: number;
  payOps: number;
  remainingOps: number;
  chargeRes: number;
  payRes: number;
  remainingRes: number;
  remaining: number;
  lastPaidAt: string | null;
  electricity: string | null;
  gas: string | null;
  water: string | null;
  propertyId: string | null;
  postalCode: string | null;
};

type ColumnKey = keyof Omit<UnitStatusRow, "id">;

type Column = {
  key: ColumnKey;
  header: string;
  numeric?: boolean;
  locked?: boolean;
  defaultVisible?: boolean;
  reserve?: boolean;
  money?: boolean;
};

const COLUMNS: Column[] = [
  { key: "number", header: "واحد", locked: true, defaultVisible: true },
  { key: "floor", header: "طبقه", defaultVisible: false },
  { key: "area", header: "متراژ", numeric: true, defaultVisible: false },
  { key: "owners", header: "مالک", defaultVisible: true },
  { key: "tenants", header: "مستاجر", defaultVisible: true },
  { key: "residents", header: "نفرات ساکن", defaultVisible: true },
  { key: "parking", header: "پارکینگ", defaultVisible: false },
  { key: "storage", header: "انباری", defaultVisible: false },
  { key: "amenities", header: "امکانات اضافه", defaultVisible: false },
  { key: "phones", header: "تلفن", defaultVisible: false },
  { key: "chargeOps", header: "شارژ صادرشده", numeric: true, money: true, defaultVisible: true },
  { key: "payOps", header: "واریزی شارژ", numeric: true, money: true, defaultVisible: true },
  { key: "remainingOps", header: "مانده شارژ", numeric: true, money: true, defaultVisible: true },
  { key: "chargeRes", header: "صندوق صادرشده", numeric: true, money: true, reserve: true, defaultVisible: false },
  { key: "payRes", header: "واریزی صندوق", numeric: true, money: true, reserve: true, defaultVisible: false },
  { key: "remainingRes", header: "مانده صندوق", numeric: true, money: true, reserve: true, defaultVisible: true },
  { key: "remaining", header: "مانده کل", numeric: true, money: true, defaultVisible: true },
  { key: "lastPaidAt", header: "آخرین واریز", defaultVisible: false },
  { key: "electricity", header: "شناسه برق", defaultVisible: false },
  { key: "gas", header: "شناسه گاز", defaultVisible: false },
  { key: "water", header: "شناسه آب", defaultVisible: false },
  { key: "propertyId", header: "شناسه ملک", defaultVisible: false },
  { key: "postalCode", header: "کد پستی", defaultVisible: false },
  { key: "notes", header: "یادداشت", defaultVisible: false },
];

const STORAGE_KEY = "zagros.unit-status.columns.v1";

function defaultKeys(columns: Column[]) {
  return columns.filter((column) => column.locked || column.defaultVisible).map((column) => column.key);
}

function moneyTone(value: number) {
  if (value > 0) return "text-danger";
  if (value < 0) return "text-success";
  return "text-ink-muted";
}

export function UnitsStatusBoard({
  rows,
  currency,
  buildingName,
  printedAt,
  canSeeReserve,
}: {
  rows: UnitStatusRow[];
  currency: string;
  buildingName: string;
  printedAt: string;
  canSeeReserve: boolean;
}) {
  const catalog = useMemo(
    () => COLUMNS.filter((column) => canSeeReserve || !column.reserve),
    [canSeeReserve],
  );
  const [visible, setVisible] = useState<ColumnKey[]>(() => defaultKeys(catalog));
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as string[];
      const allowed = new Set(catalog.map((column) => column.key));
      const next = stored.filter((key): key is ColumnKey => allowed.has(key as ColumnKey));
      if (!next.includes("number")) next.unshift("number");
      if (next.length) setVisible(next);
    } catch {
      /* keep defaults */
    }
  }, [catalog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visible));
  }, [visible]);

  useEffect(() => {
    if (!pickerOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [pickerOpen]);

  const active = catalog.filter((column) => visible.includes(column.key));

  function toggle(key: ColumnKey) {
    const column = catalog.find((item) => item.key === key);
    if (!column || column.locked) return;
    setVisible((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  const totals = rows.reduce(
    (sum, row) => ({
      chargeOps: sum.chargeOps + row.chargeOps,
      payOps: sum.payOps + row.payOps,
      remainingOps: sum.remainingOps + row.remainingOps,
      chargeRes: sum.chargeRes + row.chargeRes,
      payRes: sum.payRes + row.payRes,
      remainingRes: sum.remainingRes + row.remainingRes,
      remaining: sum.remaining + row.remaining,
    }),
    {
      chargeOps: 0,
      payOps: 0,
      remainingOps: 0,
      chargeRes: 0,
      payRes: 0,
      remainingRes: 0,
      remaining: 0,
    },
  );

  const vacant = rows.filter((row) => row.residents === 0).length;

  return (
    <div className="unit-status-grid">
      <div className="mb-4 hidden print:!block" aria-hidden>
        <h1 className="text-xl font-bold">{buildingName} — وضعیت واحدها</h1>
        <p className="mt-1 text-sm text-ink-muted">
          تاریخ تهیه: <DateSpan value={printedAt} /> — تعداد واحد: {faDigits(rows.length)}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap gap-2 text-sm text-ink-muted">
          <span className="rounded-full bg-surface px-3 py-1.5 ring-1 ring-border">
            {faDigits(rows.length)} واحد
          </span>
          <span className="rounded-full bg-surface px-3 py-1.5 ring-1 ring-border">
            {faDigits(vacant)} خالی
          </span>
          <span
            className={cn(
              "rounded-full bg-surface px-3 py-1.5 ring-1 ring-border",
              moneyTone(totals.remaining),
            )}
          >
            مانده کل {faMoney(totals.remaining, currency)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <div ref={pickerRef} className="relative">
            <Button variant="outline" onClick={() => setPickerOpen((value) => !value)}>
              <Icon name="columns" className="size-4" />
              ستون‌ها
            </Button>
            {pickerOpen ? (
              <div className="absolute top-full left-0 z-40 mt-1 w-64 rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">نمایش ستون</p>
                  <button
                    type="button"
                    className="text-xs text-accent hover:underline"
                    onClick={() => setVisible(defaultKeys(catalog))}
                  >
                    پیش‌فرض
                  </button>
                </div>
                <ul className="grid max-h-80 gap-1 overflow-auto">
                  {catalog.map((column) => (
                    <li key={column.key}>
                      <label className="flex min-h-9 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-1 text-sm hover:bg-surface-muted">
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--accent)]"
                          checked={visible.includes(column.key)}
                          disabled={column.locked}
                          onChange={() => toggle(column.key)}
                        />
                        {column.header}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <Button variant="secondary" onClick={() => window.print()}>
            <Icon name="printer" className="size-4" />
            چاپ / PDF
          </Button>
        </div>
      </div>

      {rows.length ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm print:rounded-none print:border-border print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead className="bg-surface-muted text-ink-muted">
                <tr>
                  {active.map((column, index) => (
                    <th
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-2.5 text-xs font-medium",
                        column.numeric ? "text-left" : "text-right",
                        index === 0 && "sticky right-0 z-10 bg-surface-muted print:static",
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border hover:bg-surface-muted/70">
                    {active.map((column, index) => (
                      <td
                        key={column.key}
                        className={cn(
                          "whitespace-nowrap px-3 py-2 text-ink",
                          column.numeric && "text-left tabular-nums",
                          index === 0 && "sticky right-0 z-10 bg-surface font-medium print:static",
                        )}
                      >
                        {cell(row, column, currency)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-strong bg-surface-muted font-medium">
                  {active.map((column, index) => (
                    <td
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-2.5",
                        column.numeric && "text-left tabular-nums",
                        index === 0 && "sticky right-0 z-10 bg-surface-muted print:static",
                      )}
                    >
                      {index === 0
                        ? "جمع"
                        : column.money
                          ? moneyCell(totals[column.key as keyof typeof totals], currency, column.key.startsWith("remaining"))
                          : ""}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-muted px-6 py-12 text-center text-ink-muted">
          واحدی برای نمایش نیست.
        </p>
      )}
    </div>
  );
}

function cell(row: UnitStatusRow, column: Column, currency: string) {
  const value = row[column.key];
  if (column.key === "residents") {
    return row.residents === 0 ? "خالی" : faDigits(row.residents);
  }
  if (column.key === "lastPaidAt") {
    return <DateSpan value={row.lastPaidAt} />;
  }
  if (column.key === "floor") {
    return row.floor == null ? "—" : faDigits(row.floor);
  }
  if (column.key === "area") {
    return row.area ? faDigits(row.area) : "—";
  }
  if (column.key === "parking" || column.key === "storage") {
    return faDigits(Number(value));
  }
  if (column.money && typeof value === "number") {
    return moneyCell(value, currency, column.key.startsWith("remaining"));
  }
  if (value == null || value === "") return "—";
  return String(value);
}

function moneyCell(value: number, currency: string, tint: boolean) {
  return <span className={cn("tabular-nums", tint && moneyTone(value))}>{faMoney(value, currency)}</span>;
}
