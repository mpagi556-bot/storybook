PRAGMA foreign_keys=OFF;
BEGIN;
ALTER TABLE tests ADD COLUMN assessment_type TEXT NOT NULL DEFAULT 'summative' CHECK (assessment_type IN ('formative','summative'));
INSERT OR IGNORE INTO schema_migrations(name,applied_at) VALUES('storybook-upgrade-003',strftime('%s','now')*1000);
COMMIT;
PRAGMA foreign_keys=ON;
