Perfect. This is one of the most critical implementation documents because your project's core innovation depends on WhatsApp integration. Since you're using **MongoDB + Express + AI Agents**, this document is written specifically for Cursor to implement.

---

# DOCUMENT 15

# WHATSAPP INTEGRATION IMPLEMENTATION

**Project:** AccrediAssist

**Version:** 2.0

---

# 1. Introduction

This document defines the implementation of the WhatsApp Integration Service responsible for receiving messages from official departmental WhatsApp groups and forwarding them to the AI pipeline.

This module serves as the entry point for all institutional information processed by AccrediAssist.

---

# 2. Objectives

The WhatsApp Integration module must:

* Connect to one authorized WhatsApp Business/official account.
* Authenticate using QR Code.
* Maintain persistent sessions.
* Listen for incoming messages.
* Monitor only approved WhatsApp groups.
* Capture message metadata.
* Download media (images/documents) when present.
* Forward messages to the AI Extraction Agent.
* Handle reconnections automatically.

---

# 3. Technology Stack

| Component        | Technology     |
| ---------------- | -------------- |
| Runtime          | Node.js        |
| Framework        | Express.js     |
| Language         | TypeScript     |
| WhatsApp Library | Baileys        |
| Database         | MongoDB        |
| File Storage     | Cloudinary     |
| Queue (Future)   | BullMQ + Redis |

---

# 4. Folder Structure

```text
backend/

src/

├── whatsapp/
│   ├── whatsapp.service.ts
│   ├── session.service.ts
│   ├── message.listener.ts
│   ├── media.service.ts
│   ├── group.filter.ts
│   ├── reconnect.service.ts
│   └── index.ts
```

Each file should have a single responsibility.

---

# 5. WhatsApp Authentication

### Steps

1. Start backend server.
2. Generate QR Code.
3. Admin scans QR using the official WhatsApp account.
4. Session credentials are stored securely.
5. Future logins should reuse the saved session.
6. QR should only be required if the session expires.

---

# 6. Session Management

The session service is responsible for:

* Saving authentication credentials.
* Restoring sessions after server restart.
* Detecting expired sessions.
* Triggering re-authentication if necessary.

Session data must never be committed to GitHub.

---

# 7. Connection Lifecycle

```text
Server Starts
      │
      ▼
Initialize WhatsApp Client
      │
      ▼
Load Existing Session
      │
      ▼
Session Exists?
   ┌───────────┐
   │           │
 Yes          No
   │           │
Connect     Generate QR
   │           │
   └──────┬────┘
          ▼
Connected
          │
          ▼
Listen for Messages
```

---

# 8. Authorized Group Filtering

The system should process messages **only** from approved groups.

Example configuration:

```json
{
  "allowedGroups": [
    "Computer Department",
    "Training & Placement",
    "Faculty Updates",
    "Student Achievements"
  ]
}
```

Messages from personal chats or unknown groups must be ignored.

---

# 9. Incoming Message Structure

Each received message should be converted into a standard object.

Example:

```json
{
  "groupName": "Training & Placement",
  "sender": "Placement Officer",
  "message": "Rahul Patil secured placement at Infosys.",
  "timestamp": "2026-07-09T10:30:00Z",
  "media": null
}
```

This standardized object is passed to the AI Extraction Agent.

---

# 10. Media Handling

If a message contains attachments:

Supported media:

* Images
* PDFs
* Documents

Workflow:

```text
Receive Media
      │
      ▼
Download File
      │
      ▼
Upload to Cloudinary
      │
      ▼
Store Cloudinary URL
      │
      ▼
Pass URL to AI
```

Only the Cloudinary URL should be stored in MongoDB.

---

# 11. AI Integration Flow

```text
Incoming WhatsApp Message
           │
           ▼
Message Listener
           │
           ▼
Group Filter
           │
           ▼
Media Processing
           │
           ▼
AI Extraction Agent
           │
           ▼
Classification Agent
           │
           ▼
Validation Agent
           │
           ▼
Pending Review
```

---

# 12. Error Handling

The service should handle:

* Lost connection
* Invalid sessions
* QR expiration
* Media download failures
* Unsupported message types
* AI service unavailable

Errors should be logged and retried where appropriate.

---

# 13. Logging

Maintain logs for:

* WhatsApp connected
* WhatsApp disconnected
* QR generated
* Message received
* Media downloaded
* AI request sent
* AI response received
* Errors

Logs should include timestamps for debugging.

---

# 14. Security Rules

* Only administrators can manage the WhatsApp connection.
* Session credentials must be encrypted or securely stored.
* Ignore messages from unauthorized groups.
* Never expose raw WhatsApp session data via APIs.
* Respect WhatsApp's Terms of Service.

---

# 15. Express APIs

Admin APIs:

```text
GET    /api/whatsapp/status
POST   /api/whatsapp/connect
POST   /api/whatsapp/disconnect
GET    /api/whatsapp/qr
GET    /api/whatsapp/groups
```

Future APIs:

```text
POST   /api/whatsapp/reconnect
POST   /api/whatsapp/refresh-session
```

---

# 16. Configuration

Environment variables:

```text
WHATSAPP_SESSION_PATH=

WHATSAPP_ALLOWED_GROUPS=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=
```

---

# 17. Cursor Implementation Order

Cursor should implement this module in the following sequence:

1. Install and configure Baileys.
2. Implement QR authentication.
3. Implement session persistence.
4. Build connection manager.
5. Create message listener.
6. Add authorized group filtering.
7. Implement media download and upload to Cloudinary.
8. Forward messages to the AI Extraction Agent.
9. Implement automatic reconnection.
10. Test complete message flow.

Each step must be tested before moving to the next.

---

# 18. Future Enhancements

The architecture should support:

* Multiple WhatsApp accounts.
* Multiple departments.
* Multi-college SaaS deployment.
* Scheduled message synchronization.
* AI-based spam detection.
* OCR for images and PDF attachments.

---

# 19. Success Criteria

The WhatsApp Integration module is complete when:

* QR authentication works.
* Sessions persist after server restart.
* Only approved groups are monitored.
* Messages are received in real time.
* Media files are uploaded successfully.
* Messages are forwarded to the AI pipeline.
* Pending records are created automatically.
* Connection failures are handled gracefully.

---

# ⚠️ Important Technical Note

For your Final Year Project, **Baileys is suitable for development and demonstrations** because it provides WhatsApp Web integration. However, for a real production SaaS with institutions, you should plan to migrate to the **official WhatsApp Business Platform (Cloud API)**, as it is the supported solution for commercial deployments.

---

# End of Document 15

## Next Document

**Document 16 – MongoDB Models, Mongoose Schemas & Database Relationships**

This will define every Mongoose schema in code-level detail (field types, validation, indexes, relationships, enums, timestamps, soft deletes, and reusable base models). Cursor can almost directly generate the backend models from this document.
