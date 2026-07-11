/*
# Expand Journal, Community Posts, and Vendor Tables

## Summary
This migration adds columns needed for the upgraded Journal, Community Feed,
and Vendor Panel features. All changes are additive (ADD COLUMN IF NOT EXISTS)
and do not affect existing data.

## 1. journal_entries — new columns
- `title` (text) — entry title
- `mood` (text) — emoji mood picker value
- `expense` (numeric) — expense amount in NPR
- `location_text` (text) — manual location override
- `latitude` (numeric) — auto-detected latitude
- `longitude` (numeric) — auto-detected longitude
- `entry_date` (date) — date of the journal entry
- `media_urls` (jsonb) — array of photo URLs for multi-photo support

## 2. user_posts — new columns
- `media_urls` (jsonb) — array of photo URLs for multi-photo posts
- `location_text` (text) — location tag
- `likes` (integer, default 0) — like count
- `author_avatar` (text) — cached author avatar URL

## 3. post_replies — new columns
- `author_avatar` (text) — cached author avatar URL

## 4. vendors — new columns
- `contact_person` (text)
- `province` (text)
- `city` (text)
- `gps_lat` (numeric)
- `gps_lng` (numeric)
- `years_experience` (integer)
- `languages` (text[]) — languages spoken
- `services_offered` (text[]) — services offered
- `profile_photo_url` (text)
- `logo_url` (text)
- `gallery_urls` (jsonb) — array of gallery photo URLs
- `pricing` (jsonb) — pricing structure (hourly/daily/nightly/package)
- `documents` (jsonb) — uploaded document URLs (ID, license, registration, insurance)
- `availability` (jsonb) — availability calendar data
- `rating` (numeric, default 0) — vendor rating
- `review_count` (integer, default 0)
- `cover_photo_url` (text)

## 5. New table: vendor_bookings
Stores bookings made to vendors. Owner-scoped with RLS.
- id, vendor_id, user_id, customer_name, customer_email, customer_phone,
  booking_date, end_date, status, total_amount, notes, created_at

## 6. New table: post_likes
Tracks individual likes on community posts to prevent double-likes.
- id, post_id, user_id, created_at
Unique constraint on (post_id, user_id).

## Security
- RLS enabled on vendor_bookings and post_likes with owner-scoped policies.
- All new columns are nullable (no data loss for existing rows).
*/

-- ============================================================
-- 1. journal_entries new columns
-- ============================================================
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS mood text;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS expense numeric(10,2);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS location_text text;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS latitude numeric(9,6);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS longitude numeric(9,6);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_date date;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS media_urls jsonb;

-- ============================================================
-- 2. user_posts new columns
-- ============================================================
ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS media_urls jsonb;
ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS location_text text;
ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS author_avatar text;

-- ============================================================
-- 3. post_replies new columns
-- ============================================================
ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS author_avatar text;

-- ============================================================
-- 4. vendors new columns
-- ============================================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_person text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gps_lat numeric(9,6);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gps_lng numeric(9,6);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS years_experience integer;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS services_offered text[] DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gallery_urls jsonb;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pricing jsonb;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS documents jsonb;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS availability jsonb;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cover_photo_url text;

-- ============================================================
-- 5. vendor_bookings table
-- ============================================================
CREATE TABLE IF NOT EXISTS vendor_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  booking_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  total_amount numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_bookings_select_own" ON vendor_bookings;
CREATE POLICY "vendor_bookings_select_own" ON vendor_bookings FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM vendors WHERE vendors.id = vendor_bookings.vendor_id AND vendors.user_id = auth.uid()));

DROP POLICY IF EXISTS "vendor_bookings_insert_own" ON vendor_bookings;
CREATE POLICY "vendor_bookings_insert_own" ON vendor_bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vendor_bookings_update_own" ON vendor_bookings;
CREATE POLICY "vendor_bookings_update_own" ON vendor_bookings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM vendors WHERE vendors.id = vendor_bookings.vendor_id AND vendors.user_id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM vendors WHERE vendors.id = vendor_bookings.vendor_id AND vendors.user_id = auth.uid()));

DROP POLICY IF EXISTS "vendor_bookings_delete_own" ON vendor_bookings;
CREATE POLICY "vendor_bookings_delete_own" ON vendor_bookings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vendor_bookings_vendor_id ON vendor_bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_user_id ON vendor_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_status ON vendor_bookings(status);

-- ============================================================
-- 6. post_likes table
-- ============================================================
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_likes_select_all" ON post_likes;
CREATE POLICY "post_likes_select_all" ON post_likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "post_likes_insert_own" ON post_likes;
CREATE POLICY "post_likes_insert_own" ON post_likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_likes_delete_own" ON post_likes;
CREATE POLICY "post_likes_delete_own" ON post_likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- ============================================================
-- 7. Make vendors SELECT public for approved vendors
-- ============================================================
DROP POLICY IF EXISTS "vendors_select_approved" ON vendors;
CREATE POLICY "vendors_select_approved" ON vendors FOR SELECT
  TO authenticated USING (status = 'approved' OR auth.uid() = user_id);