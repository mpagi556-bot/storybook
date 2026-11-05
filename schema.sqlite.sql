-- Storybook School schema (SQLite: applied automatically by server.js)
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN('admin','teacher','student')),
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  pass_hash TEXT NOT NULL,             -- scrypt with a per-user salt
  level TEXT,                          -- pupil: P.1..P.6 | teacher: classes taught, e.g. 'P.4,P.5'
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected','disabled')),
  must_change INTEGER NOT NULL DEFAULT 0,
  fails INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER,
  created_at INTEGER NOT NULL,
  approved_at INTEGER
);
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  ip TEXT
);
CREATE TABLE IF NOT EXISTS tests(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  story TEXT NOT NULL,
  questions TEXT NOT NULL,             -- JSON with answers; never sent to pupils
  total INTEGER NOT NULL,
  published INTEGER NOT NULL DEFAULT 0,
  author_id INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started' CHECK(status IN('started','done')),
  answers TEXT,
  got INTEGER,
  by_level TEXT,                       -- JSON marks per Bloom level
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  UNIQUE(test_id,user_id)
);
CREATE TABLE IF NOT EXISTS audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  user_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS ix_att_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS ix_att_test ON attempts(test_id);
CREATE INDEX IF NOT EXISTS ix_users_status ON users(status);
-- SQLite only. For PostgreSQL or Supabase use storybook-supabase.sql.
