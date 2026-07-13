export type PrescriptionDrugTemplate = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
};

export type PrescriptionQuickTemplate = {
  id: string;
  labelAr: string;
  labelEn: string;
  drugs: Omit<PrescriptionDrugTemplate, "id">[];
};

/** Common Egyptian clinic drug catalog for V1 autocomplete. */
export const PRESCRIPTION_DRUG_CATALOG: Omit<PrescriptionDrugTemplate, "id">[] = [
  {
    name: "Augmentin 1g Tablet",
    dosage: "قرص",
    frequency: "كل 12 ساعة",
    duration: "لمدة 5 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Panadol Extra",
    dosage: "قرص",
    frequency: "كل 8 ساعات",
    duration: "لمدة 3 أيام",
    notes: "عند اللزوم",
  },
  {
    name: "Brufen 400mg",
    dosage: "قرص",
    frequency: "كل 8 ساعات",
    duration: "لمدة 5 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Flagyl 500mg",
    dosage: "قرص",
    frequency: "كل 8 ساعات",
    duration: "لمدة 7 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Amoxicillin 500mg",
    dosage: "كبسولة",
    frequency: "كل 8 ساعات",
    duration: "لمدة 7 أيام",
    notes: "حسب الإرشاد",
  },
  {
    name: "Voltaren 50mg",
    dosage: "قرص",
    frequency: "كل 12 ساعة",
    duration: "لمدة 3 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Motilium 10mg",
    dosage: "قرص",
    frequency: "كل 8 ساعات",
    duration: "لمدة 3 أيام",
    notes: "قبل الأكل",
  },
  {
    name: "Congestal",
    dosage: "قرص",
    frequency: "كل 12 ساعة",
    duration: "لمدة 5 أيام",
    notes: "قبل النوم",
  },
  {
    name: "Otrivin Nasal Spray",
    dosage: "بخة",
    frequency: "مرتين يومياً",
    duration: "لمدة 5 أيام",
    notes: "في كل فتحة أنف",
  },
  {
    name: "Antinal",
    dosage: "كبسولة",
    frequency: "كل 8 ساعات",
    duration: "لمدة 3 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Cataflam 50mg",
    dosage: "قرص",
    frequency: "كل 12 ساعة",
    duration: "لمدة 3 أيام",
    notes: "بعد الأكل",
  },
  {
    name: "Hibiotic 1g",
    dosage: "قرص",
    frequency: "كل 12 ساعة",
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
      {
        name: "Congestal",
        dosage: "قرص",
        frequency: "كل 12 ساعة",
        duration: "لمدة 5 أيام",
        notes: "قبل النوم",
      },
      {
        name: "Panadol Extra",
        dosage: "قرص",
        frequency: "كل 8 ساعات",
        duration: "لمدة 3 أيام",
        notes: "عند اللزوم",
      },
      {
        name: "Otrivin Nasal Spray",
        dosage: "بخة",
        frequency: "مرتين يومياً",
        duration: "لمدة 5 أيام",
        notes: "في كل فتحة أنف",
      },
    ],
  },
  {
    id: "extraction",
    labelAr: "روشتة خلع ضرس",
    labelEn: "Extraction Rx",
    drugs: [
      {
        name: "Augmentin 1g Tablet",
        dosage: "قرص",
        frequency: "كل 12 ساعة",
        duration: "لمدة 5 أيام",
        notes: "بعد الأكل",
      },
      {
        name: "Brufen 400mg",
        dosage: "قرص",
        frequency: "كل 8 ساعات",
        duration: "لمدة 3 أيام",
        notes: "بعد الأكل",
      },
      {
        name: "Flagyl 500mg",
        dosage: "قرص",
        frequency: "كل 8 ساعات",
        duration: "لمدة 5 أيام",
        notes: "بعد الأكل",
      },
    ],
  },
  {
    id: "pain",
    labelAr: "روشتة ألم",
    labelEn: "Pain Rx",
    drugs: [
      {
        name: "Cataflam 50mg",
        dosage: "قرص",
        frequency: "كل 12 ساعة",
        duration: "لمدة 3 أيام",
        notes: "بعد الأكل",
      },
      {
        name: "Panadol Extra",
        dosage: "قرص",
        frequency: "كل 8 ساعات",
        duration: "لمدة 3 أيام",
        notes: "عند اللزوم",
      },
    ],
  },
];

export const DOSAGE_OPTIONS = ["قرص", "كبسولة", "ملعقة", "بخة", "أمبولة", "لوشن"];
export const FREQUENCY_OPTIONS = [
  "مرة يومياً",
  "مرتين يومياً",
  "كل 8 ساعات",
  "كل 12 ساعة",
  "كل 6 ساعات",
  "عند اللزوم",
];
export const DURATION_OPTIONS = [
  "لمدة 3 أيام",
  "لمدة 5 أيام",
  "لمدة 7 أيام",
  "لمدة 10 أيام",
  "لمدة أسبوعين",
];
