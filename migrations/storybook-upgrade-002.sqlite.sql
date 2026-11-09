PRAGMA foreign_keys=OFF;
BEGIN;
ALTER TABLE stories ADD COLUMN learning_area TEXT;
ALTER TABLE stories ADD COLUMN competence TEXT;
INSERT OR IGNORE INTO schema_migrations(name,applied_at) VALUES('storybook-upgrade-002',strftime('%s','now')*1000);
COMMIT;
PRAGMA foreign_keys=ON;
