PROJECT OVERVIEW & SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

Project Version: 2.0

Status: Final Approved by HOD

Project Title
AccrediAssist
A Multi-Agent AI System for Automated NBA, NAAC & AICTE Accreditation Evidence Management using WhatsApp and Institutional Data
Domain
Artificial Intelligence (AI)
Agentic AI
Educational Technology (EdTech)
Academic Accreditation Management
Information Extraction
Natural Language Processing (NLP)
Project Vision

Educational institutions communicate most of their academic activities through official WhatsApp groups. Information related to workshops, industrial visits, placements, internships, faculty achievements, student achievements, seminars, certifications, and other activities is continuously shared in these groups.

However, this information becomes difficult to retrieve over time because WhatsApp is not designed to serve as a long-term institutional repository. As a result, faculty members spend significant time manually collecting evidence for NBA, NAAC, and AICTE accreditation processes.

AccrediAssist aims to solve this problem by automatically converting WhatsApp communications into structured institutional knowledge.

Using a Multi-Agent AI architecture, the system extracts relevant information from WhatsApp messages, classifies it into appropriate categories, stores it in MongoDB, and enables intelligent search, reporting, and accreditation evidence management.

Problem Statement

Most educational institutions face the following challenges:

Important information gets buried in WhatsApp conversations.
Searching old achievements is time-consuming.
Accreditation evidence is collected manually.
Monthly reports require repetitive effort.
Event reports are prepared manually after completion.
Student and faculty achievements are scattered across different platforms.
Placement and internship records are difficult to maintain.
There is no centralized AI-powered knowledge repository.

These issues increase faculty workload and reduce operational efficiency during accreditation cycles.

Proposed Solution

Develop an AI-powered multi-agent platform that:

Reads information from official WhatsApp groups.
Uses AI agents to extract important details.
Automatically classifies the information.
Stores structured records in MongoDB.
Generates reports automatically.
Allows users to search historical records using natural language.
Supports accreditation evidence management for NBA, NAAC, and AICTE.
Project Objectives

The primary objectives are:

Automate institutional information extraction from WhatsApp.
Reduce manual documentation work.
Create a centralized institutional knowledge base.
Generate reports automatically.
Improve accreditation readiness.
Enable AI-powered search across institutional records.
Preserve historical departmental information.
Target Users
Administrator
Manage the entire system.
Manage users and permissions.
Monitor AI processing.
HOD
Review departmental information.
View reports.
Search historical data.
Faculty
Review AI-extracted information.
Upload supporting documents if required.
Generate reports.
Accreditation Committee
Search evidence.
Download reports.
View analytics.
Core Features
1. WhatsApp Information Extraction

Automatically capture relevant information from official departmental WhatsApp groups.

2. AI Information Extraction

Extract:

Student Name
Faculty Name
Workshop
Industrial Visit
Internship
Placement
Seminar
Research Paper
Patent
Certification
Achievement
3. Automatic Achievement Classification

The AI agent should identify the category of the achievement.

Examples:

Sports
Cultural
Technical
Internship
Placement
Workshop
Seminar
Certification
Research
Patent

The classification should happen automatically without manual tagging.

4. MongoDB Knowledge Base

Store every approved record permanently.

5. Smart Search

Users should be able to search using natural language.

Examples:

Show workshops conducted in 2026.
Find placements in Infosys.
Show all sports achievements.
Find internships completed this year.
6. Monthly Report Generation

Generate Word/PDF reports for:

Students
Faculty
Placements
Achievements
7. Completed Event Report Generation

Unlike the previous version, the system does not create events.

Instead, after a workshop, seminar, industrial visit, or other activity is completed, AI generates a professional report using:

WhatsApp messages
Images (if available)
Captions
Date
Venue
Coordinator
Summary

Supported reports include:

Industrial Visit Report
Workshop Report
Seminar Report
Guest Lecture Report
Training Program Report
8. Internship & Placement Management

Store:

Student
Company
Role
Duration
Package (if applicable)
Offer Letter (optional)
9. Dashboard

Provide:

Total Records
Placements
Internships
Workshops
Faculty Achievements
Student Achievements
Monthly Statistics
Expected Benefits
Reduced faculty workload.
Faster report generation.
Improved accreditation preparation.
Better institutional record management.
Permanent digital repository.
AI-assisted information retrieval.
Out of Scope (Version 2)

The following features are not included in the MVP:

Event Creation Module
Event Registration
WhatsApp Event Announcement Generator
Calendar Management
Student Attendance
Complete College ERP

These may be considered in future versions.

Functional Requirements

The system shall:

Extract information from WhatsApp.
Process information using AI.
Automatically classify records.
Store structured data in MongoDB.
Generate reports.
Support smart search.
Display analytics.
Allow downloading reports.
Non-Functional Requirements
Responsive UI
Secure Authentication
Scalable Architecture
Modular Design
Fast Search Performance
Maintainable Codebase
Clean REST APIs
Success Criteria

The project is successful if it can:

Read institutional information from WhatsApp.
Correctly classify achievements.
Store information in MongoDB.
Generate completed event reports.
Generate monthly reports.
Search historical records.
Support accreditation documentation.
Cursor Instructions

Before implementation, Cursor must:

Read all documentation.
Follow modular architecture.
Use Express.js for the backend.
Use MongoDB as the primary database.
Build reusable components.
Maintain clean coding practices.
Implement one module at a time.
End of Document 1