# Storybook School

A school reading and assessment platform for primary learners (P.1–P.6). This upgrade extends the supplied Node.js + browser-JavaScript application; it does **not** replace its framework or rewrite the original assessment engine.

## What is included in this upgrade

- Story Library with draft/published/archived states, class-level filtering, source/licence metadata, editing and story-read tracking. Eight original sample stories are seeded by migration 001.
- Story-to-test workflow: choose a library story while creating a test; the story relationship is retained on the test. Tests are labelled formative/continuous or summative.
- Story imports from pasted text, TXT, DOCX and text-based PDF. Scanned PDF pages can be OCR-processed in the browser when the OCR library loads. Original PDF, DOCX, TXT, image and MP3 files can optionally be uploaded directly to a private Supabase Storage bucket using server-issued signed URLs.
- AI story details and comprehension-question generation through the Anthropic Messages API. The API key stays on the server. Generated questions are stored as **unapproved drafts** in the question bank; teachers approve them before adding them to a test.
- Question-bank CSV import with row validation and error reporting.
- Classes, class membership assignment, parent account creation/linking, CSV pupil import preview, duplicate checks and one-time starting passwords.
- Teacher tools: edit a test title before anyone starts it (the backend accepts a fuller update, but a complete post-creation question editor is not yet exposed), duplicate, archive, time limit, due date, question analytics, result filters, CSV export, printable pupil reports, comments and controlled retakes. Retakes preserve the previous attempt in `attempt_history` and write an audit event.
- Pupil tools: unfinished-test answer saving/resume, server-enforced timing, Story Library, reading practice, browser read-aloud with word highlighting, accessibility display controls, progress, points, daily reading streak and badges.
- Parent dashboard: linked children only, completed results, Bloom-level breakdowns, teacher comments, post-submission corrections and announcements. Parent result detail is restricted to completed attempts.
- Admin tools: audit log, announcements, school name/logo settings, JSON backup, password reset with forced password change, and sign out everywhere.
- Operational/security additions: numbered migrations, startup environment warnings, persistent login rate limits, upload limits, AI daily limits, CSRF/origin checks, security headers and `/api/health`.

See [Uganda curriculum alignment](docs/CURRICULUM_ALIGNMENT.md), [implementation matrix](docs/IMPLEMENTATION_MATRIX.md), [upgrade scope and known gaps](docs/UPGRADE_SCOPE.md), [security review](docs/SECURITY_REVIEW.md) and [verification report](docs/VERIFICATION_REPORT.md) before production use. The original uploaded playbook is retained in `docs/reference/`.

## Preserve the original architecture

- **Server:** `server.js`, Node.js built-in HTTP server (no Express rewrite).
- **Frontend:** `public/index.html`, `public/app.js`, `public/engine.js`, `public/style.css`.
- **Database:** PostgreSQL through `pg` when `DATABASE_URL` is set; otherwise SQLite through Node's built-in `node:sqlite`.
- **Hosting:** static frontend on Vercel; API server on Render, using the existing `vercel.json` rewrite. Keep the existing Render service URL unless you intentionally migrate the API service.
- **Build:** `scripts/build.js` copies the public frontend into `dist/`.

## Requirements

- Node.js 22.5 or newer.
- npm (or pnpm, if that is how the repository is managed).
- PostgreSQL/Supabase for a shared production database, or SQLite for local development.

## Run locally with SQLite

```bash
npm install
cp .env.example .env
# Leave DATABASE_URL blank to use SQLite. Set a different DB path if desired.
npm start
```

Open `http://localhost:3000`.

The local SQLite database is created as `storybook.db`. The first run seeds an administrator account. The initial credentials are `admin` / `Admin@12345`; the account is forced to change its password. **Change this immediately before exposing the app to anyone.** The password is a known bootstrap credential, not a secure production secret.

To run the test suite and build:

```bash
npm test
npm run build
```

## PostgreSQL / Supabase setup

1. Create a PostgreSQL database and a dedicated application connection string (Supabase session pooler is suitable).
2. Back up the database before changing it.
3. If this is a new database, run `schema.postgres.sql` once to create the original base tables.
4. Set `DATABASE_URL` on the API server. Set `PGSSL=1` if your provider requires SSL. On startup, the server applies any unapplied `migrations/storybook-upgrade-NNN.postgres.sql` files in numeric order.
5. Confirm the `/api/health` endpoint returns `{"ok":true,...}` and inspect the migration table `schema_migrations`.

The SQLite equivalent migration is `migrations/storybook-upgrade-001.sqlite.sql`. The migration runner records successful migrations. Do not manually run an old Gemini-generated SQL statement that assumes a `stories` table already exists. Do not run rollback SQL after real users or parent links exist without a reviewed recovery plan.

## Optional AI configuration (Render/API server only)

```dotenv
ANTHROPIC_API_KEY=your_server_side_key
ANTHROPIC_MODEL=claude-sonnet-5-5
AI_DAILY_LIMIT=30
```

The model can be changed without editing code. The server limits calls per teacher per day and records usage in `ai_usage`. If the key is absent, AI endpoints return a clear configuration message; the original browser template question generator remains available. Never place `ANTHROPIC_API_KEY` in `public/`, Vercel frontend variables, or client JavaScript.

## Optional private file storage

Create a **private** Supabase Storage bucket (for example `storybook-private`) and configure its maximum file size to 15 MB and its allowed MIME types to:

- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `text/plain`
- `image/png`
- `image/jpeg`
- `audio/mpeg`

Set these variables on the Node API server only:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STORAGE_BUCKET=storybook-private
```

The service-role key must never be exposed to the browser. The browser receives a short-lived signed upload URL from the Node server and uploads directly to Supabase Storage; downloads also use short-lived signed URLs. The application validates metadata and size before issuing an upload URL. The Supabase bucket's own size/MIME restrictions are the final enforcement layer for the uploaded object. Supabase recommends resumable TUS uploads for larger files (around 6 MB and above); this build uses signed standard uploads up to the playbook's 15 MB cap, so 6–15 MB uploads may be less resilient on unstable connections. Resumable TUS support remains a follow-up improvement.

If only some storage variables are configured, startup prints a warning and upload endpoints remain unavailable.

## Production deployment (existing Vercel + Render arrangement)

### Render

- Deploy the repository's Node service.
- Set `NODE_VERSION` to a supported Node 22 release.
- Set `DATABASE_URL`, `HTTPS=1`, and `CORS_ORIGINS` for the exact Vercel/custom frontend origin(s).
- Add the optional Anthropic and Supabase Storage variables only when those services are configured.
- Use `/api/health` as the Render health-check path.
- Keep all server secrets in Render environment variables.

### Vercel

- Keep the existing Vercel project and `vercel.json` rewrite to the Render API service.
- Build command: `npm run build`.
- Output directory: `dist`.
- If you change the frontend domain or API service URL, update the rewrite and the Render `CORS_ORIGINS` value together.

### First production release

1. Make the repository private if it is not already.
2. Change the bootstrap admin password and rotate any previously exposed credentials.
3. Back up Supabase/PostgreSQL.
4. Deploy to a preview/staging environment first.
5. Verify the migration marker, `/api/health`, all four roles, a real class, a real test and a parent-child link.
6. Verify private bucket access and signed upload/download with a small test file.
7. Verify AI calls with a low daily limit and a test key.
8. Run the acceptance checklist in `docs/TESTING.md` before opening the platform to a full school.

## Content and copyright

Only import material that is public domain, openly licensed, created by the school, or used with written permission. Store author, source name, source URL and licence/permission for every story. The Story Library requires source and licence metadata before a story can be saved/published. See `docs/CONTENT_LICENSING.md`.

## Notes

- All timestamps stored by the application are Unix milliseconds (`BIGINT` in PostgreSQL / `INTEGER` in SQLite).
- The browser uses pinned CDN builds of Mammoth, PDF.js, Tesseract.js and Papa Parse for document/CSV parsing. These are convenience dependencies for file import; the backend remains independent of them.
- This ZIP includes the source and the migration files. A successful local SQLite test run does not prove that a particular live PostgreSQL database, Render service or Supabase bucket is configured correctly. See the verification limitations in `docs/UPGRADE_SCOPE.md`.
