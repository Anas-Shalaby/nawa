export type CatalogDrug = {
  name: string;
  doseAmount: string;
  form: string;
  frequency: string;
  duration: string;
  notes: string;
};

export type PrescriptionQuickTemplate = {
  id: string;
  labelAr: string;
  labelEn: string;
  drugs: CatalogDrug[];
};

/** Egyptian clinic drug catalog — V1 static; clinic favorites/templates extend it. */
export const PRESCRIPTION_DRUG_CATALOG: CatalogDrug[] = [
  {
    name: "Augmentin 1g Tablet",
    doseAmount: "1",
    form: "قرص",
    frequency: "مرتين يومياً",
    duration: "لمدة 5 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Panadol Extra",
    doseAmount: "1",
    form: "قرص",
    frequency: "كل 8 ساعات",
    duration: "لمدة 3 أيام",
    notes: "عند اللزوم",
  },
  {
    name: "Brufen 400mg",
    doseAmount: "1",
    form: "قرص",
    frequency: "كل 8 ساعات",
    duration: "لمدة 5 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Flagyl 500mg",
    doseAmount: "1",
    form: "قرص",
    frequency: "كل 8 ساعات",
    duration: "لمدة 7 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Amoxicillin 500mg",
    doseAmount: "1",
    form: "كبسولة",
    frequency: "كل 8 ساعات",
    duration: "لمدة 7 أيام",
    notes: "حسب الإرشاد",
  },
  {
    name: "Voltaren 50mg",
    doseAmount: "1",
    form: "قرص",
    frequency: "مرتين يومياً",
    duration: "لمدة 3 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Motilium 10mg",
    doseAmount: "1",
    form: "قرص",
    frequency: "كل 8 ساعات",
    duration: "لمدة 3 أيام",
    notes: "قبل الأكل",
  },
  {
    name: "Congestal",
    doseAmount: "1",
    form: "قرص",
    frequency: "مرتين يومياً",
    duration: "لمدة 5 أيام",
    notes: "قبل النوم",
  },
  {
    name: "Otrivin Nasal Spray",
    doseAmount: "1",
    form: "بخة",
    frequency: "مرتين يومياً",
    duration: "لمدة 5 أيام",
    notes: "في كل فتحة أنف",
  },
  {
    name: "Antinal",
    doseAmount: "2",
    form: "كبسولة",
    frequency: "كل 8 ساعات",
    duration: "لمدة 3 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Cataflam 50mg",
    doseAmount: "1",
    form: "قرص",
    frequency: "مرتين يومياً",
    duration: "لمدة 3 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Hibiotic 1g",
    doseAmount: "1",
    form: "قرص",
    frequency: "مرتين يومياً",
    duration: "لمدة 5 أيام",
    notes: "بعد الأكل",
  },
];

export const PRESCRIPTION_QUICK_TEMPLATES: PrescriptionQuickTemplate[] = [
  {
    id: "cold",
    labelAr: "روشتة برد",
    labelEn: "Cold Rx",
    drugs: [
      PRESCRIPTION_DRUG_CATALOG[7]!,
      PRESCRIPTION_DRUG_CATALOG[1]!,
      PRESCRIPTION_DRUG_CATALOG[8]!,
    ],
  },
  {
    id: "extraction",
    labelAr: "روشتة خلع ضرس",
    labelEn: "Extraction Rx",
    drugs: [
      PRESCRIPTION_DRUG_CATALOG[0]!,
      { ...PRESCRIPTION_DRUG_CATALOG[2]!, duration: "لمدة 3 أيام" },
      { ...PRESCRIPTION_DRUG_CATALOG[3]!, duration: "لمدة 5 أيام" },
    ],
  },
  {
    id: "pain",
    labelAr: "روشتة ألم",
    labelEn: "Pain Rx",
    drugs: [PRESCRIPTION_DRUG_CATALOG[10]!, PRESCRIPTION_DRUG_CATALOG[1]!],
  },
];

export const DOSE_AMOUNT_OPTIONS = ["1/2", "1", "2", "3", "5 مل", "10 مل"];
export const FORM_OPTIONS = ["قرص", "كبسولة", "ملعقة", "بخة", "أمبولة", "لوشن", "نقطة"];
export const FREQUENCY_OPTIONS = [
  "مرة يومياً",
  "مرتين يومياً",
  "ثلاث مرات يومياً",
  "كل 6 ساعات",
  "كل 8 ساعات",
  "كل 12 ساعة",
  "عند اللزوم",
];
export const DURATION_OPTIONS = [
  "لمدة 3 أيام",
  "لمدة 5 أيام",
  "لمدة 7 أيام",
  "لمدة 10 أيام",
  "لمدة أسبوعين",
];
export const CHRONIC_DURATION_OPTIONS = [
  "لمدة شهر",
  "لمدة 3 أشهر",
  "استمرار",
  "حسب المتابعة",
];
export const NOTE_PRESETS = [
  "بعد الأكل",
  "قبل الأكل",
  "قبل النوم",
  "عند اللزوم",
  "حسب الإرشاد",
];

/** @deprecated Use FORM_OPTIONS — kept for any lingering imports. */
export const DOSAGE_OPTIONS = FORM_OPTIONS;

/** Legacy shape for older callers expecting dosage string = form. */
export type PrescriptionDrugTemplate = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
};
