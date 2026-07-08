/*
# Vendor Authentication and Business Accounts

This migration adds:
- vendors table for business applications
- pending_status tracking for vendor approval
- Updates profiles to support user_type tracking
*/

-- Add user_type to profiles (traveler or vendor)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'traveler' CHECK (user_type IN ('traveler', 'vendor'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vendor_status text DEFAULT NULL CHECK (vendor_status IN ('pending', 'approved', 'rejected'));

-- Create vendors table for business applications
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('guide', 'homestay', 'transport', 'cafe', 'hotel', 'tour_operator', 'rental', 'other')),
  location text NOT NULL,
  district text,
  description text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Vendor policies
DROP POLICY IF EXISTS "vendors_select_own" ON vendors;
CREATE POLICY "vendors_select_own" ON vendors FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "vendors_insert_own" ON vendors;
CREATE POLICY "vendors_insert_own" ON vendors FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vendors_update_own" ON vendors;
CREATE POLICY "vendors_update_own" ON vendors FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin can see all vendors
DROP POLICY IF EXISTS "vendors_admin_all" ON vendors;
CREATE POLICY "vendors_admin_all" ON vendors FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND email = 'admin@paila.com'
  ));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);