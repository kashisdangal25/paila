/*
# Add trips_planned column to user_stats

1. Changes
- Add `trips_planned` column (integer, default 0) to `user_stats` table.
- This tracks the number of trips a user has planned (distinct from trips_completed, which tracks finished trips).
2. Security
- No RLS policy changes needed — existing policies already cover the new column.
3. Notes
- Column defaults to 0 so existing rows are unaffected.
*/

ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS trips_planned integer NOT NULL DEFAULT 0;
