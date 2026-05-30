import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

export default function TrendArrow({ trend }) {
  const Icon = trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : ArrowRight;
  const color =
    trend.direction === "up"
      ? "text-[var(--status-high)]"
      : trend.direction === "down"
        ? "text-[var(--status-normal)]"
        : "text-secondary";

  return (
    <span className={`inline-flex items-center gap-1 numeric text-xs ${color}`}>
      <Icon size={14} strokeWidth={2.4} />
      {Math.abs(trend.percent).toFixed(1)}%
    </span>
  );
}
