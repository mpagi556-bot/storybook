# Upgrade playbook implementation matrix

| Playbook section | Status in this ZIP |
|---|---|
| Safety routine | Documented. The live database/repository were not accessed; backup and password rotation remain the operator's responsibility. |
| Database upgrade | Migrations 001 and 002 added for PostgreSQL and SQLite, with startup runner and migration ledger. Live PostgreSQL execution not verified. |
| Master prompt / architecture | Preserved: plain Node HTTP server, browser frontend, existing engine, Supabase/PostgreSQL or SQLite, Vercel + Render. |
| Prompt 1 – Story Library | Implemented: CRUD, publish/archive, search/level visibility, metadata, sample stories, reading tracking, story-to-test selection. |
| Prompt 2 – Real classes | Partially implemented: classes, membership assignment, teacher level scope, pupil CSV import. Multi-class `test_classes` publication and year-end promotion remain incomplete. |
| Prompt 3 – Upload/import | Implemented with noted limitations: paste/TXT/DOCX/PDF extraction, OCR, question CSV, signed private-storage upload/download, resource/cover/audio attachments. TUS resumable uploads and object scanning are not included. |
| Prompt 4 – AI generation | Implemented: server-side Anthropic story/question generation, model config, daily limits, usage logs, validation, unapproved question bank. AI written-marking suggestions remain incomplete. |
| Prompt 5 – Teacher tools | Implemented: edit title before attempt, duplicate, archive, due/time limits, retakes with history, comments, filters, analytics, CSV and print. Full historical-attempt UI is not included. |
| Prompt 6 – Pupil experience | Implemented: resume/autosave, server timer enforcement, read-aloud, practice, accessibility controls, progress, points, reading streak and badges. |
| Prompt 7 – Parent role | Implemented: admin-created parent accounts, links, linked-child results, Bloom levels, comments, completed corrections and announcements. Self-signup/email recovery remain incomplete. |
| Prompt 8 – Admin/security | Implemented: audit, role/class announcements with expiry, school settings, temporary password reset, persistent login rate limits, CSRF/origin checks, CSP, session revoke-all. Active-session listing is not included. |
| Prompt 9 – Reliability/deployment | Implemented: health endpoint, cold-start retry, migration runner, startup environment warnings, JSON backup and deployment docs. |
| Prompt 10 – Tests/review | SQLite API/role tests run. PostgreSQL runtime tests, Playwright browser journey and live deployment/security review remain release gates. |

For the detailed gaps and pre-launch requirements, read `UPGRADE_SCOPE.md`, `SECURITY_REVIEW.md` and `TESTING.md`.
