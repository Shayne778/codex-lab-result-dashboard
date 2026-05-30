from __future__ import annotations

import json
import re
from collections import Counter
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
LABS_DIR = ROOT / "labs"
OUT_DIR = ROOT / "outputs" / "lab_results_inventory"
OUT_JSON = OUT_DIR / "all_lab_results.json"
OUT_SUMMARY = OUT_DIR / "file_summary.json"

VALUE_TOKEN = r"(?:[<>]=?)?\d+(?:,\d{3})*(?:\.\d+)?|Negative|Positive|Trace|Clear|Cloudy|Yellow|Amber|Straw|None|NONE|Non-Reactive|Reactive|Not\s+Detected|Detected"
VALUE_RE = re.compile(rf"^{VALUE_TOKEN}$", re.I)
DATE_RE = re.compile(r"\b\d{1,2}/\d{1,2}/\d{4}\b")

LABCORP_NO_CODE_PREFIXES = [
    "eGFR",
    "BUN/Creatinine Ratio",
    "Globulin, Total",
    "A/G Ratio",
    "VLDL Cholesterol Cal",
    "LDL/HDL Ratio",
    "Neut/Lymph Ratio",
    "C-Peptide",
]

SKIP_LINE_PREFIXES = (
    "Mckee,",
    "Patient ID:",
    "Specimen ID:",
    "Date Created",
    "All Rights Reserved",
    "This document",
    "If you have received",
    "Test Current Result",
    "Please Note:",
    "Comment:",
    "PDF ",
    "Historical Reporting",
    "Collection Date",
)

QUEST_UNITS = [
    "mg/dL",
    "g/dL",
    "U/L",
    "IU/L",
    "mmol/L",
    "mL/min/1.73m2",
    "mL/min/1.73",
    "% of total Hgb",
    "%",
    "fL",
    "pg",
    "pg/mL",
    "ng/dL",
    "ng/mL",
    "x10E3/uL",
    "x10E6/uL",
    "cells/uL",
    "(calc)",
    "mg/dL (calc)",
]


def clean_text(text: str) -> str:
    return (
        text.replace("\xa0", " ")
        .replace("Â", "")
        .replace("\x00", "")
        .replace("≥", ">=")
        .replace("≤", "<=")
        .replace("−", "-")
    )


def provider_for(text: str) -> str:
    if "Laboratory Corporation" in text or "LabCorp" in text:
        return "LabCorp"
    if "MyChart" in text or "CAPE CORAL HOSPITAL" in text or "Lee Memorial" in text:
        return "Lee Health"
    if "Quest Diagnostics" in text or "FASTING:YES" in text:
        return "Quest Diagnostics"
    return "Other"


def parse_date(text: str, filename: str) -> str:
    for pattern in [r"Date Collected:\s*(\d{1,2}/\d{1,2}/\d{4})", r"Collected:\s*(\d{1,2}/\d{1,2}/\d{4})"]:
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

    return ""


def split_value(raw: str):
    raw = raw.strip()
    comparator = ""
    numeric = None
    text_value = raw
    match = re.match(r"^(?P<comp><=|>=|<|>)?(?P<num>\d+(?:,\d{3})*(?:\.\d+)?)$", raw)
    if match:
        comparator = match.group("comp") or ""
        number = match.group("num").replace(",", "")
        numeric = float(number) if "." in number else int(number)
    return text_value, numeric, comparator


def parse_reference(ref_raw: str):
    ref_raw = " ".join((ref_raw or "").split())
    if not ref_raw:
        return None, None
    range_match = re.search(r"([0-9.]+)\s*-\s*([0-9.]+)", ref_raw)
    if range_match:
        return float(range_match.group(1)), float(range_match.group(2))
    upper = re.search(r"(?:<|<=|below <)\s*([0-9.]+)", ref_raw, re.I)
    if upper:
        return None, float(upper.group(1))
    lower = re.search(r"(?:>|>=|above >=|> OR =)\s*([0-9.]+)", ref_raw, re.I)
    if lower:
        return float(lower.group(1)), None
    return None, None


def inferred_status(value_numeric, value_raw: str, flag: str, ref_min, ref_max):
    if flag:
        return flag
    if value_numeric is None:
        return "Normal" if value_raw.lower() in {"negative", "clear", "yellow", "none", "none seen", "non-reactive"} else ""
    if ref_min is not None and value_numeric < ref_min:
        return "Low"
    if ref_max is not None and value_numeric > ref_max:
        return "High"
    return "Normal"


def make_row(source, page, provider, date, panel, test, value_raw, flag="", unit="", ref_raw="", notes=""):
    value_raw, value_numeric, comparator = split_value(str(value_raw))
    ref_min, ref_max = parse_reference(ref_raw)
    return {
        "source_file": source,
        "page": page,
        "provider": provider,
        "collection_date": date,
        "panel_or_section": panel,
        "test_name": " ".join(test.split()),
        "result_value_raw": value_raw,
        "result_value_numeric": value_numeric,
        "comparator": comparator,
        "flag_reported": flag,
        "unit": unit,
        "reference_range_raw": ref_raw,
        "reference_min": ref_min,
        "reference_max": ref_max,
        "status_inferred": inferred_status(value_numeric, value_raw, flag, ref_min, ref_max),
        "extraction_note": notes,
    }


def is_noise(line: str) -> bool:
    if not line or len(line) < 2:
        return True
    return line.startswith(SKIP_LINE_PREFIXES)


def extract_pdf(path: Path):
    reader = PdfReader(str(path))
    page_texts = [clean_text(page.extract_text() or "") for page in reader.pages]
    full_text = "\n".join(page_texts)
    provider = provider_for(full_text)
    date = parse_date(full_text, path.name)

    if provider == "LabCorp":
        rows = extract_labcorp(path.name, page_texts, provider, date)
    elif provider == "Lee Health":
        rows = extract_mychart(path.name, page_texts, provider, date)
    elif provider == "Quest Diagnostics":
        rows = extract_quest(path.name, page_texts, provider, date)
    else:
        rows = []

    return rows, {
        "source_file": path.name,
        "provider": provider,
        "collection_date": date,
        "pages": len(reader.pages),
        "results_extracted": len(rows),
        "text_characters": len(full_text),
    }


def extract_labcorp(source, page_texts, provider, date):
    rows = []
    current_panel = ""
    for page_idx, text in enumerate(page_texts, start=1):
        lines = [" ".join(line.split()) for line in text.splitlines()]
        for idx, line in enumerate(lines):
            if is_noise(line):
                continue
            next_line = lines[idx + 1] if idx + 1 < len(lines) else ""
            if "Test Current Result" in next_line and not re.search(r"\b\d{2}\b", line):
                current_panel = re.sub(r"\s+\(Cont\.\)$", "", line)
                continue

            parsed = parse_labcorp_coded_line(line, current_panel, source, page_idx, provider, date)
            if parsed:
                rows.append(parsed)
                continue

            parsed = parse_labcorp_no_code_line(line, current_panel, source, page_idx, provider, date)
            if parsed:
                rows.append(parsed)
    return rows


def parse_labcorp_coded_line(line, panel, source, page, provider, date):
    match = re.match(
        rf"^(?P<test>.+?)\s+(?:A,\s*)?(?P<code>\d{{2}})\s+(?P<value>{VALUE_TOKEN})(?:\s+(?P<flag>High|Low|Abnormal))?(?P<tail>.*)$",
        line,
        re.I,
    )
    if not match:
        return None
    test = match.group("test").strip()
    if is_noise(test) or test.lower() in {"pdf", "comment"}:
        return None
    if re.match(r"^(?:[<>]=?|\d)", test):
        return None
    value = match.group("value")
    flag = match.group("flag") or ""
    tail = match.group("tail").strip()
    unit, ref = split_labcorp_tail(tail)
    return make_row(source, page, provider, date, panel, test, value, flag, unit, ref, "LabCorp table row")


def parse_labcorp_no_code_line(line, panel, source, page, provider, date):
    for prefix in LABCORP_NO_CODE_PREFIXES:
        if not line.startswith(prefix + " "):
            continue
        rest = line[len(prefix) :].strip()
        tokens = rest.split()
        if not tokens or not VALUE_RE.match(tokens[0]):
            return None
        value = tokens[0]
        flag = tokens[1] if len(tokens) > 1 and tokens[1] in {"High", "Low", "Abnormal"} else ""
        tail = " ".join(tokens[2 if flag else 1 :])
        unit, ref = split_labcorp_tail(tail)
        return make_row(source, page, provider, date, panel, prefix, value, flag, unit, ref, "LabCorp table row without lab code")
    return None


def split_labcorp_tail(tail: str):
    tail = tail.strip()
    if not tail:
        return "", ""
    date_match = DATE_RE.search(tail)
    if date_match:
        tail = tail[date_match.end() :].strip()

    if not tail:
        return "", ""
    unit_patterns = [
        "mL/min/1.73",
        "mL/min/1.73m2",
        "x10E3/uL",
        "x10E6/uL",
        "uIU/mL",
        "ng/mL",
        "ng/dL",
        "pg/mL",
        "mg/dL",
        "g/dL",
        "mmol/L",
        "IU/L",
        "U/L",
        "umol/L",
        "nmol/L",
        "mg/L",
        "mm/hr",
        "ratio",
        "nm",
        "%",
    ]
    for unit in unit_patterns:
        if tail.startswith(unit):
            return unit, tail[len(unit) :].strip()
    return "", tail


def extract_mychart(source, page_texts, provider, default_date):
    rows = []
    for page_idx, text in enumerate(page_texts, start=1):
        chunks = re.split(r"MyChart", text)
        for chunk in chunks:
            if "Normal range:" not in chunk:
                continue
            date = default_date
            date_match = re.search(r"Collection date:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})", chunk)
            if date_match:
                date = datetime.strptime(date_match.group(1), "%B %d, %Y").date().isoformat()

            panel = spaced_heading_to_words(chunk)
            lines = [line.strip() for line in chunk.splitlines() if line.strip()]
            for idx, line in enumerate(lines):
                if idx + 1 >= len(lines) or not lines[idx + 1].startswith("Normal range:"):
                    continue
                test = line
                if is_noise(test) or test in {"Results", "Narrative"}:
                    continue
                ref_raw = lines[idx + 1].replace("Normal range:", "").strip()
                value, flag = extract_mychart_value(lines[idx + 2 : idx + 18], ref_raw)
                unit = unit_from_range(ref_raw)
                if value is None:
                    continue
                rows.append(make_row(source, page_idx, provider, date, panel, test, value, flag, unit, ref_raw, "MyChart result block"))
    return rows


def spaced_heading_to_words(chunk: str) -> str:
    match = re.search(r"Results\s*\n([A-Z](?:\s+[A-Z0-9,/()&])+)", chunk)
    if not match:
        return ""
    raw = match.group(1)
    return re.sub(r"\s+", "", raw).replace("WITH", " WITH ")


def extract_mychart_value(lines, ref_raw):
    candidates = []
    flag = ""
    for line in lines:
        if line == "Value":
            continue
        cleaned = line.replace(",", "").strip()
        if cleaned.endswith(" High"):
            flag = "High"
            cleaned = cleaned.replace(" High", "")
        elif cleaned.endswith(" Low"):
            flag = "Low"
            cleaned = cleaned.replace(" Low", "")
        if VALUE_RE.match(cleaned):
            candidates.append(cleaned)
    if not candidates:
        return None, flag
    if len(candidates) >= 3:
        return candidates[2], flag
    return candidates[-1], flag


def unit_from_range(ref_raw: str) -> str:
    for unit in QUEST_UNITS:
        if unit in ref_raw:
            return unit
    match = re.search(r"\b([A-Za-z0-9*/.]+/[A-Za-z0-9*.]+)\b", ref_raw)
    return match.group(1) if match else ""


def extract_quest(source, page_texts, provider, date):
    rows = []
    for page_idx, text in enumerate(page_texts, start=1):
        lines = [line.strip() for line in text.splitlines() if line.strip() and line.strip() != "|"]
        candidates = []
        for idx, line in enumerate(lines):
            if not plausible_quest_test_name(line):
                continue
            lookahead = "\n".join(lines[idx + 1 : idx + 12])
            if re.search(r"Reference\s+Range:", lookahead, re.I) or any(unit in lines[idx + 1] if idx + 1 < len(lines) else False for unit in QUEST_UNITS):
                candidates.append(idx)

        for n, idx in enumerate(candidates):
            end = candidates[n + 1] if n + 1 < len(candidates) else min(len(lines), idx + 120)
            block = lines[idx:end]
            parsed = parse_quest_block(block, source, page_idx, provider, date)
            if parsed:
                rows.append(parsed)
    return rows


def plausible_quest_test_name(line: str) -> bool:
    if is_noise(line):
        return False
    if line in {"APPLICABLE", "NOT", "NOT APPLICABLE", "NON-REACTIVE"}:
        return False
    if re.match(r"^(?:[<>]=?|> OR =)\s*\d", line):
        return False
    if re.match(r"^\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?$", line):
        return False
    if len(line) > 70 or re.search(r"\d{1,2}/\d{1,2}/\d{2,4}", line):
        return False
    if line in {"From", "To", "No Historical Data", "FASTING:YES"}:
        return False
    letters = re.sub(r"[^A-Za-z]", "", line)
    if len(letters) < 2:
        return False
    return line.upper() == line or line in {"eGFR NON-AFR. AMERICAN", "eGFR AFRICAN AMERICAN"}


def parse_quest_block(block, source, page, provider, date):
    test = block[0]
    joined = "\n".join(block)
    ref_raw = ""
    unit = ""

    ref_match = re.search(r"Reference\s+Range:\s*\n(?P<body>.*?)(?:\nFrom\n|\nNo Historical Data|\n[A-Z][A-Z /(),-]{3,}\nReference\s+Range:|$)", joined, re.S | re.I)
    if ref_match:
        ref_body_lines = [line.strip() for line in ref_match.group("body").splitlines() if line.strip()]
        ref_raw = " ".join(ref_body_lines[:4])
        unit = next((line for line in ref_body_lines[:6] if any(u in line for u in QUEST_UNITS)), "")

    if not unit:
        unit = next((line for line in block[:8] if any(u in line for u in QUEST_UNITS)), "")

    value = extract_quest_value(test, block, unit)
    if value is None:
        return None
    return make_row(source, page, provider, date, "", test, value, "", unit, ref_raw, "Quest vertical result block")


def extract_quest_value(test: str, block: list[str], unit: str):
    joined = "\n".join(block)
    test_upper = test.upper()
    if "BUN/CREATININE RATIO" in test_upper and "NOT APPLICABLE" in joined:
        return "NOT APPLICABLE"
    if "HEMOGLOBIN A1C" in test_upper:
        match = re.search(r"\n([0-9.]+)\n<5\.7", joined)
        if match:
            return match.group(1)
    if "NON HDL CHOLESTEROL" in test_upper:
        match = re.search(r"\n([0-9.]+)\n<130\n", joined)
        if match:
            return match.group(1)

    start = 1
    for idx, line in enumerate(block):
        if unit and unit in line:
            start = idx + 1
            break
        if re.search(r"Reference\s+Range:", line, re.I):
            start = idx + 1

    candidates = []
    for line in block[start : start + 35]:
        cleaned = line.replace(",", "").strip()
        if cleaned in {"From", "To"}:
            break
        if cleaned.endswith(" High"):
            cleaned = cleaned.replace(" High", "")
        if cleaned.endswith(" Low"):
            cleaned = cleaned.replace(" Low", "")
        if cleaned.endswith(" H"):
            cleaned = cleaned[:-2]
        if cleaned.endswith(" L"):
            cleaned = cleaned[:-2]
        if re.match(r"^\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?$", cleaned):
            continue
        if VALUE_RE.match(cleaned):
            candidates.append(cleaned)
    if not candidates:
        return None
    return candidates[0]


def dedupe(rows):
    seen = set()
    out = []
    for row in rows:
        key = (
            row["source_file"],
            row["page"],
            row["collection_date"],
            row["panel_or_section"],
            row["test_name"],
            row["result_value_raw"],
            row["unit"],
        )
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_rows = []
    summaries = []
    for path in sorted(LABS_DIR.glob("*.pdf")):
        rows, summary = extract_pdf(path)
        rows = dedupe(rows)
        summary["results_extracted"] = len(rows)
        summaries.append(summary)
        all_rows.extend(rows)

    all_rows = dedupe(all_rows)
    all_rows.sort(key=lambda r: (r["collection_date"], r["source_file"], r["page"], r["panel_or_section"], r["test_name"]))
    OUT_JSON.write_text(json.dumps(all_rows, indent=2) + "\n", encoding="utf-8")
    OUT_SUMMARY.write_text(json.dumps(summaries, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {len(all_rows)} result rows")
    for item in summaries:
        print(f"{item['results_extracted']:4d} {item['source_file']}")
    print(dict(Counter(row["provider"] for row in all_rows)))


if __name__ == "__main__":
    main()
