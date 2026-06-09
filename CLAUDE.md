# Family Planning App

## Project Overview

A shared web app for Tony and his husband to collaborate on family planning across major life categories. The app integrates deeply with Google Suite so all documents, budgets, and plans live in Google Drive and are accessible from any device.

## Goals

- One central place for both partners to see everything going on
- Documents stored as real Google Docs/Sheets in a shared Drive folder
- Google OAuth login — no separate accounts or passwords to manage
- Clean, organized UI by planning category
- Easy to add notes, tasks, links, and documents to each category

## Planning Categories

- Landscaping
- Insurance
- Financial Planning
- Vacations
- _(more to be added as the project grows)_

## Tech Stack

- **Framework:** Next.js (React) — good Google API support, easy Vercel deployment
- **Auth:** Google OAuth via NextAuth.js
- **Storage:** Google Drive API — connects to existing shared Google Drive folder
- **Hosting:** Vercel (free tier, `.vercel.app` URL)
- **Styling:** Tailwind CSS

## Google Suite Integration

- Login via Google OAuth (both users authenticate with their own Google accounts)
- Connects to the couple's existing shared Google Drive folder
- Each category has its own subfolder in Drive — docs and sheets listed in the app
- App can create new Google Docs/Sheets directly from the UI
- Google Calendar integration — upcoming events shown per category
- Each category page shows: linked Docs/Sheets, shared task list, notes, calendar events

## Project Structure (Planned)

```
family-planning-app/
├── CLAUDE.md               # This file
├── README.md
├── app/                    # Next.js app directory
│   ├── api/                # API routes (Google OAuth, Drive API calls)
│   ├── dashboard/          # Main family dashboard
│   └── [category]/         # Per-category planning pages
├── components/             # Shared UI components
├── lib/                    # Google API helpers, auth config
└── public/
```

## Open Decisions

- [x] Tech stack — Next.js + Tailwind + NextAuth + Google APIs
- [x] Domain — free `.vercel.app` URL
- [x] Category pages — Docs/Sheets, task list, notes, calendar events
- [x] Drive — connect to existing shared Google Drive folder
- [ ] Name/path of the shared Google Drive folder to connect to
- [ ] Google Cloud project setup (OAuth credentials needed before first run)
- [ ] Mobile-first or desktop-first design?

## Phases

### Phase 1 — Foundation
- [ ] Project scaffold (Next.js + Tailwind)
- [ ] Google OAuth login (both partners can log in)
- [ ] Dashboard with category cards (Landscaping, Insurance, Financial Planning, Vacations)
- [ ] Google Drive integration (list and open existing docs per category subfolder)

### Phase 2 — Core Features
- [ ] Create new Google Doc/Sheet from within the app
- [ ] Notes per category (stored in Drive as a pinned doc)
- [ ] Shared task lists per category
- [ ] Google Calendar events shown per category

### Phase 3 — Polish & Extras
- [ ] Mobile-responsive design
- [ ] Notifications or reminders
- [ ] Additional categories
- [ ] Activity feed (recent changes across all categories)

## Setup Notes

### Google Cloud Setup (required before first run)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project
2. Enable these APIs: **Google Drive API**, **Google Docs API**, **Google Sheets API**, **Google Calendar API**
3. Go to **APIs & Services > OAuth consent screen** — set up as External, add your two Gmail addresses as test users
4. Go to **APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Secret into `.env.local`
6. Generate a random NEXTAUTH_SECRET: `openssl rand -base64 32`

### Environment Variables (`.env.local`)

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
SHARED_DRIVE_FOLDER_NAME=Family Planning   # match your actual folder name
```

### Running Locally

```bash
cd ~/Claude/family-planning-app
npm run dev
# Open http://localhost:3000
```

### Google Drive Folder Structure

The app expects this structure in your shared Google Drive:

```
Family Planning/          ← set SHARED_DRIVE_FOLDER_NAME to this
  Landscaping/
  Insurance/
  Financial Planning/
  Vacations/
```

Subfolders are created automatically if they don't exist yet.

### OAuth Scopes Used

- `drive` — list, create, and open files in shared folder
- `documents` — create Google Docs
- `spreadsheets` — create Google Sheets
- `calendar.readonly` — show upcoming events per category

## Session Log

| Date | What was done |
|------|---------------|
| 2026-06-08 | Project created, CLAUDE.md initialized, all key decisions made, ready to scaffold |
| 2026-06-08 | Phase 1 complete — Next.js scaffold, Google OAuth, Drive API, Calendar API, dashboard, all 4 category pages with files/tasks/notes/events |
