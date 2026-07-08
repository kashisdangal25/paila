/*
# Journal Feed Tables

This migration creates the journal/feed feature - a social feed where users can share travel experiences.

## Tables Created

1. `journal_entries`
   - id (uuid, primary key)
   - user_id (uuid, references auth.users, defaults to auth.uid())
   - place_id (uuid, references destinations - the place the entry is about)
   - category (text) - Adventure, Wildlife, Culture & Heritage, Nature, Pilgrimage, Homestay
   - text (text) - the journal entry content
   - media_url (text) - photo/video URL from upload
   - created_at (timestamptz)
   - updated_at (timestamptz)

2. `journal_replies`
   - id (uuid, primary key)
   - entry_id (uuid, references journal_entries)
   - user_id (uuid, references auth.users, defaults to auth.uid())
   - text (text) - reply content
   - created_at (timestamptz)

## Tables Modified

1. `destinations`
   - Added `cached_image_url` (text) - stores fetched image URL from Unsplash/Pexels
   - Added `image_search_query` (text) - the query used to fetch the image

## Security

- RLS enabled on all new tables
- Only authenticated users can create/update their own entries and replies
- Public entries readable by all authenticated users
- Private entries only visible to owner
*/

-- Add image caching columns to destinations
ALTER TABLE destinations 
ADD COLUMN IF NOT EXISTS cached_image_url text,
ADD COLUMN IF NOT EXISTS image_search_query text;

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'Adventure',
  text text NOT NULL,
  media_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Policies for journal_entries
DROP POLICY IF EXISTS "select_journal_entries" ON journal_entries;
CREATE POLICY "select_journal_entries" ON journal_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "insert_journal_entries" ON journal_entries;
CREATE POLICY "insert_journal_entries" ON journal_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_journal_entries" ON journal_entries;
CREATE POLICY "update_journal_entries" ON journal_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_journal_entries" ON journal_entries;
CREATE POLICY "delete_journal_entries" ON journal_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create journal_replies table
CREATE TABLE IF NOT EXISTS journal_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journal_replies ENABLE ROW LEVEL SECURITY;

-- Policies for journal_replies
DROP POLICY IF EXISTS "select_journal_replies" ON journal_replies;
CREATE POLICY "select_journal_replies" ON journal_replies FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM journal_entries 
      WHERE journal_entries.id = journal_replies.entry_id 
      AND (journal_entries.user_id = auth.uid() OR journal_entries.is_public = true)
    )
  );

DROP POLICY IF EXISTS "insert_journal_replies" ON journal_replies;
CREATE POLICY "insert_journal_replies" ON journal_replies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_journal_replies" ON journal_replies;
CREATE POLICY "update_journal_replies" ON journal_replies FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_journal_replies" ON journal_replies;
CREATE POLICY "delete_journal_replies" ON journal_replies FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_place_id ON journal_entries(place_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_replies_entry_id ON journal_replies(entry_id);