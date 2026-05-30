from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime
from hashlib import sha1
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
LABS_DIR = ROOT / "labs"
OUT_FILE = ROOT / "frontend" / "src" / "data" / "liveLabs.json"


@dataclass(frozen=True)
class Marker:
    canonical: str
    labels: tuple[str, ...]
    category: str
    subcategory: str
    unit: str
    panel: str
    reference_min: float | None = None
    reference_max: float | None = None
    labcorp_panel: str | None = None


MARKERS = [
    Marker("Glucose", ("Glucose", "GLUCOSE"), "Metabolic", "Blood Sugar", "mg/dL", "Comprehensive Metabolic Panel", 70, 99),
    Marker("BUN", ("BUN", "UREA NITROGEN (BUN)"), "Metabolic", "Kidney", "mg/dL", "Comprehensive Metabolic Panel", 6, 20),
    Marker("Creatinine", ("Creatinine", "CREATININE"), "Metabolic", "Kidney", "mg/dL", "Comprehensive Metabolic Panel", 0.76, 1.27),
    Marker("eGFR", ("eGFR", "Glomerular Filtration Rate (eGFR)", "eGFR NON-AFR. AMERICAN"), "Metabolic", "Kidney", "mL/min/1.73m2", "Comprehensive Metabolic Panel", 60, None),
    Marker("Sodium", ("Sodium", "SODIUM"), "Metabolic", "Electrolytes", "mmol/L", "Comprehensive Metabolic Panel", 134, 144),
    Marker("Potassium", ("Potassium", "POTASSIUM"), "Metabolic", "Electrolytes", "mmol/L", "Comprehensive Metabolic Panel", 3.5, 5.2),
    Marker("Chloride", ("Chloride", "CHLORIDE"), "Metabolic", "Electrolytes", "mmol/L", "Comprehensive Metabolic Panel", 96, 106),
    Marker("CO2", ("Carbon Dioxide, Total", "CO2"), "Metabolic", "Electrolytes", "mmol/L", "Comprehensive Metabolic Panel", 20, 30),
    Marker("Calcium", ("Calcium", "CALCIUM"), "Metabolic", "Electrolytes", "mg/dL", "Comprehensive Metabolic Panel", 8.7, 10.2),
    Marker("Albumin", ("Albumin", "ALBUMIN"), "Metabolic", "Liver", "g/dL", "Comprehensive Metabolic Panel", 3.5, 5.2),
    Marker("Total Bilirubin", ("Bilirubin, Total", "BILIRUBIN, TOTAL"), "Metabolic", "Liver", "mg/dL", "Comprehensive Metabolic Panel", 0, 1.2),
    Marker("Alkaline Phosphatase", ("Alkaline Phosphatase", "ALKALINE PHOSPHATASE"), "Metabolic", "Liver", "U/L", "Comprehensive Metabolic Panel", 38, 126),
    Marker("AST", ("AST (SGOT)", "AST"), "Metabolic", "Liver", "U/L", "Comprehensive Metabolic Panel", 0, 40),
    Marker("ALT", ("ALT (SGPT)", "ALT"), "Metabolic", "Liver", "U/L", "Comprehensive Metabolic Panel", 0, 44),
    Marker("Total Cholesterol", ("Cholesterol, Total", "Cholesterol", "CHOLESTEROL, TOTAL"), "Lipids", "Standard Panel", "mg/dL", "Lipid Panel", 100, 199, "Lipid Panel With LDL/HDL Ratio"),
    Marker("Triglycerides", ("Triglycerides", "Triglyceride", "TRIGLYCERIDES"), "Lipids", "Standard Panel", "mg/dL", "Lipid Panel", 0, 149, "Lipid Panel With LDL/HDL Ratio"),
    Marker("HDL", ("HDL Cholesterol", "Cholesterol, HDL", "HDL CHOLESTEROL"), "Lipids", "Standard Panel", "mg/dL", "Lipid Panel", 40, None, "Lipid Panel With LDL/HDL Ratio"),
    Marker("LDL", ("LDL Chol Calc (NIH)", "Cholesterol, LDL (calculated)", "LDL-CHOLESTEROL"), "Lipids", "Standard Panel", "mg/dL", "Lipid Panel", 0, 99, "Lipid Panel With LDL/HDL Ratio"),
    Marker("LDL-P", ("LDL-P",), "Lipids", "NMR Profile", "nmol/L", "NMR LipoProfile", 0, 999, "NMR LipoProfile"),
    Marker("Small LDL-P", ("Small LDL-P",), "Lipids", "NMR Profile", "nmol/L", "NMR LipoProfile", 0, 527, "NMR LipoProfile"),
    Marker("LDL Size", ("LDL Size",), "Lipids", "NMR Profile", "nm", "NMR LipoProfile", 20.5, None, "NMR LipoProfile"),
    Marker("HDL-P", ("HDL-P (Total)",), "Lipids", "NMR Profile", "umol/L", "NMR LipoProfile", 30.5, None, "NMR LipoProfile"),
    Marker("Large HDL-P", ("Large HDL-P",), "Lipids", "NMR Profile", "umol/L", "NMR LipoProfile", 4.8, None, "NMR LipoProfile"),
    Marker("LP-IR Score", ("LP-IR Score",), "Lipids", "NMR Profile", "score", "NMR LipoProfile", 0, 45, "NMR LipoProfile"),
    Marker("WBC", ("WBC", "WHITE BLOOD CELL COUNT"), "CBC", "Cell Counts", "x10E3/uL", "Complete Blood Count", 3.4, 10.8),
    Marker("RBC", ("RBC", "RED BLOOD CELL COUNT"), "CBC", "Cell Counts", "x10E6/uL", "Complete Blood Count", 4.14, 5.8),
    Marker("Hemoglobin", ("Hemoglobin", "HEMOGLOBIN"), "CBC", "Cell Counts", "g/dL", "Complete Blood Count", 13, 17.7),
    Marker("Hematocrit", ("Hematocrit", "HEMATOCRIT"), "CBC", "Cell Counts", "%", "Complete Blood Count", 37.5, 52),
    Marker("MCV", ("MCV",), "CBC", "Cell Counts", "fL", "Complete Blood Count", 79, 100),
    Marker("MCH", ("MCH",), "CBC", "Cell Counts", "pg", "Complete Blood Count", 26, 34),
    Marker("MCHC", ("MCHC",), "CBC", "Cell Counts", "g/dL", "Complete Blood Count", 31, 36),
    Marker("RDW", ("RDW",), "CBC", "Cell Counts", "%", "Complete Blood Count", 10.5, 15.4),
    Marker("Platelets", ("Platelets", "Platelet Count", "PLATELET COUNT"), "CBC", "Cell Counts", "x10E3/uL", "Complete Blood Count", 150, 450),
    Marker("Neutrophils", ("Neutrophils", "Neutrophils %"), "CBC", "Differential", "%", "Complete Blood Count", 40, 77),
    Marker("Lymphocytes", ("Lymphs", "Lymphocytes %"), "CBC", "Differential", "%", "Complete Blood Count", 12, 45),
    Marker("Monocytes", ("Monocytes", "Monocytes %"), "CBC", "Differential", "%", "Complete Blood Count", 4, 12),
    Marker("Eosinophils", ("Eos", "Eosinophils %"), "CBC", "Differential", "%", "Complete Blood Count", 0, 6),
    Marker("Basophils", ("Basos", "Basophils %"), "CBC", "Differential", "%", "Complete Blood Count", 0, 2),
    Marker("Testosterone Total", ("Testosterone", "Testosterone, Total"), "Hormones", "Androgens", "ng/dL", "Hormone Panel", 264, 916),
    Marker("Testosterone Free", ("Free Testosterone(Direct)", "Testosterone, Free"), "Hormones", "Androgens", "pg/mL", "Hormone Panel", 9.3, 26.5),
    Marker("HbA1c", ("Hemoglobin A1c", "HEMOGLOBIN A1c"), "Metabolic", "Blood Sugar", "%", "Hemoglobin A1c", 4.8, 5.6),
    Marker("Fasting Insulin", ("Insulin",), "Metabolic", "Blood Sugar", "uIU/mL", "Insulin", 2.6, 24.9),
    Marker("Apolipoprotein B", ("Apolipoprotein B",), "Lipids", "Standard Panel", "mg/dL", "Apolipoprotein B", 0, 90),
    Marker("hs-CRP", ("C-Reactive Protein, Cardiac",), "Inflammatory", "Cardio Risk", "mg/L", "Inflammatory Markers", 0, 3),
    Marker("ESR", ("Sedimentation Rate-Westergren",), "Inflammatory", "Systemic", "mm/hr", "Inflammatory Markers", 0, 15),
    Marker("Uric Acid", ("Uric Acid",), "Metabolic", "Blood Sugar", "mg/dL", "Metabolic", 3.8, 8.4),
    Marker("Urine pH", ("pH",), "Urinalysis", "Chemistry", "", "Urinalysis", 5, 7.5),
    Marker("Specific Gravity", ("Specific Gravity",), "Urinalysis", "Chemistry", "", "Urinalysis", 1.005, 1.03),
    Marker("Urine Protein", ("Protein",), "Urinalysis", "Chemistry", "", "Urinalysis"),
    Marker("Urine Glucose", ("Glucose",), "Urinalysis", "Chemistry", "", "Urinalysis"),
    Marker("Urine Ketones", ("Ketones",), "Urinalysis", "Chemistry", "", "Urinalysis"),
    Marker("Urine Blood", ("Occult Blood", "Blood"), "Urinalysis", "Chemistry", "", "Urinalysis"),
    Marker("Nitrite", ("Nitrite, Urine", "Nitrite"), "Urinalysis", "Chemistry", "", "Urinalysis"),
    Marker("Leukocyte Esterase", ("WBC Esterase", "Leukocyte Esterase"), "Urinalysis", "Chemistry", "", "Urinalysis"),
]


VALUE_RE = re.compile(r"^(?:[<>]=?)?\d+(?:,\d{3})*(?:\.\d+)?$")
DATE_RE = re.compile(r"\b\d{1,2}/\d{1,2}/\d{4}\b")


def clean_text(text: str) -> str:
    return (
        text.replace("\xa0", " ")
        .replace("Â", "")
        .replace("\x00", "")
        .replace("−", "-")
        .replace(">= ", ">=")
    )


def provider_for(text: str) -> str:
    if "Laboratory Corporation" in text or "LabCorp" in text:
        return "LabCorp"
    if "MyChart" in text or "CAPE CORAL HOSPITAL" in text or "Lee Memorial" in text:
        return "Lee Health"
    if "Quest Diagnostics" in text or "FASTING:YES" in text:
        return "Quest Diagnostics"
    return "Other"


def parse_date(text: str, provider: str, filename: str) -> str:
    patterns = [
        r"Date Collected:\s*(\d{1,2}/\d{1,2}/\d{4})",
        r"Collected:\s*(\d{1,2}/\d{1,2}/\d{4})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return datetime.strptime(match.group(1), "%m/%d/%Y").date().isoformat()

    match = re.search(r"Collection date:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})", text)
    if match:
        return datetime.strptime(match.group(1), "%B %d, %Y").date().isoformat()

    match = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", filename)
    if match:
        month, day, year = match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"

    raise ValueError(f"Could not determine collection date for {filename}")


def to_number(token: str) -> float | str:
    token = token.strip().replace(",", "")
    if token.startswith("<") or token.startswith(">"):
        numeric = re.sub(r"^[<>]=?", "", token)
        return float(numeric) if "." in numeric else int(numeric)
    return float(token) if "." in token else int(token)


def normalize_value(raw: str) -> float | int | str:
    raw = raw.strip().replace(",", "")
    if VALUE_RE.match(raw):
        return to_number(raw)
    return raw


def parse_range(raw: str, fallback_min: float | None, fallback_max: float | None) -> tuple[float | None, float | None]:
    raw = raw.strip()
    if not raw or raw.lower().startswith("not"):
        return fallback_min, fallback_max
    range_match = re.search(r"([0-9.]+)\s*-\s*([0-9.]+)", raw)
    if range_match:
        return float(range_match.group(1)), float(range_match.group(2))
    upper_match = re.search(r"(?:<|<=|below <)\s*([0-9.]+)", raw)
    if upper_match:
        return fallback_min if fallback_min is not None else 0, float(upper_match.group(1))
    lower_match = re.search(r"(?:>|>=|above >=|> OR =)\s*([0-9.]+)", raw)
    if lower_match:
        return float(lower_match.group(1)), fallback_max
    return fallback_min, fallback_max


def status_for(value: float | int | str, ref_min: float | None, ref_max: float | None, flag: str | None = None) -> str:
    if isinstance(value, str):
        return "normal" if value.lower() in {"negative", "normal", "clear", "yellow"} else "borderline-high"
    if flag == "High":
        return "high"
    if flag == "Low":
        return "low"
    if ref_min is not None and value < ref_min:
        return "low"
    if ref_max is not None and value > ref_max:
        return "high"
    if ref_min is not None and ref_max is not None and ref_max > ref_min:
        buffer = (ref_max - ref_min) * 0.1
        if value <= ref_min + buffer:
            return "borderline-low"
        if value >= ref_max - buffer:
            return "borderline-high"
    return "normal"


def result_id(date: str, provider: str, canonical: str, panel: str, source: str) -> str:
    digest = sha1(f"{date}|{provider}|{canonical}|{panel}|{source}".encode()).hexdigest()[:10]
    slug = re.sub(r"[^a-z0-9]+", "-", canonical.lower()).strip("-")
    return f"{date}-{slug}-{digest}"


def make_result(marker: Marker, value, date: str, provider: str, source: str, panel: str | None = None, ref_raw: str = "", flag: str | None = None):
    ref_min, ref_max = parse_range(ref_raw, marker.reference_min, marker.reference_max)
    return {
        "id": result_id(date, provider, marker.canonical, panel or marker.panel, source),
        "date": date,
        "provider": provider,
        "panel": panel or marker.panel,
        "biomarker": marker.canonical,
        "displayName": marker.canonical.replace("Total Cholesterol", "Total Cholesterol"),
        "value": value,
        "unit": marker.unit,
        "referenceMin": ref_min,
        "referenceMax": ref_max,
        "status": status_for(value, ref_min, ref_max, flag),
        "category": marker.category,
        "subcategory": marker.subcategory,
        "sourceFile": source,
        "notes": "Extracted from PDF text layer",
    }


def extract_labcorp(text: str, date: str, provider: str, source: str) -> list[dict]:
    results = []
    current_panel = ""
    panel_headings = [
        "NMR LipoProfile+Lipids+IR+Gph",
        "CBC with Diff, Platelet, NLR",
        "Comp. Metabolic Panel (14)",
        "Lipid Panel With LDL/HDL Ratio",
        "Testosterone,Free and Total",
        "Hemoglobin A1c",
        "Insulin",
        "Urinalysis, Routine",
    ]
    labcorp_label_pairs = sorted(
        [
            (label, marker)
            for marker in MARKERS
            for label in marker.labels
            if marker.category != "Urinalysis" and label not in {"Protein", "Blood", "pH"}
        ],
        key=lambda pair: len(pair[0]),
        reverse=True,
    )

    for raw_line in text.splitlines():
        line = " ".join(raw_line.split())
        if not line:
            continue
        for heading in panel_headings:
            if line == heading or line.startswith(f"{heading} ("):
                current_panel = heading

        if current_panel == "Urinalysis, Routine":
            results.extend(extract_labcorp_ua_line(line, date, provider, source))
            continue

        for label, marker in labcorp_label_pairs:
            if not line.startswith(label):
                continue
            if marker.labcorp_panel and marker.labcorp_panel not in current_panel and marker.category != "Lipids":
                continue
            if marker.subcategory == "Standard Panel" and current_panel != "Lipid Panel With LDL/HDL Ratio":
                continue
            if marker.subcategory == "NMR Profile" and "NMR LipoProfile" not in current_panel:
                continue
            rest = line[len(label) :].strip()
            tokens = rest.split()
            value_token = None
            flag = None
            for idx, token in enumerate(tokens):
                if token in {"A,", "01", "02", "03"}:
                    continue
                if VALUE_RE.match(token):
                    value_token = token
                    if idx + 1 < len(tokens) and tokens[idx + 1] in {"High", "Low"}:
                        flag = tokens[idx + 1]
                    break
            if value_token is None:
                continue
            ref_raw = ""
            if marker.unit and marker.unit in line:
                ref_raw = line.split(marker.unit, 1)[-1].strip()
            elif tokens:
                ref_raw = tokens[-1]
            results.append(make_result(marker, normalize_value(value_token), date, provider, source, marker.panel, ref_raw, flag))
            break
    return results


def extract_labcorp_ua_line(line: str, date: str, provider: str, source: str) -> list[dict]:
    found = []
    ua_map = {
        "Specific Gravity": "Specific Gravity",
        "pH": "Urine pH",
        "Color": None,
        "Appearance": None,
        "WBC Esterase": "Leukocyte Esterase",
        "Protein": "Urine Protein",
        "Glucose": "Urine Glucose",
        "Ketones": "Urine Ketones",
        "Occult Blood": "Urine Blood",
        "Nitrite, Urine": "Nitrite",
    }
    for label, canonical in ua_map.items():
        if canonical is None or not line.startswith(label):
            continue
        marker = next(item for item in MARKERS if item.canonical == canonical)
        rest = line[len(label) :].strip()
        tokens = [tok for tok in rest.split() if tok not in {"01", "02", "03"}]
        if not tokens:
            continue
        value_token = next((tok for tok in tokens if VALUE_RE.match(tok) or tok in {"Negative", "Trace", "Clear", "Yellow"}), tokens[0])
        found.append(make_result(marker, normalize_value(value_token), date, provider, source, "Urinalysis"))
    return found


def extract_mychart(text: str, date: str, provider: str, source: str) -> list[dict]:
    results = []
    for marker in MARKERS:
        if marker.category == "Urinalysis":
            continue
        for label in marker.labels:
            pattern = re.compile(re.escape(label) + r"\s*\nNormal range:\s*(?P<range>[^\n]+)(?P<body>.*?)(?:MyChart|Normal range:|$)", re.S | re.I)
            match = pattern.search(text)
            if not match:
                continue
            body_lines = [line.strip() for line in match.group("body").splitlines() if line.strip()]
            candidates = []
            for line in body_lines[:18]:
                line = line.replace("High", "").replace("Low", "").strip()
                if VALUE_RE.match(line):
                    candidates.append(line)
            if not candidates:
                continue
            value_token = candidates[-1] if len(candidates) <= 3 else candidates[2]
            flag = "High" if "High" in match.group("body")[:120] else "Low" if "Low" in match.group("body")[:120] else None
            results.append(make_result(marker, normalize_value(value_token), date, provider, source, marker.panel, match.group("range"), flag))
            break
    return results


def extract_quest(text: str, date: str, provider: str, source: str) -> list[dict]:
    lines = [line.strip() for line in text.splitlines() if line.strip() and line.strip() != "|"]
    results = []
    seen = set()
    quest_markers = [m for m in MARKERS if m.category != "Urinalysis" and m.subcategory != "NMR Profile"]
    for idx, line in enumerate(lines):
        for marker in quest_markers:
            if line.upper() not in {label.upper() for label in marker.labels}:
                continue
            if marker.canonical in seen:
                continue
            block = lines[idx : idx + 90]
            if "Reference Range:" not in block[:10]:
                continue
            ref_raw = ""
            unit = marker.unit
            if "Reference Range:" in block:
                ref_idx = block.index("Reference Range:")
                ref_parts = []
                for item in block[ref_idx + 1 : ref_idx + 8]:
                    ref_parts.append(item)
                    if any(u in item for u in ["mg/dL", "g/dL", "mmol/L", "%", "fL", "pg", "mL/min", "x10"]):
                        break
                ref_raw = " ".join(ref_parts)
            value = quest_value(marker, block)
            if value is None:
                continue
            results.append(make_result(marker, value, date, provider, source, marker.panel, ref_raw))
            seen.add(marker.canonical)
    return results


def quest_value(marker: Marker, block: list[str]):
    joined = "\n".join(block)
    if marker.canonical == "HbA1c":
        match = re.search(r"\n([0-9.]+)\n<5\.7", joined)
        if match:
            return normalize_value(match.group(1))
    if marker.canonical == "LDL":
        for line in block[:18]:
            if VALUE_RE.match(line):
                val = normalize_value(line)
                if isinstance(val, (int, float)) and 20 <= val <= 300:
                    return val
    try:
        unit_idx = next(i for i, line in enumerate(block) if marker.unit and marker.unit in line)
    except StopIteration:
        unit_idx = 0
    for line in block[unit_idx + 1 : unit_idx + 24]:
        token = line.split()[0]
        if VALUE_RE.match(token):
            val = normalize_value(token)
            if isinstance(val, (int, float)):
                return val
    return None


def add_homa_ir(results: list[dict]) -> list[dict]:
    by_date = {}
    for result in results:
        by_date.setdefault((result["date"], result["provider"], result["sourceFile"]), []).append(result)
    homa_marker = next(marker for marker in MARKERS if marker.canonical == "Fasting Insulin")
    out = list(results)
    for (date, provider, source), items in by_date.items():
        glucose = next((item for item in items if item["biomarker"] == "Glucose" and isinstance(item["value"], (int, float))), None)
        insulin = next((item for item in items if item["biomarker"] == "Fasting Insulin" and isinstance(item["value"], (int, float))), None)
        if not glucose or not insulin:
            continue
        marker = Marker("HOMA-IR", ("HOMA-IR",), "Metabolic", "Blood Sugar", "score", "Calculated", 0.5, 2.0)
        value = round((glucose["value"] * insulin["value"]) / 405, 2)
        out.append(make_result(marker, value, date, provider, source, "Calculated", "0.5-2.0"))
    return out


def extract_file(path: Path) -> list[dict]:
    reader = PdfReader(str(path))
    text = clean_text("\n".join(page.extract_text() or "" for page in reader.pages))
    provider = provider_for(text)
    date = parse_date(text, provider, path.name)
    if provider == "LabCorp":
        return extract_labcorp(text, date, provider, path.name)
    if provider == "Lee Health":
        return extract_mychart(text, date, provider, path.name)
    if provider == "Quest Diagnostics":
        return extract_quest(text, date, provider, path.name)
    return []


def dedupe(results: list[dict]) -> list[dict]:
    by_key = {}
    for result in results:
        key = (result["date"], result["provider"], result["panel"], result["biomarker"], json.dumps(result["value"]))
        by_key.setdefault(key, result)
    return sorted(by_key.values(), key=lambda item: (item["date"], item["category"], item["biomarker"]))


def main() -> int:
    all_results = []
    counts = {}
    for path in sorted(LABS_DIR.glob("*.pdf")):
        extracted = extract_file(path)
        counts[path.name] = len(extracted)
        all_results.extend(extracted)
    all_results = dedupe(add_homa_ir(all_results))
    OUT_FILE.write_text(json.dumps(all_results, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(all_results)} normalized results to {OUT_FILE}")
    for name, count in counts.items():
        print(f"{count:3d} {name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
