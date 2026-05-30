# LabVault Codex Notes

Always read `PROJECTBRIEF_codex.md` before starting a new phase.

Phase 1 is frontend-first:
- Build against `frontend/src/data/mockLabs.js`.
- Keep PDF parsing, backend persistence, and OpenAI vision fallback out of the critical path until Phase 2/3.
- Preserve NMR LipoProfile as a LabCorp-specific sub-panel under Lipids.
- Treat HOMA-IR as calculated from same-draw fasting insulin and glucose.
- Render urinalysis as a status grid because qualitative values do not fit line charts.

Run the current app with:

```bash
cd frontend
npm install
npm run dev
```
