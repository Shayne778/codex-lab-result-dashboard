export function getStatusLabel(status) {
  const labels = {
    normal: "Normal",
    "borderline-low": "Borderline low",
    "borderline-high": "Borderline high",
    low: "Low",
    high: "High",
    unknown: "Unknown",
  };

  return labels[status] ?? "Unknown";
}

export function statusTone(status) {
  if (status === "normal") return "text-[var(--status-normal)]";
  if (status === "low") return "text-[var(--status-low)]";
  if (status === "high") return "text-[var(--status-high)]";
  if (status?.startsWith("borderline")) return "text-[var(--status-borderline)]";
  return "text-secondary";
}

export function computeStatus(value, min, max, borderlineRatio = 0.1) {
  if (typeof value !== "number" || min == null || max == null) return "unknown";
  const span = max - min;
  const buffer = span * borderlineRatio;

  if (value < min) return "low";
  if (value > max) return "high";
  if (value <= min + buffer) return "borderline-low";
  if (value >= max - buffer) return "borderline-high";
  return "normal";
}
