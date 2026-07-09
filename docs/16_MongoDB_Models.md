Perfect. This document is the **database implementation guide**. Cursor can use it to generate almost all of the Mongoose models directly.

---

# DOCUMENT 16

# MONGODB MODELS, MONGOOSE SCHEMAS & DATABASE RELATIONSHIPS

**Project:** AccrediAssist

**Version:** 2.0

---

# 1. Introduction

This document defines the MongoDB database implementation using Mongoose. It specifies collections, schema fields, validation rules, indexes, relationships, enums, timestamps, and best practices.

All collections should follow a consistent design to ensure maintainability and scalability.

---

# 2. Database Design Principles

The database should:

* Use Mongoose schemas.
* Enable timestamps on all collections.
* Validate required fields.
* Use enums where applicable.
* Add indexes on frequently queried fields.
* Store file URLs instead of binary data.
* Use ObjectId references when linking documents.

---

# 3. Base Schema

Every collection should inherit these common fields:

```text
_id

createdAt

updatedAt

createdBy

updatedBy

isDeleted
```

### Notes

* `createdAt` and `updatedAt` should use Mongoose timestamps.
* `isDeleted` is used for soft deletion.

---

# 4. User Schema

Collection:

```text
users
```

Fields:

```text
name : String

email : String (Unique)

password : String

role : Enum

department : String

designation : String

profileImage : String

isActive : Boolean

lastLogin : Date
```

Role Enum:

```text
Admin

HOD

Faculty

AccreditationCommittee
```

Indexes:

```text
email
```

---

# 5. Pending Record Schema

Collection:

```text
pending_records
```

Fields:

```text
originalMessage : String

groupName : String

senderName : String

category : Enum

extractedData : Mixed

confidenceScore : Number

status : Enum

reviewedBy : ObjectId

reviewedAt : Date
```

Status Enum

```text
Pending

Approved

Rejected

Needs Review
```

Indexes

```text
status

category

createdAt
```

---

# 6. Student Achievement Schema

Collection

```text
student_achievements
```

Fields

```text
studentName

rollNumber

department

achievementType

title

description

organization

certificateUrl

photos

date

approvedBy
```

Achievement Enum

```text
Sports

Technical

Hackathon

Research

Certification

Award

Cultural
```

Indexes

```text
studentName

achievementType

date
```

---

# 7. Faculty Achievement Schema

Collection

```text
faculty_achievements
```

Fields

```text
facultyName

designation

achievementType

title

description

organization

certificateUrl

photos

date

approvedBy
```

Indexes

```text
facultyName

achievementType
```

---

# 8. Placement Schema

Collection

```text
placements
```

Fields

```text
studentName

rollNumber

company

role

package

joiningDate

offerLetter

approvedBy
```

Indexes

```text
studentName

company
```

---

# 9. Internship Schema

Collection

```text
internships
```

Fields

```text
studentName

rollNumber

company

role

duration

startDate

endDate

certificateUrl

approvedBy
```

Indexes

```text
studentName

company
```

---

# 10. Completed Event Report Schema

Collection

```text
completed_event_reports
```

Fields

```text
eventTitle

eventType

date

venue

coordinator

participants

summary

description

photoUrls

generatedReportUrl

approvedBy
```

Indexes

```text
eventTitle

eventType

date
```

---

# 11. Publication Schema

Collection

```text
publications
```

Fields

```text
facultyName

paperTitle

journal

conference

authors

doi

publicationDate

documentUrl
```

Indexes

```text
facultyName

paperTitle
```

---

# 12. Patent Schema

Collection

```text
patents
```

Fields

```text
patentTitle

inventors

patentNumber

status

filingDate

documentUrl
```

Status Enum

```text
Filed

Published

Granted
```

---

# 13. Report Schema

Collection

```text
reports
```

Fields

```text
reportTitle

reportType

generatedBy

generatedDate

fileUrl

filtersApplied
```

Report Types

```text
Monthly

Placement

Internship

Student Achievement

Faculty Achievement

Completed Event
```

---

# 14. Notification Schema

Collection

```text
notifications
```

Fields

```text
title

message

userId

isRead

type
```

Notification Types

```text
Approval

AI

Report

System
```

---

# 15. Audit Log Schema

Collection

```text
audit_logs
```

Fields

```text
userId

action

module

description

ipAddress

timestamp
```

This collection should never be modified manually.

---

# 16. Database Relationships

```text
User
 │
 ├──────────────┐
 │              │
 ▼              ▼
Pending     Reports

Pending

↓

Student Achievement

Faculty Achievement

Placement

Internship

Completed Event Report

Publication

Patent
```

All approved records originate from `pending_records`.

---

# 17. Index Strategy

Create indexes on:

Users

* email

Student Achievement

* studentName
* achievementType
* department

Faculty Achievement

* facultyName

Placements

* company

Internships

* company

Pending Records

* status
* category

Reports

* reportType
* generatedDate

Audit Logs

* timestamp

---

# 18. Validation Rules

Every schema should validate:

* Required fields
* Maximum string length
* Enum values
* Email format
* URL format
* Positive numbers
* Valid dates

Validation must occur before saving to MongoDB.

---

# 19. Soft Delete Strategy

Records should not be permanently removed.

Instead:

```text
isDeleted = true
```

Deleted records:

* Hidden from normal queries.
* Still available for auditing.
* Recoverable by administrators.

---

# 20. Cursor Implementation Notes

Cursor should:

* Create one Mongoose model per collection.
* Use TypeScript interfaces.
* Enable timestamps.
* Apply indexes during schema creation.
* Use ObjectId references where needed.
* Create reusable BaseModel utilities.
* Keep schemas modular.

Suggested folder structure:

```text
backend/src/models/

User.ts

PendingRecord.ts

StudentAchievement.ts

FacultyAchievement.ts

Placement.ts

Internship.ts

CompletedEventReport.ts

Publication.ts

Patent.ts

Report.ts

Notification.ts

AuditLog.ts
```

---

# 21. Success Criteria

The database implementation is complete when:

* All schemas are implemented.
* Validation rules are enforced.
* Indexes improve query performance.
* Soft delete is supported.
* Relationships are maintained.
* TypeScript interfaces are defined.
* Models integrate seamlessly with Express services and AI agents.

---

# End of Document 16

## Next Document

**Document 17 – REST API Specification (OpenAPI/Swagger)**

This document will define every endpoint with request bodies, response schemas, authentication requirements, error codes, and examples. Cursor can use it to automatically generate comprehensive API documentation and consistent backend implementations.
