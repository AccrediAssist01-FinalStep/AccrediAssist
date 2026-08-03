# AI Event Report System — Implementation Report

## Overview

The WhatsApp intake pipeline now supports **multi-message AI event report generation**. Workshop and Industrial Visit documentation can be assembled automatically from a full department group conversation (text, images, PDFs) instead of requiring faculty to write reports manually.

## Workflow

```
Department WhatsApp Group
  → Event message correlation (3 min idle flush, 90 min max session)
  → Cloudinary media preserved on each message
  → Combined Gemini analysis (all messages + attachments together)
  → 800–1000 word professional report + structured extraction
  → Pending Review (always Needs Review — no auto-approve)
  → Faculty Approve / Reject / Edit / Regenerate
  → On approval: store CompletedEventReport + generate PDF & DOCX (Workshop uses official template layout)
```

## Workshop Report Template Generator

Workshop reports follow the structure of `Workshop Report.docx` (reference copy: `backend/src/report-generation/workshop/assets/workshop-report-reference.docx`). The template is used **only for layout** — content is always generated from WhatsApp evidence via Gemini.

**Section order:** Cover → Event Details → Introduction → Objectives → Workshop Proceedings → Topics Covered → Schedule Summary → Learning Outcomes → Key Highlights → Benefits → Conclusion → AI Executive Summary → Acknowledgement → Evidence Gallery

**Image placement:** Gemini returns `imagePlacements[]` mapping each image to a section (introduction, workshopProceedings, speakerDetails, studentParticipation, conclusion, evidenceGallery). Images are embedded inline in DOCX/PDF, not appended only at the end.

**Structured storage:** `extractedData.workshopReportStructured` on the pending record; preview shown in Pending Review UI.

**Export:** On faculty approval of a Workshop AI event report, `workshopReportGeneratorService` produces template-aligned PDF and DOCX.

Run workshop generator tests:

```bash
cd backend
npx tsx src/scripts/test-workshop-report-generator.ts
```

## Key Backend Files

| Area | Path |
|------|------|
| Session model | `backend/src/models/EventReportSession.ts` |
| Message correlation | `backend/src/services/event-correlation.service.ts` |
| Gemini agent | `backend/src/ai/agents/ai-event-report.agent.ts` |
| Pipeline | `backend/src/ai/services/ai-event-report-pipeline.service.ts` |
| Prompts | `backend/src/ai/templates/ai-event-report/` |
| Workshop template generator | `backend/src/report-generation/workshop/` |
| Generic PDF/DOCX export (IV/other) | `backend/src/services/ai-event-report-export.service.ts` |
| Workshop PDF/DOCX (template layout) | `backend/src/report-generation/workshop/services/workshop-report-generator.service.ts` |
| Regenerate API | `POST /api/v1/pending/:id/regenerate` |
| Workflow routing | `backend/src/services/pendingReviewWorkflow.service.ts` |

## Key Frontend Files

| Area | Path |
|------|------|
| AI report preview | `frontend/src/features/pending-review/components/AiGeneratedReportPreview.tsx` |
| Approve/Reject/Regenerate | `frontend/src/features/pending-review/components/PendingRecordDrawer.tsx` |
| Reports dashboard stats | `frontend/src/features/reports/components/AiEventReportsDashboard.tsx` |

## Anti-Hallucination Rules

- Gemini prompt forbids inventing names, dates, attendance, or outcomes
- Missing fields listed in `missingFields`
- Narrative uses: *"Information was not available in the provided WhatsApp conversation or uploaded documents."*

## Testing

Run:

```bash
cd backend
npx tsx src/scripts/test-ai-event-report-pipeline.ts
```

### Final PASS/FAIL Summary (2026-07-30)

| Workflow | Result |
|----------|--------|
| Event keyword session start | PASS |
| Multi-message append to active session | PASS |
| Casual message ignored | PASS |
| Caption + text combination | PASS |
| Conversation timeline merge | PASS |
| Evidence preservation (images/PDFs) | PASS |
| Result normalization | PASS |
| Category mapping (Workshop / IV) | PASS |
| Prompt template registration | PASS |
| MongoDB session persistence | PASS |
| Admin API auth | PASS |
| Regenerate endpoint | PASS |
| Gemini combined analysis | PASS |
| Needs Review status (no auto-approve) | PASS |
| AI narrative generation | PASS |
| Evidence linkage | PASS |
| Missing fields tracking | PASS |
| Regenerate from stored session | PASS |

**Total: 20/20 PASS**

## Notes

- Event sessions flush after **3 minutes** of inactivity or at **90 minutes** maximum collection time.
- PDF/DOCX are generated on **faculty approval** and stored as `generatedReportUrl` / `docxReportUrl` on `CompletedEventReport`.
- Batch report types (8-report module) remain separate; this system handles **per-event** WhatsApp documentation.
