BEGIN;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS learning_area TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS competence TEXT;
INSERT INTO schema_migrations(name,applied_at) VALUES('storybook-upgrade-002',(EXTRACT(EPOCH FROM NOW())*1000)::BIGINT) ON CONFLICT(name) DO NOTHING;
COMMIT;
