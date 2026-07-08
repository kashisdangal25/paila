/*
# Enhanced Destination Details

Adding comprehensive information for each destination:
- Elevation, difficulty, duration
- Transport options, budget ranges
- Network connectivity, best season
- Safety info, photography spots
- Emergency contacts (hospital, police, health post)
- Local foods, cultural info
- Paila Score ratings
- Packing checklist items
*/

-- Add comprehensive columns to destinations table
ALTER TABLE destinations 
ADD COLUMN IF NOT EXISTS elevation_m integer,
ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'Moderate',
ADD COLUMN IF NOT EXISTS duration_days text,
ADD COLUMN IF NOT EXISTS transport text,
ADD COLUMN IF NOT EXISTS budget_min integer,
ADD COLUMN IF NOT EXISTS budget_max integer,
ADD COLUMN IF NOT EXISTS network text DEFAULT 'Limited',
ADD COLUMN IF NOT EXISTS best_season text,
ADD COLUMN IF NOT EXISTS safety_info text,
ADD COLUMN IF NOT EXISTS sunrise_spot text,
ADD COLUMN IF NOT EXISTS sunset_spot text,
ADD COLUMN IF NOT EXISTS photography_tips text,
ADD COLUMN IF NOT EXISTS nearest_hospital text,
ADD COLUMN IF NOT EXISTS nearest_hospital_km integer,
ADD COLUMN IF NOT EXISTS nearest_police text,
ADD COLUMN IF NOT EXISTS nearest_police_km integer,
ADD COLUMN IF NOT EXISTS nearest_health_post text,
ADD COLUMN IF NOT EXISTS nearest_health_post_km integer,
ADD COLUMN IF NOT EXISTS local_rescue text,
ADD COLUMN IF NOT EXISTS local_foods text[],
ADD COLUMN IF NOT EXISTS cultural_tips text,
ADD COLUMN IF NOT EXISTS wildlife text[],
ADD COLUMN IF NOT EXISTS festivals_nearby text,
ADD COLUMN IF NOT EXISTS things_to_respect text,
ADD COLUMN IF NOT EXISTS score_adventure integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_crowd integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_cleanliness integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_photography integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_family integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_budget integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_safety integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS packing_list text[],
ADD COLUMN IF NOT EXISTS nearby_places uuid[],
ADD COLUMN IF NOT EXISTS latitude numeric(10, 7),
ADD COLUMN IF NOT EXISTS longitude numeric(10, 7);

-- Create a destination_reviews table for user reviews
CREATE TABLE IF NOT EXISTS destination_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  adventure_score integer CHECK (adventure_score >= 1 AND adventure_score <= 5),
  crowd_score integer CHECK (crowd_score >= 1 AND crowd_score <= 5),
  cleanliness_score integer CHECK (cleanliness_score >= 1 AND cleanliness_score <= 5),
  photography_score integer CHECK (photography_score >= 1 AND photography_score <= 5),
  family_score integer CHECK (family_score >= 1 AND family_score <= 5),
  budget_score integer CHECK (budget_score >= 1 AND budget_score <= 5),
  safety_score integer CHECK (safety_score >= 1 AND safety_score <= 5),
  title text,
  content text,
  visit_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(destination_id, user_id)
);

-- Enable RLS on reviews
ALTER TABLE destination_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for destination_reviews
DROP POLICY IF EXISTS "select_reviews" ON destination_reviews;
CREATE POLICY "select_reviews" ON destination_reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_review" ON destination_reviews;
CREATE POLICY "insert_own_review" ON destination_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_review" ON destination_reviews;
CREATE POLICY "update_own_review" ON destination_reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_review" ON destination_reviews;
CREATE POLICY "delete_own_review" ON destination_reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create emergency_contacts table for dynamic emergency info
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE,
  contact_type text NOT NULL,
  name text NOT NULL,
  phone text,
  distance_km integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_emergency" ON emergency_contacts;
CREATE POLICY "select_emergency" ON emergency_contacts FOR SELECT
  TO authenticated USING (true);

-- Create local_guides table linking guides to destinations
CREATE TABLE IF NOT EXISTS destination_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  guide_id uuid NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(destination_id, guide_id)
);

ALTER TABLE destination_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_dest_guides" ON destination_guides;
CREATE POLICY "select_dest_guides" ON destination_guides FOR SELECT
  TO authenticated USING (true);