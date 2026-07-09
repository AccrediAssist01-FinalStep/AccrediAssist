PROPOSED SOLUTION & COMPLETE SYSTEM ARCHITECTURE

Project: AccrediAssist

Version: 2.0

1. Introduction

AccrediAssist is an Agentic AI-powered accreditation evidence management platform designed to automatically transform institutional WhatsApp communications into structured, searchable, and report-ready academic records.

Instead of manually collecting information from hundreds of WhatsApp messages, faculty members can use a centralized AI-powered system that extracts, classifies, stores, and organizes institutional data.

The platform acts as an Institutional Knowledge Repository for NBA, NAAC, and AICTE accreditation.

2. High-Level Architecture
                   Official WhatsApp Groups
                              │
                              ▼
                 WhatsApp Integration Service
                              │
                              ▼
                  AI Multi-Agent Processing
                              │
        ┌──────────────┬───────────────┬──────────────┐
        ▼              ▼               ▼
 Information      Classification     Validation
 Extraction          Agent             Agent
        │              │               │
        └──────────────┴───────────────┘
                              │
                              ▼
                     Pending Review Queue
                              │
                     Faculty Approval Panel
                    Approve / Reject / Edit
                              │
                              ▼
                        MongoDB Database
                              │
      ┌──────────────┬─────────────┬──────────────┐
      ▼              ▼             ▼
 Dashboard      Smart Search     Reports
                              │
                              ▼
                   NBA / NAAC / AICTE Evidence
3. System Workflow
Step 1

A message is posted in an official department WhatsApp group.

Example:

"Congratulations! Rahul Patil secured an internship at Infosys as a Software Intern."

Step 2

The WhatsApp Integration Service receives the new message.

Step 3

The AI Extraction Agent identifies:

Student Name
Company
Internship
Date
Role
Step 4

The Classification Agent categorizes it as:

Internship

Step 5

The record enters the Pending Review Queue.

Step 6

Faculty reviews the extracted information.

Options:

Approve
Edit
Reject
Step 7

Approved information is stored permanently in MongoDB.

Step 8

The information becomes available for:

Search
Reports
Dashboard
Accreditation Evidence
4. User Roles
Administrator

Responsibilities

Manage users
Manage permissions
Monitor AI services
View logs
Configure system
HOD

Responsibilities

View analytics
Search records
Generate reports
Review accreditation evidence
Faculty

Responsibilities

Review AI-generated records
Upload supporting documents
Generate reports
Search information
Accreditation Committee

Responsibilities

Search evidence
Generate reports
View dashboards
Download documents
5. Core Modules
Module 1
WhatsApp Integration

Responsibilities

Connect to official department WhatsApp
Listen for new messages
Forward messages to AI pipeline

Output

Raw WhatsApp Message

Module 2
AI Information Extraction

Responsibilities

Extract:

Names
Dates
Companies
Venues
Workshops
Industrial Visits
Certifications
Placements
Internships
Publications

Output

Structured JSON

Module 3
Classification Agent

Automatically determine the category.

Examples

Input:

"Our students won first prize in coding competition."

Output:

Category

Technical Achievement

Another Example

Input:

"Girls won Kabaddi Championship."

Output

Category

Sports Achievement

Supported Categories

Workshop
Seminar
Industrial Visit
Sports
Cultural
Placement
Internship
Patent
Publication
Research
Certification
Student Achievement
Faculty Achievement
Module 4
Approval Module

No record is directly stored.

Every extracted record goes through approval.

Workflow

AI

↓

Pending Review

↓

Faculty

↓

Approve

↓

Database
Module 5
MongoDB Knowledge Base

Acts as the permanent repository.

Stores

Achievements
Reports
Placements
Internships
Publications
Patents
Images
Supporting Documents
Module 6
Smart Search

Supports

Keyword Search

Examples

Internship Infosys

Natural Language Search

Examples

Show all internships completed in 2026.

Module 7
Report Generator

Generate reports for:

Workshop
Industrial Visit
Student Achievement
Faculty Achievement
Placement
Internship
Monthly Activity

Formats

Word (.docx)
PDF
Module 8
Dashboard

Display

Monthly Activity
Placement Count
Internship Count
Student Achievements
Faculty Achievements
Publications
Reports Generated
6. AI Multi-Agent Architecture

The system uses specialized AI agents.

Agent 1

Communication Agent

Purpose

Receives messages from WhatsApp.

Agent 2

Information Extraction Agent

Purpose

Extract important information.

Agent 3

Classification Agent

Purpose

Identify the correct category.

Agent 4

Validation Agent

Purpose

Check extracted information for completeness.

Agent 5

Duplicate Detection Agent

Purpose

Prevent duplicate entries.

Agent 6

Search Agent

Purpose

Answer user queries using MongoDB data.

Agent 7

Report Generation Agent

Purpose

Prepare Word and PDF reports automatically.

7. Data Flow
WhatsApp

↓

AI Agents

↓

Pending Review

↓

Faculty Approval

↓

MongoDB

↓

Dashboard

↓

Search

↓

Reports
8. Security Architecture

The system shall implement:

JWT Authentication
Password Encryption
Role-Based Access
Secure APIs
Audit Logs
Input Validation
9. Scalability

The architecture should support future expansion.

Possible future modules

OCR for Certificates
Email Integration
Mobile App
Multi-Department Support
Multi-College SaaS
10. Why Agentic AI?

Traditional systems simply store information.

AccrediAssist uses specialized AI agents that work together.

Each agent performs one responsibility:

Receive messages
Understand content
Extract data
Classify records
Validate information
Generate reports
Answer user queries

This modular approach makes the platform easier to maintain, extend, and improve over time.

Cursor Implementation Notes

Cursor must follow this implementation order:

Backend Foundation
MongoDB Integration
Authentication
WhatsApp Integration
AI Processing Pipeline
Approval Module
Database Storage
Dashboard
Smart Search
Report Generation
Analytics
Deployment

Each module should be implemented and tested before moving to the next.

End of Document 3