-- SmartSheets Complete Database Schema
-- Migration 001: Core tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  cell_key TEXT NOT NULL, -- e.g. "A1", "B12"
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
  old_value TEXT,
  new_value TEXT,
  old_formula TEXT,
  new_formula TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cell_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('heading1','heading2','paragraph','bullet_list_item','numbered_list_item','checklist_item','code_block','quote','callout','table','image')),
  content TEXT DEFAULT '',
  checked BOOLEAN,
  language TEXT,
  depth INTEGER DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hybrid_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('spreadsheet','document','code','checklist','prompt','reference')),
  title TEXT DEFAULT '',
  doc_content TEXT,
  code_language TEXT,
  prompt_template TEXT,
  reference_url TEXT,
  spreadsheet_rows INTEGER DEFAULT 5,
  spreadsheet_cols INTEGER DEFAULT 5,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hybrid_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hybrid_block_id UUID NOT NULL REFERENCES hybrid_blocks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE hybrid_cells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hybrid_block_id UUID NOT NULL REFERENCES hybrid_blocks(id) ON DELETE CASCADE,
  cell_key TEXT NOT NULL,
  value TEXT DEFAULT '',
  lock_level INTEGER NOT NULL DEFAULT 0,
  UNIQUE(hybrid_block_id, cell_key)
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('edit','delete','lock','unlock','paste','import','copy','restore')),
  details TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cell_copy_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  cell_address TEXT,
  workspace_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recycle_bin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_id UUID NOT NULL,
  name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('workspace','folder','sheet')),
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#10b981',
  UNIQUE(user_id, name)
);

CREATE TABLE workspace_tags (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (workspace_id, tag_id)
);

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark','light')),
  autosave_interval INTEGER DEFAULT 500,
  retention_days INTEGER DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
CREATE INDEX idx_document_blocks_workspace ON document_blocks(workspace_id);
CREATE INDEX idx_hybrid_blocks_workspace ON hybrid_blocks(workspace_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(type, created_at DESC);
CREATE INDEX idx_recycle_bin_user ON recycle_bin(user_id);
CREATE INDEX idx_recycle_bin_expires ON recycle_bin(expires_at);
CREATE INDEX idx_tags_user ON tags(user_id);
CREATE INDEX idx_cell_copy_history_user ON cell_copy_history(user_id);

-- Full text search index
CREATE INDEX idx_cells_value_search ON cells USING gin(to_tsvector('english', coalesce(value, '')));
CREATE INDEX idx_document_blocks_content_search ON document_blocks USING gin(to_tsvector('english', coalesce(content, '')));
CREATE INDEX idx_workspaces_name_search ON workspaces USING gin(to_tsvector('english', coalesce(name, '')));

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

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sheets_updated_at
  BEFORE UPDATE ON sheets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cells_updated_at
  BEFORE UPDATE ON cells FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Log cell version on update
CREATE OR REPLACE FUNCTION log_cell_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.value IS DISTINCT FROM NEW.value OR OLD.formula IS DISTINCT FROM NEW.formula THEN
    INSERT INTO cell_versions (cell_id, old_value, new_value, old_formula, new_formula)
    VALUES (NEW.id, OLD.value, NEW.value, OLD.formula, NEW.formula);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_cell_update
  AFTER UPDATE ON cells FOR EACH ROW EXECUTE FUNCTION log_cell_version();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_copy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycle_bin ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY user_own ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY user_folders ON folders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_workspaces ON workspaces
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_sheets ON sheets
  FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

CREATE POLICY user_cells ON cells
  FOR ALL USING (sheet_id IN (
    SELECT s.id FROM sheets s JOIN workspaces w ON w.id = s.workspace_id WHERE w.user_id = auth.uid()
  ));

CREATE POLICY user_cell_versions ON cell_versions
  FOR ALL USING (cell_id IN (
    SELECT c.id FROM cells c
    JOIN sheets s ON s.id = c.sheet_id
    JOIN workspaces w ON w.id = s.workspace_id
    WHERE w.user_id = auth.uid()
  ));

CREATE POLICY user_cell_comments ON cell_comments
  FOR ALL USING (cell_id IN (
    SELECT c.id FROM cells c
    JOIN sheets s ON s.id = c.sheet_id
    JOIN workspaces w ON w.id = s.workspace_id
    WHERE w.user_id = auth.uid()
  ));

CREATE POLICY user_document_blocks ON document_blocks
  FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

CREATE POLICY user_hybrid_blocks ON hybrid_blocks
  FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

CREATE POLICY user_hybrid_checklist ON hybrid_checklist_items
  FOR ALL USING (hybrid_block_id IN (
    SELECT hb.id FROM hybrid_blocks hb JOIN workspaces w ON w.id = hb.workspace_id WHERE w.user_id = auth.uid()
  ));

CREATE POLICY user_hybrid_cells ON hybrid_cells
  FOR ALL USING (hybrid_block_id IN (
    SELECT hb.id FROM hybrid_blocks hb JOIN workspaces w ON w.id = hb.workspace_id WHERE w.user_id = auth.uid()
  ));

CREATE POLICY user_activity_logs ON activity_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_copy_history ON cell_copy_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_recycle_bin ON recycle_bin
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_tags ON tags
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_workspace_tags ON workspace_tags
  FOR ALL USING (tag_id IN (SELECT id FROM tags WHERE user_id = auth.uid()));

CREATE POLICY user_settings ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', false),
  ('documents', 'documents', false),
  ('spreadsheets', 'spreadsheets', false),
  ('exports', 'exports', false),
  ('imports', 'imports', false),
  ('images', 'images', false),
  ('attachments', 'attachments', false),
  ('backups', 'backups', false),
  ('temp', 'temp', false),
  ('private-files', 'private-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY user_avatars ON storage.objects
  FOR ALL USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY user_documents ON storage.objects
  FOR ALL USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY user_exports ON storage.objects
  FOR ALL USING (auth.uid()::text = (storage.foldername(name))[1]);
