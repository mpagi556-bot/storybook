# Upgrade scope and known gaps

## Implemented in this source upgrade

| Area from the playbook | Included work |
|---|---|
| Story Library | Story CRUD, publish/unpublish, archive, search/level query support, source/licence metadata, teacher-entered learning area and competence focus, curriculum grouping label by class level, formative/summative test purpose, sample stories, story reads, create-test-from-story relationship |
| Classes | Class creation, teacher/pupil membership records, class-level scoping based on each teacher's assigned levels, bulk pupil CSV preview/import and forced first-password change |
| Upload/import | Paste text, TXT, DOCX, PDF text extraction, scanned-PDF OCR path, question CSV import, private Supabase signed upload/download API, resource records, optional cover image/audio/PDF attachments |
| AI | Server-side Anthropic story detail and question generation, configurable model, per-teacher daily limit and usage records, JSON validation, question-bank approval workflow |
| Teacher tools | Test title-edit UI (the server API accepts a full test payload before the first attempt, but a complete post-creation question editor is not yet exposed), duplicate, archive, time limit, due date, formative/summative assessment label, server submit enforcement, question analytics, result filters, CSV export, print report, comments, retake with archived prior attempt and audit event |
| Pupil experience | Save/resume answers, timer, read-aloud, word highlighting, reading practice, accessible display toggles, progress history, points, reading-day streak and threshold badges |
| Parent role | Admin-created parent accounts, parent-child linking, linked-child results, Bloom breakdown, teacher comments, completed-attempt corrections and announcements |
| Admin/security | Audit screen, role/class announcements and expiry, school name/logo, JSON backup, temporary password reset, persistent login rate limit, upload/AI limits, CSRF/origin checks, CSP/security headers, revoke-all sessions |
| Reliability | `/api/health`, migration runner, environment warnings, Render cold-start retry message and README/deployment instructions |

## Not fully implemented or not independently verified

These items are deliberately identified rather than represented as complete:

1. **Live PostgreSQL validation:** no production `DATABASE_URL` or Supabase database was supplied. The PostgreSQL migration was reviewed in source but could not be run against the user's live schema. Test against a disposable PostgreSQL database before production.
2. **Playwright end-to-end browser flow:** the automated Node API test suite was run. A full Playwright browser test spanning admin → teacher → pupil → parent is not included/run in this package.
3. **Class-level test assignment:** `classes`, `class_members` and `test_classes` are present. The current authorization fallback still relies on the teacher's assigned level labels and the pupil's legacy level for core test visibility. Multi-class `test_classes` publication/visibility is not yet wired end-to-end in the interface.
4. **Class promotion:** bulk year-end promotion to the next level is not implemented.
5. **Retake history UI:** a teacher can authorize a retake; the previous attempt is retained in `attempt_history` and included in admin backups. A dedicated historical-attempt browser screen is not yet provided.
6. **AI written-answer marking suggestions:** written answers are marked by the existing rule-based marking engine. An optional AI rubric suggestion with teacher override is not implemented.
7. **Parent self-signup and email password reset:** parents are created by an administrator and linked manually. Email reset requires a separately configured transactional email provider and is not implemented.
8. **Active-session list:** users can sign out everywhere, but the interface does not list individual active sessions.
9. **Cover image management:** image files can be uploaded and stored as a story cover resource; a full cover-image crop/preview editor is not included.
10. **Storage object verification:** the API validates file metadata and size before issuing signed URLs and the bucket must enforce its own object restrictions. A post-upload server-side object inspection/antivirus scan is not included.
11. **Advanced analytics:** question-level percent-correct and most-selected-wrong-answer analytics are included. A full dashboard of class comparisons and automated intervention recommendations is not.
12. **Live deployment verification:** the existing Vercel/Render deployment was not accessed or changed. The deployment URLs and credentials were not supplied for verification.

## Safety and compatibility decisions

- Existing `server.js`, `public/app.js`, `public/engine.js`, original schema files and Vercel/Render arrangement were retained.
- Database work is additive. Migration 001 creates missing tables/columns and the SQLite runner skips test columns that are already present.
- Test deletion now archives rather than physically deleting a test.
- Existing tests and attempts are preserved. Retakes move the previous attempt into `attempt_history` before a new attempt can be started.
- Parent endpoints only return children linked through `parent_links`. Parent corrections are restricted to completed attempts.
- Answer keys remain server-side until the attempt is submitted; parent endpoints never return open-test answer keys.
- AI output is stored as unapproved draft content. Teachers must review it.
- Source and licence metadata are required for library stories.

## Required before launch

Back up the live database, change the bootstrap admin password, make the repository private, run the migration in staging, configure private storage if needed, and complete the acceptance checks in `TESTING.md`.
