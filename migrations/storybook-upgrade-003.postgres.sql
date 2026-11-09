BEGIN;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS assessment_type TEXT NOT NULL DEFAULT 'summative' CHECK (assessment_type IN ('formative','summative'));
INSERT INTO schema_migrations(name,applied_at) VALUES('storybook-upgrade-003',(EXTRACT(EPOCH FROM NOW())*1000)::BIGINT) ON CONFLICT(name) DO NOTHING;
COMMIT;
