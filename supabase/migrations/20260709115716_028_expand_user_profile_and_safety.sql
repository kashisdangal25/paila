/*
# Expand User Profile and Safety Information

## Summary
This migration significantly expands the `profiles` table to support a complete,
production-ready user profile and travel-safety system for Paila. It also adds a
new `trusted_contacts` table to support future SOS / trip-sharing / emergency
notification features, and an `is_currently_travelling` flag recommended for
future safety features (SOS, trip sharing, emergency contact notification).

## Important Notes

### 1. Non-destructive
All new columns are added with `ADD COLUMN IF NOT EXISTS` and are nullable
(except where noted), so existing rows and existing app functionality are not
broken. No columns are dropped, renamed, or retyped.

### 2. New columns on `profiles`
- `username` (text, unique) — optional but unique display handle.
- `date_of_birth` (date) — optional.
- `gender` (text) — optional; free text (male/female/other/non-binary/etc.).
- `nationality` (text) — optional.
- `country_of_residence` (text) — optional.
- `preferred_language` (text) — optional; defaults to 'en'.
- `emergency_contact_name` (text) — optional.
- `emergency_contact_phone` (text) — optional.
- `emergency_contact_relationship` (text) — optional.
- `blood_group` (text) — optional; constrained to known values or null.
- `medical_conditions` (text) — optional.
- `allergies` (text) — optional.
- `trekking_experience_level` (text) — optional; constrained to
  beginner/intermediate/advanced/expert.
- `preferred_emergency_language` (text) — optional.
- `sos_enabled` (boolean) — default false; future SOS feature toggle.
- `last_known_location` (jsonb) — optional; stores {lat, lng, updated_at} when
  permission granted. NULL by default.
- `offline_trek_status` (text) — optional; constrained to
  safe/trekking/offline/checkin_needed. NULL by default.
- `travel_insurance` (jsonb) — optional; stores insurance provider/policy/phone
  for future use. NULL by default.
- `is_currently_travelling` (boolean) — default false. Recommended optional flag
  for future safety features (SOS, trip sharing, notifying an emergency contact).
  Not yet wired to any feature; stored now so the profile is designed for it.

### 3. New table: `trusted_contacts`
Stores a user's trusted contacts for future trip-sharing / emergency
notification features. Each row belongs to a user (owner) and references a
contact by name + phone + relationship. This is structure-only — no app feature
consumes it yet.

Columns:
- `id` (uuid, primary key)
- `user_id` (uuid, not null, references auth.users, cascade delete)
- `name` (text, not null)
- `phone` (text, not null)
- `email` (text, optional)
- `relationship` (text, optional)
- `notify_on_trip` (boolean, default false) — future: notify when user starts a trip
- `notify_on_sos` (boolean, default true) — future: notify on SOS alert
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 4. Security (RLS)
- `profiles` already has RLS enabled. Existing policies remain. A partial unique
  index on `username` is added so NULL usernames don't conflict (NULLs are
  allowed and not considered equal).
- `trusted_contacts` gets RLS enabled with owner-scoped CRUD policies
  (select/insert/update/delete) scoped to `authenticated` using `auth.uid()`.

### 5. Indexes
- Partial unique index on `profiles.username` (where username is not null).
- Index on `trusted_contacts.user_id` for fast lookups.
*/

-- ============================================================
-- 1. Expand profiles table
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_of_residence text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_relationship text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_group text
  CHECK (blood_group IS NULL OR blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_conditions text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergies text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trekking_experience_level text
  CHECK (trekking_experience_level IS NULL OR trekking_experience_level IN ('beginner','intermediate','advanced','expert'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_emergency_language text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sos_enabled boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_known_location jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS offline_trek_status text
  CHECK (offline_trek_status IS NULL OR offline_trek_status IN ('safe','trekking','offline','checkin_needed'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS travel_insurance jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_currently_travelling boolean DEFAULT false;

-- Partial unique index on username: only enforces uniqueness for non-null values
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON profiles (username) WHERE username IS NOT NULL;

-- ============================================================
-- 2. trusted_contacts table
-- ============================================================

CREATE TABLE IF NOT EXISTS trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  relationship text,
  notify_on_trip boolean DEFAULT false,
  notify_on_sos boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trusted_contacts_select_own" ON trusted_contacts;
CREATE POLICY "trusted_contacts_select_own" ON trusted_contacts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trusted_contacts_insert_own" ON trusted_contacts;
CREATE POLICY "trusted_contacts_insert_own" ON trusted_contacts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trusted_contacts_update_own" ON trusted_contacts;
CREATE POLICY "trusted_contacts_update_own" ON trusted_contacts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trusted_contacts_delete_own" ON trusted_contacts;
CREATE POLICY "trusted_contacts_delete_own" ON trusted_contacts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user_id ON trusted_contacts(user_id);

-- ============================================================
-- 3. updated_at trigger for trusted_contacts
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trusted_contacts_updated_at ON trusted_contacts;
CREATE TRIGGER trusted_contacts_updated_at
  BEFORE UPDATE ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();