"use client";

import { DateSpan } from "@/components/atoms/DateSpan";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/cn";
import { faDigits } from "@/lib/format";
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS,
  jalaliDateValue,
  jalaliMonthValue,
  parseJalaliDate,
} from "@/lib/jalali";
import { addDays, addMonths, format, getDay, getDaysInMonth, isSameDay, startOfMonth } from "date-fns-jalali";
import { useEffect, useId, useMemo, useRef, useState } from "react";

function monthCells(cursor: Date) {
  const start = startOfMonth(cursor);
  const blanks = (getDay(start) + 1) % 7;
  const cells: (Date | null)[] = Array.from({ length: blanks }, () => null);
  const days = getDaysInMonth(start);
  for (let index = 0; index < days; index += 1) {
    cells.push(addDays(start, index));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DatePicker({
  name,
  id,
  required,
  defaultValue,
  defaultToday = false,
  granularity = "day",
  placeholder = "انتخاب تاریخ",
}: {
  name: string;
  id?: string;
  required?: boolean;
  defaultValue?: Date | string | null;
  defaultToday?: boolean;
  granularity?: "day" | "month";
  placeholder?: string;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const initialDate = parseJalaliDate(defaultValue) ?? (defaultToday ? new Date() : null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | null>(initialDate);
  const [cursor, setCursor] = useState(initialDate ?? new Date());

  const submitted = selected
    ? granularity === "month"
      ? jalaliMonthValue(selected)
      : jalaliDateValue(selected)
    : "";

  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const cursorYear = Number(format(cursor, "yyyy"));
  const cursorMonth = Number(format(cursor, "M"));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(date: Date) {
    setSelected(date);
    setCursor(date);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <input id={fieldId} type="hidden" name={name} value={submitted} required={required} />
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${fieldId}-calendar`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex w-full min-h-[var(--touch)] items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-ink outline-none transition-shadow duration-[var(--duration-fast)] focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)]",
          !selected && "text-ink-faint",
        )}
      >
        {selected ? (
          granularity === "month" ? (
            <DateSpan value={jalaliMonthValue(selected)} />
          ) : (
            <DateSpan value={selected} />
          )
        ) : (
          <span>{placeholder}</span>
        )}
        <Icon name="calendar" className="size-4 text-ink-muted" />
      </button>
      {open ? (
        <div
          id={`${fieldId}-calendar`}
          role="dialog"
          aria-label="تقویم شمسی"
          className="absolute top-full right-0 z-50 mt-1 w-80 rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-md"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-ink-muted hover:bg-surface-muted hover:text-ink"
              onClick={() => setCursor(addMonths(cursor, granularity === "month" ? -12 : -1))}
              aria-label={granularity === "month" ? "سال قبل" : "ماه قبل"}
            >
              <Icon name="chevronRight" className="size-4" />
            </button>
            <p className="text-sm font-medium">
              {granularity === "month"
                ? faDigits(cursorYear)
                : `${JALALI_MONTHS[cursorMonth - 1]} ${faDigits(cursorYear)}`}
            </p>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-ink-muted hover:bg-surface-muted hover:text-ink"
              onClick={() => setCursor(addMonths(cursor, granularity === "month" ? 12 : 1))}
              aria-label={granularity === "month" ? "سال بعد" : "ماه بعد"}
            >
              <Icon name="chevronLeft" className="size-4" />
            </button>
          </div>
          {granularity === "month" ? (
            <div className="grid grid-cols-3 gap-1.5">
              {JALALI_MONTHS.map((label, index) => {
                const date = parseJalaliDate(`${cursorYear}/${String(index + 1).padStart(2, "0")}/01`);
                if (!date) return null;
                const active = selected
                  ? Number(format(selected, "yyyy")) === cursorYear && Number(format(selected, "M")) === index + 1
                  : false;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => choose(date)}
                    className={cn(
                      "min-h-10 rounded-[var(--radius-md)] px-1 text-sm hover:bg-accent-soft hover:text-accent-ink",
                      active && "bg-accent text-white hover:bg-accent hover:text-white",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="mb-1 grid grid-cols-7 text-center text-xs text-ink-faint">
                {JALALI_WEEKDAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {cells.map((day, index) =>
                  day ? (
                    <button
                      key={jalaliDateValue(day)}
                      type="button"
                      onClick={() => choose(day)}
                      className={cn(
                        "min-h-9 rounded-[var(--radius-sm)] text-sm tabular-nums hover:bg-accent-soft hover:text-accent-ink",
                        selected && isSameDay(day, selected) && "bg-accent text-white hover:bg-accent hover:text-white",
                        isSameDay(day, new Date()) && !(selected && isSameDay(day, selected)) && "text-accent-deep",
                      )}
                    >
                      {faDigits(format(day, "d"))}
                    </button>
                  ) : (
                    <span key={`empty-${index}`} />
                  ),
                )}
              </div>
            </>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() => choose(new Date())}
            >
              {granularity === "month" ? "ماه جاری" : "امروز"}
            </button>
            {!required ? (
              <button
                type="button"
                className="text-xs text-ink-faint hover:text-ink"
                onClick={() => {
                  setSelected(null);
                  setOpen(false);
                }}
              >
                پاک کردن
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
