-- Create image_presets table for reusable style definitions
CREATE TABLE image_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,           -- e.g. "Islamic geometric pattern, {colors}"
  style_reference_url TEXT,                -- Optional reference image URL
  width INT NOT NULL DEFAULT 1200,         -- Default width
  height INT NOT NULL DEFAULT 630,         -- Default height (OG standard)
  text_config JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { fontFamily, fontSize, color, position, alignment, bgColor, bgOpacity }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Create image_projects table for saved cover image instances
CREATE TABLE image_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  preset_id UUID REFERENCES image_presets(id) ON DELETE SET NULL,  -- Optional, NULL if custom

  -- Dimensions (editable per project)
  width INT NOT NULL DEFAULT 1200,
  height INT NOT NULL DEFAULT 630,

  -- Generation config (for future AI generation)
  background_image_url TEXT,               -- AI-generated background (NULL until Phase 2)
  generation_prompt TEXT,                  -- Prompt to use (from preset or custom)
  style_reference_url TEXT,

  -- Text overlay config
  text_content TEXT NOT NULL DEFAULT '',   -- The actual text (title)
  text_config JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { fontFamily, fontSize, color, position, alignment, bgColor, bgOpacity }

  -- Exported media (Phase 2)
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,  -- Final exported image in media library

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_image_presets_name ON image_presets (name);
CREATE INDEX idx_image_presets_created_by ON image_presets (created_by);

CREATE INDEX idx_image_projects_name ON image_projects (name);
CREATE INDEX idx_image_projects_preset ON image_projects (preset_id);
CREATE INDEX idx_image_projects_created_by ON image_projects (created_by);

-- Add updated_at triggers using existing function
CREATE TRIGGER update_image_presets_updated_at
  BEFORE UPDATE ON image_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_projects_updated_at
  BEFORE UPDATE ON image_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE image_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow read access for all authenticated users (presets are global)
CREATE POLICY "Allow read access for authenticated users on image_presets"
  ON image_presets
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Allow all operations for admins and authors on presets
CREATE POLICY "Enable all access for admins and authors on image_presets"
  ON image_presets
  FOR ALL
  TO authenticated
  USING (is_admin() OR is_author())
  WITH CHECK (is_admin() OR is_author());

-- RLS Policy: Allow read access for authenticated users on projects
CREATE POLICY "Allow read access for authenticated users on image_projects"
  ON image_projects
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Allow all operations for admins and authors on projects
CREATE POLICY "Enable all access for admins and authors on image_projects"
  ON image_projects
  FOR ALL
  TO authenticated
  USING (is_admin() OR is_author())
  WITH CHECK (is_admin() OR is_author());

-- Add comments for documentation
COMMENT ON TABLE image_presets IS 'Reusable style definitions for image generation with prompt templates and text configuration';
COMMENT ON TABLE image_projects IS 'Saved cover image instances with specific text and configuration';
COMMENT ON COLUMN image_presets.prompt_template IS 'Template for AI generation prompt, can include placeholders like {colors}';
COMMENT ON COLUMN image_presets.text_config IS 'JSON config: { fontFamily, fontSize, color, position, alignment, bgColor, bgOpacity }';
COMMENT ON COLUMN image_projects.text_config IS 'JSON config: { fontFamily, fontSize, color, position, alignment, bgColor, bgOpacity }';
COMMENT ON COLUMN image_projects.media_id IS 'Reference to exported image in media library (Phase 2)';
