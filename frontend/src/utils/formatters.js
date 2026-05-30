export function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatValue(value, precision = 1) {
  if (typeof value === "string") return value;
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(precision);
}

export function formatRange(min, max, unit = "") {
  if (min == null && max == null) return "No range";
  if (min == null) return `<= ${max} ${unit}`.trim();
  if (max == null) return `>= ${min} ${unit}`.trim();
  return `${min}-${max} ${unit}`.trim();
}
