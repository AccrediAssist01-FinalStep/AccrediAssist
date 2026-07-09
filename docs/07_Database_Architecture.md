DOCUMENT 7
MULTI-AGENT AI ARCHITECTURE & CLASSIFICATION ENGINE

Project: AccrediAssist

Version: 2.0

1. Introduction

AccrediAssist follows an Agentic AI architecture, where multiple specialized AI agents collaborate to transform unstructured WhatsApp messages into structured institutional records.

Unlike a traditional chatbot, each AI agent performs one specific responsibility, making the system more accurate, modular, and maintainable.

2. Why Multi-Agent AI?

Instead of using one large AI model for every task, the project divides responsibilities among multiple agents.

Benefits:

Better accuracy
Easier debugging
Independent modules
Easier future upgrades
Faster processing
Improved maintainability

Each agent performs only one responsibility and passes the output to the next agent.

3. Complete AI Workflow
Official WhatsApp Message
          │
          ▼
Communication Agent
          │
          ▼
Information Extraction Agent
          │
          ▼
Classification Agent
          │
          ▼
Validation Agent
          │
          ▼
Duplicate Detection Agent
          │
          ▼
Pending Review Queue
          │
          ▼
Faculty Approval
          │
          ▼
MongoDB Knowledge Base
          │
          ▼
Search Agent
          │
          ▼
Report Generation Agent
4. AI Agent 1 – Communication Agent
Purpose

Receive incoming messages from official WhatsApp groups.

Responsibilities
Listen for new messages.
Identify authorized groups.
Extract raw message content.
Forward messages to the next AI agent.
Input

Raw WhatsApp message.

Output

Raw text + metadata.

Example:

Group:
Computer Department

Sender:
Faculty

Message:
Students completed Industrial Visit at Infosys Pune.
5. AI Agent 2 – Information Extraction Agent
Purpose

Extract important information from messages.

The AI should identify:

Student Name
Faculty Name
Company
Event
Date
Venue
Achievement
Certification
Placement
Internship
Publication
Patent

Example

Input:

Rahul Patil secured placement in TCS as Software Engineer.

Output

{
  "studentName": "Rahul Patil",
  "company": "TCS",
  "role": "Software Engineer",
  "category": "Placement"
}
6. AI Agent 3 – Classification Agent
Purpose

Automatically classify extracted information.

Supported Categories

Placement
Internship
Student Achievement
Faculty Achievement
Workshop
Seminar
Industrial Visit
Publication
Patent
Sports
Cultural
Certification
Research

Example

Input

Team won first prize in Hackathon.

Output

Category

Technical Achievement
7. AI Agent 4 – Validation Agent
Purpose

Validate extracted information before review.

Checks

Required fields
Missing names
Invalid dates
Invalid categories
Empty records
Confidence score

If validation fails:

Status becomes

Needs Review
8. AI Agent 5 – Duplicate Detection Agent
Purpose

Prevent duplicate records.

Compare

Student Name
Faculty Name
Company
Date
Event Title
Publication Title

If similarity is high:

Possible Duplicate Found

The reviewer decides whether to merge or keep the record.

9. AI Agent 6 – Search Agent
Purpose

Answer natural language queries using approved MongoDB records.

Examples

Show all internships in 2026.

Find publications by Dr. Kulkarni.

Show all sports achievements.

The agent must only use verified database records.

10. AI Agent 7 – Report Generation Agent
Purpose

Generate professional reports from approved data.

Supported Reports

Monthly Reports
Workshop Reports
Industrial Visit Reports
Placement Reports
Student Achievement Reports
Faculty Achievement Reports

Export Formats

DOCX
PDF
11. Agent Communication
Communication Agent

↓

Extraction Agent

↓

Classification Agent

↓

Validation Agent

↓

Duplicate Detection Agent

↓

Pending Review

↓

MongoDB

↓

Search Agent

↓

Report Agent

Every agent performs only one task before passing control to the next.

12. AI Prompting Strategy

Each AI agent should use a dedicated prompt.

Example:

Extraction Agent

Goal:

Extract only factual information from the WhatsApp message.

Rules:

Do not invent information.
Preserve names exactly.
Ignore unrelated conversation.
Classification Agent

Goal:

Assign one appropriate category.

Rules:

Choose the most relevant category.
Do not assign multiple categories unless clearly required.
Validation Agent

Goal:

Check completeness and consistency.

Rules:

Identify missing fields.
Never fabricate values.
Flag uncertain records.
13. Human-in-the-Loop

AI assists the process but does not make final decisions.

Every extracted record must be reviewed by a faculty member before permanent storage.

This ensures data accuracy and institutional trust.

14. Error Handling

If AI cannot confidently process a message:

Mark the record as Needs Review.
Notify the reviewer.
Do not automatically approve.

The system should always prioritize correctness over automation.

15. Future AI Agents

The architecture should allow new agents to be added without affecting existing ones.

Possible future agents:

OCR Agent (Certificates & PDFs)
Email Processing Agent
Calendar Agent
Recommendation Agent
Accreditation Gap Analysis Agent
Analytics Agent
16. Cursor Implementation Notes

Cursor should implement the AI layer in the following order:

Communication Agent
Information Extraction Agent
Classification Agent
Validation Agent
Duplicate Detection Agent
Search Agent
Report Generation Agent

Each agent should be placed in a separate file inside:

backend/src/agents/

Each agent must expose a clear service interface so additional agents can be added later.

17. Success Criteria

The AI architecture is considered complete when:

Messages are received automatically.
Information is extracted accurately.
Categories are assigned correctly.
Invalid records are flagged.
Duplicate entries are detected.
Faculty approval is required before storage.
Search works only on approved records.
Reports are generated from verified institutional data.
End of Document 7