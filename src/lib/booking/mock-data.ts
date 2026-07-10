import type { Service, Tenant, TimeSlot } from "./types";

const MOCK_TENANTS: Record<string, Tenant> = {
  "nova-dental": {
    id: "tenant-001",
    name: "Nova Dental Clinic",
    slug: "nova-dental",
    whatsappNumber: "+20 100 123 4567",
    type: "dental",
    doctorName: "د. أحمد محمود",
    specialty: "استشاري جراحة الوجه والفكين",
    bio: "خبرة واسعة في طب الأسنان التجميلي والجراحي.",
    credentials: ["البورد الأمريكي", "خبرة 15 عاماً"],
    avatarUrl: null,
    coverUrl: null,
  },
  "glow-derm": {
    id: "tenant-002",
    name: "Glow Dermatology",
    slug: "glow-derm",
    whatsappNumber: "+20 101 987 6543",
    type: "dermatology",
    doctorName: "د. سارة نور",
    specialty: "استشارية الأمراض الجلدية",
    bio: "متخصصة في علاجات البشرة والتجميل الطبي.",
    credentials: ["زمالة أوروبية"],
    avatarUrl: null,
    coverUrl: null,
  },
};

const MOCK_SERVICES: Service[] = [
  {
    id: "svc-001",
    name: "Consultation",
    durationMinutes: 30,
    priceEgp: 500,
    preVisitInstructions: "Please arrive 10 minutes early.",
  },
  {
    id: "svc-002",
    name: "Follow-up",
    durationMinutes: 20,
    priceEgp: null,
    preVisitInstructions: null,
  },
];

/** Phone numbers that trigger soft-ban in mock booking (no_show_count >= 2). */
export const MOCK_SOFT_BAN_NUMBERS = ["+201999999999", "01999999999"];

function generateSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const taken = new Set(["10:00", "14:30"]);

  for (let hour = 9; hour <= 16; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 16 && minute === 30) continue;
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const date = new Date();
      date.setHours(hour, minute, 0, 0);

      slots.push({
        id: `slot-${time}`,
        time,
        label: new Intl.DateTimeFormat("en-EG", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(date),
        available: !taken.has(time),
      });
    }
  }

  return slots;
}

export async function fetchTenantBySlug(slug: string): Promise<Tenant | null> {
  // TODO: Supabase — SELECT * FROM tenants WHERE slug = $1
  await new Promise((r) => setTimeout(r, 0));
  return MOCK_TENANTS[slug] ?? null;
}

export async function fetchServices(_tenantId: string): Promise<Service[]> {
  // TODO: Supabase — SELECT * FROM services WHERE tenant_id = $1 AND is_active = true
  await new Promise((r) => setTimeout(r, 0));
  return MOCK_SERVICES;
}

export async function fetchAvailableSlots(
  _tenantId: string,
  _serviceId: string,
  _date?: string,
): Promise<TimeSlot[]> {
  // TODO: Supabase — compute slots from tenant settings minus booked appointments
  await new Promise((r) => setTimeout(r, 0));
  return generateSlots();
}
