import { useTranslations } from "next-intl";

export default function BookingNotFound() {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        <span className="text-2xl font-bold text-gray-300">?</span>
      </div>
      <h1 className="mb-2 text-xl font-semibold text-booking-text">{t("clinicNotFound")}</h1>
      <p className="text-sm text-booking-muted">{t("clinicNotFoundHint")}</p>
    </div>
  );
}
