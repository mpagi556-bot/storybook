# Testing and release acceptance

## Automated test command

```bash
npm test
```

The included `test.js` starts the real Node HTTP server against a disposable SQLite database and exercises:

- Bootstrap admin password-change requirement.
- Account approval and role boundaries.
- Class-level visibility and pupil test isolation.
- Answer-key stripping and server-side marking.
- Story create/publish/read tracking.
- Parent account creation, child linking, completed-result visibility, comments and announcement access.
- Parent denial of teacher/admin and test-authoring endpoints.
- Question CSV import, question-bank approval and per-question analytics.
- Unfinished test answer save/resume.
- Test duplication, archive and controlled retake with old-attempt retention.
- Bulk pupil import and duplicate handling.
- Backup export without password hashes.
- Login lockout.

## Manual browser checks

Use four separate browser profiles (admin, teacher, pupil and parent):

1. Admin signs in, changes the bootstrap password, creates a class and accounts, assigns members and links a parent.
2. Teacher sees only the assigned class/level, creates a story, adds source/licence, imports a document, reviews generated questions and publishes a story/test.
3. Pupil sees only published material for their level, reads a story, tests read-aloud and accessibility controls, starts a timed test, changes answers, refreshes and resumes, then submits.
4. Teacher reviews results, filters class/test/Bloom level, inspects question analytics, exports CSV, prints a report, adds a comment and allows a retake.
5. Parent sees only linked children, completed results, Bloom-level breakdown, teacher comments, post-submit corrections and announcements. Try changing result IDs to another pupil and confirm access is denied.
6. Confirm pupils cannot view answer keys before submission or access other pupils' data.
7. Test a 15 MB or smaller permitted file upload and a file above 15 MB (which must be rejected). Confirm the bucket is private and signed links expire.
8. Wait for the Render service to sleep/cold-start (if applicable); the frontend should show the friendly reconnect message and retry.
9. Check the browser console and server logs. No passwords, API keys, session tokens or full answer keys should be logged.

## Not run in this environment

- A real PostgreSQL/Supabase database test (no live connection was supplied).
- A Playwright browser test (the package does not include an installed Playwright runtime or browser binaries).
- A real Render/Vercel deployment check.
- A real Anthropic API call or Supabase Storage upload (the user's secrets and bucket were not supplied).

These checks must be completed in staging before production.
