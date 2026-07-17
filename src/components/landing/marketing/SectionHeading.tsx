interface SectionHeadingProps {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
  className?: string;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  align = "start",
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={[
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-start",
        className,
      ].join(" ")}
    >
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className="text-balance text-3xl font-semibold tracking-tight text-primary md:text-5xl md:leading-[1.1]"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
