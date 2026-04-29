-- ── PROJECTS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  domain      TEXT        NOT NULL CHECK (domain IN ('ai-ml','health','finance','creative','education','social')),
  members     JSONB       NOT NULL DEFAULT '[]',   -- [{name, linkedin}]
  short       TEXT        NOT NULL,                -- one-sentence pitch (hover preview)
  full        TEXT        NOT NULL,                -- full description (detail panel)
  image_url   TEXT,                                -- uploaded project image/GIF
  link        TEXT        DEFAULT '#',
  tech        TEXT[]      NOT NULL DEFAULT '{}',
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  emoji       TEXT        NOT NULL DEFAULT '🚀',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "public_read" ON projects
  FOR SELECT USING (true);

-- Anyone can submit
CREATE POLICY "public_insert" ON projects
  FOR INSERT WITH CHECK (true);

-- ── STORAGE BUCKET ────────────────────────────────────────────
-- Run this in the Supabase dashboard → Storage → New bucket
-- Name: project-images
-- Public bucket: YES
--
-- Then add this storage policy in dashboard → Storage → Policies:
-- Policy name: public_upload
-- Allowed operation: INSERT
-- Target roles: anon, authenticated
-- Policy: true
