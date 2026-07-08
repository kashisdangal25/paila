/*
# User Saved Destinations and User Stats

This migration adds:
1. user_saved - Track user's saved destinations, hidden gems, guides, and stays
2. user_stats - Track user achievements and activity stats
3. user_achievements - Track unlocked achievements
*/

-- ============================================
-- USER SAVED TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_saved (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE,
  hidden_gem_id uuid REFERENCES hidden_gems(id) ON DELETE CASCADE,
  guide_id uuid REFERENCES guides(id) ON DELETE CASCADE,
  stay_id uuid REFERENCES stays(id) ON DELETE CASCADE,
  collection_name text DEFAULT 'default',
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT check_item_exists CHECK (
    destination_id IS NOT NULL OR
    hidden_gem_id IS NOT NULL OR
    guide_id IS NOT NULL OR
    stay_id IS NOT NULL
  ),
  
  CONSTRAINT unique_user_item UNIQUE (user_id, destination_id, hidden_gem_id, guide_id, stay_id)
);

ALTER TABLE user_saved ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_saved_select_own" ON user_saved;
CREATE POLICY "user_saved_select_own" ON user_saved FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_saved_insert_own" ON user_saved;
CREATE POLICY "user_saved_insert_own" ON user_saved FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_saved_delete_own" ON user_saved;
CREATE POLICY "user_saved_delete_own" ON user_saved FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_saved_user_id ON user_saved(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_destination ON user_saved(destination_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_hidden_gem ON user_saved(hidden_gem_id);

-- ============================================
-- USER STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trips_completed integer DEFAULT 0,
  places_visited integer DEFAULT 0,
  provinces_visited integer DEFAULT 0,
  photos_shared integer DEFAULT 0,
  total_distance_km integer DEFAULT 0,
  total_elevation_m integer DEFAULT 0,
  reviews_written integer DEFAULT 0,
  guides_booked integer DEFAULT 0,
  current_level integer DEFAULT 1,
  current_xp integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_stats_select_own" ON user_stats;
CREATE POLICY "user_stats_select_own" ON user_stats FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_stats_insert_own" ON user_stats;
CREATE POLICY "user_stats_insert_own" ON user_stats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_stats_update_own" ON user_stats;
CREATE POLICY "user_stats_update_own" ON user_stats FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_key)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_achievements_select_own" ON user_achievements;
CREATE POLICY "user_achievements_select_own" ON user_achievements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_achievements_insert_own" ON user_achievements;
CREATE POLICY "user_achievements_insert_own" ON user_achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ============================================
-- ADD COLUMNS TO TRIPS
-- ============================================
ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_km integer DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS max_altitude_m integer DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS photos_count integer DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cover_image text;

-- ============================================
-- MORE DESTINATIONS
-- ============================================
INSERT INTO destinations (name, slug, description, category, region, image_url, rating, review_count, altitude_m, difficulty, best_months, featured, nature_score) VALUES
  ('Mardi Himal Trek', 'mardi-himal', 'A hidden gem trek with stunning close-up views of Machhapuchhre and the Annapurnas, perfect for those seeking quieter trails.', 'Trekking', 'Gandaki Province', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', 4.8, 1850, 4500, 'Moderate', ARRAY['Mar', 'Apr', 'May', 'Oct', 'Nov'], true, 9.2),
  ('Ghorepani Poon Hill', 'poon-hill', 'The classic sunrise trek offering panoramic Himalayan views. Perfect introduction to Nepalese trekking.', 'Trekking', 'Gandaki Province', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80', 4.7, 4200, 3210, 'Easy', ARRAY['Mar', 'Apr', 'May', 'Oct', 'Nov', 'Dec'], true, 8.8),
  ('Bardia National Park', 'bardia', 'The best place in Nepal to see Bengal tigers in the wild. Remote, pristine, and truly wild.', 'Wildlife', 'Lumbini Province', 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&q=80', 4.9, 420, 400, 'Easy', ARRAY['Oct', 'Nov', 'Feb', 'Mar', 'Apr'], false, 9.5),
  ('Upper Mustang', 'upper-mustang', 'The forbidden kingdom — ancient Tibetan culture preserved in a high-altitude desert landscape.', 'Adventure', 'Gandaki Province', 'https://images.unsplash.com/photo-1502786129293-79981df4e689?w=800&q=80', 4.9, 680, 3800, 'Moderate', ARRAY['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], true, 9.1),
  ('Kathmandu Durbar Square', 'kathmandu-durbar', 'The historic heart of Kathmandu — UNESCO World Heritage site with centuries of royal history.', 'Culture', 'Bagmati Province', 'https://images.unsplash.com/photo-1602088113235-229c19758e9c?w=800&q=80', 4.6, 2400, 1350, 'Easy', ARRAY['All Year'], false, 7.5),
  ('Patan Durbar Square', 'patan-durbar', 'The finest collection of Newari architecture in Nepal. A living museum of medieval art.', 'Culture', 'Bagmati Province', 'https://images.unsplash.com/photo-1602088113235-229c19758e9c?w=800&q=80', 4.7, 1850, 1350, 'Easy', ARRAY['All Year'], false, 7.8),
  ('Boudhanath Stupa', 'boudhanath', 'One of the largest stupas in the world. The spiritual heart of Tibetan Buddhism in Nepal.', 'Pilgrimage', 'Bagmati Province', 'https://images.unsplash.com/photo-1554700808-78a83b3b1bc8?w=800&q=80', 4.9, 3100, 1400, 'Easy', ARRAY['All Year'], false, 8.2),
  ('Swayambhunath', 'swayambhunath', 'The Monkey Temple — ancient stupa with panoramic Kathmandu views. One of Nepal oldest religious sites.', 'Pilgrimage', 'Bagmati Province', 'https://images.unsplash.com/photo-1554700808-78a83b3b1bc8?w=800&q=80', 4.7, 2800, 1350, 'Easy', ARRAY['All Year'], false, 8.0),
  ('Nagarkot', 'nagarkot', 'The sunrise viewpoint — spectacular Himalayan views just an hour from Kathmandu.', 'Trekking', 'Bagmati Province', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', 4.5, 1650, 2100, 'Easy', ARRAY['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], false, 7.6),
  ('Dhampus Village', 'dhampus', 'Authentic Gurung village with stunning mountain views. Perfect cultural homestay experience.', 'Trekking', 'Gandaki Province', 'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800&q=80', 4.6, 980, 1650, 'Easy', ARRAY['All Year'], false, 8.4),
  ('Gosaikunda Lake', 'gosaikunda', 'Sacred alpine lake at 4,380m. A pilgrimage site for Hindus and a stunning high-altitude trek.', 'Pilgrimage', 'Bagmati Province', 'https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=800&q=80', 4.8, 760, 4380, 'Moderate', ARRAY['Apr', 'May', 'Jun', 'Oct', 'Nov'], false, 9.0),
  ('Ilam Tea Gardens', 'ilam', 'Rolling tea plantations in eastern Nepal. Misty mornings, fresh tea, and peaceful mountain views.', 'Trekking', 'Koshi Province', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', 4.5, 540, 1700, 'Easy', ARRAY['Mar', 'Apr', 'May', 'Oct', 'Nov'], false, 8.6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- MORE HIDDEN GEMS
-- ============================================
INSERT INTO hidden_gems (name, slug, description, region, image_url, nature_score, tags, pilot_pick, guide_favorite, peaceful) VALUES
  ('Taudaha Lake', 'taudaha-lake', 'A peaceful lake on Kathmandu outskirts, steeped in legend and bird-watching paradise.', 'Bagmati Province', 'https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=800&q=80', 8.2, ARRAY['peaceful', 'nature', 'birds'], false, false, true),
  ('Balthali Village', 'balthali', 'A hidden village retreat with organic farms, mountain views, and zero tourists.', 'Bagmati Province', 'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800&q=80', 8.7, ARRAY['pilot', 'peaceful', 'homestay'], true, false, true),
  ('Kalinchowk', 'kalinchowk', 'A temple-topped hill with 360 Himalayan views, snow in winter, and rhododendrons in spring.', 'Bagmati Province', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', 8.9, ARRAY['guide', 'nature', 'views'], false, true, false),
  ('Bandipur', 'bandipur', 'A perfectly preserved hilltop town with Newari architecture and mountain vistas. Tourism done right.', 'Gandaki Province', 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&q=80', 8.8, ARRAY['pilot', 'peaceful', 'culture'], true, false, true),
  ('Ghiling Village', 'ghiling', 'Windswept village in Upper Mustang where time stands still. Authentic Tibetan culture.', 'Gandaki Province', 'https://images.unsplash.com/photo-1502786129293-79981df4e689?w=800&q=80', 9.3, ARRAY['hidden', 'culture', 'guide'], false, true, false),
  ('Champadevi Hike', 'champadevi', 'A challenging day hike from Kathmandu with Buddhist stupa at the summit and valley views.', 'Bagmati Province', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', 8.1, ARRAY['hike', 'nature'], false, true, false),
  ('Shivapuri Nagarjun', 'shivapuri', 'Kathmandu backyard wilderness — pristine forests, hidden monasteries, and summit views.', 'Bagmati Province', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80', 8.6, ARRAY['nature', 'peaceful', 'hike'], true, false, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- MORE GUIDES
-- ============================================
INSERT INTO guides (name, avatar_url, specialties, languages, rating, review_count, price_per_day, available, verified, bio) VALUES
  ('Tenzing Sherpa', 'https://images.unsplash.com/photo-1506794778202-cf785654b30d?w=200&q=80', ARRAY['Everest Region', 'High Passes', 'Ice Climbing'], ARRAY['English', 'Nepali', 'Tibetan'], 4.9, 156, 4800, true, true, 'Born in Namche Bazaar, I have 20 years of experience guiding in the Khumbu region. Let me show you my home.'),
  ('Lhakpa Bhote', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', ARRAY['Upper Mustang', 'Tibetan Culture', 'Restricted Areas'], ARRAY['English', 'Nepali', 'Tibetan', 'Hindi'], 4.8, 89, 4200, true, true, 'Mustang is my ancestral home. I guide you through the hidden valleys most tourists never see.'),
  ('Pasang Sherpa', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80', ARRAY['Annapurna Circuit', 'Manaslu', 'Off-beat Treks'], ARRAY['English', 'Nepali', 'Japanese'], 4.9, 210, 3500, true, true, 'I have completed the Annapurna Circuit 100+ times. Every season has its magic.'),
  ('Maya Gurung', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', ARRAY['Homestays', 'Cultural Tours', 'Village Tourism'], ARRAY['English', 'Nepali', 'Gurung'], 4.8, 67, 2500, true, true, 'I grew up in a Gurung village. Let me share our hospitality, food, and traditions with you.'),
  ('Raj Kumar Chaudhary', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', ARRAY['Chitwan Safari', 'Bird Watching', 'Wildlife Photography'], ARRAY['English', 'Nepali', 'Tharu'], 4.7, 134, 2200, true, true, 'Born in the jungle. I know every rhino trail and tiger path in Chitwan.')
ON CONFLICT DO NOTHING;

-- ============================================
-- MORE STAYS
-- ============================================
INSERT INTO stays (name, slug, type, region, location, image_url, description, amenities, price_per_night, rating, review_count, badge) VALUES
  ('Bardia Jungle Retreat', 'bardia-jungle-retreat', 'Lodge', 'Bardia', 'Thakurdwara, Bardia', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', 'Eco-friendly jungle lodge on the edge of Bardia National Park. Safari adventures await.', ARRAY['Safari', 'Nature walks', 'River views', 'Eco-friendly', 'Organic meals'], 3800, 4.9, 72, 'Eco-Friendly'),
  ('Bandipur Mountain Resort', 'bandipur-mountain-resort', 'Hotel', 'Bandipur', 'Bandipur Hilltop', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', 'Heritage hotel in restored Newari building with panoramic Himalayan views.', ARRAY['Mountain views', 'Heritage architecture', 'Restaurant', 'Cultural tours'], 3200, 4.7, 98, 'Heritage Stay'),
  ('Tansen View Tower', 'tansen-view-tower', 'Homestay', 'Palpa', 'Tansen Bazaar', 'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800&q=80', 'Family-run guesthouse with the best views in Tansen. Authentic home-cooked meals.', ARRAY['Home cooking', 'Mountain views', 'Quiet', 'Cultural experience'], 1200, 4.6, 45, 'Peaceful'),
  ('Nagarkot Mountain View', 'nagarkot-mountain-view', 'Resort', 'Bhaktapur', 'Nagarkot', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', 'Sunrise and sunset Himalayan views from every room. The best of Nagarkot.', ARRAY['Mountain views', 'Restaurant', 'Sunrise tours', 'Hiking'], 2800, 4.5, 187, 'Trekker Favourite'),
  ('Pokhara Lakeview Hotel', 'pokhara-lakeview', 'Hotel', 'Pokhara', 'Lakeside, Pokhara', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', 'Boutique hotel steps from Phewa Lake with rooftop yoga and mountain views.', ARRAY['Lake views', 'Roof deck', 'Yoga', 'Spa', 'Restaurant'], 2200, 4.7, 142, NULL),
  ('Mustang Heritage Lodge', 'mustang-heritage-lodge', 'Lodge', 'Mustang', 'Lo Manthang, Mustang', 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80', 'Authentic mud-brick lodge inside the walled city of Lo Manthang.', ARRAY['Cultural tours', 'Home meals', 'Traditional architecture', 'Pottery'], 3500, 4.8, 34, 'Heritage Stay')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- MORE REVIEWS
-- ============================================
INSERT INTO reviews (destination_id, rating, content, user_name, user_location) VALUES
  ((SELECT id FROM destinations WHERE slug = 'mardi-himal'), 5, 'Most beautiful trek I have done in Nepal. Less crowded than ABC with even better views of Machhapuchhre!', 'Arun Sharma', 'Delhi, India'),
  ((SELECT id FROM destinations WHERE slug = 'poon-hill'), 5, 'Perfect for beginners. The sunrise view was surreal. Highly recommend the 4-day version.', 'Lisa Chen', 'Singapore'),
  ((SELECT id FROM destinations WHERE slug = 'upper-mustang'), 5, 'Like traveling back in time. The landscapes are surreal — Tibetan culture preserved beautifully.', 'Marco Rossi', 'Milan, Italy'),
  ((SELECT id FROM destinations WHERE slug = 'bardia'), 5, 'We saw a tiger! Best wildlife experience in Asia. Much wilder than Chitwan.', 'James Wilson', 'Brisbane, Australia'),
  ((SELECT id FROM destinations WHERE slug = 'gosaikunda'), 5, 'The frozen lake in winter was otherworldly. Spiritual and physically challenging.', 'Yuki Tanaka', 'Osaka, Japan'),
  ((SELECT id FROM destinations WHERE slug = 'bandipur'), 5, 'The most charming town in Nepal. Living museum vibes with incredible views.', 'Sophie Martin', 'Lyon, France')
ON CONFLICT DO NOTHING;