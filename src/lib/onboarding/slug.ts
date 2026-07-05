const ARABIC_CHAR_MAP: Record<string, string> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "aa",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ؤ: "w",
  ي: "y",
  ى: "a",
  ئ: "y",
  ة: "h",
  ء: "",
  "ـ": "",
  " ": "-",
};

const PREFIXES = ["عيادة", "مركز", "مستشفى"];

function stripClinicPrefix(name: string): string {
  let result = name.trim();

  for (const prefix of PREFIXES) {
    if (result.startsWith(prefix)) {
      result = result.slice(prefix.length).trim();
      break;
    }
  }

  return result;
}

function applyDefiniteArticle(name: string): string {
  let result = name;

  if (result.startsWith("ال")) {
    result = `al-${result.slice(2)}`;
  }

  return result.replace(/\s+ال(?=\S)/g, " al-");
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function slugifyClinicName(clinicName: string): string {
  let name = stripClinicPrefix(clinicName.trim().normalize("NFKC"));
  name = applyDefiniteArticle(name);

  let slug = "";

  for (const char of name) {
    if (ARABIC_CHAR_MAP[char] !== undefined) {
      slug += ARABIC_CHAR_MAP[char];
    } else if (/[a-zA-Z0-9]/.test(char)) {
      slug += char.toLowerCase();
    } else if (char === "-" || char === " ") {
      slug += "-";
    }
  }

  slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "");

  if (!slug || slug.length < 2) {
    slug = `clinic-${randomSuffix()}`;
  } else if (!slug.includes("clinic")) {
    slug = `${slug}-clinic`;
  }

  return slug.slice(0, 56);
}

export async function generateUniqueTenantSlug(
  isTaken: (slug: string) => Promise<boolean>,
  clinicName: string,
): Promise<string> {
  const baseSlug = slugifyClinicName(clinicName);
  let candidate = baseSlug;
  let suffix = 2;

  while (await isTaken(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
