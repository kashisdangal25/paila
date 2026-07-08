/*
# Destination Reports Table

Allows users to report issues with destination data for community-driven improvements
*/

CREATE TABLE IF NOT EXISTS destination_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('wrong_info', 'closed', 'blocked', 'dangerous', 'contact', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE destination_reports ENABLE ROW LEVEL SECURITY;

-- Policies - users can manage their own reports
CREATE POLICY "users_view_own_reports" ON destination_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users_insert_reports" ON destination_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_destination_reports_status ON destination_reports(status);
CREATE INDEX IF NOT EXISTS idx_destination_reports_destination ON destination_reports(destination_id);