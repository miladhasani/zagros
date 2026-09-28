import { digitsEnToFa } from "@persian-tools/persian-tools";
import { format, isValid, parse } from "date-fns-jalali";
import { toLatinDigits } from "@/lib/phone";

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export const JALALI_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

export function currentJalali() {
  const now = new Date();
  return {
    year: Number(format(now, "yyyy")),
    month: Number(format(now, "M")),
    day: Number(format(now, "d")),
  };
}

export function periodLabel(year: number, month: number) {
  return `${JALALI_MONTHS[month - 1] ?? month} ${digitsEnToFa(String(year))}`;
}

export function jalaliDateValue(date: Date) {
  return format(date, "yyyy/MM/dd");
}

export function jalaliMonthValue(date: Date) {
  const month = Number(format(date, "M"));
  const year = Number(format(date, "yyyy"));
  return `${JALALI_MONTHS[month - 1] ?? month} ${year}`;
}

export function isJalaliMonthLabel(raw: string) {
  const text = toLatinDigits(raw.trim());
  return JALALI_MONTHS.some((month) => text.includes(month)) && !/\d{1,2}\/\d{1,2}/.test(text);
}

export function parseJalaliDate(raw: Date | string | null | undefined): Date | null {
  if (raw instanceof Date) return isValid(raw) ? raw : null;
  if (raw == null) return null;
  const text = toLatinDigits(String(raw).trim());
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const instant = new Date(text);
    return isValid(instant) ? instant : null;
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso && Number(iso[1]) >= 1700) {
    const gregorian = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`);
    return isValid(gregorian) ? gregorian : null;
  }

  const numeric = text.replace(/-/g, "/").match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (numeric) {
    const value = parse(
      `${numeric[1]}/${numeric[2].padStart(2, "0")}/${numeric[3].padStart(2, "0")}`,
      "yyyy/MM/dd",
      new Date(),
    );
    return isValid(value) ? value : null;
  }

  const monthIndex = JALALI_MONTHS.findIndex((month) => text.includes(month));
  const yearMatch = text.match(/(\d{4})/);
  if (monthIndex >= 0 && yearMatch) {
    const value = parse(`${yearMatch[1]}/${String(monthIndex + 1).padStart(2, "0")}/01`, "yyyy/MM/dd", new Date());
    return isValid(value) ? value : null;
  }

  return null;
}
