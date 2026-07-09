/*
# Fix profiles insert policy and add delete policy

## Summary
The existing `profiles_insert_own` policy allowed inserts when `auth.uid()` is
NULL (i.e. unauthenticated/anon), which is a security gap. This tightens it to
require `auth.uid() = id` (authenticated owner only). Also adds a missing
DELETE policy so users can delete their own profile row.

## Changes
1. Drop and recreate `profiles_insert_own` with a strict ownership check.
2. Add `profiles_delete_own` policy.
*/

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);