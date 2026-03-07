/**
 * Phone number normalization for M-Pesa Daraja API.
 * Converts various Kenyan phone formats to 254XXXXXXXXX.
 */

export function normalizePhoneForDaraja(phone: string): string {
  // Strip spaces, hyphens, and parentheses
  let cleaned = phone.replace(/[\s\-()]/g, "");

  if (cleaned.startsWith("+254")) {
    cleaned = cleaned.slice(1); // remove +
  } else if (cleaned.startsWith("07") || cleaned.startsWith("01")) {
    cleaned = "254" + cleaned.slice(1); // replace leading 0 with 254
  }
  // If already starts with 254, leave as-is

  // Validate: must be exactly 12 digits starting with 254
  if (!/^254\d{9}$/.test(cleaned)) {
    throw new Error(
      `Invalid phone number format: "${phone}". Expected Kenyan format (+254, 254, 07, or 01 prefix).`,
    );
  }

  return cleaned;
}
