export interface BookingNotification {
  id: string;
  appointmentId: string;
  patientName: string;
  serviceName: string;
  timeLabel: string;
  createdAt: number;
  read: boolean;
}
