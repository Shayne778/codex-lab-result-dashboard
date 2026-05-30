export function readingsFor(labs, biomarker) {
  return labs
    .filter((result) => result.biomarker === biomarker && typeof result.value === "number")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function latestFor(labs, biomarker) {
  return readingsFor(labs, biomarker).at(-1);
}

export function trendFor(labs, biomarker) {
  const readings = readingsFor(labs, biomarker);
  const latest = readings.at(-1);
  const previous = readings.at(-2);

  if (!latest || !previous || previous.value === 0) {
    return { direction: "flat", percent: 0, absolute: 0 };
  }

  const absolute = latest.value - previous.value;
  return {
    direction: absolute > 0 ? "up" : absolute < 0 ? "down" : "flat",
    percent: (absolute / previous.value) * 100,
    absolute,
  };
}
