-- Add dual calendar event dates to articles for timeline support
ALTER TABLE articles
ADD COLUMN event_date_hijri VARCHAR(50) NULL,        -- Hijri date string (e.g., "12 Rabi al-Awwal 1 AH")
ADD COLUMN event_date_hijri_year INT NULL,           -- Hijri year for sorting (e.g., 1)
ADD COLUMN event_date_gregorian DATE NULL,           -- Gregorian date (e.g., 622-09-24)
ADD COLUMN event_date_precision VARCHAR(20) DEFAULT 'day' CHECK (event_date_precision IN ('day', 'month', 'year', 'decade', 'century'));

-- Create index for sorting by Hijri year
CREATE INDEX idx_articles_event_date_hijri_year ON articles (event_date_hijri_year) WHERE event_date_hijri_year IS NOT NULL;

-- Create index for sorting by Gregorian date
CREATE INDEX idx_articles_event_date_gregorian ON articles (event_date_gregorian) WHERE event_date_gregorian IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN articles.event_date_hijri IS 'Human-readable Hijri date string (e.g., "12 Rabi al-Awwal 1 AH")';
COMMENT ON COLUMN articles.event_date_hijri_year IS 'Hijri year for chronological sorting';
COMMENT ON COLUMN articles.event_date_gregorian IS 'Gregorian calendar date';
COMMENT ON COLUMN articles.event_date_precision IS 'Date precision level: day, month, year, decade, or century';
