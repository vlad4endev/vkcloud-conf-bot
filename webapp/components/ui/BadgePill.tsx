import type { BadgeType } from "@/lib/scheduleData";

export function BadgePill({
  label,
  type,
}: {
  label: string;
  type?: BadgeType | "time";
}) {
  if (type === "time" || !type) {
    return <span className="badge-time">{label}</span>;
  }
  if (type === "track") {
    return <span className="badge-track">{label}</span>;
  }
  return <span className="badge-type">{label}</span>;
}
