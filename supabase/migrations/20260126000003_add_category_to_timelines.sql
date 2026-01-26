-- Add category_id column to timelines table for auto-applying categories to new articles
ALTER TABLE timelines ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- Create index for category lookups
CREATE INDEX idx_timelines_category ON timelines (category_id) WHERE category_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN timelines.category_id IS 'Default category to apply to articles created from this timeline';
