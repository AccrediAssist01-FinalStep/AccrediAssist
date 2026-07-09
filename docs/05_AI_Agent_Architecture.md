DOCUMENT 5
DATABASE DESIGN & MONGODB SCHEMA

Project: AccrediAssist

Version: 2.0

1. Introduction

MongoDB is the primary database for AccrediAssist. It stores all verified institutional information extracted from WhatsApp messages.

The database acts as the Institutional Knowledge Repository, allowing users to search, retrieve, analyze, and generate reports for NBA, NAAC, and AICTE accreditation.

Only approved AI-generated records are stored permanently.

2. Database Architecture
                    WhatsApp
                        │
                        ▼
               AI Information Extraction
                        │
                        ▼
               Pending Review Collection
                        │
               Faculty Approval
             Approve / Reject / Edit
                        │
                        ▼
                  MongoDB Collections
                        │
      ┌──────────────┬──────────────┬──────────────┐
      ▼              ▼              ▼
 Student Data   Faculty Data   Reports & Analytics
3. Collections Overview

The system will use the following collections:

users

pending_records

student_achievements

faculty_achievements

placements

internships

completed_event_reports

monthly_reports

publications

patents

documents

system_logs

notifications
4. Users Collection

Purpose

Store application users.

Fields

_id

name

email

password

role

department

designation

createdAt

updatedAt

Roles

Admin
HOD
Faculty
Accreditation Committee
5. Pending Records Collection

Purpose

Store AI-extracted information before approval.

Fields

_id

message

category

extractedData

confidenceScore

status

createdByAI

reviewedBy

createdAt

updatedAt

Status

Pending
Approved
Rejected
6. Student Achievements Collection

Purpose

Store verified student achievements.

Fields

_id

studentName

rollNumber

achievementType

title

description

department

eventName

organization

certificate

photos

date

approvedBy

createdAt

Achievement Types

Sports
Cultural
Technical
Certification
Hackathon
Competition
Research
Award
7. Faculty Achievements Collection

Purpose

Store faculty achievements.

Fields

_id

facultyName

designation

achievementType

title

description

organization

certificate

photos

date

approvedBy

createdAt
8. Placements Collection

Purpose

Store placement records.

Fields

_id

studentName

rollNumber

company

role

package

joiningDate

offerLetter

approvedBy

createdAt
9. Internships Collection

Purpose

Store internship information.

Fields

_id

studentName

rollNumber

company

role

duration

startDate

endDate

certificate

approvedBy
10. Completed Event Reports Collection

Purpose

Store reports after an event has been completed.

Examples

Workshop
Seminar
Guest Lecture
Industrial Visit
FDP
Training Program

Fields

_id

eventTitle

eventType

date

venue

coordinator

participants

description

summary

photos

generatedReport

approvedBy

createdAt

Note: The system does not create or manage events. It only stores reports after completion.

11. Monthly Reports Collection

Purpose

Store generated monthly reports.

Fields

_id

month

year

reportType

generatedBy

generatedFile

createdAt

Types

Student Report
Faculty Report
Placement Report
Activity Report
12. Publications Collection

Purpose

Store faculty publications.

Fields

_id

facultyName

paperTitle

journal

conference

doi

publicationDate

authors

supportingDocument
13. Patents Collection

Purpose

Store patent details.

Fields

_id

patentTitle

inventors

patentNumber

status

filingDate

document
14. Documents Collection

Purpose

Store uploaded files.

Fields

_id

fileName

fileType

url

uploadedBy

relatedCollection

relatedId

createdAt

Only file URLs will be stored. Actual files will be uploaded to Cloudinary.

15. Notifications Collection

Purpose

Store system notifications.

Examples

Record Approved
New Report Generated
AI Processing Complete

Fields

_id

title

message

user

isRead

createdAt
16. System Logs Collection

Purpose

Maintain audit logs.

Examples

Login
Report Generation
Approval
AI Processing
Errors

Fields

_id

action

performedBy

description

timestamp
17. Relationships
Users
 │
 ├── Approves
 │
 ▼
Pending Records
 │
 ▼
Student Achievements

Faculty Achievements

Placements

Internships

Completed Event Reports

Reports are generated using approved records.

18. Indexing Strategy

Create indexes on:

Users

email

Student Achievements

studentName
achievementType
date

Faculty Achievements

facultyName
achievementType

Placements

company
studentName

Internships

company
studentName

Completed Event Reports

eventTitle
eventType
date

Monthly Reports

month
year
19. Data Validation Rules

The backend must validate:

Required fields
Email format
Date format
Duplicate records
Empty values
File types

Invalid records should never reach MongoDB.

20. Data Lifecycle
WhatsApp Message
        │
        ▼
AI Extraction
        │
        ▼
Pending Records
        │
Faculty Approval
        │
        ▼
Permanent Collection
        │
        ▼
Search
Reports
Dashboard
Analytics
21. Cursor Database Rules

Cursor must:

Create one Mongoose model per collection.
Use timestamps in every schema.
Add proper validation.
Use indexes where specified.
Keep collections independent but reference related data using ObjectIds where appropriate.
Never delete records permanently without authorization (prefer soft delete if required in future).
22. Definition of Done

The database layer is complete when:

All collections are created.
Models are validated.
Relationships are implemented.
Indexes are added.
CRUD operations work.
AI can store approved records.
Reports can retrieve data efficiently.
End of Document 5