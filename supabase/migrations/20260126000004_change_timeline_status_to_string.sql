-- Add new status column
ALTER TABLE timelines ADD COLUMN status VARCHAR(20) DEFAULT 'draft';

-- Migrate existing data: is_published=true → 'published', false → 'draft'
UPDATE timelines SET status = CASE WHEN is_published = true THEN 'published' ELSE 'draft' END;

-- Drop dependent policies first
DROP POLICY IF EXISTS "Allow public read access for published timelines" ON timelines;
DROP POLICY IF EXISTS "Allow public read access for timeline articles of published tim" ON timeline_articles;

-- Drop old column and index
DROP INDEX IF EXISTS idx_timelines_is_published;
ALTER TABLE timelines DROP COLUMN is_published;

-- Create new index for status
CREATE INDEX idx_timelines_status ON timelines (status) WHERE status = 'published';

-- Recreate RLS policies for public access using new status column
CREATE POLICY "Allow public read access for published timelines"
  ON timelines
  FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Allow public read access for timeline articles of published timelines"
  ON timeline_articles
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM timelines
      WHERE timelines.id = timeline_articles.timeline_id
      AND timelines.status = 'published'
    )
  );
