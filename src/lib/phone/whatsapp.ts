/** Normalize Egyptian phone numbers for wa.me links. */
export function toWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("20")) {
    return `https://wa.me/${digits}`;
  }

  if (digits.startsWith("0")) {
    return `https://wa.me/20${digits.slice(1)}`;
  }

  return `https://wa.me/20${digits}`;
}
