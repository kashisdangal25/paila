/*
# Add media_type column to journal_entries

1. Changes
- Add `media_type` column (text, nullable) to `journal_entries` table.
- This stores 'image' or 'video' so the frontend can reliably render media without relying on URL extension matching.
2. Security
- No RLS policy changes needed — existing policies already cover the new column.
3. Notes
- Column is nullable so existing entries without media_type still work (frontend falls back to URL extension matching).
*/

ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS media_type text;
