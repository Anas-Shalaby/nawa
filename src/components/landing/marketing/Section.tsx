import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
  ariaLabelledBy?: string;
}

export function Section({
  id,
  children,
  className = "",
  as: Tag = "section",
  ariaLabelledBy,
}: SectionProps) {
  return (
    <Tag
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={[
        "scroll-mt-24 px-6 py-24 md:scroll-mt-28 md:py-32",
        className,
      ].join(" ")}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </Tag>
  );
}
