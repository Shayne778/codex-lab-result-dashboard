# LabVault

Local-first personal lab results dashboard built with Vite, React, Tailwind, Recharts, and PDF-to-spreadsheet extraction utilities.

## Privacy Model

The public GitHub Pages build uses mock/demo data only. Private lab PDFs, generated Excel files, and private dashboard JSON are intentionally ignored by Git.

For local private data, place the generated JSON at:

```text
frontend/public/private/liveLabs.json
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

The local dev app will load private data when that file exists. Production builds do not fetch or bundle it.

## Build

```bash
cd frontend
npm install
npm run build
```
