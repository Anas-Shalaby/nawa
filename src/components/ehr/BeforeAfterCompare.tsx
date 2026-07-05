"use client";

import { useTranslations } from "next-intl";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import type { PatientMediaWithUrl } from "@/lib/media/types";

interface BeforeAfterCompareProps {
  items: PatientMediaWithUrl[];
  beforeId: string | null;
  afterId: string | null;
  onSelectBefore: (id: string) => void;
  onSelectAfter: (id: string) => void;
  theater?: boolean;
}

export function BeforeAfterCompare({
  items,
  beforeId,
  afterId,
  onSelectBefore,
  onSelectAfter,
  theater = false,
}: BeforeAfterCompareProps) {
  const t = useTranslations("ehr");

  const beforeItem = items.find((item) => item.id === beforeId) ?? null;
  const afterItem = items.find((item) => item.id === afterId) ?? null;
  const canCompare =
    beforeItem?.signedUrl && afterItem?.signedUrl && beforeId !== afterId;

  return (
    <div className="space-y-4 text-start">
      <div className="grid gap-4 sm:grid-cols-2">
        <ComparePicker
          label={t("compareBefore")}
          selectedId={beforeId}
          items={items}
          onSelect={onSelectBefore}
          accentClass="ring-accent"
        />
        <ComparePicker
          label={t("compareAfter")}
          selectedId={afterId}
          items={items}
          onSelect={onSelectAfter}
          accentClass="ring-emerald-400"
        />
      </div>

      {canCompare ? (
        <div
          className={[
            "overflow-hidden rounded-xl border border-subtle bg-black",
            theater ? "h-[min(72vh,640px)]" : "h-[min(48vh,420px)]",
          ].join(" ")}
        >
          <ReactCompareSlider
            itemOne={
              <ReactCompareSliderImage
                src={beforeItem.signedUrl!}
                alt={t("compareBefore")}
                style={{ objectFit: "contain" }}
              />
            }
            itemTwo={
              <ReactCompareSliderImage
                src={afterItem.signedUrl!}
                alt={t("compareAfter")}
                style={{ objectFit: "contain" }}
              />
            }
            className="h-full w-full"
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-subtle bg-base/60">
          <p className="text-sm text-muted">{t("compareHint")}</p>
        </div>
      )}
    </div>
  );
}

function ComparePicker({
  label,
  selectedId,
  items,
  onSelect,
  accentClass,
}: {
  label: string;
  selectedId: string | null;
  items: PatientMediaWithUrl[];
  onSelect: (id: string) => void;
  accentClass: string;
}) {
  const t = useTranslations("ehr");

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={[
              "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
              selectedId === item.id
                ? `${accentClass} ring-2`
                : "border-subtle opacity-70 hover:opacity-100",
            ].join(" ")}
            title={t(`tags.${item.tag}`)}
          >
            {item.signedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.signedUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-base text-[10px] text-muted">
                —
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
