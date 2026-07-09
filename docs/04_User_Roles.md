DOCUMENT 4
TECHNOLOGY STACK & PROJECT ARCHITECTURE

Project: AccrediAssist

Version: 2.0

1. Introduction

This document defines the official technology stack, project folder structure, coding standards, architecture, and development practices for AccrediAssist.

All team members and AI coding assistants (Cursor) must strictly follow this document throughout development.

2. Technology Stack
Frontend
Technology	Purpose
Next.js (App Router)	Frontend Framework
React	UI Development
TypeScript	Type Safety
Tailwind CSS	Styling
React Hook Form	Form Handling
TanStack Query	API State Management
Axios	API Communication
Socket.IO Client	Real-time Updates
Backend
Technology	Purpose
Node.js	Runtime Environment
Express.js	REST API Framework
TypeScript	Backend Development
JWT	Authentication
bcrypt	Password Encryption
Multer	File Uploads
Socket.IO	Real-time Communication
Database
Technology	Purpose
MongoDB Atlas	Cloud Database
Mongoose	ODM
AI
Technology	Purpose
OpenAI Compatible API	Information Extraction
Multi-Agent Architecture	AI Processing
LangChain (Future)	Agent Orchestration
Cloud Services
Service	Purpose
Cloudinary	Image & File Storage
Vercel	Frontend Hosting
Render	Backend Hosting
GitHub	Version Control
3. High-Level Project Architecture
                Frontend (Next.js)
                        │
                 REST API (Axios)
                        │
                Express.js Backend
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
 Authentication   AI Services    WhatsApp Service
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                  MongoDB Database
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
     Dashboard      Reports        Smart Search
4. Project Folder Structure
AccrediAssist/

│
├── docs/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── public/
│   └── styles/
│
├── backend/
│   ├── src/
│   │
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   ├── repositories/
│   ├── agents/
│   ├── utils/
│   ├── types/
│   ├── validations/
│   ├── database/
│   ├── uploads/
│   └── server.ts
│
├── README.md
├── .env
└── package.json
5. Backend Architecture

Follow a layered architecture.

Routes

↓

Controllers

↓

Services

↓

Repositories

↓

MongoDB

Each layer should have only one responsibility.

Responsibilities
Routes
Define API endpoints
Forward requests to controllers
Controllers
Receive requests
Validate input
Call services
Return responses
Services
Business logic
AI integration
Report generation
Data processing
Repositories
MongoDB operations
CRUD
Aggregations
Queries
Models

Define MongoDB schemas.

6. Frontend Architecture

The frontend should follow a component-based architecture.

Pages

↓

Layouts

↓

Components

↓

Hooks

↓

Services

↓

API
7. API Standards

Every API should follow REST principles.

Example:

GET

/api/students
POST

/api/students
PUT

/api/students/:id
DELETE

/api/students/:id

Use JSON responses consistently.

Example:

{
  "success": true,
  "message": "Student created successfully",
  "data": {}
}
8. Environment Variables

Backend

PORT=
JWT_SECRET=
MONGODB_URI=
OPENAI_API_KEY=
CLOUDINARY_URL=
WHATSAPP_SESSION_PATH=

Frontend

NEXT_PUBLIC_API_URL=

Never hardcode secrets.

9. Authentication

Use JWT.

Flow

Login

↓

Verify User

↓

Generate JWT

↓

Frontend stores Token

↓

Protected APIs

Passwords must be hashed using bcrypt.

10. File Upload Strategy

Supported Files

Images
PDF
DOCX

Store

Files in Cloudinary
URLs in MongoDB

Never store large files directly inside MongoDB.

11. Error Handling

Every API should return meaningful errors.

Example

{
  "success": false,
  "message": "Record not found"
}

Avoid exposing internal server details.

12. Logging

Log:

User Login
AI Processing
Report Generation
Database Errors
WhatsApp Events

This helps during debugging.

13. Coding Standards

Follow these rules:

Use TypeScript everywhere.
Use async/await (avoid callbacks).
Use descriptive variable names.
One responsibility per function.
Reusable components only.
Validate all inputs.
Add comments for complex logic.
Keep code modular.
14. Git Workflow

Use feature branches.

main

↓

develop

↓

feature/auth

feature/dashboard

feature/reports

feature/search

feature/whatsapp

feature/ai

Commit frequently with meaningful messages.

15. Cursor Development Rules

Cursor must:

Read all project documentation before coding.
Follow this folder structure exactly.
Generate modular and reusable code.
Avoid unnecessary dependencies.
Use TypeScript consistently.
Write clean REST APIs.
Stop after completing one task and wait for approval.
16. Future Scalability

The architecture should support future additions such as:

Multi-department support
Multi-college SaaS
OCR for scanned documents
Email integration
Mobile application
AI recommendation engine

No major refactoring should be required.

17. Definition of Done

A module is considered complete only when:

Code compiles successfully.
APIs are tested.
UI is functional.
MongoDB operations work.
Error handling is implemented.
Code is committed to Git.
End of Document 4
Next Document