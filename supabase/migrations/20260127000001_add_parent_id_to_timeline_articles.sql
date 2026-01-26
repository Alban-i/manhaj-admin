-- Add parent_id column for two-level hierarchy in timeline events
-- ON DELETE SET NULL: children are promoted to top level when parent is deleted
ALTER TABLE timeline_articles
ADD COLUMN parent_id UUID REFERENCES timeline_articles(id) ON DELETE SET NULL;

-- Create function to enforce maximum of 2 nesting levels
-- A child cannot have children (only parent -> child allowed, not parent -> child -> grandchild)
CREATE OR REPLACE FUNCTION enforce_max_two_levels()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- Check if the parent itself has a parent (would make this a 3rd level)
    IF EXISTS (
      SELECT 1 FROM timeline_articles
      WHERE id = NEW.parent_id AND parent_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Maximum nesting depth is 2 levels. Cannot add child to an event that is already a child.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the constraint on insert and update
CREATE TRIGGER trigger_enforce_max_two_levels
BEFORE INSERT OR UPDATE ON timeline_articles
FOR EACH ROW
EXECUTE FUNCTION enforce_max_two_levels();

-- Create index for efficient queries on parent_id
-- This helps when fetching children for a parent or querying by timeline with hierarchy
CREATE INDEX idx_timeline_articles_parent ON timeline_articles (timeline_id, parent_id, display_order);

-- Add comment for documentation
COMMENT ON COLUMN timeline_articles.parent_id IS 'Parent event ID for nested hierarchy. NULL means top-level event. Maximum 2 levels (parent and children only).';
