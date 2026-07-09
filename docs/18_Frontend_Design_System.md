Perfect. This document is extremely important because it tells Cursor **exactly how to build the frontend**. If followed properly, the entire UI will remain consistent and professional.

---

# DOCUMENT 18

# FRONTEND DESIGN SYSTEM & COMPONENT LIBRARY

**Project:** AccrediAssist

**Version:** 2.0

---

# 1. Introduction

This document defines the frontend architecture, UI design system, reusable components, layouts, navigation, state management, and coding standards for AccrediAssist.

The frontend should be modern, responsive, and optimized for desktop users while remaining functional on tablets and mobile devices.

---

# 2. Technology Stack

| Component        | Technology      |
| ---------------- | --------------- |
| Framework        | Next.js 15      |
| Language         | TypeScript      |
| Styling          | Tailwind CSS    |
| UI Components    | shadcn/ui       |
| Icons            | Lucide React    |
| Charts           | Recharts        |
| Forms            | React Hook Form |
| Validation       | Zod             |
| Data Fetching    | TanStack Query  |
| State Management | Zustand         |
| HTTP Client      | Axios           |

---

# 3. Frontend Folder Structure

```text
frontend/

src/

├── app/
├── components/
│     ├── common/
│     ├── dashboard/
│     ├── forms/
│     ├── tables/
│     ├── reports/
│     ├── search/
│     └── charts/
│
├── hooks/
├── services/
├── store/
├── lib/
├── types/
├── constants/
├── utils/
├── layouts/
├── styles/
└── middleware.ts
```

---

# 4. Design System

## Primary Colors

```text
Primary Blue

Secondary White

Accent Purple

Success Green

Warning Orange

Error Red

Gray Scale
```

---

## Typography

Headings

* H1
* H2
* H3

Body

* Large
* Medium
* Small

Buttons

* Medium
* Small

Captions

* Extra Small

---

# 5. Application Layout

```text
+--------------------------------------------------------------+
| Navbar                                  Notifications Profile |
+--------------------------------------------------------------+

| Sidebar |                                           |
|         |                                           |
|         |             Main Content                  |
|         |                                           |
|         |                                           |
|         |                                           |
+--------------------------------------------------------------+
```

---

# 6. Sidebar Navigation

Menu

Dashboard

Pending Reviews

Student Achievements

Faculty Achievements

Placements

Internships

Completed Event Reports

Publications

Patents

Smart Search

Reports

Analytics

Settings

Profile

Logout

Menu visibility depends on user role.

---

# 7. Navbar

Navbar should include

* Logo
* Project Name
* Search
* Notification Icon
* User Avatar
* Profile Menu

---

# 8. Authentication Pages

Pages

```text
/login

/forgot-password
```

Login Screen

Fields

* Email
* Password

Buttons

* Login

Validation

* Required
* Email Format

---

# 9. Dashboard Page

Cards

* Total Records
* Pending Reviews
* Student Achievements
* Faculty Achievements
* Placements
* Internships
* Publications
* Patents
* Reports Generated

---

Charts

* Monthly Activities
* Placement Trend
* Internship Trend
* Achievement Distribution
* Publications
* Reports Generated

---

# 10. Pending Review Page

Table

Columns

* Message
* Category
* Confidence
* Group
* Date
* Status

Actions

* View
* Approve
* Edit
* Reject

---

# 11. Smart Search Page

Components

Search Bar

Advanced Filters

Results Table

Search History

Suggested Searches

---

Example Queries

Show all internships.

Find workshops.

Show placements in Infosys.

Find publications.

---

# 12. Student Achievement Page

Table

Columns

* Student
* Department
* Achievement
* Date

Actions

* View
* Edit
* Delete
* Download

---

# 13. Faculty Achievement Page

Columns

* Faculty Name
* Achievement
* Organization
* Date

Actions

* View
* Edit
* Download

---

# 14. Placements Page

Columns

* Student
* Company
* Role
* Package

Actions

* View
* Export

---

# 15. Internship Page

Columns

* Student
* Company
* Duration

Actions

* View
* Export

---

# 16. Completed Event Reports

Display

* Event Name
* Event Type
* Date
* Coordinator

Actions

* View
* Download DOCX
* Download PDF

---

# 17. Report Generation Page

Users select

Report Type

Filters

Generate

Download

Preview

---

Supported Reports

Monthly

Placement

Internship

Faculty

Student

Completed Event

---

# 18. Analytics Page

Charts

Bar Chart

Pie Chart

Line Chart

Area Chart

Metrics

* Total Activities
* Monthly Trends
* Placement Growth
* Publications
* Patents

---

# 19. Settings Page

Admin Only

Sections

* WhatsApp Connection
* AI Configuration
* User Management
* Database Status
* Cloudinary Status
* Logs

---

# 20. Reusable Components

Buttons

Input Fields

Cards

Badges

Tables

Search Bar

Pagination

Dropdown

Modal

Confirmation Dialog

Toast

Skeleton Loader

Avatar

Breadcrumb

File Upload

Image Viewer

---

# 21. State Management

Use **Zustand** for:

* Authentication
* User Profile
* Notifications
* Theme
* Sidebar State

Use **TanStack Query** for:

* API requests
* Caching
* Pagination
* Refetching

---

# 22. API Layer

All API calls should go through:

```text
src/services/
```

Example

```text
auth.service.ts

dashboard.service.ts

report.service.ts

search.service.ts

whatsapp.service.ts
```

Axios should be configured with:

* Base URL
* JWT Token Interceptor
* Error Interceptor
* Refresh Logic (future)

---

# 23. Form Handling

All forms should use:

* React Hook Form
* Zod Validation

Forms

Login

Approve Record

Generate Report

Search Filters

Profile

Settings

---

# 24. Loading & Error States

Every page should include:

* Loading Skeleton
* Empty State
* Error State
* Retry Button

Never leave the user with a blank screen.

---

# 25. Responsive Design

Support:

Desktop

Laptop

Tablet

Mobile

Sidebar should collapse automatically.

Tables should become scrollable on smaller screens.

---

# 26. Accessibility

Follow WCAG guidelines:

* Keyboard navigation
* Proper labels
* Sufficient color contrast
* Focus indicators
* ARIA attributes where required

---

# 27. Cursor Implementation Order

Cursor should build the frontend in this sequence:

1. Global Layout
2. Authentication
3. Sidebar & Navbar
4. Dashboard
5. Data Tables
6. Pending Review
7. Search
8. Reports
9. Analytics
10. Settings
11. Profile
12. Responsive Design
13. UI Polish

Every component should be reusable and fully typed with TypeScript.

---

# 28. Success Criteria

The frontend implementation is complete when:

* All pages follow the design system.
* Components are reusable.
* Navigation is intuitive.
* State management is centralized.
* Forms are validated.
* API integration is stable.
* The application is responsive.
* The UI is modern, accessible, and professional.

---

# End of Document 18

## Next Document

**Document 19 – AI Report Generation Engine & Document Builder**

This will be one of the most advanced documents. It will explain how the AI automatically generates professional **NBA/NAAC-ready reports**, including completed event reports with photos, monthly departmental reports, placement reports, internship reports, and faculty/student achievement reports in **DOCX and PDF** format. It will define templates, AI summarization, formatting rules, and export workflows so Cursor can implement a complete report generation engine.
