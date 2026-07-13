export type NotificationKind =
  | "booking"
  | "inventory"
  | "financial"
  | "urgent"
  | "system"
  | "cancellation";

export type NotificationActionKey =
  | "viewDetails"
  | "updateStock"
  | "collect"
  | "sendPaymentLink"
  | "openPublicSlot"
  | "confirmRestock";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  /** Shown under the "عاجل" filter and styled with danger accent. */
  urgent?: boolean;
  actionHref?: string;
  actionLabelKey?: NotificationActionKey;
  meta?: {
    appointmentId?: string;
    patientId?: string;
    patientName?: string;
    phoneNumber?: string;
    serviceName?: string;
    timeLabel?: string;
    appointmentDateIso?: string;
    inventoryItemId?: string;
    inventoryName?: string;
    inventoryQuantity?: number;
    inventoryMinThreshold?: number;
    amountEgp?: number;
  };
}

/** @deprecated Prefer AppNotification — kept for gradual migration. */
export type BookingNotification = AppNotification & {
  appointmentId: string;
  patientName: string;
  serviceName: string;
  timeLabel: string;
};
