import { createHmac, timingSafeEqual } from "crypto";

const TICKET_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function getTicketSecret(): string {
  return (
    process.env.BOOKING_TICKET_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 48) ??
    "nawa-dev-booking-ticket-secret"
  );
}

type TicketPayload = {
  aid: string;
  slug: string;
  iat: number;
};

function encodePayload(payload: TicketPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string): TicketPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TicketPayload;
    if (!parsed.aid || !parsed.slug || typeof parsed.iat !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function signBookingTicket(appointmentId: string, tenantSlug: string): string {
  const payload = encodePayload({
    aid: appointmentId,
    slug: tenantSlug,
    iat: Date.now(),
  });
  const signature = createHmac("sha256", getTicketSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyBookingTicket(token: string): TicketPayload | null {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expected = createHmac("sha256", getTicketSecret()).update(payloadPart).digest("base64url");

  try {
    const sigBuffer = Buffer.from(signaturePart);
    const expectedBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  } catch {
    return null;
  }

  const payload = decodePayload(payloadPart);
  if (!payload) return null;

  if (Date.now() - payload.iat > TICKET_TTL_MS) return null;

  return payload;
}

export function verifyBookingTicketForAppointment(
  token: string,
  appointmentId: string,
  tenantSlug: string,
): boolean {
  const payload = verifyBookingTicket(token);
  if (!payload) return false;
  return payload.aid === appointmentId && payload.slug === tenantSlug;
}

export function formatBookingReference(appointmentId: string): string {
  const segment = appointmentId.replace(/-/g, "").slice(-4);
  const numeric = Number.parseInt(segment, 16) % 10000;
  return `NW${numeric.toString().padStart(4, "0")}`;
}
