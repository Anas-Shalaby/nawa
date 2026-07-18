"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  CalendarClock,
  ImageIcon,
  Loader2,
  LocateFixed,
  MapPin,
  Phone,
  Plus,
  Sparkles,
  Building2,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Can } from "@/components/auth/Can";
import { saveDoctorProfile } from "@/actions/saveDoctorProfile";
import type { DoctorProfile } from "@/lib/queries/doctorProfile";
import { EntityContextHeader } from "@/components/settings/EntityContextHeader";

interface ProfileSettingsShellProps {
  profile: DoctorProfile;
}

type MediaDraft = {
  file: File | null;
  previewUrl: string | null;
};

function FloatingField({
  id,
  label,
  value,
  onChange,
  multiline = false,
  rows = 4,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  const filled = value.trim().length > 0;

  const sharedClass = [
    "peer w-full rounded-xl border border-subtle bg-base/40 px-3.5 pb-2.5 pt-5 text-sm text-primary outline-none transition",
    "placeholder:text-transparent focus:border-accent/50 focus:ring-2 focus:ring-accent/20",
  ].join(" ");

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={label}
          onChange={(event) => onChange(event.target.value)}
          className={[sharedClass, "resize-none"].join(" ")}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          placeholder={label}
          onChange={(event) => onChange(event.target.value)}
          className={sharedClass}
        />
      )}
      <label
        htmlFor={id}
        className={[
          "pointer-events-none absolute start-3.5 text-muted transition-all",
          filled || multiline
            ? "top-2 text-[10px]"
            : "top-1/2 -translate-y-1/2 text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px]",
          "peer-focus:text-accent",
        ].join(" ")}
      >
        {label}
      </label>
    </div>
  );
}

function MediaDropZone({
  label,
  hint,
  removeLabel,
  previewUrl,
  icon,
  aspect,
  onPick,
  onClear,
}: {
  label: string;
  hint: string;
  removeLabel: string;
  previewUrl: string | null;
  icon: React.ReactNode;
  aspect: "square" | "wide";
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function acceptFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    onPick(file);
  }

  return (
    <div className="text-start">
      <p className="mb-2 text-sm font-medium text-primary">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFiles(event.dataTransfer.files);
        }}
        className={[
          "group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed transition",
          aspect === "square" ? "aspect-square max-h-44" : "aspect-[16/9]",
          dragging
            ? "border-accent bg-accent/10"
            : "border-subtle bg-base/30 hover:border-accent hover:bg-accent/5",
        ].join(" ")}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent transition group-hover:scale-105">
              {icon}
            </div>
            <p className="text-xs text-muted">{hint}</p>
          </div>
        )}

        {previewUrl ? (
          <span className="absolute inset-0 bg-base/0 transition group-hover:bg-base/40" />
        ) : null}
      </button>

      {previewUrl ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 text-xs text-muted transition hover:text-accent-danger"
        >
          {removeLabel}
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          acceptFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function PhonePreview({
  doctorName,
  specialty,
  bio,
  credentials,
  avatarUrl,
  coverUrl,
  clinicPhone,
  clinicLocation,
  clinicLatitude,
  clinicLongitude,
  bookCta,
  previewLabel,
  locationCta,
}: {
  doctorName: string;
  specialty: string;
  bio: string;
  credentials: string[];
  avatarUrl: string | null;
  coverUrl: string | null;
  clinicPhone: string;
  clinicLocation: string;
  clinicLatitude: number | null;
  clinicLongitude: number | null;
  bookCta: string;
  previewLabel: string;
  locationCta: string;
}) {
  return (
    <div className="sticky top-8">
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-muted">
        {previewLabel}
      </p>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="mx-auto w-[320px]"
      >
        <div className="relative overflow-hidden rounded-[3rem] border-[10px] border-slate-900 bg-white shadow-2xl">
          {/* Notch */}
          <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-2">
            <div className="h-5 w-28 rounded-full bg-slate-900" />
          </div>

          <div className="relative flex h-[640px] flex-col bg-white text-slate-900">
            {/* Cover */}
            <div className="relative h-40 shrink-0 bg-gradient-to-br from-violet-100 via-slate-100 to-slate-200">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-slate-300" aria-hidden />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
            </div>

            {/* Avatar overlapping cover */}
            <div className="relative z-10 -mt-12 flex justify-center px-5">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={doctorName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <UserRound className="h-10 w-10" aria-hidden />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-24 pt-3 text-center">
              <h2 className="text-lg font-bold text-slate-900">
                {doctorName || "د. أحمد محمود"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {specialty || "استشاري جراحة الوجه والفكين"}
              </p>

              {clinicPhone || clinicLocation ? (
                <div className="mt-3 space-y-1.5 text-start text-[11px] text-slate-500">
                  {clinicPhone ? (
                    <p className="flex items-center gap-1.5" dir="ltr">
                      <Phone className="h-3 w-3 shrink-0" aria-hidden />
                      {clinicPhone}
                    </p>
                  ) : null}
                  {clinicLocation || (clinicLatitude !== null && clinicLongitude !== null) ? (
                    <a
                      href={
                        clinicLatitude !== null && clinicLongitude !== null
                          ? `https://www.google.com/maps/search/?api=1&query=${clinicLatitude},${clinicLongitude}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicLocation)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-1.5 transition hover:text-accent"
                      dir="rtl"
                    >
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                      <span>{clinicLocation || locationCta}</span>
                    </a>
                  ) : null}
                </div>
              ) : null}

              {credentials.length > 0 ? (
                <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {credentials.map((tag) => (
                    <span
                      key={tag}
                      className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex justify-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-400">
                    البورد الأمريكي
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-400">
                    خبرة 15 عاماً
                  </span>
                </div>
              )}

              <p className="mt-4 text-start text-xs leading-relaxed text-slate-600">
                {bio ||
                  "نبذة مهنية قصيرة تظهر هنا للمريض قبل الحجز — خبراتك، أسلوبك، وما يميز عيادتك."}
              </p>
            </div>

            {/* Pinned CTA */}
            <div className="absolute inset-x-0 bottom-0 border-t border-slate-100 bg-white/95 p-4 backdrop-blur">
              <button
                type="button"
                className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(108,92,231,0.45)]"
              >
                {bookCta}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function ProfileSettingsShell({ profile }: ProfileSettingsShellProps) {
  const t = useTranslations("profileSettings");
  const nameId = useId();
  const specialtyId = useId();
  const bioId = useId();
  const phoneId = useId();
  const locationId = useId();
  const credentialId = useId();

  const [doctorName, setDoctorName] = useState(profile.doctorName);
  const [specialty, setSpecialty] = useState(profile.specialty);
  const [bio, setBio] = useState(profile.bio);
  const [clinicPhone, setClinicPhone] = useState(profile.clinicPhone);
  const [clinicLocation, setClinicLocation] = useState(profile.clinicLocation);
  const [clinicLatitude, setClinicLatitude] = useState<number | null>(
    profile.clinicLatitude,
  );
  const [clinicLongitude, setClinicLongitude] = useState<number | null>(
    profile.clinicLongitude,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [credentials, setCredentials] = useState<string[]>(profile.credentials);
  const [credentialDraft, setCredentialDraft] = useState("");
  const [avatar, setAvatar] = useState<MediaDraft>({
    file: null,
    previewUrl: profile.avatarUrl,
  });
  const [cover, setCover] = useState<MediaDraft>({
    file: null,
    previewUrl: profile.coverUrl,
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (avatar.file && avatar.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(avatar.previewUrl);
      }
      if (cover.file && cover.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(cover.previewUrl);
      }
    };
  }, [avatar.file, avatar.previewUrl, cover.file, cover.previewUrl]);

  function pickAvatar(file: File) {
    setAvatar((current) => {
      if (current.file && current.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  }

  function pickCover(file: File) {
    setCover((current) => {
      if (current.file && current.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  }

  function addCredential() {
    const next = credentialDraft.trim();
    if (!next) return;
    if (credentials.includes(next)) {
      setCredentialDraft("");
      return;
    }
    setCredentials((current) => [...current, next].slice(0, 12));
    setCredentialDraft("");
  }

  function removeCredential(tag: string) {
    setCredentials((current) => current.filter((item) => item !== tag));
  }

  function captureClinicLocation() {
    if (!navigator.geolocation) {
      toast.error(t("locationUnsupported"));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setClinicLatitude(Number(position.coords.latitude.toFixed(7)));
        setClinicLongitude(Number(position.coords.longitude.toFixed(7)));
        setIsLocating(false);
        toast.success(t("locationCaptured"));
      },
      (error) => {
        setIsLocating(false);
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? t("locationPermissionDenied")
            : t("locationError"),
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 60_000,
      },
    );
  }

  function handleSave() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("doctorName", doctorName);
      formData.set("specialty", specialty);
      formData.set("bio", bio);
      formData.set("clinicPhone", clinicPhone);
      formData.set("clinicLocation", clinicLocation);
      formData.set("clinicLatitude", clinicLatitude?.toString() ?? "");
      formData.set("clinicLongitude", clinicLongitude?.toString() ?? "");
      formData.set("credentials", JSON.stringify(credentials));
      formData.set("existingAvatarUrl", profile.avatarUrl ?? "");
      formData.set("existingCoverUrl", profile.coverUrl ?? "");
      if (avatar.file) formData.set("avatarFile", avatar.file);
      if (cover.file) formData.set("coverFile", cover.file);

      const result = await saveDoctorProfile(formData);
      if (!result.success) {
        toast.error(result.error ?? t("saveError"));
        return;
      }

      if (result.avatarUrl) {
        setAvatar({ file: null, previewUrl: result.avatarUrl });
      }
      if (result.coverUrl) {
        setCover({ file: null, previewUrl: result.coverUrl });
      }

      toast.success(t("saved"));
    });
  }

  return (
    <div className="w-full" dir="rtl">
      <EntityContextHeader
        entityLabel={t("entityLabel")}
        title={t("title")}
        subtitle={t("subtitle")}
        icon={Building2}
        breadcrumb={{ href: "/dashboard/settings", label: t("backToSettings") }}
        action={
          <Link
            href="/dashboard/settings/schedule"
            className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-surface px-4 py-2.5 text-sm font-medium text-primary transition hover:border-accent/40 hover:bg-accent/10"
          >
            <CalendarClock className="h-4 w-4 text-accent" aria-hidden />
            {t("editWorkingHours")}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Form — right in RTL (first in DOM for RTL reading) */}
        <section className="lg:col-span-7">
          <div className="rounded-2xl border border-subtle/70 bg-surface/80 p-6 shadow-[0_0_0_1px_rgba(108,92,231,0.04)] backdrop-blur-sm md:p-8">
            <div className="mb-8 text-start">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Nawa
              </div>
              <p className="text-sm text-muted">{t("formEyebrow")}</p>
            </div>

            <div className="mb-8 grid gap-5 sm:grid-cols-2">
              <MediaDropZone
                label={t("avatarLabel")}
                hint={t("avatarHint")}
                removeLabel={t("removeImage")}
                previewUrl={avatar.previewUrl}
                icon={<Camera className="h-5 w-5" aria-hidden />}
                aspect="square"
                onPick={pickAvatar}
                onClear={() =>
                  setAvatar((current) => {
                    if (current.file && current.previewUrl?.startsWith("blob:")) {
                      URL.revokeObjectURL(current.previewUrl);
                    }
                    return { file: null, previewUrl: null };
                  })
                }
              />
              <MediaDropZone
                label={t("coverLabel")}
                hint={t("coverHint")}
                removeLabel={t("removeImage")}
                previewUrl={cover.previewUrl}
                icon={<ImageIcon className="h-5 w-5" aria-hidden />}
                aspect="wide"
                onPick={pickCover}
                onClear={() =>
                  setCover((current) => {
                    if (current.file && current.previewUrl?.startsWith("blob:")) {
                      URL.revokeObjectURL(current.previewUrl);
                    }
                    return { file: null, previewUrl: null };
                  })
                }
              />
            </div>

            <div className="space-y-4">
              <FloatingField
                id={nameId}
                label={t("nameLabel")}
                value={doctorName}
                onChange={setDoctorName}
              />
              <FloatingField
                id={specialtyId}
                label={t("specialtyLabel")}
                value={specialty}
                onChange={setSpecialty}
              />
              <FloatingField
                id={bioId}
                label={t("bioLabel")}
                value={bio}
                onChange={setBio}
                multiline
                rows={5}
              />
              <FloatingField
                id={phoneId}
                label={t("clinicPhoneLabel")}
                value={clinicPhone}
                onChange={setClinicPhone}
              />
              <FloatingField
                id={locationId}
                label={t("clinicLocationLabel")}
                value={clinicLocation}
                onChange={setClinicLocation}
                multiline
                rows={3}
              />
              <div className="rounded-xl border border-subtle bg-base/30 p-3 text-start">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {t("coordinatesLabel")}
                    </p>
                    <p className="mt-1 text-xs text-muted" dir="ltr">
                      {clinicLatitude !== null && clinicLongitude !== null
                        ? `${clinicLatitude}, ${clinicLongitude}`
                        : t("coordinatesEmpty")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={captureClinicLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <LocateFixed className="h-4 w-4" aria-hidden />
                    )}
                    {isLocating ? t("locating") : t("captureLocation")}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-start">
              <p className="mb-2 text-sm font-medium text-primary">{t("credentialsLabel")}</p>
              <p className="mb-3 text-xs text-muted">{t("credentialsHint")}</p>

              <div className="flex gap-2">
                <input
                  id={credentialId}
                  type="text"
                  value={credentialDraft}
                  onChange={(event) => setCredentialDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCredential();
                    }
                  }}
                  placeholder={t("credentialsPlaceholder")}
                  className="min-w-0 flex-1 rounded-xl border border-subtle bg-base/40 px-3.5 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={addCredential}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent/15 px-3.5 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/25"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {t("addCredential")}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <AnimatePresence initial={false}>
                  {credentials.map((tag) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-elevated/60 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeCredential(tag)}
                        className="rounded-full p-0.5 text-muted transition hover:bg-accent-danger/15 hover:text-accent-danger"
                        aria-label={t("removeCredential", { tag })}
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <Can permission="clinic.manage">
              <div className="sticky bottom-4 z-10 mt-8">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending || !doctorName.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {t("saving")}
                    </>
                  ) : (
                    t("save")
                  )}
                </button>
              </div>
            </Can>
          </div>
        </section>

        {/* Live preview — left in RTL */}
        <aside className="lg:col-span-5">
          <PhonePreview
            doctorName={doctorName}
            specialty={specialty}
            bio={bio}
            credentials={credentials}
            avatarUrl={avatar.previewUrl}
            coverUrl={cover.previewUrl}
            clinicPhone={clinicPhone}
            clinicLocation={clinicLocation}
            clinicLatitude={clinicLatitude}
            clinicLongitude={clinicLongitude}
            bookCta={t("bookCta")}
            previewLabel={t("previewLabel")}
            locationCta={t("getDirections")}
          />
        </aside>
      </div>
    </div>
  );
}
