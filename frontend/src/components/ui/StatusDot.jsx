import { getStatusLabel } from "../../utils/statusCalc";

const dotClass = {
  normal: "bg-[var(--status-normal)] shadow-[0_0_14px_rgba(0,212,160,0.5)]",
  "borderline-low": "bg-[var(--status-borderline)] shadow-[0_0_14px_rgba(245,166,35,0.45)]",
  "borderline-high": "bg-[var(--status-borderline)] shadow-[0_0_14px_rgba(245,166,35,0.45)]",
  low: "bg-[var(--status-low)] shadow-[0_0_14px_rgba(108,142,191,0.45)]",
  high: "bg-[var(--status-high)] shadow-[0_0_14px_rgba(255,77,109,0.45)]",
  unknown: "bg-secondary",
};

export default function StatusDot({ status, showLabel = true }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass[status] ?? dotClass.unknown}`} />
      {showLabel ? <span>{getStatusLabel(status)}</span> : null}
    </span>
  );
}
