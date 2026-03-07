/**
 * Normalize a Kenyan phone number to international format (+254XXXXXXXXX).
 *
 * Handles three input formats:
 * - Local: 07XXXXXXXX (10 digits) -> +2547XXXXXXXX
 * - International with +: +2547XXXXXXXX (13 chars) -> pass through
 * - International without +: 2547XXXXXXXX (12 digits) -> prepend +
 *
 * @throws {Error} If the phone number does not match any valid Kenyan format
 */
export function normalizeKenyanPhone(phone: string): string {
  // Strip spaces and hyphens
  const cleaned = phone.replace(/[\s-]/g, "");

  // Local format: 07XXXXXXXX (10 digits)
  if (/^0[71]\d{8}$/.test(cleaned)) {
    return `+254${cleaned.slice(1)}`;
  }

  // International with +: +2547XXXXXXXX or +2541XXXXXXXX
  if (/^\+254[71]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // International without +: 2547XXXXXXXX or 2541XXXXXXXX
  if (/^254[71]\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  throw new Error("Invalid Kenyan phone number");
}
