/*
# User Content Tables

This migration adds tables for user-generated content:
1. user_stories - User travel stories with photos
2. user_events - Community events
3. user_posts - Discussion posts
4. event_attendees - Event join tracking
5. post_replies - Discussion replies
*/

-- ============================================
-- USER STORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  user_avatar text,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  story_type text NOT NULL DEFAULT 'photo',
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_stories_public_read" ON user_stories;
CREATE POLICY "user_stories_public_read" ON user_stories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_stories_insert_own" ON user_stories;
CREATE POLICY "user_stories_insert_own" ON user_stories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_stories_update_own" ON user_stories;
CREATE POLICY "user_stories_update_own" ON user_stories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_stories_delete_own" ON user_stories;
CREATE POLICY "user_stories_delete_own" ON user_stories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_stories_user_id ON user_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stories_featured ON user_stories(featured);

-- ============================================
-- USER EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL DEFAULT 'trek',
  event_date date NOT NULL,
  location text NOT NULL,
  meeting_point text,
  max_attendees integer DEFAULT 10,
  current_attendees integer DEFAULT 1,
  difficulty text DEFAULT 'Easy',
  estimated_cost integer,
  images text[] DEFAULT '{}',
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_events_public_read" ON user_events;
CREATE POLICY "user_events_public_read" ON user_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_events_insert_own" ON user_events;
CREATE POLICY "user_events_insert_own" ON user_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_events_update_own" ON user_events;
CREATE POLICY "user_events_update_own" ON user_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_events_delete_own" ON user_events;
CREATE POLICY "user_events_delete_own" ON user_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_events_date ON user_events(event_date);

-- ============================================
-- EVENT ATTENDEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_event_attendee UNIQUE (event_id, user_id)
);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_attendees_public_read" ON event_attendees;
CREATE POLICY "event_attendees_public_read" ON event_attendees FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "event_attendees_insert_own" ON event_attendees;
CREATE POLICY "event_attendees_insert_own" ON event_attendees FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "event_attendees_delete_own" ON event_attendees;
CREATE POLICY "event_attendees_delete_own" ON event_attendees FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- USER POSTS TABLE (Discussions)
-- ============================================
CREATE TABLE IF NOT EXISTS user_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  views integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_posts_public_read" ON user_posts;
CREATE POLICY "user_posts_public_read" ON user_posts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_posts_insert_own" ON user_posts;
CREATE POLICY "user_posts_insert_own" ON user_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_posts_update_own" ON user_posts;
CREATE POLICY "user_posts_update_own" ON user_posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_posts_delete_own" ON user_posts;
CREATE POLICY "user_posts_delete_own" ON user_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- POST REPLIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS post_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  content text NOT NULL,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE post_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_replies_public_read" ON post_replies;
CREATE POLICY "post_replies_public_read" ON post_replies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "post_replies_insert_own" ON post_replies;
CREATE POLICY "post_replies_insert_own" ON post_replies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_replies_update_own" ON post_replies;
CREATE POLICY "post_replies_update_own" ON post_replies FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_replies_delete_own" ON post_replies;
CREATE POLICY "post_replies_delete_own" ON post_replies FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_replies_post_id ON post_replies(post_id);

-- ============================================
-- SEED CONTENT (NULL user_id for display)
-- ============================================

-- Seed stories
INSERT INTO user_stories (user_id, user_name, user_avatar, title, content, story_type, views, likes, featured, destination_id) VALUES
  (NULL, 'Lakpa Sherpa', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', 'Sunrise at Kala Patthar', 'The 3AM wake-up call was brutal, but watching the first rays hit Everest made it all worth it. The temperature was -20 degree C but my heart was warm. Standing at 5,545m watching the world wake up is something I will never forget. The golden light touching the top of Everest, Lhotse, and Nuptse was pure magic.', 'video', 2340, 847, true, (SELECT id FROM destinations WHERE slug = 'everest-base-camp')),
  (NULL, 'Maya Gurung', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', 'Hidden Waterfalls of Annapurna', 'Took the less traveled route from Chhomrong and discovered a series of waterfalls that most trekkers miss. Locals call them the Singing Falls because of the melody the water creates. Pure magic in the jungle.', 'photo', 1820, 623, true, (SELECT id FROM destinations WHERE slug = 'annapurna-base-camp')),
  (NULL, 'Kumar Rai', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80', 'Langtang After the Quake', 'Returning to Langtang 8 years after the earthquake, I found a community rebuilt with determination and hope. The teahouses are new, the trails are clear, and the welcome is warmer than ever.', 'video', 956, 456, true, (SELECT id FROM destinations WHERE slug = 'langtang-valley')),
  (NULL, 'Sita Tamang', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80', 'Street Food Tour of Kathmandu', 'From momos at Asan to sel roti during Dashain, explored every corner of Kathmandu street food scene. 15 different dishes in one day!', 'photo', 3200, 892, true, NULL),
  (NULL, 'Arun Sharma', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80', 'Motorcycle to Muktinath', 'Rode from Pokhara to Muktinath on my Royal Enfield. The wind in my face and mountains all around. Pure freedom on the Mustang trails.', 'video', 1450, 534, false, NULL),
  (NULL, 'Pemba Lama', 'https://images.unsplash.com/photo-1506794778202-cf785654b30d?w=100&q=80', 'Rhododendron Season in Ghorepani', 'Spring in Nepal means one thing: rhododendrons. The entire Poon Hill trail was a tunnel of red and pink. Nature at its finest.', 'photo', 1890, 567, true, (SELECT id FROM destinations WHERE slug = 'poon-hill'))
ON CONFLICT DO NOTHING;

-- Seed events
INSERT INTO user_events (user_id, user_name, title, description, event_type, event_date, location, meeting_point, max_attendees, current_attendees, difficulty, estimated_cost) VALUES
  (NULL, 'Paila Team', 'Shivapuri Peak Sunrise Hike', 'Join us for a sunrise hike to Shivapuri Peak! We start early to catch the golden hour. Moderate fitness required. Breakfast included at Nagi Gompa.', 'hike', '2026-07-15', 'Shivapuri Nagarjun National Park', 'Budhanilkantha Bus Park, 5:00 AM', 12, 7, 'Moderate', 800),
  (NULL, 'Photo Nepal', 'Bhaktapur Photography Walk', 'Explore the medieval streets of Bhaktapur with fellow photographers. Golden hour session, Newari breakfast, and local guide included.', 'photography', '2026-07-20', 'Bhaktapur Durbar Square', 'Bhaktapur Bus Park, 6:00 AM', 8, 5, 'Easy', 1500),
  (NULL, 'Weekend Trekkers', 'Nagarkot Group Trek', 'Weekend trek to Nagarkot with overnight stay. Perfect for beginners! Watchtower sunset and sunrise, village visit, and bonfire.', 'trek', '2026-07-22', 'Nagarkot', 'Kamalbinayak Bus Stop, 7:00 AM', 24, 18, 'Easy', 2500),
  (NULL, 'Wildlife Nepal', 'Chitwan Safari Weekend', '3-day jungle safari in Chitwan. Elephant safari, jungle walk, canoe ride, Tharu cultural program. All inclusive.', 'safari', '2026-08-01', 'Chitwan National Park', 'Meeting at Tourist Bus Park, 6:00 AM', 10, 6, 'Easy', 8500),
  (NULL, 'Monsoon Riders', 'Kathmandu Valley Cycling Tour', 'Full day cycling around Kathmandu Valley. Kopan Monastery, Boudhanath, and hidden temple stops. Bikes provided.', 'cycling', '2026-07-18', 'Kathmandu', 'Thamel, 6:30 AM', 15, 9, 'Moderate', 1800)
ON CONFLICT DO NOTHING;

-- Seed discussions
INSERT INTO user_posts (user_id, user_name, title, content, category, views, replies_count) VALUES
  (NULL, 'Suresh M.', 'Best time for Langtang Valley trek?', 'Planning my first Langtang trek. Should I go in spring or autumn? Looking for advice on weather and crowd levels. Any recommendations for teahouses?', 'planning', 1200, 23),
  (NULL, 'Emma L.', 'Budget breakdown for ABC trek', 'Just completed ABC on a tight budget. Here is my complete breakdown for other budget travelers. Total cost was under NPR 25,000 including everything!', 'tips', 3400, 45),
  (NULL, 'Kumar R.', 'Monsoon trekking gear recommendations?', 'Heading to Nepal in July. What gear is essential for monsoon season? Any specific brands that work well? Leech socks?', 'gear', 892, 18),
  (NULL, 'Priya K.', 'Solo female trekker safety tips', 'I have done 5 solo treks in Nepal. Sharing my safety tips and experiences for other women travelers. Nepal is incredibly safe if you follow these guidelines.', 'safety', 2100, 67),
  (NULL, 'Tenzin W.', 'Upper Mustang permit process explained', 'Complete guide to getting your Upper Mustang restricted area permit. Updated for 2026 season. Step by step process and costs.', 'planning', 1800, 34),
  (NULL, 'Marco R.', 'Best teahouses on EBC route', 'Just returned from Everest Base Camp. Here are my top teahouse recommendations for each overnight stop. Food, views, and hospitality ratings included.', 'tips', 2450, 56)
ON CONFLICT DO NOTHING;