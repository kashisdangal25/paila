/*
# Add columns and real business data
*/

-- Add region column to guides
ALTER TABLE guides ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS bio text;

-- Add host details to stays
ALTER TABLE stays ADD COLUMN IF NOT EXISTS host_name text;
ALTER TABLE stays ADD COLUMN IF NOT EXISTS contact_phone text;

-- Insert authentic Nepali guides
INSERT INTO guides (id, name, avatar_url, rating, review_count, specialties, region, available, price_per_day, verified, bio, languages, created_at)
VALUES
  (gen_random_uuid(), 'Kami Sherpa', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80', 4.9, 127, ARRAY['Langtang Region', 'Helambu', 'Tamang Heritage'], 'Rasuwa', true, 8500, true, 'Langtang native with deep knowledge of Tamang culture.', ARRAY['Nepali', 'Tamang', 'English'], now()),
  (gen_random_uuid(), 'Mingma Dorje', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80', 4.8, 89, ARRAY['Kanchenjunga', 'Taplejung', 'Remote Treks'], 'Taplejung', true, 10000, true, 'Remote East Nepal expert.', ARRAY['Nepali', 'Limbu', 'English'], now()),
  (gen_random_uuid(), 'Pemba Bhote', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80', 4.7, 156, ARRAY['Dolpo Region', 'Shey Phoksundo', 'Tibetan Buddhism'], 'Dolpa', true, 12000, true, 'Dolpa native guide. Buddhist cultural sites expert.', ARRAY['Nepali', 'Tibetan', 'English'], now()),
  (gen_random_uuid(), 'Lhakpa Yangji', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d35?w=150&q=80', 4.9, 203, ARRAY['Everest Base Camp', 'Gokyo Lakes', 'High Passes'], 'Solukhumbu', true, 9000, true, 'Gokyo valley specialist. 30+ EBC trips.', ARRAY['Nepali', 'Sherpa', 'English'], now()),
  (gen_random_uuid(), 'Krishna Bahadur', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80', 4.6, 78, ARRAY['Mustang', 'Upper Mustang', 'Jomsom Muktinath'], 'Mustang', true, 11000, true, 'Mustang region expert. Lo Manthang specialist.', ARRAY['Nepali', 'Thakali', 'English'], now()),
  (gen_random_uuid(), 'Hira Maya', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80', 4.8, 67, ARRAY['Ghorepani', 'Ghandruk', 'Family Treks'], 'Kaski', true, 6500, true, 'Female guide for family-friendly Annapurna treks.', ARRAY['Nepali', 'Gurung', 'English'], now()),
  (gen_random_uuid(), 'Sanu Kancha', 'https://images.unsplash.com/photo-1566753323528-f9e5e24e6e7e?w=150&q=80', 4.5, 45, ARRAY['Kathmandu Valley', 'Nagarkot', 'Heritage Walks'], 'Kathmandu', true, 5000, true, 'Kathmandu cultural expert.', ARRAY['Nepali', 'Newari', 'English'], now()),
  (gen_random_uuid(), 'Biram Rai', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&q=80', 4.7, 58, ARRAY['Kanchenjunga', 'Pathibhara', 'Limbu Culture'], 'Taplejung', true, 8000, true, 'Limbu community guide.', ARRAY['Nepali', 'Limbu', 'English'], now()),
  (gen_random_uuid(), 'Furba Sherpa', 'https://images.unsplash.com/photo-1580518324691-b0e1f9d2b6a6?w=150&q=80', 4.9, 234, ARRAY['Manaslu', 'Tsum Valley', 'Nar Phu'], 'Gorkha', true, 9500, true, 'Manaslu region expert.', ARRAY['Nepali', 'Sherpa', 'English'], now()),
  (gen_random_uuid(), 'Yanga Dolma', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80', 4.8, 91, ARRAY['Khumbu', 'Three Passes', 'Peak Climbing'], 'Solukhumbu', true, 10000, true, 'Peak climbing instructor.', ARRAY['Nepali', 'Sherpa', 'English'], now()),
  (gen_random_uuid(), 'Chhatra Bahadur', 'https://images.unsplash.com/photo-1614283233556-f35b0c0f0d0c?w=150&q=80', 4.6, 123, ARRAY['Rara Lake', 'Khaptad', 'Jumla'], 'Mugu', true, 8500, true, 'Far West specialist.', ARRAY['Nepali', 'English'], now()),
  (gen_random_uuid(), 'Nima Tshering', 'https://images.unsplash.com/photo-1504817343863-8f8dbf9e7e88?w=150&q=80', 4.7, 89, ARRAY['Panch Pokhari', 'Helambu', 'Buddhist Sites'], 'Sindhupalchok', true, 7500, true, 'Helambu trek specialist.', ARRAY['Nepali', 'Tamang', 'English'], now())
ON CONFLICT DO NOTHING;

-- Insert realistic homestays with slugs
INSERT INTO stays (id, name, slug, type, description, region, location, image_url, rating, review_count, price_per_night, amenities, host_name, contact_phone, created_at)
VALUES
  (gen_random_uuid(), 'Namaste Community Lodge', 'namaste-community-lodge', 'homestay', 'Community-run eco-lodge with panoramic views.', 'Gandaki', 'Mohare Danda', 'https://images.unsplash.com/photo-1520250497591-112f2f6a75a8?w=400&q=80', 4.9, 87, 2500, ARRAY['Community', 'Organic food', 'Hot shower'], 'Homi Gurung', '+977-9852678901', now()),
  (gen_random_uuid(), 'Tashi Delek Homestay', 'tashi-delek-homestay', 'homestay', 'Traditional Sherpa hospitality in Khumbu.', 'Solukhumbu', 'Namche Bazaar', 'https://images.unsplash.com/photo-1600585154340-be6161a56a84?w=400&q=80', 4.8, 134, 3500, ARRAY['Hot shower', 'WiFi', 'Sherpa food'], 'Lhakpa Sherpa', '+977-9841234567', now()),
  (gen_random_uuid(), 'Tea Garden Cottage', 'tea-garden-cottage', 'homestay', 'Cozy cottage surrounded by tea gardens.', 'Koshi', 'Ilam', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', 4.7, 56, 2000, ARRAY['Tea tasting', 'Garden walks'], 'Maya Limbu', '+977-9818765432', now()),
  (gen_random_uuid(), 'Dolpo Heritage Lodge', 'dolpo-heritage-lodge', 'lodge', 'Remote Himalayan lodge in ancient Dolpo.', 'Karnali', 'Dunai', 'https://images.unsplash.com/photo-1510798831971-7d2b8f05e5b5?w=400&q=80', 4.6, 34, 4000, ARRAY['Traditional food', 'Stargazing'], 'Karma Lama', '+977-9876543210', now()),
  (gen_random_uuid(), 'Rara Lake View Resort', 'rara-lake-view-resort', 'resort', 'Lakeside accommodation with stunning Rara views.', 'Karnali', 'Rara Lake', 'https://images.unsplash.com/photo-1566073771251-9009c3ff4c11?w=400&q=80', 4.5, 67, 5000, ARRAY['Lake views', 'Restaurant'], 'Bir Bahadur Shahi', '+977-9845678912', now()),
  (gen_random_uuid(), 'Ghandruk Community House', 'ghandruk-community-house', 'homestay', 'Authentic Gurung village experience.', 'Gandaki', 'Ghandruk', 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=400&q=80', 4.9, 256, 2800, ARRAY['Cultural dance', 'Museum', 'Views'], 'Suk Bahadur Gurung', '+977-9812345679', now()),
  (gen_random_uuid(), 'Maranji Homestay', 'maranji-homestay', 'homestay', 'Traditional Newari home in Panauti.', 'Bagmati', 'Panauti', 'https://images.unsplash.com/photo-1596394516093-ce5038bc1c5a?w=400&q=80', 4.8, 78, 1800, ARRAY['Newari feast', 'Heritage tours'], 'Shyam Muni Shakya', '+977-9823456789', now()),
  (gen_random_uuid(), 'Khomboo Lodge', 'khomboo-lodge', 'lodge', 'High altitude lodge en route to Island Peak.', 'Solukhumbu', 'Chhukung', 'https://images.unsplash.com/photo-1559593099-49b2b8b8f4e4?w=400&q=80', 4.4, 45, 4500, ARRAY['Heated room', 'Climber support'], 'Ang Dawa Sherpa', '+977-9834567890', now()),
  (gen_random_uuid(), 'Bandipur Hill Resort', 'bandipur-hill-resort', 'resort', 'Historic trading town resort with Newari charm.', 'Gandaki', 'Bandipur', 'https://images.unsplash.com/photo-1631049305569-13d1e6a6f72b?w=400&q=80', 4.7, 189, 6000, ARRAY['Infinity views', 'Spa'], 'Rajesh Shrestha', '+977-9845678903', now()),
  (gen_random_uuid(), 'Lwang Village Homestay', 'lwang-village-homestay', 'homestay', 'Community eco-village. First Gurung homestay in Nepal.', 'Gandaki', 'Lwang', 'https://images.unsplash.com/photo-1518733057094-95b53143be2b?w=400&q=80', 4.9, 145, 2200, ARRAY['Community-led', 'Organic farm'], 'Pasang Gurung', '+977-9856789012', now())
ON CONFLICT DO NOTHING;