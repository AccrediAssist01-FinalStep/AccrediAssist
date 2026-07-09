DOCUMENT 8
AUTHENTICATION, USER ROLES & APPROVAL WORKFLOW

Project: AccrediAssist

Version: 2.0

1. Introduction

AccrediAssist manages sensitive institutional data related to students, faculty, placements, internships, achievements, and accreditation evidence. Therefore, the platform must provide secure authentication, role-based access control, and a human approval process before AI-generated information is permanently stored.

The principle is:

AI Assists. Humans Approve.

2. Authentication Overview

The system will use JWT (JSON Web Token) for authentication.

Passwords will be securely hashed using bcrypt before storage in MongoDB.

Every protected API must require a valid JWT token.

3. Authentication Flow
User Login
     │
     ▼
Enter Email & Password
     │
     ▼
Express.js Authentication API
     │
     ▼
Verify Credentials
     │
     ▼
Generate JWT Token
     │
     ▼
Frontend Stores Token
     │
     ▼
Access Protected APIs
4. Login Process

Steps:

User enters email and password.
Backend validates credentials.
Password is compared using bcrypt.
JWT token is generated.
Token is returned to the frontend.
Frontend stores the token securely.
Token is sent with every API request.
5. User Roles

The system supports four primary roles.

Administrator

Responsibilities:

Manage users
Assign roles
Configure WhatsApp integration
View system logs
Monitor AI processing
Manage departments
HOD (Head of Department)

Responsibilities:

View dashboard
Search records
Generate reports
Monitor accreditation data
View analytics
Faculty

Responsibilities:

Review AI-extracted records
Edit extracted information
Approve or reject records
Generate reports
Upload supporting documents
Accreditation Committee

Responsibilities:

Search historical records
Download reports
View evidence
Access dashboards
6. Role-Based Access Control (RBAC)
Module	Admin	HOD	Faculty	Accreditation Committee
Dashboard	✅	✅	✅	✅
AI Pending Records	✅	👁️	✅	❌
Approve Records	✅	❌	✅	❌
Generate Reports	✅	✅	✅	✅
Smart Search	✅	✅	✅	✅
User Management	✅	❌	❌	❌
System Logs	✅	❌	❌	❌
WhatsApp Settings	✅	❌	❌	❌
7. Approval Workflow

AI-generated records are never stored directly.

Workflow:

WhatsApp Message
        │
        ▼
AI Extraction
        │
        ▼
Pending Records
        │
        ▼
Faculty Review
        │
 ┌──────┼──────┐
 ▼      ▼      ▼
Approve Edit Reject
        │
        ▼
MongoDB Collections
8. Pending Records Dashboard

Faculty members should see a dedicated dashboard containing:

Message Preview
AI Extracted Data
Category
Confidence Score
Date & Time
Sender
Group Name

Available actions:

Approve
Edit
Reject
View Original Message
9. Record Editing

Before approval, faculty can edit fields such as:

Student Name
Faculty Name
Company
Event Title
Date
Venue
Description
Category

This ensures incorrect AI extraction can be corrected before permanent storage.

10. Approval Rules

A record can only be approved if:

Required fields are present.
Duplicate check is complete.
Validation passes.
Reviewer confirms the information.

Once approved:

The record is moved to the appropriate MongoDB collection.
The pending record is marked as Approved.
An audit log is created.
11. Rejection Rules

A reviewer may reject a record if:

It is unrelated to institutional activities.
AI extracted incorrect information.
It is spam or irrelevant.
It is a duplicate.

Rejected records remain in the system for auditing but are not included in reports or searches.

12. Audit Trail

Every important action should be logged.

Examples:

User Login
Record Approved
Record Edited
Record Rejected
Report Generated
User Created
WhatsApp Session Started

Each log should include:

User
Action
Timestamp
IP Address (optional)
Related Record ID
13. Security Best Practices

The system should:

Hash passwords using bcrypt.
Use JWT with expiration.
Validate all inputs.
Protect all APIs with authentication middleware.
Restrict actions based on user role.
Never expose sensitive information in API responses.
14. Session Management
JWT tokens should have an expiration time.
Invalid or expired tokens should require the user to log in again.
Logout should clear the stored token from the client.
15. API Endpoints (Authentication)

Example endpoints:

POST /api/auth/login

POST /api/auth/logout

GET /api/auth/profile

POST /api/users

GET /api/users

PUT /api/users/:id

DELETE /api/users/:id
16. Cursor Implementation Notes

Cursor should implement the authentication module in the following order:

User Model
Password Hashing (bcrypt)
JWT Generation
Authentication Middleware
Role-Based Authorization Middleware
Login API
User Management APIs
Pending Records Approval APIs
Audit Logging

Each step should be tested before proceeding to the next.

17. Success Criteria

The authentication and approval module is complete when:

Users can securely log in.
JWT authentication protects all APIs.
User roles are enforced correctly.
AI-generated records require human approval.
Approved records are stored permanently.
Rejected records are excluded from reports.
All important actions are logged for auditing.
End of Document 8