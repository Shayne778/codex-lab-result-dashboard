import { biomarkerMeta } from "./biomarkerMeta";
import { computeStatus } from "../utils/statusCalc";

const drawDates = [
  { date: "2024-07-12", provider: "Quest Diagnostics" },
  { date: "2024-10-18", provider: "Lee Health" },
  { date: "2025-01-24", provider: "LabCorp" },
  { date: "2025-05-08", provider: "Quest Diagnostics" },
  { date: "2025-09-19", provider: "LabCorp" },
  { date: "2026-01-16", provider: "Lee Health" },
  { date: "2026-05-10", provider: "LabCorp" },
];

const series = {
  Glucose: { values: [91, 98, 103, 96, 89, 94, 101], range: [70, 99], panel: "Comprehensive Metabolic Panel" },
  "HbA1c": { values: [5.2, 5.3, 5.5, 5.4, 5.1, 5.2, 5.4], range: [4.8, 5.6], panel: "Hemoglobin A1c" },
  "Fasting Insulin": { values: [7.9, 9.6, 11.8, 8.4, 6.8, 7.2, 10.1], range: [2.6, 24.9], panel: "Insulin" },
  Creatinine: { values: [0.94, 0.98, 1.02, 0.97, 1.05, 1.01, 0.99], range: [0.76, 1.27], panel: "Comprehensive Metabolic Panel" },
  eGFR: { values: [105, 101, 96, 103, 94, 98, 100], range: [60, 130], panel: "Comprehensive Metabolic Panel" },
  ALT: { values: [24, 31, 44, 33, 27, 25, 38], range: [0, 44], panel: "Comprehensive Metabolic Panel" },
  "Total Cholesterol": { values: [188, 195, 214, 205, 182, 176, 202], range: [100, 199], panel: "Lipid Panel" },
  LDL: { values: [112, 119, 137, 126, 104, 99, 128], range: [0, 99], panel: "Lipid Panel" },
  HDL: { values: [54, 51, 49, 52, 58, 61, 55], range: [40, 90], panel: "Lipid Panel" },
  Triglycerides: { values: [92, 121, 143, 110, 84, 78, 132], range: [0, 149], panel: "Lipid Panel" },
  "LDL-P": { values: [1250, 1325, 1540, 1420, 1180, 1115, 1495], range: [0, 999], panel: "NMR LipoProfile" },
  "Small LDL-P": { values: [510, 602, 725, 680, 420, 390, 665], range: [0, 527], panel: "NMR LipoProfile" },
  "LP-IR Score": { values: [41, 48, 57, 50, 34, 37, 53], range: [0, 45], panel: "NMR LipoProfile" },
  WBC: { values: [5.8, 6.1, 5.4, 5.9, 6.5, 5.7, 5.6], range: [3.4, 10.8], panel: "Complete Blood Count" },
  Hemoglobin: { values: [15.2, 15.0, 14.6, 15.1, 15.4, 14.9, 15.3], range: [13.0, 17.7], panel: "Complete Blood Count" },
  Platelets: { values: [244, 258, 233, 241, 266, 251, 238], range: [150, 450], panel: "Complete Blood Count" },
  Neutrophils: { values: [55, 58, 61, 57, 54, 56, 59], range: [40, 75], panel: "Complete Blood Count" },
  "Testosterone Total": { values: [522, 548, 610, 585, 642, 598, 568], range: [264, 916], panel: "Hormone Panel" },
  "Testosterone Free": { values: [12.4, 13.1, 14.7, 13.8, 15.3, 14.0, 13.5], range: [8.7, 25.1], panel: "Hormone Panel" },
  "hs-CRP": { values: [1.1, 1.8, 3.2, 2.0, 0.8, 1.0, 2.4], range: [0, 3], panel: "Inflammatory Markers" },
  ESR: { values: [6, 8, 14, 10, 5, 7, 12], range: [0, 15], panel: "Inflammatory Markers" },
  "Urine pH": { values: [6.0, 6.5, 5.5, 6.0, 6.5, 7.0, 6.0], range: [5.0, 8.0], panel: "Urinalysis" },
  "Specific Gravity": { values: [1.018, 1.024, 1.026, 1.02, 1.016, 1.019, 1.025], range: [1.005, 1.03], panel: "Urinalysis" },
};

const qualitativeUa = {
  "Urine Protein": ["Negative", "Negative", "Trace", "Negative", "Negative", "Negative", "Trace"],
  "Urine Ketones": ["Negative", "Negative", "Negative", "Trace", "Negative", "Negative", "Negative"],
  "Urine Blood": ["Negative", "Negative", "Negative", "Negative", "Negative", "Negative", "1+"],
};

function makeResult(draw, biomarker, value, index, config) {
  const meta = biomarkerMeta[biomarker];
  const [referenceMin, referenceMax] = config.range ?? [null, null];

  return {
    id: `${draw.date}-${biomarker}`.replaceAll(" ", "-"),
    date: draw.date,
    provider: draw.provider,
    panel: config.panel,
    biomarker,
    displayName: meta.displayName,
    value,
    unit: meta.unit,
    referenceMin,
    referenceMax,
    status: computeStatus(value, referenceMin, referenceMax),
    category: meta.category,
    subcategory: meta.subcategory,
    sourceFile: `${draw.provider.toLowerCase().replaceAll(" ", "_")}_${draw.date}.pdf`,
    notes: index === 2 && biomarker === "LDL-P" ? "LabCorp NMR LipoProfile marker" : "",
  };
}

function makeQualitativeResult(draw, biomarker, value) {
  const meta = biomarkerMeta[biomarker];
  const flagged = !["Negative", "Normal"].includes(value);

  return {
    id: `${draw.date}-${biomarker}`.replaceAll(" ", "-"),
    date: draw.date,
    provider: draw.provider,
    panel: "Urinalysis",
    biomarker,
    displayName: meta.displayName,
    value,
    unit: "",
    referenceMin: null,
    referenceMax: null,
    status: flagged ? "borderline-high" : "normal",
    category: meta.category,
    subcategory: meta.subcategory,
    sourceFile: `${draw.provider.toLowerCase().replaceAll(" ", "_")}_${draw.date}.pdf`,
    notes: flagged ? "Qualitative UA flag" : "",
  };
}

function addHomaIr(results) {
  const byDate = new Map();
  results.forEach((result) => {
    if (!byDate.has(result.date)) byDate.set(result.date, []);
    byDate.get(result.date).push(result);
  });

  const homa = [];
  byDate.forEach((dateResults, date) => {
    const glucose = dateResults.find((result) => result.biomarker === "Glucose");
    const insulin = dateResults.find((result) => result.biomarker === "Fasting Insulin");
    if (!glucose || !insulin) return;

    const draw = drawDates.find((item) => item.date === date);
    const value = Number(((glucose.value * insulin.value) / 405).toFixed(2));
    homa.push(makeResult(draw, "HOMA-IR", value, 0, {
      panel: "Calculated",
      range: [0.5, 2.0],
    }));
  });

  return [...results, ...homa];
}

const numericResults = Object.entries(series).flatMap(([biomarker, config]) =>
  drawDates.map((draw, index) => makeResult(draw, biomarker, config.values[index], index, config))
);

const uaResults = Object.entries(qualitativeUa).flatMap(([biomarker, values]) =>
  drawDates.map((draw, index) => makeQualitativeResult(draw, biomarker, values[index]))
);

export const mockLabs = addHomaIr([...numericResults, ...uaResults]).sort((a, b) => b.date.localeCompare(a.date));
