-- Migration 002: Rebuild all tables with TEXT IDs (matching app format)
-- user_id stores Supabase auth.uid() as text for RLS compatibility

-- Drop triggers first
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
DROP TRIGGER IF EXISTS update_sheets_updated_at ON sheets;
DROP TRIGGER IF EXISTS update_cells_updated_at ON cells;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS log_cell_version ON cells;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS log_cell_version_change();

-- Drop policies
DROP POLICY IF EXISTS user_profiles ON profiles;
DROP POLICY IF EXISTS user_folders ON folders;
DROP POLICY IF EXISTS user_workspaces ON workspaces;
DROP POLICY IF EXISTS user_sheets ON sheets;
DROP POLICY IF EXISTS user_cells ON cells;
DROP POLICY IF EXISTS user_cell_versions ON cell_versions;
DROP POLICY IF EXISTS user_cell_comments ON cell_comments;
DROP POLICY IF EXISTS user_activity_logs ON activity_logs;
DROP POLICY IF EXISTS user_recycle_bin ON recycle_bin;
DROP POLICY IF EXISTS user_copy_history ON copy_history;
DROP POLICY IF EXISTS user_tags ON tags;
DROP POLICY IF EXISTS user_settings ON settings;
DROP POLICY IF EXISTS user_document_blocks ON document_blocks;
DROP POLICY IF EXISTS user_hybrid_blocks ON hybrid_blocks;
DROP POLICY IF EXISTS user_hybrid_checklist ON hybrid_checklist_items;
DROP POLICY IF EXISTS user_hybrid_cells ON hybrid_cells;

-- Drop tables (order matters for FK constraints)
DROP TABLE IF EXISTS hybrid_cells CASCADE;
DROP TABLE IF EXISTS hybrid_checklist_items CASCADE;
DROP TABLE IF EXISTS hybrid_blocks CASCADE;
DROP TABLE IF EXISTS document_blocks CASCADE;
DROP TABLE IF EXISTS cell_versions CASCADE;
DROP TABLE IF EXISTS cell_comments CASCADE;
DROP TABLE IF EXISTS cells CASCADE;
DROP TABLE IF EXISTS sheets CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS copy_history CASCADE;
DROP TABLE IF EXISTS recycle_bin CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================
-- TABLES (all IDs are TEXT to match app format)
-- ============================================================

CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#10b981',
  icon TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('spreadsheet', 'document', 'hybrid')),
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sheets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Sheet1',
  rows INTEGER NOT NULL DEFAULT 40,
  cols INTEGER NOT NULL DEFAULT 16,
  frozen_rows INTEGER NOT NULL DEFAULT 0,
  frozen_cols INTEGER NOT NULL DEFAULT 0,
  is_protected BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cells (
  id TEXT PRIMARY KEY,
  sheet_id TEXT NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  cell_key TEXT NOT NULL,
  value TEXT DEFAULT '',
  formula TEXT,
  lock_level INTEGER NOT NULL DEFAULT 0,
  lock_password TEXT,
  is_checkbox BOOLEAN DEFAULT false,
  is_checked BOOLEAN DEFAULT false,
  note TEXT,
  style JSONB DEFAULT '{}',
  dropdown_options TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sheet_id, cell_key)
);

CREATE TABLE cell_versions (
  id TEXT PRIMARY KEY,
  cell_id TEXT NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
  old_value TEXT,
  new_value TEXT,
  old_formula TEXT,
  new_formula TEXT,
  changed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cell_comments (
  id TEXT PRIMARY KEY,
  cell_id TEXT NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE copy_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_id TEXT,
  target_id TEXT,
  type TEXT,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recycle_bin (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data JSONB,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  theme TEXT DEFAULT 'dark',
  font_size INTEGER DEFAULT 14,
  auto_save BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document/Hybrid workspace tables
CREATE TABLE document_blocks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'paragraph',
  content TEXT DEFAULT '',
  checked BOOLEAN DEFAULT false,
  language TEXT,
  depth INTEGER DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hybrid_blocks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text',
  title TEXT DEFAULT '',
  doc_content TEXT,
  code_language TEXT,
  prompt_template TEXT,
  reference_url TEXT,
  spreadsheet_rows INTEGER DEFAULT 5,
  spreadsheet_cols INTEGER DEFAULT 5,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hybrid_checklist_items (
  id TEXT PRIMARY KEY,
  hybrid_block_id TEXT NOT NULL REFERENCES hybrid_blocks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hybrid_cells (
  id TEXT PRIMARY KEY,
  hybrid_block_id TEXT NOT NULL REFERENCES hybrid_blocks(id) ON DELETE CASCADE,
  cell_key TEXT NOT NULL,
  value TEXT DEFAULT '',
  lock_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hybrid_block_id, cell_key)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_folders_user ON folders(user_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_workspaces_user ON workspaces(user_id);
CREATE INDEX idx_workspaces_folder ON workspaces(folder_id);
CREATE INDEX idx_sheets_workspace ON sheets(workspace_id);
CREATE INDEX idx_cells_sheet ON cells(sheet_id);
CREATE INDEX idx_cells_key ON cells(sheet_id, cell_key);
CREATE INDEX idx_cell_versions_cell ON cell_versions(cell_id);
CREATE INDEX idx_cell_comments_cell ON cell_comments(cell_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_copy_history_user ON copy_history(user_id);
CREATE INDEX idx_recycle_bin_user ON recycle_bin(user_id);
CREATE INDEX idx_settings_user ON settings(user_id);
CREATE INDEX idx_document_blocks_workspace ON document_blocks(workspace_id);
CREATE INDEX idx_hybrid_blocks_workspace ON hybrid_blocks(workspace_id);
CREATE INDEX idx_hybrid_checklist_block ON hybrid_checklist_items(hybrid_block_id);
CREATE INDEX idx_hybrid_cells_block ON hybrid_cells(hybrid_block_id);
CREATE INDEX idx_cells_value_search ON cells USING gin(to_tsvector('english', coalesce(value, '')));

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sheets_updated_at BEFORE UPDATE ON sheets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cells_updated_at BEFORE UPDATE ON cells FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_document_blocks_updated_at BEFORE UPDATE ON document_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_hybrid_blocks_updated_at BEFORE UPDATE ON hybrid_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Cell version tracking
CREATE OR REPLACE FUNCTION log_cell_version_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.value IS DISTINCT FROM NEW.value OR OLD.formula IS DISTINCT FROM NEW.formula THEN
    INSERT INTO cell_versions (id, cell_id, old_value, new_value, old_formula, new_formula, changed_by)
    VALUES (gen_random_uuid()::text, NEW.id, OLD.value, NEW.value, OLD.formula, NEW.formula, NEW.updated_at::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_cell_version
  AFTER UPDATE ON cells FOR EACH ROW EXECUTE FUNCTION log_cell_version_change();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (NEW.id::text, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO settings (id, user_id)
  VALUES (gen_random_uuid()::text, NEW.id::text)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper to get current user id as text
CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
  SELECT auth.uid()::text;
$$ LANGUAGE SQL STABLE;

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycle_bin ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_cells ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY user_folders ON folders FOR ALL USING (user_id = current_user_id());
CREATE POLICY user_workspaces ON workspaces FOR ALL USING (user_id = current_user_id());

CREATE POLICY user_sheets ON sheets FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE user_id = current_user_id())
);

CREATE POLICY user_cells ON cells FOR ALL USING (
  sheet_id IN (SELECT id FROM sheets WHERE workspace_id IN (SELECT id FROM workspaces WHERE user_id = current_user_id()))
);

CREATE POLICY user_cell_versions ON cell_versions FOR ALL USING (true);
CREATE POLICY user_cell_comments ON cell_comments FOR ALL USING (true);

CREATE POLICY user_activity_logs ON activity_logs FOR ALL USING (user_id = current_user_id());
CREATE POLICY user_copy_history ON copy_history FOR ALL USING (user_id = current_user_id());
CREATE POLICY user_recycle_bin ON recycle_bin FOR ALL USING (user_id = current_user_id());
CREATE POLICY user_settings ON settings FOR ALL USING (user_id = current_user_id());
CREATE POLICY user_profiles ON profiles FOR ALL USING (id = current_user_id());

CREATE POLICY user_document_blocks ON document_blocks FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE user_id = current_user_id())
);

CREATE POLICY user_hybrid_blocks ON hybrid_blocks FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE user_id = current_user_id())
);

CREATE POLICY user_hybrid_checklist ON hybrid_checklist_items FOR ALL USING (
  hybrid_block_id IN (SELECT id FROM hybrid_blocks WHERE workspace_id IN (SELECT id FROM workspaces WHERE user_id = current_user_id()))
);

CREATE POLICY user_hybrid_cells ON hybrid_cells FOR ALL USING (
  hybrid_block_id IN (SELECT id FROM hybrid_blocks WHERE workspace_id IN (SELECT id FROM workspaces WHERE user_id = current_user_id()))
);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('workspace_attachments', 'workspace_attachments', false),
  ('profile_avatars', 'profile_avatars', false),
  ('document_images', 'document_images', false),
  ('spreadsheet_exports', 'spreadsheet_exports', false),
  ('backup_archives', 'backup_archives', false),
  ('import_sources', 'import_sources', false),
  ('temp_uploads', 'temp_uploads', false),
  ('template_library', 'template_library', false),
  ('encrypted_vault', 'encrypted_vault', false),
  ('shared_links', 'shared_links', false)
ON CONFLICT (id) DO NOTHING;
