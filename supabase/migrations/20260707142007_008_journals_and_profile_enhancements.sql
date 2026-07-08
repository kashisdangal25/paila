/*
# User Journals and Profile Enhancements

This migration adds:
1. user_journals table for travel journal entries
2. profile_photo_url column to profiles table
3. bio column to profiles table
4. location column to profiles table

## Tables Created

### user_journals
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- title (text)
- content (text)
- destination_id (uuid, references destinations)
- mood (text) - excited, peaceful, adventurous, reflective
- weather (text)
- is_public (boolean)
- created_at (timestamp)

## Tables Modified

### profiles
- Added profile_photo_url (text)
- Added bio (text)
- Added location (text)

## Security
- RLS enabled on user_journals
- Users can only CRUD their own journals
- Public journals readable by all authenticated users
*/

-- Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS location text DEFAULT 'Nepal';

-- Create user_journals table
CREATE TABLE IF NOT EXISTS user_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  mood text DEFAULT 'reflective',
  weather text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_journals
ALTER TABLE user_journals ENABLE ROW LEVEL SECURITY;

-- Policies for user_journals
DROP POLICY IF EXISTS "select_own_journals" ON user_journals;
CREATE POLICY "select_own_journals" ON user_journals FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "insert_own_journals" ON user_journals;
CREATE POLICY "insert_own_journals" ON user_journals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_journals" ON user_journals;
CREATE POLICY "update_own_journals" ON user_journals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_journals" ON user_journals;
CREATE POLICY "delete_own_journals" ON user_journals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON user_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_destination_id ON user_journals(destination_id);