"use client";

interface HealthIndicatorProps {
  completedVisitsCount: number;
  recentVisitsCount: number; // last 90 days
  noShowCount: number;
  balanceDue: number;
  locale: string;
}

export function HealthIndicator({
  completedVisitsCount,
  recentVisitsCount,
  noShowCount,
  balanceDue,
  locale,
}: HealthIndicatorProps) {
  const isAr = locale === "ar";
  const badges: Array<{ text: string; bg: string; textCol: string }> = [];

  // New Patient Badge
  if (completedVisitsCount === 0) {
    badges.push({
      text: isAr ? "مريض جديد" : "New Patient",
      bg: "bg-blue-500/10 border-blue-500/20",
      textCol: "text-blue-600 dark:text-blue-400",
    });
  } else {
    badges.push({
      text: isAr ? "مريض سابق" : "Returning Patient",
      bg: "bg-accent/10 border-accent/20",
      textCol: "text-accent",
    });
  }

  // Frequent Visitor Badge (>= 5 visits in 90 days)
  if (recentVisitsCount >= 5) {
    badges.push({
      text: isAr ? "متردد متكرر" : "Frequent Visitor",
      bg: "bg-purple-500/10 border-purple-500/20",
      textCol: "text-purple-600 dark:text-purple-400",
    });
  }

  // Repeated No-Show Badge (>= 2 no shows)
  if (noShowCount >= 2) {
    badges.push({
      text: isAr ? "تغيب متكرر" : "Repeated No-Show",
      bg: "bg-accent-danger/10 border-accent-danger/20",
      textCol: "text-accent-danger",
    });
  }

  // High Outstanding Balance Badge (>= 2000 EGP)
  if (balanceDue >= 2000) {
    badges.push({
      text: isAr ? "مديونية مرتفعة" : "High Balance Dues",
      bg: "bg-accent-danger/10 border-accent-danger/25",
      textCol: "text-accent-danger font-semibold",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 hide-on-print">
      {badges.map((b, i) => (
        <span
          key={i}
          className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${b.bg} ${b.textCol}`}
        >
          {b.text}
        </span>
      ))}
    </div>
  );
}
