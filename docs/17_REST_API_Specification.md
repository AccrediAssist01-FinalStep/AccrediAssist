Perfect. This document defines the complete REST API contract. It ensures the frontend, backend, AI agents, and future mobile apps all communicate using a consistent API.

---

# DOCUMENT 17

# REST API SPECIFICATION (OpenAPI / Swagger)

**Project:** AccrediAssist

**Version:** 2.0

---

# 1. Introduction

This document defines all REST APIs exposed by the AccrediAssist backend. Every endpoint follows RESTful principles, uses JSON for request/response bodies, and is documented for Swagger/OpenAPI generation.

Base URL:

```text
/api/v1
```

---

# 2. API Standards

### Request Format

* Content-Type: `application/json`
* Authorization: `Bearer <JWT_TOKEN>` (for protected routes)

### Standard Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Standard Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# 3. Authentication APIs

## Login

```http
POST /api/v1/auth/login
```

Request

```json
{
  "email": "faculty@college.edu",
  "password": "password123"
}
```

Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN",
    "user": {}
  }
}
```

---

## Logout

```http
POST /api/v1/auth/logout
```

Authentication Required

✅ Yes

---

## Get Profile

```http
GET /api/v1/auth/profile
```

Authentication Required

✅ Yes

---

# 4. User APIs

## Get Users

```http
GET /api/v1/users
```

Role

* Admin

---

## Create User

```http
POST /api/v1/users
```

Request

```json
{
  "name": "John Doe",
  "email": "john@college.edu",
  "role": "Faculty",
  "department": "Computer"
}
```

---

## Update User

```http
PUT /api/v1/users/{id}
```

---

## Delete User

```http
DELETE /api/v1/users/{id}
```

Soft delete only.

---

# 5. Pending Review APIs

## Get Pending Records

```http
GET /api/v1/pending
```

Query Parameters

```
?page=1

&limit=20

&status=Pending
```

---

## Approve Record

```http
PUT /api/v1/pending/{id}/approve
```

---

## Reject Record

```http
PUT /api/v1/pending/{id}/reject
```

---

## Edit Pending Record

```http
PUT /api/v1/pending/{id}
```

---

# 6. Student Achievement APIs

```http
GET /api/v1/student-achievements

POST /api/v1/student-achievements

PUT /api/v1/student-achievements/{id}

DELETE /api/v1/student-achievements/{id}
```

Supports:

* Pagination
* Search
* Filters
* Sorting

---

# 7. Faculty Achievement APIs

```http
GET /api/v1/faculty-achievements

POST /api/v1/faculty-achievements

PUT /api/v1/faculty-achievements/{id}

DELETE /api/v1/faculty-achievements/{id}
```

---

# 8. Placement APIs

```http
GET /api/v1/placements

POST /api/v1/placements

PUT /api/v1/placements/{id}

DELETE /api/v1/placements/{id}
```

Filters

* Company
* Department
* Academic Year

---

# 9. Internship APIs

```http
GET /api/v1/internships

POST /api/v1/internships

PUT /api/v1/internships/{id}

DELETE /api/v1/internships/{id}
```

---

# 10. Event Report APIs

```http
GET /api/v1/event-reports

POST /api/v1/event-reports

PUT /api/v1/event-reports/{id}

DELETE /api/v1/event-reports/{id}
```

---

# 11. Publications APIs

```http
GET /api/v1/publications

POST /api/v1/publications

PUT /api/v1/publications/{id}

DELETE /api/v1/publications/{id}
```

---

# 12. Patent APIs

```http
GET /api/v1/patents

POST /api/v1/patents

PUT /api/v1/patents/{id}

DELETE /api/v1/patents/{id}
```

---

# 13. Smart Search API

```http
POST /api/v1/search
```

Request

```json
{
  "query": "Show all internships in Infosys"
}
```

Response

```json
{
  "success": true,
  "data": {
    "results": []
  }
}
```

---

# 14. Report APIs

## Generate Report

```http
POST /api/v1/reports/generate
```

Request

```json
{
  "reportType": "Monthly",
  "month": "July",
  "year": 2026
}
```

---

## Report History

```http
GET /api/v1/reports
```

---

## Download Report

```http
GET /api/v1/reports/{id}/download
```

---

# 15. Dashboard APIs

## Dashboard Summary

```http
GET /api/v1/dashboard/summary
```

Returns:

* Total Placements
* Internships
* Student Achievements
* Faculty Achievements
* Pending Reviews
* Reports Generated

---

## Dashboard Charts

```http
GET /api/v1/dashboard/charts
```

Returns chart-ready datasets.

---

# 16. AI APIs (Internal)

These APIs are intended for internal communication between services.

```http
POST /api/v1/ai/extract

POST /api/v1/ai/classify

POST /api/v1/ai/validate

POST /api/v1/ai/report-summary
```

These should not be accessible to normal users.

---

# 17. WhatsApp APIs

## Status

```http
GET /api/v1/whatsapp/status
```

---

## Connect

```http
POST /api/v1/whatsapp/connect
```

---

## Disconnect

```http
POST /api/v1/whatsapp/disconnect
```

---

## QR Code

```http
GET /api/v1/whatsapp/qr
```

---

## Allowed Groups

```http
GET /api/v1/whatsapp/groups
```

---

# 18. Notification APIs

```http
GET /api/v1/notifications

PUT /api/v1/notifications/{id}/read
```

---

# 19. Audit Log APIs

Admin only.

```http
GET /api/v1/audit-logs
```

Supports:

* Date filter
* User filter
* Module filter

---

# 20. HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | OK                    |
| 201  | Created               |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Validation Error      |
| 500  | Internal Server Error |

---

# 21. API Security

Every protected API should:

* Validate JWT token.
* Check user role (RBAC).
* Validate request body.
* Sanitize inputs.
* Log important actions.

Sensitive endpoints (e.g., WhatsApp management, user management) must be restricted to administrators.

---

# 22. Swagger Documentation

Cursor should configure Swagger so that all APIs are automatically documented.

Documentation should include:

* Endpoint description
* Request body
* Response schema
* Authentication requirements
* Example requests and responses
* Error responses

Swagger should be accessible at:

```text
/api/docs
```

---

# 23. Cursor Implementation Instructions

Cursor should implement APIs in this order:

1. Authentication
2. User Management
3. Pending Review
4. Student & Faculty Modules
5. Placement & Internship Modules
6. Event Reports
7. Publications & Patents
8. Dashboard APIs
9. Smart Search
10. Report Generation
11. WhatsApp APIs
12. Notifications & Audit Logs
13. Swagger Documentation

Every endpoint must include:

* Validation
* Authentication
* Authorization
* Error Handling
* Logging
* Unit Tests

---

# 24. Success Criteria

The REST API layer is complete when:

* All endpoints follow REST standards.
* Swagger documentation is generated automatically.
* APIs are secured with JWT and RBAC.
* Request validation is enforced.
* Error responses are standardized.
* AI agents and frontend integrate seamlessly.
* APIs are versioned (`/api/v1`) for future scalability.

---

# End of Document 17

## Next Document

**Document 18 – Frontend Design System & Component Library**

This document will define the complete **Next.js + Tailwind CSS frontend architecture**, reusable UI components, design tokens, layouts, page structure, state management, forms, tables, and component hierarchy. It will act as the frontend implementation guide for Cursor. This is the document that enables Cursor to build a consistent, professional UI across the entire application.
