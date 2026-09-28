import { verifyIranianNationalId } from "@persian-tools/persian-tools";
import { normalizeIranianMobile, toLatinDigits } from "@/lib/phone";

export function displayName(user: { firstName: string; lastName: string }) {
  return [user.firstName.trim(), user.lastName.trim()].filter(Boolean).join(" ");
}

export function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim(),
  };
}

export function sanitizeNationalIdInput(raw: string) {
  return toLatinDigits(raw).replace(/\D/g, "").slice(0, 10);
}

export function sanitizeCardNumberInput(raw: string) {
  return toLatinDigits(raw).replace(/\D/g, "").slice(0, 16);
}

export function normalizeNationalId(raw: string) {
  const digits = sanitizeNationalIdInput(raw);
  return digits.length ? digits : null;
}

export function normalizeCardNumber(raw: string) {
  const digits = sanitizeCardNumberInput(raw);
  return digits.length ? digits : null;
}

export function normalizeCardField(raw: string) {
  const digits = sanitizeCardNumberInput(raw);
  return isValidCardNumber(digits) ? digits : "";
}

export function collectMobiles(formData: FormData, name = "phone") {
  return [
    ...new Set(
      formData
        .getAll(name)
        .map((value) => normalizeIranianMobile(String(value)))
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

export function collectCardNumbers(formData: FormData, name = "cardNumber") {
  return [
    ...new Set(
      formData
        .getAll(name)
        .map((value) => normalizeCardField(String(value)))
        .filter(Boolean),
    ),
  ];
}

export function userPhones(user: { phone: string; phones?: string[] }) {
  return [...new Set([user.phone, ...(user.phones ?? [])].filter(Boolean))];
}

export function isValidNationalId(raw: string) {
  const digits = sanitizeNationalIdInput(raw);
  return digits.length === 10 && verifyIranianNationalId(digits);
}

export function isValidCardNumber(raw: string) {
  const digits = sanitizeCardNumberInput(raw);
  return digits.length === 16 && luhnValid(digits);
}

export function formatCardNumber(digits: string) {
  return digits.replace(/(\d{4})(?=\d)/g, "$1-");
}

function luhnValid(digits: string) {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
