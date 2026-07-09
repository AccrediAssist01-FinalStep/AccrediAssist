Perfect. From this point onward, the documents become more implementation-oriented and will serve as the blueprint for Cursor.

---

# DOCUMENT 11

# BACKEND API DESIGN & EXPRESS.JS ARCHITECTURE

**Project:** AccrediAssist

**Version:** 2.0

---

# 1. Introduction

The backend is the core of AccrediAssist. It manages authentication, AI processing, WhatsApp integration, database operations, report generation, and communication between the frontend and MongoDB.

The backend will be built using **Node.js**, **Express.js**, **TypeScript**, and **MongoDB (Mongoose)**, following a modular architecture.

---

# 2. Backend Architecture

The backend follows a layered architecture.

```text
HTTP Request
      │
      ▼
Routes
      │
      ▼
Controllers
      │
      ▼
Services
      │
      ▼
Repositories
      │
      ▼
MongoDB
```

Each layer has a single responsibility.

---

# 3. Project Folder Structure

```text
backend/

src/

├── config/
├── routes/
├── controllers/
├── services/
├── repositories/
├── models/
├── middleware/
├── agents/
├── validations/
├── utils/
├── types/
├── database/
├── uploads/
├── app.ts
└── server.ts
```

---

# 4. Layer Responsibilities

## Routes

Responsible for:

* API endpoints
* Request routing
* Middleware attachment

Example

```
POST /api/auth/login
```

---

## Controllers

Responsible for:

* Receive Request
* Validate Input
* Call Service
* Return Response

Controllers should never contain business logic.

---

## Services

Responsible for:

* AI Processing
* Business Logic
* Report Generation
* Database Coordination

Services communicate with repositories.

---

## Repositories

Responsible for:

* MongoDB Queries
* CRUD Operations
* Aggregation
* Index Usage

Repositories should not contain business logic.

---

## Models

Define Mongoose schemas for all collections.

Examples:

* User
* Placement
* Internship
* Pending Record
* Student Achievement
* Faculty Achievement

---

# 5. Middleware

The backend should implement the following middleware.

### Authentication Middleware

Verify JWT Token.

---

### Authorization Middleware

Check User Role.

---

### Validation Middleware

Validate request body.

---

### Error Handler

Catch application errors.

Return standardized responses.

---

### Logger Middleware

Log

* Requests
* Errors
* Response Time

---

# 6. API Response Standard

Every API should follow the same response format.

### Success

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

---

### Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# 7. Authentication APIs

### Login

```
POST /api/auth/login
```

---

### Logout

```
POST /api/auth/logout
```

---

### User Profile

```
GET /api/auth/profile
```

---

# 8. User Management APIs

```
GET /api/users

POST /api/users

PUT /api/users/:id

DELETE /api/users/:id
```

Admin only.

---

# 9. Pending Review APIs

### Get Pending Records

```
GET /api/pending
```

---

### Approve Record

```
PUT /api/pending/:id/approve
```

---

### Reject Record

```
PUT /api/pending/:id/reject
```

---

### Edit Pending Record

```
PUT /api/pending/:id
```

---

# 10. Student Achievement APIs

```
GET /api/student-achievements

POST /api/student-achievements

PUT /api/student-achievements/:id

DELETE /api/student-achievements/:id
```

---

# 11. Faculty Achievement APIs

```
GET /api/faculty-achievements

POST /api/faculty-achievements

PUT /api/faculty-achievements/:id

DELETE /api/faculty-achievements/:id
```

---

# 12. Placement APIs

```
GET /api/placements

POST /api/placements

PUT /api/placements/:id

DELETE /api/placements/:id
```

---

# 13. Internship APIs

```
GET /api/internships

POST /api/internships

PUT /api/internships/:id

DELETE /api/internships/:id
```

---

# 14. Completed Event Report APIs

```
GET /api/event-reports

POST /api/event-reports

PUT /api/event-reports/:id

DELETE /api/event-reports/:id
```

---

# 15. Publications APIs

```
GET /api/publications

POST /api/publications

PUT /api/publications/:id

DELETE /api/publications/:id
```

---

# 16. Patent APIs

```
GET /api/patents

POST /api/patents

PUT /api/patents/:id

DELETE /api/patents/:id
```

---

# 17. Smart Search API

```
POST /api/search
```

Example Request

```json
{
  "query": "Show all internships in Infosys"
}
```

Example Response

```json
{
  "success": true,
  "results": []
}
```

---

# 18. Report Generation APIs

### Generate Report

```
POST /api/reports/generate
```

---

### Download Report

```
GET /api/reports/:id
```

---

### Report History

```
GET /api/reports
```

---

# 19. Dashboard APIs

```
GET /api/dashboard/summary

GET /api/dashboard/charts

GET /api/dashboard/activity
```

These APIs provide:

* Statistics
* Charts
* Recent Activity

---

# 20. AI APIs

Internal APIs used by AI Agents.

```
POST /api/ai/extract

POST /api/ai/classify

POST /api/ai/validate

POST /api/ai/report
```

These APIs are not exposed to normal users.

---

# 21. WhatsApp APIs

```
GET /api/whatsapp/status

POST /api/whatsapp/connect

POST /api/whatsapp/disconnect

GET /api/whatsapp/groups
```

Admin only.

---

# 22. Validation Rules

Every request must validate:

* Required Fields
* Email Format
* Date Format
* Empty Strings
* File Type
* Invalid IDs

Use **Zod** or **Joi** for request validation.

---

# 23. Error Handling

The backend should never expose internal errors.

Return appropriate HTTP status codes:

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Resource Created      |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict (Duplicate)  |
| 500  | Internal Server Error |

All errors should be logged.

---

# 24. Cursor Implementation Rules

Cursor must:

* Build one API module at a time.
* Separate controllers, services, and repositories.
* Never write business logic inside routes.
* Use TypeScript throughout.
* Validate every request.
* Protect APIs with JWT and RBAC where required.
* Write reusable, testable code.
* Document APIs using Swagger (optional but recommended).

---

# 25. Success Criteria

The backend API layer is complete when:

* All REST APIs are functional.
* Authentication and authorization work correctly.
* CRUD operations work for every module.
* AI services integrate with backend modules.
* WhatsApp APIs manage connections successfully.
* Reports and search APIs return accurate results.
* Error handling is consistent.
* Code follows the defined architecture.

---

# End of Document 11

## Next Document

**Document 12 – Development Roadmap & Sprint Planning**

This document will divide the entire project into **weekly development sprints**, assigning clear milestones, deliverables, testing goals, and GitHub checkpoints. It will act as the execution plan for your team and for Cursor to build the project step by step without confusion.
