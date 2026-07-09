DOCUMENT 6
WHATSAPP INTEGRATION & AI INFORMATION EXTRACTION

Project: AccrediAssist

Version: 2.0

1. Introduction

The primary objective of AccrediAssist is to automatically transform unstructured WhatsApp conversations into structured institutional records that support NBA, NAAC, and AICTE accreditation.

Official departmental WhatsApp groups are the primary communication channel for academic activities. Instead of manually searching these chats, AccrediAssist continuously monitors messages, extracts important information using AI, and stores verified records in MongoDB.

2. Why WhatsApp?

Most colleges already use WhatsApp for communication.

Examples of messages include:

Student placements
Internship updates
Workshop completion
Seminar details
Industrial visits
Faculty publications
Student achievements
Sports achievements
Cultural activities
Certifications

Currently, this information is scattered across chat history and becomes difficult to retrieve.

AccrediAssist converts these temporary messages into permanent institutional knowledge.

3. System Workflow
Official Department WhatsApp Group
                │
                ▼
      WhatsApp Integration Service
                │
                ▼
       Receive New Message
                │
                ▼
      AI Information Extraction
                │
                ▼
      AI Classification Agent
                │
                ▼
       Pending Review Queue
                │
      Faculty Review & Approval
                │
                ▼
         MongoDB Knowledge Base
                │
        Search • Reports • Dashboard
4. WhatsApp Integration

The backend connects to an official department WhatsApp account using a WhatsApp Web-based integration.

Responsibilities:

Authenticate using QR code
Maintain session
Listen for incoming messages
Identify official groups
Forward messages to the AI pipeline

The integration should work continuously after successful authentication.

5. Message Listener

The listener monitors approved WhatsApp groups.

When a new message arrives:

Capture message text.
Capture sender information.
Capture group information.
Capture timestamp.
Forward data to the AI Extraction Agent.

Example:

Group:
Computer Engineering Department

Sender:
Training & Placement Officer

Message:
Congratulations!
Rahul Patil has secured an internship at Infosys as a Software Development Intern.

Time:
10:42 AM
6. AI Information Extraction

The Extraction Agent converts unstructured text into structured data.

Example:

Input:

Congratulations!
Rahul Patil has secured an internship at Infosys as a Software Development Intern.

Output:

{
  "category": "Internship",
  "studentName": "Rahul Patil",
  "company": "Infosys",
  "role": "Software Development Intern"
}

The AI should never modify facts that are not present in the message.

7. Supported Information Types

The AI should recognize:

Student Information
Achievements
Internships
Placements
Certifications
Sports
Cultural Activities
Competitions
Hackathons
Faculty Information
Publications
Patents
Workshops
FDPs
Guest Lectures
Awards
Consultancy
Academic Activities
Workshops
Seminars
Industrial Visits
Training Programs
Guest Lectures
8. AI Classification

After extraction, the Classification Agent assigns a category.

Possible categories:

Student Achievement
Faculty Achievement
Placement
Internship
Workshop
Seminar
Industrial Visit
Sports
Cultural
Publication
Patent
Certification

Example:

Message:

"Girls won first prize in volleyball."

Output:

Category:
Sports Achievement
9. Confidence Score

Each extracted record receives a confidence score.

Example:

Confidence

96%

If confidence is below a predefined threshold (for example, 70%), the record should be highlighted for careful faculty review.

10. Duplicate Detection

Before creating a new record, the Duplicate Detection Agent checks whether similar information already exists.

Compare fields such as:

Student Name
Faculty Name
Event Title
Company
Date
Publication Title

If a probable duplicate is found, the system alerts the reviewer instead of creating another record.

11. Approval Workflow

No AI-generated record is stored directly.

Workflow:

WhatsApp Message
        │
        ▼
AI Extraction
        │
        ▼
Pending Record
        │
        ▼
Faculty Review
        │
 ┌──────┼──────┐
 ▼      ▼      ▼
Approve Edit Reject
        │
        ▼
MongoDB

Faculty may:

Approve
Edit extracted fields
Reject incorrect records
12. Image Handling

If a WhatsApp message contains images:

The system should:

Download images
Upload them to Cloudinary
Store image URLs in MongoDB

These images can later be included in generated reports.

13. AI Error Handling

If AI cannot confidently understand a message:

Mark the record as Needs Review
Do not guess missing information
Notify the reviewer

The AI should always prioritize accuracy over automation.

14. Security Considerations

The system should:

Process only authorized departmental groups.
Restrict WhatsApp access to administrators.
Protect stored session data.
Never expose raw messages publicly.
Log all AI processing actions.
15. Expected Output

Every approved message should become a structured database record that is immediately available for:

Dashboard
Smart Search
Monthly Reports
Completed Event Reports
Accreditation Evidence
16. Cursor Implementation Notes

Cursor must implement this module in the following order:

WhatsApp connection service
QR authentication
Session management
Message listener
AI extraction service
Classification service
Duplicate detection
Pending review workflow
Approval APIs
MongoDB integration

Each step should be completed and tested before moving to the next.

17. Success Criteria

This module is considered complete when:

The system connects to the official WhatsApp account.
New messages are received automatically.
AI extracts structured information correctly.
Categories are assigned automatically.
Duplicate records are detected.
Faculty can review and approve records.
Approved information is stored in MongoDB.
Stored records are available for search and reporting.
End of Document 6