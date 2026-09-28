import { addCommas, digitsEnToFa } from "@persian-tools/persian-tools";
import { isJalaliMonthLabel, parseJalaliDate } from "@/lib/jalali";
import { toLatinDigits } from "@/lib/phone";
import { format } from "date-fns-jalali";
import { Decimal } from "@prisma/client/runtime/library";

export function faDigits(value: string | number) {
  return digitsEnToFa(String(value));
}

export function faMoney(value: number | Decimal | string, currency = "تومان") {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return "—";
  return `${digitsEnToFa(addCommas(Math.round(n)))} ${currency}`;
}

export function faDate(value: Date | string | null | undefined) {
  if (typeof value === "string" && isJalaliMonthLabel(value)) {
    return digitsEnToFa(value.trim());
  }
  const date = parseJalaliDate(value);
  if (!date) {
    const text = value == null ? "" : String(value).trim();
    return text ? digitsEnToFa(text) : "";
  }
  return digitsEnToFa(format(date, "yyyy/MM/dd"));
}

export function faDateTime(value: Date | string | null | undefined) {
  const date = parseJalaliDate(value);
  if (!date) return faDate(value);
  return digitsEnToFa(format(date, "yyyy/MM/dd HH:mm"));
}

export function moneyNumber(value: number | Decimal | string | null | undefined) {
  if (value == null) return 0;
  return Number(value);
}

export function parseMoneyInput(raw: string) {
  const latin = toLatinDigits(raw).replace(/[^\d.-]/g, "");
  if (!latin) return 0;
  const value = Number(latin);
  return Number.isFinite(value) ? value : 0;
}

/** Live money field: Latin digits with a thousands separator every 3 digits. */
export function formatMoneyInput(raw: string) {
  const latin = toLatinDigits(String(raw ?? "")).replace(/[^\d.]/g, "");
  if (!latin) return "";
  const [wholeRaw = "", ...fractionParts] = latin.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const grouped = addCommas(whole);
  if (!latin.includes(".")) return grouped;
  return `${grouped}.${fractionParts.join("").replace(/\D/g, "").slice(0, 2)}`;
}
