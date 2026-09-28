import { digitsArToEn, digitsFaToEn, isPhoneNumberValid, phoneNumberNormalizer } from "@persian-tools/persian-tools";

export const IRAN_MOBILE_PATTERN = /^09\d{9}$/;

export function toLatinDigits(value: string) {
  return digitsArToEn(digitsFaToEn(value));
}

/** Live input: Persian digits become English, extra characters are stripped. */
export function sanitizeMobileInput(raw: string) {
  let value = toLatinDigits(raw).replace(/[^\d+]/g, "");
  if (value.startsWith("+98")) value = `0${value.slice(3)}`;
  if (value.startsWith("0098")) value = `0${value.slice(4)}`;
  if (value.startsWith("98") && value.length >= 10) value = `0${value.slice(2)}`;
  if (/^9\d{9}$/.test(value)) value = `0${value}`;
  return value.slice(0, 11);
}

/** Stored/login format: 09XXXXXXXXX, or null if invalid. */
export function normalizeIranianMobile(raw: string) {
  const latin = sanitizeMobileInput(raw);
  if (IRAN_MOBILE_PATTERN.test(latin) && isPhoneNumberValid(latin)) return latin;
  try {
    const normalized = phoneNumberNormalizer(toLatinDigits(raw).trim(), "0");
    if (IRAN_MOBILE_PATTERN.test(normalized) && isPhoneNumberValid(normalized)) return normalized;
  } catch {
    // ignore invalid numbers
  }
  return IRAN_MOBILE_PATTERN.test(latin) ? latin : null;
}

export function normalizeMobileField(raw: string) {
  return normalizeIranianMobile(raw) ?? "";
}

export const IRAN_LANDLINE_PATTERN = /^\d{8}$/;

/** Live input: Persian digits become English; city code may still be typed, then stripped on add. */
export function sanitizeLandlineInput(raw: string) {
  return toLatinDigits(raw).replace(/\D/g, "").slice(0, 11);
}

/** Local 8-digit landline. City code (021…) is dropped if pasted. */
export function normalizeLandline(raw: string) {
  const digits = toLatinDigits(raw).replace(/\D/g, "");
  if (IRAN_LANDLINE_PATTERN.test(digits)) return digits;
  if (/^0\d{10}$/.test(digits)) return digits.slice(-8);
  return "";
}
