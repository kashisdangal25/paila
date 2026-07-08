/*
# Add user_id to guides and stays for Business Portal

This allows linking user accounts to their guide/homestay business profiles
*/

-- Add user_id column to guides
ALTER TABLE guides ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add user_id column to stays
ALTER TABLE stays ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add business_type column to profiles to track user role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type text CHECK (business_type IN ('traveler', 'guide', 'homestay', 'both'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_business boolean DEFAULT false;

-- Update RLS policies to allow users to manage their own business profiles
DROP POLICY IF EXISTS "update_own_guide" ON guides;
CREATE POLICY "update_own_guide" ON guides FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_guide" ON guides;
CREATE POLICY "insert_own_guide" ON guides FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_stay" ON stays;
CREATE POLICY "update_own_stay" ON stays FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_stay" ON stays;
CREATE POLICY "insert_own_stay" ON stays FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);