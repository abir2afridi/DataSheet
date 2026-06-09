-- SmartSheets Seed Data
-- Run this AFTER 001_schema.sql to populate sample data

-- Create a demo user profile (requires an actual auth.users entry first)
-- This is a reference; real profiles are created automatically via the trigger.

-- Demo folders reference (UUIDs are deterministic for dev consistency)
-- Replace user_id with actual user UUID after first signup

-- ============================================================
-- SAMPLE FOLDERS
-- ============================================================
-- INSERT INTO folders (id, user_id, name, color, icon, is_pinned)
-- VALUES
--   ('00000000-0000-0000-0000-000000000001', '<USER_ID>', 'Knowledge Vault', '#10b981', 'FolderLock', true),
--   ('00000000-0000-0000-0000-000000000002', '<USER_ID>', 'Aesthetic Sandboxes', '#f59e0b', 'Sliders', false);

-- ============================================================
-- SAMPLE WORKSPACES
-- ============================================================
-- INSERT INTO workspaces (id, user_id, folder_id, name, type, tags, is_pinned)
-- VALUES
--   ('00000000-0000-0000-0000-000000000010', '<USER_ID>', '00000000-0000-0000-0000-000000000001', 'Security Prompts Ledger', 'spreadsheet', ARRAY['prompts','api','finances'], true),
--   ('00000000-0000-0000-0000-000000000011', '<USER_ID>', '00000000-0000-0000-0000-000000000001', 'Vault Systems Manual', 'document', ARRAY['study','manual'], false),
--   ('00000000-0000-0000-0000-000000000012', '<USER_ID>', '00000000-0000-0000-0000-000000000002', 'Modular Developer Hub', 'hybrid', ARRAY['sandbox','prompts'], false);

-- ============================================================
-- SAMPLE SHEETS + CELLS (for Security Prompts Ledger)
-- ============================================================
-- INSERT INTO sheets (id, workspace_id, name, rows, cols, frozen_rows, frozen_cols, sort_order)
-- VALUES ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'Smart Ledger Core', 40, 16, 1, 1, 0);

-- INSERT INTO cells (sheet_id, cell_key, value, lock_level, style) VALUES
--   ('00000000-0000-0000-0000-000000000020', 'A1', 'Prompt Frameworks Overview', 1, '{"bold":true,"color":"#00ffcc"}'::jsonb),
--   ('00000000-0000-0000-0000-000000000020', 'A2', 'Parameters weight sum:', 0, '{}'::jsonb),
--   ('00000000-0000-0000-0000-000000000020', 'B2', '250', 0, '{}'::jsonb),
--   ('00000000-0000-0000-0000-000000000020', 'A3', 'Execution speed sum:', 0, '{}'::jsonb),
--   ('00000000-0000-0000-0000-000000000020', 'B3', '1100', 0, '{}'::jsonb),
--   ('00000000-0000-0000-0000-000000000020', 'A4', 'Aggregate score:', 0, '{}'::jsonb),
--   ('00000000-0000-0000-0000-000000000020', 'B4', '3540', 2, '{}'::jsonb),
--   ('00000000-0000-0000-0000-000000000020', 'B4_formula', NULL, 2, '{}'::jsonb);
-- UPDATE cells SET formula = '=SUM(B2,B3)' WHERE cell_key = 'B4' AND sheet_id = '00000000-0000-0000-0000-000000000020';

-- ============================================================
-- SAMPLE DOCUMENT BLOCKS (for Vault Systems Manual)
-- ============================================================
-- INSERT INTO document_blocks (workspace_id, type, content, sort_order) VALUES
--   ('00000000-0000-0000-0000-000000000011', 'heading1', 'SmartSheets Crypt System Manual', 0),
--   ('00000000-0000-0000-0000-000000000011', 'quote', 'You are entering a private local node layout. Every block and grid item supports smart cell lock firmware.', 1),
--   ('00000000-0000-0000-0000-000000000011', 'heading2', 'Core Operations Checklist', 2),
--   ('00000000-0000-0000-0000-000000000011', 'checklist_item', 'Configure custom passwords on Vault Locks (Level 3)', 3),
--   ('00000000-0000-0000-0000-000000000011', 'checklist_item', 'Assemble hybrid layouts chaining checklists and spreadsheet blocks', 4);
-- UPDATE document_blocks SET checked = true WHERE content = 'Configure custom passwords on Vault Locks (Level 3)';

-- ============================================================
-- SAMPLE HYBRID BLOCKS (for Modular Developer Hub)
-- ============================================================
-- INSERT INTO hybrid_blocks (id, workspace_id, type, title, prompt_template, sort_order)
-- VALUES (
--   '00000000-0000-0000-0000-000000000030',
--   '00000000-0000-0000-0000-000000000012',
--   'prompt',
--   'Secured Agent Prompter',
--   'Review and evaluate potential SQL execution paths targeting variables: $PROMPTVAR',
--   0
-- );

-- INSERT INTO hybrid_blocks (id, workspace_id, type, title, doc_content, sort_order)
-- VALUES (
--   '00000000-0000-0000-0000-000000000031',
--   '00000000-0000-0000-0000-000000000012',
--   'document',
--   'Setup Guide',
--   'Initialize components from the upper append choices.',
--   1
-- );

-- INSERT INTO hybrid_checklist_items (hybrid_block_id, text, done, sort_order) VALUES
--   ('00000000-0000-0000-0000-000000000031', 'Install dependencies', true, 0),
--   ('00000000-0000-0000-0000-000000000031', 'Configure environment', false, 1),
--   ('00000000-0000-0000-0000-000000000031', 'Deploy to staging', false, 2);

-- ============================================================
-- SAMPLE TAGS
-- ============================================================
-- INSERT INTO tags (user_id, name, color) VALUES
--   ('<USER_ID>', 'prompts', '#00ffcc'),
--   ('<USER_ID>', 'api', '#10b981'),
--   ('<USER_ID>', 'finances', '#f59e0b'),
--   ('<USER_ID>', 'study', '#0284c7'),
--   ('<USER_ID>', 'manual', '#a855f7'),
--   ('<USER_ID>', 'sandbox', '#ef4444');
