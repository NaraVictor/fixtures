import type { PredictionStatus } from "@/lib/data/types";

const VARIANT_MAP: Record<PredictionStatus, string> = {
  won: "badge--won",
  lost: "badge--lost",
  pending: "badge--pending",
  void: "badge--void",
};

export function StatusBadge({ status }: { status: PredictionStatus | string }) {
  const variant = VARIANT_MAP[status as PredictionStatus] ?? "badge--pending";
  const label = status === "void" ? "Void" : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`badge ${variant}`} role="status" aria-label={`Prediction: ${label}`}>
      {label}
    </span>
  );
}
