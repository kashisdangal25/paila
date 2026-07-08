/*
# Paila - Initial Database Schema

This migration creates the complete database structure for Paila, Nepal's travel companion app.

## Tables Created

### 1. profiles
- User profiles linked to Supabase auth
- Stores name, email, avatar URL
- User-scoped data (each user can only see their own profile)

### 2. destinations
- Main destinations database (cities, trekking routes, attractions)
- Categories: City, Lakes, Wildlife, Trekking, Adventure, Pilgrimage
- Includes ratings, difficulty levels, altitude data
- Public read access, admin write only

### 3. hidden_gems
- Off-the-beaten-path places
- Tagged as pilot picks, guide favorites, peaceful spots
- Nature score rating system
- Public read access

### 4. guides
- Licensed local guides
- Verified status, availability tracking
- Languages, specialties, pricing
- Public read access

### 5. stays
- Homestays, lodges, hotels, hostels
- Amenities, badges (Highly Rated, Budget Friendly, etc.)
- Pricing and ratings
- Public read access

### 6. trips
- User's personal trip journal
- Linked to destinations
- Budget tracking, dates, status
- User-scoped data

### 7. sos_alerts
- Emergency alert system
- Captures GPS coordinates
- Resolution tracking
- User-scoped data

### 8. reviews
- Destination, guide, and stay reviews
- User identification info
- Linked to various entity types
- Public read, user-scoped write

### 9. quotes
- Inspirational nature quotes (rotating banner)
- Order index for sequence

## Security (RLS)
- All tables have Row Level Security enabled
- User tables (profiles, trips, sos_alerts) use auth.uid() for ownership
- Public tables (destinations, hidden_gems, guides, stays, quotes) allow anon read
- Reviews are public read, user-owned write (seed data has null user_id for display)

## Indexes
- Created indexes for frequently queried columns
- Geographic/region queries optimized
*/

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================
-- DESTINATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  region text NOT NULL,
  image_url text NOT NULL,
  rating numeric(2,1) DEFAULT 0.0,
  review_count integer DEFAULT 0,
  altitude_m integer,
  difficulty text,
  best_months text[],
  nature_score numeric(3,1),
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

-- Policies for destinations (public read)
DROP POLICY IF EXISTS "destinations_public_read" ON destinations;
CREATE POLICY "destinations_public_read" ON destinations FOR SELECT
  TO anon, authenticated USING (true);

-- Index for search and filtering
CREATE INDEX IF NOT EXISTS idx_destinations_category ON destinations(category);
CREATE INDEX IF NOT EXISTS idx_destinations_region ON destinations(region);
CREATE INDEX IF NOT EXISTS idx_destinations_featured ON destinations(featured);

-- ============================================
-- HIDDEN GEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hidden_gems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  region text NOT NULL,
  image_url text NOT NULL,
  nature_score numeric(3,1) NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  pilot_pick boolean DEFAULT false,
  guide_favorite boolean DEFAULT false,
  peaceful boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hidden_gems ENABLE ROW LEVEL SECURITY;

-- Policies for hidden_gems (public read)
DROP POLICY IF EXISTS "hidden_gems_public_read" ON hidden_gems;
CREATE POLICY "hidden_gems_public_read" ON hidden_gems FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_hidden_gems_nature_score ON hidden_gems(nature_score DESC);

-- ============================================
-- GUIDES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text NOT NULL,
  specialties text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  rating numeric(2,1) DEFAULT 0.0,
  review_count integer DEFAULT 0,
  price_per_day integer NOT NULL,
  available boolean DEFAULT true,
  verified boolean DEFAULT true,
  bio text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Policies for guides (public read)
DROP POLICY IF EXISTS "guides_public_read" ON guides;
CREATE POLICY "guides_public_read" ON guides FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_guides_available ON guides(available);

-- ============================================
-- STAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL,
  region text NOT NULL,
  location text NOT NULL,
  image_url text NOT NULL,
  description text NOT NULL,
  amenities text[] NOT NULL DEFAULT '{}',
  price_per_night integer NOT NULL,
  rating numeric(2,1) DEFAULT 0.0,
  review_count integer DEFAULT 0,
  badge text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stays ENABLE ROW LEVEL SECURITY;

-- Policies for stays (public read)
DROP POLICY IF EXISTS "stays_public_read" ON stays;
CREATE POLICY "stays_public_read" ON stays FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_stays_type ON stays(type);
CREATE INDEX IF NOT EXISTS idx_stays_region ON stays(region);

-- ============================================
-- TRIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  budget_npr integer NOT NULL,
  notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Policies for trips (user-scoped)
DROP POLICY IF EXISTS "trips_select_own" ON trips;
CREATE POLICY "trips_select_own" ON trips FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_insert_own" ON trips;
CREATE POLICY "trips_insert_own" ON trips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_update_own" ON trips;
CREATE POLICY "trips_update_own" ON trips FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_delete_own" ON trips;
CREATE POLICY "trips_delete_own" ON trips FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(start_date, end_date);

-- ============================================
-- SOS ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  message text,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for sos_alerts (user-scoped)
DROP POLICY IF EXISTS "sos_select_own" ON sos_alerts;
CREATE POLICY "sos_select_own" ON sos_alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sos_insert_own" ON sos_alerts;
CREATE POLICY "sos_insert_own" ON sos_alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sos_update_own" ON sos_alerts;
CREATE POLICY "sos_update_own" ON sos_alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sos_user_id ON sos_alerts(user_id);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  guide_id uuid REFERENCES guides(id) ON DELETE SET NULL,
  stay_id uuid REFERENCES stays(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  user_name text NOT NULL,
  user_location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews (public read, user-scoped write)
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_destination ON reviews(destination_id);
CREATE INDEX IF NOT EXISTS idx_reviews_guide ON reviews(guide_id);
CREATE INDEX IF NOT EXISTS idx_reviews_stay ON reviews(stay_id);

-- ============================================
-- QUOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  author text NOT NULL,
  order_index integer DEFAULT 0
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policies for quotes (public read)
DROP POLICY IF EXISTS "quotes_public_read" ON quotes;
CREATE POLICY "quotes_public_read" ON quotes FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert quotes
INSERT INTO quotes (text, author, order_index) VALUES
  ('The mountains are calling and I must go.', 'John Muir', 1),
  ('In every walk with nature, one receives far more than he seeks.', 'John Muir', 2),
  ('Not all those who wander are lost.', 'J.R.R. Tolkien', 3),
  ('The earth has music for those who listen.', 'William Shakespeare', 4),
  ('Look deep into nature and then you will understand everything better.', 'Albert Einstein', 5),
  ('Of all the paths you take in life, make sure a few of them are dirt.', 'John Muir', 6),
  ('In the mountains, there you feel free.', 'T.S. Eliot', 7),
  ('Every mountain top is within reach if you just keep climbing.', 'Barry Finlay', 8),
  ('The best view comes after the hardest climb.', 'Unknown', 9),
  ('To walk in nature is to witness a thousand miracles.', 'Mary Davis', 10)
ON CONFLICT DO NOTHING;

-- Insert destinations (using Pexels images)
INSERT INTO destinations (name, slug, description, category, region, image_url, rating, review_count, altitude_m, difficulty, best_months, featured) VALUES
  ('Kathmandu', 'kathmandu', 'Nepal''s vibrant capital, home to ancient temples, durbar squares, and centuries of living history in the heart of the Himalayas.', 'City', 'Bagmati Province', 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800&q=80', 4.8, 1200, 1400, 'Easy', ARRAY['Mar', 'Apr', 'May', 'Sep', 'Oct', 'Nov'], true),
  ('Pokhara', 'pokhara', 'The gateway to Annapurna, featuring the stunning Phewa Lake with mirror reflections of the Annapurna range.', 'Lakes', 'Gandaki Province', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80', 4.9, 2100, 820, 'Easy', ARRAY['Oct', 'Nov', 'Mar', 'Apr'], true),
  ('Chitwan National Park', 'chitwan', 'Home to rhinos, Bengal tigers, and jungle safaris in Nepal''s oldest national park.', 'Wildlife', 'Bagmati Province', 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&q=80', 4.7, 890, 415, 'Easy', ARRAY['Oct', 'Nov', 'Dec', 'Mar', 'Apr'], true),
  ('Annapurna Base Camp', 'annapurna-base-camp', 'One of the world''s great mountain treks through rhododendron forests to the base of the 10th highest peak.', 'Trekking', 'Gandaki Province', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80', 4.9, 3400, 4130, 'Moderate', ARRAY['Mar', 'Apr', 'May', 'Oct', 'Nov'], true),
  ('Everest Base Camp', 'everest-base-camp', 'The trek that changes you. Walk in the footsteps of legends to the foot of the world''s highest mountain.', 'Adventure', 'Koshi Province', 'https://images.unsplash.com/photo-1516982914291-e6262ba9e02b?w=800&q=80', 5.0, 4800, 5364, 'Hard', ARRAY['Mar', 'Apr', 'May', 'Oct', 'Nov'], true),
  ('Lumbini', 'lumbini', 'The birthplace of Siddhartha Gautama, the Buddha. A UNESCO World Heritage site of profound spiritual significance.', 'Pilgrimage', 'Lumbini Province', 'https://images.unsplash.com/photo-1554700808-78a83b3b1bc8?w=800&q=80', 4.8, 780, 150, 'Easy', ARRAY['Oct', 'Nov', 'Dec', 'Jan', 'Feb'], false),
  ('Rara Lake', 'rara', 'Nepal''s largest and deepest lake, a pristine turquoise basin ringed by pine forests in remote western Nepal.', 'Lakes', 'Karnali Province', 'https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=800&q=80', 4.9, 210, 2990, 'Moderate', ARRAY['Apr', 'May', 'Sep', 'Oct'], false),
  ('Bhaktapur', 'bhaktapur', 'A living medieval city where Newari culture thrives among ancient temples and pottery squares.', 'City', 'Bagmati Province', 'https://images.unsplash.com/photo-1602088113235-229c19758e9c?w=800&q=80', 4.7, 560, 1401, 'Easy', ARRAY['Oct', 'Nov', 'Mar', 'Apr'], false),
  ('Langtang Valley', 'langtang-valley', 'The valley of glaciers, offering stunning Himalayan views and Tamang culture relatively close to Kathmandu.', 'Trekking', 'Bagmati Province', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80', 4.8, 320, 3870, 'Moderate', ARRAY['Mar', 'Apr', 'May', 'Sep', 'Oct'], false),
  ('Phulchoki Hike', 'phulchoki', 'A perfect day hike near Kathmandu offering stunning mountain views and diverse flora.', 'Trekking', 'Bagmati Province', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', 4.6, 321, 2782, 'Easy', ARRAY['Mar', 'Apr', 'May', 'Sep', 'Oct', 'Nov'], false)
ON CONFLICT (slug) DO NOTHING;

-- Insert hidden gems
INSERT INTO hidden_gems (name, slug, description, region, image_url, nature_score, tags, pilot_pick, guide_favorite, peaceful) VALUES
  ('Rara Lake', 'rara-lake', 'Nepal''s largest and deepest lake — a silent turquoise basin ringed by pine forest, almost untouched by tourism.', 'Karnali Province', 'https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=800&q=80', 9.4, ARRAY['pilot', 'nature', 'peaceful'], true, false, true),
  ('Khopra Ridge', 'khopra-ridge', 'A quiet alternative to Poon Hill with sweeping Annapurna and Dhaulagiri views, minus the crowds.', 'Gandaki Province', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', 9.1, ARRAY['guide', 'nature'], false, true, false),
  ('Pathivara Hills', 'pathivara-hills', 'A sacred forested ridge with panoramic Kanchenjunga views, rarely visited by foreign trekkers.', 'Koshi Province', 'https://images.unsplash.com/photo-1591018332247-cfc8c33d6e22?w=800&q=80', 8.7, ARRAY['pilot', 'peaceful'], true, false, true),
  ('Shey Phoksundo Lake', 'shey-phoksundo', 'Nepal''s deepest lake sits inside an alpine desert national park few itineraries ever reach.', 'Karnali Province', 'https://images.unsplash.com/photo-1545153996-9097ab2c9d2c?w=800&q=80', 9.6, ARRAY['hidden', 'nature', 'peaceful'], false, true, true),
  ('Nar Phu Valley', 'nar-phu-valley', 'A restricted area of ancient Tibetan culture hidden between Annapurna and Manaslu.', 'Gandaki Province', 'https://images.unsplash.com/photo-1502786129293-79981df4e689?w=800&q=80', 9.2, ARRAY['guide', 'nature'], false, true, false),
  ('Tansen', 'tansen', 'A hilltop town with Newari architecture and panoramic views that feels like Bhaktapur 50 years ago.', 'Lumbini Province', 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&q=80', 8.5, ARRAY['peaceful'], false, false, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert guides
INSERT INTO guides (name, avatar_url, specialties, languages, rating, review_count, price_per_day, available, verified, bio) VALUES
  ('Nima Sherpa', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', ARRAY['Everest Region', 'High Altitude', 'Mountaineering'], ARRAY['English', 'Nepali', 'Tibetan'], 4.9, 182, 4500, true, true, 'Born in the Khumbu region, I have summited Everest 3 times and guided over 200 treks.'),
  ('Pemba Tamang', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80', ARRAY['Annapurna Circuit', 'Cultural Tours', 'Photography'], ARRAY['English', 'Nepali', 'Hindi', 'German'], 4.8, 134, 3800, true, true, '15 years of guiding experience, certified wilderness first responder.'),
  ('Dorje Lama', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', ARRAY['Langtang Valley', 'Wildlife', 'Day Hikes'], ARRAY['English', 'Nepali', 'French'], 4.9, 97, 3200, true, true, 'Langtang native with deep knowledge of local flora and fauna.'),
  ('Pasang Bhote', 'https://images.unsplash.com/photo-1506794778202-cf785654b30d?w=200&q=80', ARRAY['Dolpo', 'Upper Mustang', 'Remote Treks'], ARRAY['English', 'Nepali', 'Tibetan'], 4.7, 56, 4000, false, true, 'Specialist in restricted area trekking and cultural immersion.'),
  ('Kamala Gurung', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', ARRAY['Easy Hikes', 'Homestays', 'Community Tourism'], ARRAY['English', 'Nepali', 'Japanese'], 4.8, 89, 2800, true, true, 'Expert in eco-tourism and community-based homestay experiences.')
ON CONFLICT DO NOTHING;

-- Insert stays
INSERT INTO stays (name, slug, type, region, location, image_url, description, amenities, price_per_night, rating, review_count, badge) VALUES
  ('Mountain View Homestay', 'mountain-view-homestay', 'Homestay', 'Annapurna', 'Chomrong, Annapurna', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', 'Wake up to Annapurna South blocking out the sky. Authentic Gurung hospitality.', ARRAY['Hot meals', 'Hot shower', 'WiFi', 'Mountain views'], 1200, 4.9, 128, 'Highly Rated'),
  ('Himalayan Lodge', 'himalayan-lodge', 'Lodge', 'Annapurna', 'Deurali, Annapurna', 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80', 'The highest fully equipped lodge before ABC. Unmatched sunrise views.', ARRAY['Attached bath', 'Mountain view', 'Generator', 'Restaurant'], 1800, 4.7, 89, 'Trekker Favourite'),
  ('Peaceful Cottage', 'peaceful-cottage', 'Cottage', 'Kaski', 'Landruk, Kaski', 'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800&q=80', 'Quiet garden cottage with organic kitchen and authentic Nepali vibe.', ARRAY['Garden', 'Home kitchen', 'Quiet', 'Bird watching'], 900, 4.8, 61, 'Peaceful'),
  ('Backpacker Hostel Pokhara', 'backpacker-hostel-pokhara', 'Hostel', 'Pokhara', 'Lakeside, Pokhara', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800?q=80', 'Social hostel steps from Phewa Lake. Perfect for meeting fellow travelers.', ARRAY['Dorm beds', 'Common room', 'Lockers', 'WiFi', 'Bike rental'], 450, 4.5, 204, 'Budget Friendly'),
  ('Kathmandu Summit Hotel', 'kathmandu-summit-hotel', 'Hotel', 'Kathmandu', 'Thamel, Kathmandu', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', 'Central Thamel location with rooftop views of the city and mountains.', ARRAY['AC', 'Restaurant', 'Rooftop', 'Room service', 'Laundry'], 2500, 4.6, 156, NULL),
  ('Tiger Tops Jungle Lodge', 'tiger-tops-jungle-lodge', 'Lodge', 'Chitwan', 'Chitwan National Park', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80', 'Eco-lodge inside the national park. Safari starts at your doorstep.', ARRAY['Safari', 'Nature walks', 'River views', 'Eco-friendly'], 4500, 4.8, 92, 'Eco-Friendly')
ON CONFLICT (slug) DO NOTHING;

-- Insert reviews (with NULL user_id for seed data display)
INSERT INTO reviews (destination_id, rating, content, user_name, user_location) VALUES
  ((SELECT id FROM destinations WHERE slug = 'annapurna-base-camp'), 5, 'The safety alerts saved us from hiking a flooded trail. Paila notified us the night before — we changed route and had the best day of the trip.', 'Tom Miller', 'Bristol, UK'),
  ((SELECT id FROM destinations WHERE slug = 'annapurna-base-camp'), 5, 'I found a village guesthouse in Mustang I never would have discovered otherwise. The host had been waiting to welcome travelers for years.', 'Sara Rai', 'Kathmandu, Nepal'),
  ((SELECT id FROM destinations WHERE slug = 'pokhara'), 5, 'As a solo traveler I was nervous. Having the itinerary, routes, and emergency contacts all in one place made me feel like I had a local guide in my pocket.', 'Priya Kumar', 'Mumbai, India'),
  ((SELECT id FROM destinations WHERE slug = 'everest-base-camp'), 5, 'The offline maps were a lifesaver when we lost signal above Namche. Weather alerts helped us pick the perfect summit day.', 'Kenji Tanaka', 'Tokyo, Japan'),
  ((SELECT id FROM destinations WHERE slug = 'rara'), 5, 'Still can''t believe how empty this place was. Pure magic. Thank you Paila for the recommendation!', 'Emma Schmidt', 'Munich, Germany')
ON CONFLICT DO NOTHING;