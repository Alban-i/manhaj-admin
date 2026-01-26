-- Add is_original column to timelines table for translation support
ALTER TABLE timelines ADD COLUMN is_original boolean NOT NULL DEFAULT true;
