# LabVault — Personal Lab Results Dashboard
## Codex Project Specification

---

## Project Overview

LabVault is a personal health data dashboard that ingests PDF lab results from multiple providers (Quest Diagnostics, LabCorp, Lee Health, and others), normalizes them into a unified data store, and presents them as a beautiful, interactive visual dashboard.

**Core goals:**
- Upload PDFs (text-based or screenshot/scanned) → auto-parse → save
- Track biomarkers over time with trend charts and reference range overlays
- Visually stunning, modern UI that feels like a premium health analytics product
- Runs locally (no cloud, no accounts, full privacy)
- Easily updatable when new labs arrive

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend Framework | React + Vite | Fast, modern, great ecosystem |
| Styling | Tailwind CSS v3 + CSS variables | Utility-first + design token consistency |
| Charts | Recharts | Composable, React-native, flexible |
| Animations | Framer Motion | Smooth, production-grade transitions |
| Backend | Node.js + Express | Minimal API for PDF ingestion and data I/O |
| PDF Parsing | pdfjs-dist + Tesseract.js | Text PDFs + OCR fallback for screenshots |
| AI Fallback Parser | OpenAI API (vision-capable model configured via `.env`) | Vision-based extraction for unknown/complex PDFs |
| Data Storage | Flat JSON file (`data/labs.json`) | Simple, portable, no DB setup required |
| File Upload | Multer | Multipart form handling |
| Icons | Lucide React | Clean, consistent icon set |

---

## Project Structure

```
labvault/
├── AGENTS.md                    ← Codex project instructions (always read this first)
├── package.json                 ← Monorepo or split; prefer monorepo for simplicity
│
├── backend/
│   ├── server.js                ← Express app, routes, middleware
│   ├── routes/
│   │   ├── upload.js            ← POST /api/upload — receive PDF, parse, save
│   │   ├── labs.js              ← GET /api/labs — return all normalized data
│   │   └── sync.js              ← POST /api/sync — manually trigger re-parse
│   ├── parsers/
│   │   ├── index.js             ← Parser router — detects provider, delegates
│   │   ├── quest.js             ← Quest Diagnostics parser
│   │   ├── labcorp.js           ← LabCorp parser (incl. NMR Lipoprofile)
│   │   ├── leehealth.js         ← Lee Health parser
│   │   ├── generic.js           ← Regex-based fallback for unknown providers
│   │   └── vision.js            ← OpenAI API vision parser for screenshots/OCR failures
│   ├── utils/
│   │   ├── normalize.js         ← Map parsed values → standard schema
│   │   ├── referenceRanges.js   ← Canonical reference ranges by biomarker
│   │   └── storage.js           ← Read/write labs.json
│   ├── data/
│   │   └── labs.json            ← Persistent data store (auto-created)
│   └── uploads/                 ← Temp PDF staging (cleared after parse)
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              ← Root: layout shell, routing
│   │   ├── styles/
│   │   │   ├── globals.css      ← CSS variables, base resets
│   │   │   └── theme.js         ← Design tokens as JS (for Recharts colors)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx          ← Category navigation + upload button
│   │   │   │   ├── TopBar.jsx           ← Filters: date range, provider, status
│   │   │   │   └── PageWrapper.jsx      ← Consistent page padding/transitions
│   │   │   ├── dashboard/
│   │   │   │   ├── HeroMetrics.jsx      ← Top row: key biomarker summary cards
│   │   │   │   ├── BiomarkerCard.jsx    ← Single metric: value, status, sparkline, delta
│   │   │   │   ├── TrendChart.jsx       ← Time-series line chart, one or many biomarkers
│   │   │   │   ├── ReferenceBar.jsx     ← Visual range indicator (like a gauge/spectrum)
│   │   │   │   ├── LabTable.jsx         ← Full sortable/filterable results table
│   │   │   │   ├── CategoryView.jsx     ← Per-category page (e.g., "Lipids")
│   │   │   │   └── ProviderBadge.jsx    ← Color-coded provider label chip
│   │   │   ├── upload/
│   │   │   │   ├── UploadModal.jsx      ← Drag-and-drop PDF uploader
│   │   │   │   ├── ParsePreview.jsx     ← Show parsed results for confirmation
│   │   │   │   └── UploadStatus.jsx     ← Progress/success/error states
│   │   │   └── ui/
│   │   │       ├── StatusDot.jsx        ← Green/yellow/red indicator dot
│   │   │       ├── TrendArrow.jsx       ← ↑ ↓ → trend indicator with color
│   │   │       ├── Tooltip.jsx          ← Custom chart tooltip
│   │   │       └── EmptyState.jsx       ← Friendly empty state for new users
│   │   ├── hooks/
│   │   │   ├── useLabs.js       ← Fetch + cache all lab data from API
│   │   │   ├── useFilters.js    ← Date range, provider, category filter state
│   │   │   └── useBiomarker.js  ← Get all readings for a specific biomarker
│   │   ├── utils/
│   │   │   ├── formatters.js    ← Date formatting, unit display, rounding
│   │   │   ├── statusCalc.js    ← Compute normal/borderline/abnormal from value + range
│   │   │   └── trendCalc.js     ← Delta %, direction, rate of change
│   │   └── data/
│   │       └── biomarkerMeta.js ← Display names, units, categories, descriptions
```

---

## Data Schema

Every result from every provider is normalized into this shape before saving:

```json
{
  "id": "uuid-v4",
  "date": "2024-11-15",
  "provider": "Quest Diagnostics",
  "panel": "Comprehensive Metabolic Panel",
  "biomarker": "Glucose",
  "displayName": "Glucose",
  "value": 94,
  "unit": "mg/dL",
  "referenceMin": 70,
  "referenceMax": 100,
  "status": "normal",
  "category": "Metabolic",
  "subcategory": "Blood Sugar",
  "sourceFile": "quest_2024-11-15.pdf",
  "notes": ""
}
```

**Status values:** `"normal"` | `"borderline-low"` | `"borderline-high"` | `"low"` | `"high"`

Borderline = within 10% of the reference limit (configurable in `referenceRanges.js`).

---

## Biomarker Categories & Tracked Panels

### Complete Blood Count (CBC)
- WBC, RBC, Hemoglobin, Hematocrit
- MCV, MCH, MCHC, RDW
- Platelets, Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils

### Comprehensive Metabolic Panel (CMP)
- Glucose, BUN, Creatinine, eGFR
- Sodium, Potassium, Chloride, CO2, Calcium
- Total Protein, Albumin, Total Bilirubin
- ALT (SGPT), AST (SGOT), Alkaline Phosphatase

### Lipid Panel
- Total Cholesterol, LDL, HDL, Triglycerides
- Non-HDL Cholesterol, TC/HDL Ratio

### NMR LipoProfile (LabCorp)
- LDL-P (Total), Small LDL-P, LDL Size
- HDL-P (Total), Large HDL-P
- LP-IR Score

### Hormones
- Testosterone Total, Testosterone Free, Testosterone Bioavailable
- SHBG, Estradiol, Progesterone
- DHEA-S, Cortisol

### Thyroid (if tracked)
- TSH, Free T3, Free T4, Reverse T3
- TPO Antibodies

### Inflammatory Markers
- ESR (Erythrocyte Sedimentation Rate)
- CRP (High Sensitivity), Homocysteine

### Metabolic / Insulin Resistance
- HbA1c, Fasting Insulin
- HOMA-IR (calculated: Insulin × Glucose / 405)
- Uric Acid

### Urinalysis (UA)
- pH, Specific Gravity, Protein, Glucose, Ketones
- Blood, Nitrite, Leukocyte Esterase, WBC, RBC (micro)

---

## Visual Design System

### Aesthetic Direction: "Clinical Precision"
Dark-mode first. Think Bloomberg Terminal meets a premium health tech product.
Feels like **mission control for your body** — data-dense but never cluttered.
Every number has weight. Color carries meaning, not decoration.

### Color Palette (CSS Variables)
```css
:root {
  /* Backgrounds */
  --bg-base: #080d1a;          /* deepest background */
  --bg-surface: #0f1629;       /* cards, panels */
  --bg-elevated: #162038;      /* hover states, active */
  --bg-border: #1e2d4a;        /* subtle borders */

  /* Text */
  --text-primary: #e8eef7;     /* main content */
  --text-secondary: #7a94b8;   /* labels, metadata */
  --text-muted: #3d5270;       /* disabled, placeholder */

  /* Status Colors */
  --status-normal: #00d4a0;    /* teal-green: in range */
  --status-borderline: #f5a623; /* amber: approaching limit */
  --status-high: #ff4d6d;      /* rose-red: above range */
  --status-low: #6c8ebf;       /* muted blue: below range */

  /* Accent */
  --accent-primary: #3d8ef8;   /* interactive blue */
  --accent-glow: rgba(61, 142, 248, 0.15);

  /* Provider Colors */
  --provider-quest: #e85d4a;
  --provider-labcorp: #4a7fe8;
  --provider-leehealth: #48c78e;
  --provider-other: #9b6ef3;
}
```

### Typography
```css
/* Display / Headers */
font-family: 'DM Mono', monospace;   /* data values, numbers */
font-family: 'Syne', sans-serif;     /* section headers, panel names */

/* Body */
font-family: 'Inter', sans-serif;    /* readable prose, labels */
```
Load from Google Fonts: `Syne:wght@400;600;700,800`, `DM Mono:wght@400;500`, `Inter:wght@400;500`

### Chart Theming
- Background: transparent (inherits card bg)
- Grid lines: `--bg-border` at 40% opacity
- Reference range band: shaded overlay in `--status-normal` at 8% opacity
- Line stroke width: 2.5px
- Dots: 5px radius, filled, with ring on hover
- Tooltip: glassmorphism (`backdrop-filter: blur(12px)`, semi-transparent dark bg)

---

## Dashboard Layout Specification

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR (240px fixed)     │ MAIN CONTENT AREA                    │
│                           │                                       │
│  LabVault logo            │  TOP BAR                              │
│  ─────────────            │  [Date Range ▼] [Provider ▼] [Status ▼] [Search] │
│  Overview                 │  ─────────────────────────────────── │
│  ─────────────            │                                       │
│  Metabolic                │  HERO METRICS ROW (latest key values) │
│    └ Blood Sugar          │  [Glucose] [HbA1c] [Insulin] [eGFR]  │
│    └ Kidney               │  [Cholesterol] [LDL-P] [Testo] [ESR] │
│    └ Liver                │                                       │
│  Lipids                   │  TREND SECTION                        │
│    └ Standard Panel       │  [Chart: selected biomarker over time]│
│    └ NMR Profile          │  Biomarker picker tabs                │
│  CBC                      │                                       │
│  Hormones                 │  ALL RESULTS TABLE                    │
│  Inflammatory             │  Sortable, filterable, paginated      │
│  Urinalysis               │                                       │
│  ─────────────            │                                       │
│  [⬆ Upload Labs]          │                                       │
│  [⚙ Settings]             │                                       │
└───────────────────────────┴───────────────────────────────────────┘
```

### Hero Biomarker Card Structure
Each card shows:
- Biomarker name (small, muted)
- Current value + unit (large, bold, DM Mono)
- Status dot + label (Normal / High / Low)
- Delta from previous (↑ +3.2% | ↓ -1.1%)
- Mini sparkline (last 6 readings)
- Last drawn date (muted)

### Trend Chart Features
- Toggle between individual biomarkers or overlay mode (e.g., LDL + LDL-P together)
- Shaded green band = reference range
- Points colored by status (normal/abnormal)
- Hover tooltip: date, value, provider, reference range, status
- Zoom: scroll to zoom time axis
- Annotations: flag out-of-range points automatically

---

## PDF Parsing Strategy

### Parser Selection Logic (`parsers/index.js`)
```
1. Extract text from PDF (pdfjs-dist)
2. Detect provider from text patterns:
   - "Quest Diagnostics" → quest.js
   - "Laboratory Corporation" or "LabCorp" → labcorp.js
   - "Lee Health" or "Lee Memorial" → leehealth.js
   - "NMR LipoProfile" → labcorp.js (NMR mode)
   - No match → generic.js
3. If generic.js extracts < 5 biomarkers → fall through to vision.js
4. If PDF has no text layer (scanned) → vision.js directly
```

### Vision Parser (vision.js)
Uses an OpenAI vision-capable model configured by `OPENAI_VISION_MODEL` with the PDF page as an image.

Prompt template:
```
You are a medical lab result parser. Extract ALL lab results from this image.
Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "provider": "string",
  "date": "YYYY-MM-DD",
  "panel": "string",
  "results": [
    {
      "biomarker": "string",
      "value": number,
      "unit": "string",
      "referenceMin": number or null,
      "referenceMax": number or null,
      "status": "normal" | "high" | "low" | "unknown"
    }
  ]
}
If a field is not found, use null. Date format must be YYYY-MM-DD.
```

### Confirmation Step (ALWAYS required)
After parsing (any method), the frontend shows a `ParsePreview` modal:
- Table of extracted results
- User can edit/delete individual rows
- User must click "Save to Dashboard" to persist
- This catches parser errors before they corrupt the data store

---

## Build Phases

### Phase 1 — Foundation & UI Shell (Start Here)
- [ ] Set up Vite + React + Tailwind
- [ ] Implement design system (CSS variables, fonts, colors)
- [ ] Build layout: Sidebar + TopBar + main content area
- [ ] Create mock data file with realistic sample results (all categories)
- [ ] Build HeroMetrics row with BiomarkerCards
- [ ] Build TrendChart with Recharts + reference range band
- [ ] Build LabTable (sortable, filterable)
- [ ] Wire up filter state (date range, category, provider)

### Phase 2 — Backend & Data Layer
- [ ] Set up Express server
- [ ] Create `labs.json` schema + storage utilities
- [ ] Build `GET /api/labs` endpoint
- [ ] Build `POST /api/upload` skeleton (file receipt only)
- [ ] Connect frontend to real API (replace mock data)

### Phase 3 — PDF Parsing
- [ ] Implement Quest Diagnostics parser
- [ ] Implement LabCorp parser (standard + NMR)
- [ ] Implement Lee Health parser
- [ ] Implement generic regex fallback
- [ ] Implement vision fallback (OpenAI API)
- [ ] Build ParsePreview confirmation UI
- [ ] Build UploadModal with drag-and-drop

### Phase 4 — Polish & Power Features
- [ ] Add Framer Motion animations (page transitions, card reveals)
- [ ] Add HOMA-IR calculated field
- [ ] Add export to CSV / PDF summary report
- [ ] Add biomarker detail modal (click card → full history + context)
- [ ] Add reference range customization (some ranges are age/sex dependent)
- [ ] Add print-friendly view

### Phase 5 — Optional Enhancements
- [ ] Provider-specific color theming
- [ ] "Flagged Items" quick view (all out-of-range at a glance)
- [ ] Year-over-year comparison view
- [ ] Annotations / notes per draw date
- [ ] Mobile-responsive layout

---

## Development Commands

```bash
# Install all deps
npm install

# Start backend (port 3001)
cd backend && node server.js

# Start frontend (port 5173)
cd frontend && npm run dev

# Build for production
cd frontend && npm run build
```

API base URL in dev: `http://localhost:3001/api`
Frontend proxies `/api` → `localhost:3001` via Vite config.

---

## Key Implementation Notes

1. **Always start with mock data.** Build the full UI against `mockLabs.js` before touching PDF parsing. Separating UI from parser bugs is critical.

2. **Normalize EVERYTHING before saving.** The `normalize.js` util is the single source of truth for data shape. Parsers output raw objects; normalize.js handles cleanup, unit standardization, and status calculation.

3. **Reference ranges are guidelines.** The ranges in `referenceRanges.js` are population-based defaults. Allow the user to override per-biomarker in settings (e.g., some optimal testosterone ranges differ from lab "normal").

4. **NMR LipoProfile is LabCorp-specific.** It has unique biomarkers (LDL-P, Small LDL-P, LP-IR Score) not found in standard lipid panels. Treat it as a separate sub-panel under Lipids.

5. **UA (Urinalysis) has mixed data types.** Quantitative (specific gravity, WBC count) and qualitative (negative/trace/1+/2+). Store qualitative as string; handle separately in visualization (use a status grid, not a line chart).

6. **HOMA-IR is calculated, not measured.** Compute from fasting insulin and fasting glucose: `(Insulin × Glucose) / 405`. Only calculate when both are from the same draw date.

7. **DM Mono font for all numeric values.** This is non-negotiable — monospaced numbers align perfectly in tables and cards and feel authoritative.

8. **Don't paginate the sidebar.** All categories visible at once. Use nested collapsible sections if needed.

---

## Sample Mock Data Structure

Use this to seed the UI during Phase 1 development. Include at least:
- 6–8 draw dates spanning 18–24 months
- At least 3 different providers represented
- A mix of normal, borderline, and flagged results
- All major category groups covered (CBC, CMP, Lipids, NMR, Hormones, Inflammatory, UA)

File location: `frontend/src/data/mockLabs.js`

---

## Questions to Resolve Before Phase 3

1. Do you want the backend to run as a persistent local server, or should this be a fully client-side app with file system access (Electron/Tauri)?
2. Should the OpenAI API key and `OPENAI_VISION_MODEL` for vision parsing be stored in a `.env` file locally?
3. Are there any biomarkers where your personal reference ranges differ from lab normals?
4. Do you want to track units consistently (e.g., testosterone in ng/dL vs pg/mL differs by test type)?

---

*Last updated: May 2026 — LabVault v0.1 spec*
