# Storybook School

## How to start (important)
Never double-click index.html. Double-click **start.bat** (Windows) or run **./start.sh**, then open **http://localhost:3000**.
For Supabase: copy `.env.example` to `.env`, put your connection string in it, then run start.bat.

## First sign-in
Username `admin`, password `Admin@12345`. You must choose a new password straight away.

## Option A: PostgreSQL / Supabase (what you are using)
1. In Supabase, open SQL Editor and run **schema.postgres.sql** (NOT the sqlite file). It creates the tables, locks them from the public API and adds the admin.
2. Copy your database connection string (Project Settings > Database > Connection string; the "Session pooler" one is best).
3. In this folder:  `npm install`  then  `DATABASE_URL="postgresql://..." node server.js`
   (Windows PowerShell: `$env:DATABASE_URL="postgresql://..."; node server.js`)
4. Open http://localhost:3000

## Option B: no database setup (SQLite, needs Node 22.5+)
`node server.js`  (creates storybook.db and the admin automatically; uses schema.sqlite.sql)

## How access works
- Anyone can press "Create account" and choose Pupil or Teacher plus their class.
- They cannot sign in until the admin approves them under **Approvals**, where the admin can change the class first, or reject.
- Pupils see only published tests for their class. Teachers see only pupils and results for the classes the admin gave them.
- Only the admin adds accounts directly, switches accounts off, or adds teachers.

Env vars: PORT, DATABASE_URL, PGSSL=1, HTTPS=1 (Secure cookies + HSTS, use behind HTTPS), DB (SQLite file).
Self-test (SQLite): `node test.js`
