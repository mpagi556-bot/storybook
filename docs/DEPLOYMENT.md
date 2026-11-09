# Deployment checklist

## API service on Render

Required:

- `DATABASE_URL` – PostgreSQL connection string. Leave unset only for local SQLite development.
- `HTTPS=1` – secure cookie behavior behind HTTPS.
- `CORS_ORIGINS` – comma-separated exact frontend origin(s), including the Vercel deployment/custom domain.

Optional:

- `PGSSL=1` – if required by the database provider.
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `AI_DAILY_LIMIT` – AI generation.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORAGE_BUCKET` – private file storage.
- `PORT` – provided by Render automatically.

Use `/api/health` for the health check. The server applies numbered migrations during startup after the base schema is initialized.

## Frontend on Vercel

- Build command: `npm run build`
- Output directory: `dist`
- Keep the existing rewrite in `vercel.json` pointed at the correct Render API service.
- If you change the API host, update both `vercel.json` and Render's CORS allowlist.

## Supabase Storage

Create a private bucket. Set the maximum object size to 15 MB and restrict MIME types to PDF, DOCX, TXT, PNG, JPEG and MP3. The server issues short-lived signed upload/download URLs; the browser never receives the service-role key.

## First deployment

1. Back up the current database.
2. Change the bootstrap admin password.
3. Deploy to staging/preview.
4. Check `/api/health` and `schema_migrations`.
5. Test all four roles with separate browser profiles.
6. Test story creation, publish, reading, read-aloud, test creation, autosave/resume, marking, comments, parent corrections, retake and backup.
7. Test a file upload and download using a small sample object.
8. Test AI generation with a low `AI_DAILY_LIMIT`.
9. Review `SECURITY_REVIEW.md` and `TESTING.md` before production launch.
