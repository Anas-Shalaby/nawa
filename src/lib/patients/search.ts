function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

export function matchesPatientSearch(
  fields: { name: string; phoneNumber?: string },
  query: string,
): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const normalizedName = normalizeSearchText(fields.name);
  const queryWords = normalizedQuery.split(" ").filter(Boolean);
  const nameMatches = queryWords.every((word) => normalizedName.includes(word));

  if (nameMatches) return true;

  if (fields.phoneNumber) {
    const digits = fields.phoneNumber.replace(/\D/g, "");
    const queryDigits = query.replace(/\D/g, "");
    if (queryDigits && digits.includes(queryDigits)) return true;
  }

  return false;
}
