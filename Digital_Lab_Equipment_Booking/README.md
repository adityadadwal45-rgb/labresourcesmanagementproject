# LabReserve — Digital Lab Equipment Booking

LabReserve is a responsive front-end prototype for booking shared academic laboratory equipment. It uses plain HTML, CSS and JavaScript, with no framework, build step or backend.

## Run locally
Open `index.html` directly in a modern browser. Keep `lab-equipment-workbench.png` beside it. Demo data and preferences are stored in that browser's `localStorage`.

## Demo accounts
- Student: `student@lab.edu` / `student123`
- Administrator: `admin@lab.edu` / `admin123`

You can also create a student demo account from the sign-in dialog. Use the Student/Administrator selector to choose the matching workspace.

## Features
- Public landing page, demo sign-in and student sign-up
- Separate student and administrator workspaces with role-aware hash routes
- Searchable equipment catalogue with category/status filters and grid/list layouts
- Date and time-slot selection with past, booking and maintenance conflict checks
- Booking requests, approvals, rejection reasons, cancellations and usage history
- Equipment management and date-range maintenance blocks
- Notifications, admin overview/reporting, CSV history export and user management
- Admin-only reset control to restore the original demo data
- Projector-friendly desktop text and controls, collapsible desktop navigation and a mobile navigation drawer
- Dark mode and keyboard-accessible command palette
- Local persistence, motion preferences and reduced-motion support

## Prototype and security limits
Authentication and role routing are client-side demonstrations only. Demo passwords and data are stored in the browser and can be inspected or changed; routes do not provide real access control. Data is local to one browser and is not shared between users or devices. Do not use this prototype for real accounts, sensitive data or production bookings.

A real deployment needs a backend, a database, secure authentication and server-side authorization and booking-conflict validation.

Google Fonts are loaded from the internet; system fallback fonts are used when they are unavailable.
