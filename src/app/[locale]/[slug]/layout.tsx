export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="booking-surface min-h-[100dvh] bg-booking-bg text-booking-text antialiased">
      {children}
    </div>
  );
}
