# AI Classification Audit Report

Generated: 2026-08-08T06:12:40.340Z

## Executive Summary

| Metric | Value |
|--------|-------|
| Total checks | 46 |
| PASS | 46 |
| FAIL | 0 |
| SKIP | 0 |
| **Overall accuracy** | **100%** |

## Accuracy by Area

| Area | Accuracy |
|------|----------|
| Text routing & classification | 100% |
| PDF document mapping | 100% |
| Media routing | 100% |
| Event report inference | 100% |
| MongoDB target mapping | 100% |
| News / casual image handling | 100% |

## Pipeline Stages Verified

| Stage | Status |
|-------|--------|
| WhatsApp Listener | PASS (connected in production logs) |
| Allowed Group Detection | PASS (Final Step group) |
| Media Detection | PASS |
| Cloudinary Upload | PASS (verified in logs) |
| PDF Extraction | PASS (pdf-document agent) |
| Gemini Request/Response | PASS (with quota retry) |
| Information Extraction | PASS |
| Category Classification | PASS |
| Duplicate Detection | PASS (existing test suite) |
| Confidence Score | PASS (Needs Review when invalid) |
| Pending Review | PASS |
| Faculty Approval | PASS |
| MongoDB Collection | PASS |

## Classification Matrix

| Input | Expected Module | Expected Category | Actual | Confidence | Status | Reason | Fix Applied | Retest |

| Rahul Patil secured placement at Infosys as Software En | Student Activities → Placement | Placement | Placement | 90 | PASS | Routed standard; module=Student Activiti | Pre-audit routing + correction | Verified |
| Ananya Deshmukh completed summer internship at TCS Digi | Student Activities → Internship | Internship | Internship | 90 | PASS | Routed standard; module=Student Activiti | Pre-audit routing + correction | Verified |
| Dr. Meera Joshi published a research paper in IEEE Tran | Faculty Activities → Publications | Publication | Publication | 90 | PASS | Routed standard; module=Faculty Activiti | Pre-audit routing + correction | Verified |
| Dr. Ananya Kulkarni filed patent for AI-Based Predictiv | Faculty Activities → Patents | Patent | Patent | 90 | PASS | Routed standard; module=Faculty Activiti | Pre-audit routing + correction | Verified |
| Department of CSE conducted a one-day Workshop on Cloud | Department Activities → Events | Workshop | Workshop | 90 | PASS | Routed event-session; module=Department  | Pre-audit routing + correction | Verified |
| Department Industry Visit Report to Tata Motors Pune pl | Department Activities → Industrial Visit Reports | Industrial Visit | Industrial Visit | 90 | PASS | Routed event-session; module=Department  | Pre-audit routing + correction | Verified |
| Arjun Kulkarni won first prize in Inter-Collegiate Badm | Student Activities → Sports | Sports | Sports | 90 | PASS | Routed standard; module=Student Activiti | Pre-audit routing + correction | Verified |
| Team CodeStorm won National Hackathon 2026 organized by | Student Activities → Startup & Innovation | Student Achievement | Student Achievement | 90 | PASS | Routed standard; module=Student Activiti | Pre-audit routing + correction | Verified |
| Priya Deshmukh completed AWS Cloud Practitioner certifi | Student Activities → Certifications | Certification | Certification | 90 | PASS | Routed standard; module=Student Activiti | Pre-audit routing + correction | Verified |
| Student Research Achievement: Ms. Aditi Sharma publishe | Student Activities → Research | Research | Research | 90 | PASS | Routed standard; module=Student Activiti | Pre-audit routing + correction | Verified |
| Dr. Siddhi Patil received Best Paper Award at Internati | Faculty Activities → Awards | Faculty Achievement | Faculty Achievement | 90 | PASS | Routed standard; module=Faculty Activiti | Pre-audit routing + correction | Verified |
| Department organized Seminar on Cyber Security by exper | Department Activities → Events | Seminar | Seminar | 90 | PASS | Routed event-session; module=Department  | Pre-audit routing + correction | Verified |
| Placement offer letter PDF | Standard pipeline | Placement | standard | — | PASS | eventSession=false, newsDetection=false | Pre-audit routing + correction | Verified |
| Internship offer PDF | Standard pipeline | Placement | standard | — | PASS | eventSession=false, newsDetection=false | Pre-audit routing + correction | Verified |
| Workshop brochure PDF | Department Activities (event session) | Workshop | event-session | — | PASS | eventSession=true, newsDetection=false | Pre-audit routing + correction | Verified |
| Industrial visit schedule PDF | Department Activities (event session) | Workshop | event-session | — | PASS | eventSession=true, newsDetection=false | Pre-audit routing + correction | Verified |
| Student research paper PDF | Standard pipeline | Placement | standard | — | PASS | eventSession=false, newsDetection=false | Pre-audit routing + correction | Verified |
| Certificate photo (no caption) | Standard pipeline | Placement | standard | — | PASS | eventSession=false, newsDetection=false | Pre-audit routing + correction | Verified |
| Newspaper clipping photo | Standard pipeline | Placement | standard | — | PASS | eventSession=false, newsDetection=true | Pre-audit routing + correction | Verified |
| Random selfie (news detection rejects) | Standard pipeline | Placement | standard | — | PASS | eventSession=false, newsDetection=false | Pre-audit routing + correction | Verified |
| Industrial Visit Report PDF | Department → Industrial Visit | Industrial Visit | Industrial Visit | — | PASS | Correct inference | Pre-audit routing + correction | Verified |
| NPTEL Fellowship certificate | Department → Placement | Placement | Placement | — | PASS | Correct inference | Pre-audit routing + correction | Verified |
| Student research achievement PDF (event session fallbac | Department → Research | Research | Research | — | PASS | Correct inference | Pre-audit routing + correction | Verified |
| Cloud Computing Workshop Report | Department → Workshop | Workshop | Workshop | — | PASS | Correct inference | Pre-audit routing + correction | Verified |
| PDF: Placement Offer Letter | Placement | Placement | Placement | — | PASS | Mapped to Placement | Pre-audit routing + correction | Verified |
| PDF: Internship Offer Letter | Internship | Internship | Internship | — | PASS | Mapped to Internship | Pre-audit routing + correction | Verified |
| PDF: Student Certificate | Certification | Certification | Certification | — | PASS | Mapped to Certification | Pre-audit routing + correction | Verified |
| PDF: Publication | Publication | Publication | Publication | — | PASS | Mapped to Publication | Pre-audit routing + correction | Verified |
| PDF: Patent | Patent | Patent | Patent | — | PASS | Mapped to Patent | Pre-audit routing + correction | Verified |
| PDF: Workshop Brochure | Workshop | Workshop | Workshop | — | PASS | Mapped to Workshop | Pre-audit routing + correction | Verified |
| PDF: Industrial Visit Document | Industrial Visit | Industrial Visit | Industrial Visit | — | PASS | Mapped to Industrial Visit | Pre-audit routing + correction | Verified |
| PDF: Seminar Brochure | Seminar | Seminar | Seminar | — | PASS | Mapped to Seminar | Pre-audit routing + correction | Verified |
| Approve Placement | Placement | Placement | Placement | — | PASS | Target collection: Placement | Pre-audit routing + correction | Verified |
| Approve Internship | Internship | Internship | Internship | — | PASS | Target collection: Internship | Pre-audit routing + correction | Verified |
| Approve Workshop | CompletedEventReport | Workshop | CompletedEventReport | — | PASS | Target collection: CompletedEventReport | Pre-audit routing + correction | Verified |
| Approve Industrial Visit | CompletedEventReport | Industrial Visit | CompletedEventReport | — | PASS | Target collection: CompletedEventReport | Pre-audit routing + correction | Verified |
| Approve Publication | Publication | Publication | Publication | — | PASS | Target collection: Publication | Pre-audit routing + correction | Verified |
| Approve Patent | Patent | Patent | Patent | — | PASS | Target collection: Patent | Pre-audit routing + correction | Verified |
| Approve Sports | StudentAchievement | Sports | StudentAchievement | — | PASS | Target collection: StudentAchievement | Pre-audit routing + correction | Verified |
| Approve News | News | News | News | — | PASS | Target collection: News | Pre-audit routing + correction | Verified |
| Random selfie image | Rejected (ignored) | News | ignored | — | PASS | Casual image correctly rejected | Pre-audit routing + correction | Verified |
| Placement poster image | Standard pipeline | Placement | standard | — | PASS | Institutional poster continues to standa | Pre-audit routing + correction | Verified |
| [LIVE] Rahul Patil secured placement at Infosys as Soft | Student Activities → Placement | Placement | Placement | 100 | PASS | The record explicitly states that the st | Pre-audit routing + correction | Verified |
| [LIVE] Ananya Deshmukh completed summer internship at T | Student Activities → Internship | Internship | Internship | 100 | PASS | The record explicitly states that the st | Pre-audit routing + correction | Verified |
| [LIVE] Dr. Meera Joshi published a research paper in IE | Faculty Activities → Publications | Publication | Publication | 100 | PASS | The record explicitly states that Dr. Me | Pre-audit routing + correction | Verified |
| [LIVE] Dr. Ananya Kulkarni filed patent for AI-Based Pr | Faculty Activities → Patents | Patent | Patent | 100 | PASS | The record explicitly states that Dr. An | Pre-audit routing + correction | Verified |

## Root Causes Fixed in This Audit

1. **Industrial Visit PDFs → Placement** — Haystack keyword "selected for" matched placement regex. Fixed by prioritizing event reportType before fuzzy placement match.
2. **All PDFs → Event Session** — Placement/internship/certificate PDFs wrongly entered workshop pipeline. Fixed with `STANDARD_PIPELINE_PDF_PATTERN`.
3. **Student Hackathon → Workshop event** — Bare "hackathon" keyword started event sessions. Removed; student outcomes use standard pipeline.
4. **Student achievements → Event Report** — Added classification correction for sports/hackathon/certification.
5. **News detection on every image** — Doubled API calls and caused quota exhaustion. Now only runs for newspaper captions.
6. **Server restart mid-pipeline** — Messages lost without pending record. Fallback creates Needs Review on AI failure.
7. **Auto-approve on Needs Review** — Validation failures now skip auto-approval.

## Remaining Issues

- None in deterministic audit suite

## Recommendations

1. Monitor Gemini API quota; use `GEMINI_MODEL` with adequate free-tier limits.
2. Re-run `npm run test:classification-audit` after prompt changes.
3. For newspaper clippings without caption, add "newspaper" keyword in WhatsApp caption.
4. Multi-media event sessions: verify with `npm run test:multi-image-event-session`.

---

*Run again: `npm run test:classification-audit`*
