-- ── PROJECTS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  domain      TEXT        NOT NULL CHECK (domain IN ('ai-ml','health','finance','creative','education','social')),
  members     JSONB       NOT NULL DEFAULT '[]',   -- [{name, linkedin}]
  short       TEXT        NOT NULL,                -- one-sentence pitch (hover preview)
  "full"      TEXT        NOT NULL,                -- full description (detail panel)
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

-- ── AUTH & OWNERSHIP (run after initial schema) ──────────────
-- Add owner tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Admins table (insert user_id manually via Supabase dashboard to grant admin)
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_self_read" ON admins FOR SELECT USING (auth.uid() = user_id);

-- Allow owners and admins to update / delete their projects
CREATE POLICY "owner_or_admin_update" ON projects
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

CREATE POLICY "owner_or_admin_delete" ON projects
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- Remove the hardcoded domain enum (run this if you haven't already)
-- ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_domain_check;

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
