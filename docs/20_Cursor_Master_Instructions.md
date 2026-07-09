Perfect. This is the **most important document**. Cursor should read this first after all documents are added to the project. It acts as the master instruction manual and development contract for the entire project.

---

# DOCUMENT 20

# CURSOR MASTER DEVELOPMENT INSTRUCTIONS

**Project:** AccrediAssist – AI-Powered Academic Accreditation Management System

**Version:** 2.0

**Status:** Official Development Guide

---

# 1. Purpose

This document is the master instruction set for Cursor AI.

Cursor must use this document together with Documents **1–19** as the complete project specification.

Cursor should never assume functionality that is not defined in the documents and should implement the project incrementally, one module at a time.

---

# 2. Project Vision

AccrediAssist is an **AI-powered Academic Accreditation Management System** that transforms information shared in official departmental WhatsApp groups into structured, searchable institutional records.

Instead of losing valuable information in chat history, the system automatically extracts, classifies, validates, stores, and organizes institutional data for long-term use.

The primary goal is to simplify accreditation evidence management for departments preparing for NBA, NAAC, AICTE, and internal audits.

---

# 3. Core Functional Modules

Cursor must implement the following modules:

### Authentication

* Secure login
* JWT authentication
* Role-based access control

---

### WhatsApp Integration

* QR authentication
* Session persistence
* Official group monitoring
* Media download

---

### AI Agents

* Information Extraction Agent
* Classification Agent
* Validation Agent
* Duplicate Detection Agent
* Search Interpretation Agent
* Report Summary Agent

---

### Data Management

* Pending Review
* Student Achievements
* Faculty Achievements
* Placements
* Internships
* Completed Event Reports
* Publications
* Patents

---

### Dashboard

* Statistics
* Charts
* Recent Activity

---

### Smart Search

Natural language search across all approved records.

---

### AI Report Generation

Generate professional DOCX and PDF reports.

---

# 4. Approved Technology Stack

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Zustand
* TanStack Query
* React Hook Form
* Axios

---

## Backend

* Node.js
* Express.js
* TypeScript

---

## Database

* MongoDB Atlas
* Mongoose

---

## AI

* OpenAI API (or compatible LLM provider)

---

## File Storage

* Cloudinary

---

## Deployment

Frontend → Vercel

Backend → Render

Database → MongoDB Atlas

---

# 5. Development Rules

Cursor must:

* Follow clean architecture.
* Write modular code.
* Use TypeScript throughout.
* Avoid duplicate code.
* Create reusable components.
* Add comments only where necessary.
* Follow SOLID principles where practical.
* Prefer composition over tightly coupled code.

---

# 6. Implementation Order

Cursor must complete development in this exact sequence:

### Phase 1

Project Setup

Authentication

Database Connection

Folder Structure

Git Initialization

---

### Phase 2

User Management

MongoDB Models

CRUD APIs

Validation

---

### Phase 3

WhatsApp Integration

QR Authentication

Session Management

Message Listener

Media Upload

---

### Phase 4

AI Pipeline

Extraction

Classification

Validation

Duplicate Detection

Pending Review

---

### Phase 5

Dashboard

Search

Analytics

Notifications

---

### Phase 6

Report Generation

DOCX Export

PDF Export

History

---

### Phase 7

Testing

Deployment

Documentation

Final Optimization

---

# 7. Git Workflow

Cursor should:

1. Complete one feature.
2. Run tests.
3. Fix issues.
4. Commit changes.
5. Push to GitHub.
6. Continue with the next feature.

Suggested commit format:

```text
feat(auth): implement JWT authentication

feat(database): create placement model

feat(ai): implement extraction agent

feat(search): add natural language search

fix(report): correct PDF formatting
```

---

# 8. Coding Standards

Backend

* Express Router
* Controllers
* Services
* Repositories
* Models
* Middleware
* Utilities

Frontend

* Reusable components
* Strong typing
* Consistent naming
* Responsive layouts

General

* ESLint
* Prettier
* Strict TypeScript mode

---

# 9. Error Handling

Every module must include:

* Validation
* Try-catch blocks
* Logging
* Standard API responses
* Graceful failure handling

The application should never crash because of invalid user input.

---

# 10. Security Requirements

Implement:

* JWT Authentication
* Password hashing using bcrypt
* Role-Based Access Control (RBAC)
* Input validation
* File upload validation
* Environment variables for secrets
* Secure CORS configuration
* Helmet middleware
* Rate limiting for authentication endpoints

---

# 11. AI Development Guidelines

The AI should:

* Never fabricate information.
* Extract only explicit facts.
* Return structured JSON.
* Include confidence scores.
* Send uncertain records for manual review.
* Keep prompts in separate template files.

---

# 12. WhatsApp Integration Guidelines

The system should:

* Connect only to authorized WhatsApp accounts.
* Process messages only from approved groups.
* Ignore personal chats.
* Handle reconnections automatically.
* Store session credentials securely.

**Note:** Baileys is suitable for development and academic demonstration. A production deployment should use the official WhatsApp Business Platform.

---

# 13. Database Guidelines

Use MongoDB with:

* Mongoose schemas
* Validation
* Indexes
* Soft deletes
* ObjectId relationships
* Timestamps on all collections

---

# 14. Testing Requirements

Before considering any module complete:

* Unit tests pass.
* API tests pass.
* Frontend renders correctly.
* AI pipeline functions.
* MongoDB operations work.
* No TypeScript errors.
* No ESLint errors.

---

# 15. Documentation Requirements

Maintain:

* README
* API Documentation (Swagger)
* Installation Guide
* Deployment Guide
* Environment Variable Template
* Architecture Diagram

Documentation should be updated whenever new features are added.

---

# 16. Performance Goals

Target metrics:

* API response: **< 2 seconds**
* Dashboard load: **< 3 seconds**
* Search: **< 1 second** (typical dataset)
* Report generation: **< 10 seconds**

---

# 17. Deployment Checklist

Before deployment, verify:

* Environment variables configured.
* Frontend connected to backend.
* MongoDB Atlas accessible.
* Cloudinary configured.
* AI API key working.
* WhatsApp session functioning.
* All endpoints tested.
* Responsive UI verified.

---

# 18. Cursor Operating Rules

Cursor must:

* Read Documents **1–20** before writing code.
* Never skip a document.
* Never rewrite existing functionality without reason.
* Ask for clarification only if a requirement is genuinely ambiguous.
* Complete one module before moving to the next.
* Keep commits small and meaningful.
* Avoid introducing breaking changes.

---

# 19. Definition of Done

The project is considered complete when:

* Authentication is secure.
* MongoDB stores verified institutional records.
* WhatsApp integration receives approved group messages.
* AI extracts, classifies, and validates data.
* Faculty can review and approve pending records.
* Smart Search retrieves stored information.
* Dashboard displays meaningful analytics.
* Reports are generated in DOCX and PDF.
* The application is deployed successfully.
* Documentation is complete.
* The project is ready for academic demonstration.

---

# 20. Final Vision

AccrediAssist should become a centralized institutional knowledge platform where information that would normally disappear in WhatsApp conversations is transformed into permanent, searchable, report-ready records.

The system should reduce manual documentation effort, preserve institutional history, and support accreditation and departmental decision-making through AI-assisted automation.

---

# Final Instruction to Cursor

> Treat Documents **1–20** as the official project specification. Build the project incrementally, following the prescribed architecture, coding standards, and implementation order. Prioritize maintainability, security, modularity, and accurate AI-assisted processing. Ensure that every feature is tested and documented before moving to the next.

---

# End of Document 20

## 🎉 Documentation Complete

You now have a complete documentation set:

* **Documents 1–10:** Project vision, requirements, architecture, workflows, AI agents, and core modules.
* **Documents 11–20:** Backend APIs, development roadmap, deployment, AI prompts, WhatsApp integration, MongoDB models, REST API specification, frontend design system, AI report engine, and Cursor master instructions.

This is a comprehensive blueprint that Cursor can follow to build your Final Year Project systematically.
