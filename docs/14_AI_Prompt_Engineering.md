Perfect. Now we move to the implementation documents. These are the documents Cursor will actually use while coding.

---

# DOCUMENT 14

# AI PROMPT ENGINEERING & LLM DESIGN

**Project:** AccrediAssist

**Version:** 2.0

---

# 1. Introduction

This document defines how Large Language Models (LLMs) will be integrated into AccrediAssist. Instead of allowing the AI to generate free-form responses, the system uses carefully engineered prompts to extract, classify, validate, and summarize institutional information from official WhatsApp messages.

The goal is to ensure that AI produces **structured, accurate, and verifiable outputs** suitable for academic accreditation.

---

# 2. AI Objectives

The AI system should:

* Extract structured information from WhatsApp messages.
* Classify records into predefined categories.
* Detect missing information.
* Generate professional report summaries.
* Never fabricate or hallucinate data.
* Return JSON responses only.

---

# 3. LLM Workflow

```text
WhatsApp Message
       │
       ▼
Prompt Builder
       │
       ▼
LLM API
       │
       ▼
Structured JSON
       │
       ▼
Validation
       │
       ▼
MongoDB
```

---

# 4. General AI Rules

Every AI prompt must follow these rules:

* Never invent information.
* Extract only what exists in the message.
* Preserve names exactly.
* Return valid JSON only.
* If information is unavailable, return null.
* Never include explanations outside JSON.

---

# 5. Extraction Agent Prompt

### Purpose

Convert an unstructured WhatsApp message into structured JSON.

### System Prompt

```
You are an AI Information Extraction Agent.

Your task is to extract structured information from official college WhatsApp messages.

Rules:

- Do not hallucinate.
- Do not guess.
- Preserve names exactly.
- Return JSON only.
- Missing values should be null.

Possible fields:

studentName
facultyName
company
eventTitle
eventType
achievementType
publicationTitle
patentTitle
venue
date
description
category
```

Example Input

```
Congratulations!

Rahul Patil secured placement in Infosys as Software Engineer.
```

Expected Output

```json
{
  "category":"Placement",
  "studentName":"Rahul Patil",
  "company":"Infosys",
  "role":"Software Engineer"
}
```

---

# 6. Classification Agent Prompt

### Purpose

Assign one category.

Allowed Categories

* Placement
* Internship
* Workshop
* Seminar
* Industrial Visit
* Student Achievement
* Faculty Achievement
* Sports
* Cultural
* Patent
* Publication
* Certification

Prompt

```
Classify this institutional record into exactly one category.

Return JSON only.

{
 "category":""
}
```

---

# 7. Validation Agent Prompt

Purpose

Validate extracted information.

Prompt

```
Check whether this JSON contains all required information.

Identify:

- Missing fields
- Invalid dates
- Empty values

Return JSON.

{
 "isValid":true,
 "missingFields":[],
 "errors":[]
}
```

---

# 8. Duplicate Detection Prompt

Purpose

Compare two records.

Prompt

```
Compare Record A and Record B.

Determine whether they describe the same institutional activity.

Return:

{
 "duplicate":true,
 "confidence":95,
 "reason":""
}
```

---

# 9. Report Summary Prompt

Purpose

Generate a concise report summary from approved records.

Prompt

```
Generate a formal academic summary.

Rules:

Professional language.

No opinions.

No extra information.

Maximum 300 words.
```

---

# 10. Search Interpretation Prompt

Purpose

Convert natural language into MongoDB filters.

Example

User

```
Show all placements in Infosys.
```

Expected Output

```json
{
 "collection":"placements",
 "filters":{
     "company":"Infosys"
 }
}
```

---

# 11. Confidence Score

Every AI response should include:

```json
{
 "confidence":94
}
```

Confidence below the configured threshold (e.g., 70%) should automatically send the record to manual review.

---

# 12. Prompt Versioning

Every prompt should have:

* Prompt ID
* Version
* Last Updated Date

This makes future improvements easier without breaking existing functionality.

---

# 13. AI Error Handling

If the AI cannot understand a message:

```json
{
 "status":"Needs Review",
 "reason":"Insufficient information"
}
```

The backend should never store uncertain data directly in the main collections.

---

# 14. Cursor Implementation Notes

Cursor should:

* Store prompts as separate template files (not hardcoded).
* Use environment variables for AI API keys.
* Validate AI responses against JSON schemas before processing.
* Log prompt execution and responses for debugging (excluding sensitive content).

Suggested folder:

```text
backend/src/prompts/
```

Each prompt should be stored in its own file.

---

# 15. Success Criteria

This module is complete when:

* AI consistently returns valid JSON.
* Hallucinations are minimized.
* Extraction accuracy is high.
* Classification is reliable.
* Validation identifies incomplete records.
* Reports are generated in a professional format.
* Search queries are correctly interpreted.

---

# End of Document 14

## Next Document

**Document 15 – WhatsApp Integration Implementation (Baileys + Session Management + Message Listener)**

This document will contain the actual technical implementation plan for integrating WhatsApp, maintaining sessions, handling QR authentication, monitoring official groups, and feeding messages into the AI pipeline. It is one of the most important implementation documents for the project.
