-- Create timelines table for grouping historical events by topic
CREATE TABLE timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9_-]{2,}$'),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  language VARCHAR(10) REFERENCES languages(code),
  translation_group_id UUID REFERENCES translation_groups(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction table for timeline events (many-to-many relationship)
CREATE TABLE timeline_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  custom_event_date_hijri VARCHAR(50),      -- Override Hijri date for this timeline
  custom_event_date_gregorian DATE,          -- Override Gregorian date for this timeline
  custom_title VARCHAR(500),                 -- Override title for this timeline context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(timeline_id, article_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_timelines_slug ON timelines (slug);
CREATE INDEX idx_timelines_language ON timelines (language);
CREATE INDEX idx_timelines_is_published ON timelines (is_published) WHERE is_published = true;
CREATE INDEX idx_timelines_translation_group ON timelines (translation_group_id) WHERE translation_group_id IS NOT NULL;

CREATE INDEX idx_timeline_articles_timeline ON timeline_articles (timeline_id);
CREATE INDEX idx_timeline_articles_article ON timeline_articles (article_id);
CREATE INDEX idx_timeline_articles_display_order ON timeline_articles (timeline_id, display_order);

-- Add updated_at trigger using existing function
CREATE TRIGGER update_timelines_updated_at
  BEFORE UPDATE ON timelines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow read access for all authenticated users
CREATE POLICY "Allow read access for authenticated users"
  ON timelines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access for authenticated users on timeline_articles"
  ON timeline_articles
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Allow all operations for admins and authors
CREATE POLICY "Enable all access for admins and authors"
  ON timelines
  FOR ALL
  TO authenticated
  USING (is_admin() OR is_author())
  WITH CHECK (is_admin() OR is_author());

CREATE POLICY "Enable all access for admins and authors on timeline_articles"
  ON timeline_articles
  FOR ALL
  TO authenticated
  USING (is_admin() OR is_author())
  WITH CHECK (is_admin() OR is_author());

-- Allow public read access for published timelines
CREATE POLICY "Allow public read access for published timelines"
  ON timelines
  FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Allow public read access for timeline articles of published timelines"
  ON timeline_articles
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM timelines
      WHERE timelines.id = timeline_articles.timeline_id
      AND timelines.is_published = true
    )
  );

-- Add comments for documentation
COMMENT ON TABLE timelines IS 'Groups historical events (articles) into chronological timelines by topic';
COMMENT ON TABLE timeline_articles IS 'Junction table linking articles to timelines with optional date overrides';
COMMENT ON COLUMN timeline_articles.custom_event_date_hijri IS 'Override the article''s Hijri date for this specific timeline context';
COMMENT ON COLUMN timeline_articles.custom_event_date_gregorian IS 'Override the article''s Gregorian date for this specific timeline context';
COMMENT ON COLUMN timeline_articles.custom_title IS 'Override the article''s title for this specific timeline context';
