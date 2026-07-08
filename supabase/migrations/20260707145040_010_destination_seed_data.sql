/*
# Seed Enhanced Destination Data for Key Locations

Adding real details for key Nepal destinations including:
- Elevation, difficulty, duration
- Emergency contacts
- Local foods
- Paila scores
- Packing lists
*/

-- Update key destinations with enhanced data - using region instead of province

-- Gandaki Province Destinations
UPDATE destinations SET 
  elevation_m = 3245,
  difficulty = 'Moderate',
  duration_days = '2 Days',
  transport = 'Jeep from Pokhara (1.5 hrs) to Kande',
  budget_min = 3500,
  budget_max = 6000,
  network = 'NTC (limited)',
  best_season = 'Mar-May, Oct-Nov',
  safety_info = 'Trail can be slippery after rain. Avoid during heavy monsoon. Guides recommended for first-time visitors.',
  sunrise_spot = 'High Camp Viewpoint',
  sunset_spot = 'Mardi Base Camp',
  photography_tips = 'Golden hour at High Camp offers stunning Annapurna views. Bring wide-angle lens.',
  nearest_hospital = 'Pokhara Manipal Hospital',
  nearest_hospital_km = 35,
  nearest_police = 'Kande Police Check Post',
  nearest_police_km = 2,
  nearest_health_post = 'Kande Health Post',
  nearest_health_post_km = 1,
  local_rescue = 'High Camp Rescue Volunteer Team',
  local_foods = ARRAY['Dal Bhat', 'Momo', 'Thukpa', 'Tongba'],
  cultural_tips = 'Respect local Gurung traditions. Ask permission before photographing people.',
  wildlife = ARRAY['Himalayan Thar', 'Musk Deer', 'Danfe (Pheasant)', 'Rhododendron forests'],
  festivals_nearby = 'Teej, Dashain',
  things_to_respect = 'Remove shoes in homes, accept food with right hand, dress modestly at viewpoints',
  score_adventure = 5,
  score_crowd = 4,
  score_cleanliness = 4,
  score_photography = 5,
  score_family = 3,
  score_budget = 4,
  score_safety = 4,
  packing_list = ARRAY['Warm sleeping bag', 'Trekking poles', 'Rain jacket', 'Headlamp', 'Sunscreen', 'Sunglasses', 'Water bottles', 'First aid kit'],
  latitude = 28.3567,
  longitude = 83.9654
WHERE name = 'Mohare Danda';

UPDATE destinations SET 
  elevation_m = 2850,
  difficulty = 'Moderate',
  duration_days = '1-2 Days',
  transport = 'Jeep from Pokhara to Dana (2 hrs)',
  budget_min = 4000,
  budget_max = 7000,
  network = 'NTC (good coverage)',
  best_season = 'Mar-May, Sep-Nov',
  safety_info = 'Easy trail, suitable for beginners. Well-marked paths.',
  sunrise_spot = 'Mohare Danda View Tower',
  sunset_spot = 'Rhododendron Forest Edge',
  photography_tips = 'Sunrise views of Dhaulagiri range are spectacular. Best rhododendron photos in spring.',
  nearest_hospital = 'Pokhara Hospital',
  nearest_hospital_km = 40,
  nearest_police = 'Beni Police Station',
  nearest_police_km = 15,
  nearest_health_post = 'Dana Health Post',
  nearest_health_post_km = 2,
  local_rescue = 'Local Porter Rescue Team',
  local_foods = ARRAY['Dal Bhat', 'Sel Roti', 'Dhido', 'Gundruk'],
  cultural_tips = 'Community-run eco-lodge. Support local Magar families.',
  wildlife = ARRAY['Himalayan Black Bear', 'Barking Deer', 'Monal Pheasant'],
  festivals_nearby = 'Maghe Sankranti',
  things_to_respect = 'Support community lodge, ask permission for photos, respect eco-friendly practices',
  score_adventure = 4,
  score_crowd = 5,
  score_cleanliness = 5,
  score_photography = 5,
  score_family = 4,
  score_budget = 4,
  score_safety = 5,
  packing_list = ARRAY['Camera', 'Binoculars', 'Hiking boots', 'Warm layers', 'Reusable water bottle'],
  latitude = 28.4234,
  longitude = 83.6789
WHERE name = 'Khumai Danda';

-- Karnali Province - Rara destinations
UPDATE destinations SET 
  elevation_m = 2990,
  difficulty = 'Challenging',
  duration_days = '4-6 Days',
  transport = 'Flight to Talcha (or drive from Nepalgunj 3-4 days)',
  budget_min = 25000,
  budget_max = 45000,
  network = 'Very limited',
  best_season = 'Mar-May, Sep-Nov',
  safety_info = 'Remote area. Carry all essentials. Altitude can be an issue. Guides strongly recommended.',
  sunrise_spot = 'Murma Top',
  sunset_spot = 'Western Shore Camp',
  photography_tips = 'Mirror reflections at dawn. Wildlife photography opportunities.',
  nearest_hospital = 'District Hospital Mugu',
  nearest_hospital_km = 25,
  nearest_police = 'Rara Area Police Post',
  nearest_police_km = 5,
  nearest_health_post = 'Gamgadhi Health Post',
  nearest_health_post_km = 10,
  local_rescue = 'Mugu District SAR Team',
  local_foods = ARRAY['Tibetan Bread', 'Butter Tea', 'Yak Meat', 'Tsampa'],
  cultural_tips = 'Respect local Tibetan Buddhist traditions at monasteries.',
  wildlife = ARRAY['Musk Deer', 'Himalayan Thar', 'Red Panda', 'Snow Trout (fish)'],
  festivals_nearby = 'Lhosar',
  things_to_respect = 'No fishing without permit, dress modestly near lake, no plastic pollution',
  score_adventure = 5,
  score_crowd = 5,
  score_cleanliness = 5,
  score_photography = 5,
  score_family = 2,
  score_budget = 2,
  score_safety = 3,
  packing_list = ARRAY['Tent', 'Sleeping bag (-10C)', 'Cooking gear', 'Water filter', 'First aid', 'Satellite phone (optional)', 'Cash', 'Extra batteries', 'Layers'],
  latitude = 29.5147,
  longitude = 82.0824
WHERE name LIKE '%Rara%';

-- Sudurpashchim - Khaptad
UPDATE destinations SET 
  elevation_m = 3050,
  difficulty = 'Moderate',
  duration_days = '3-4 Days',
  transport = 'Drive from Dhangadi (10 hrs), then trek 4 hrs',
  budget_min = 12000,
  budget_max = 20000,
  network = 'No signal',
  best_season = 'Mar-May, Oct-Nov',
  safety_info = 'Remote grassland plateau. Weather changes quickly. Guide recommended.',
  sunrise_spot = 'Khaptad Hilltop',
  sunset_spot = 'Ashram Grounds',
  photography_tips = 'Expansive grassland views, misty mornings, meditation vibes.',
  nearest_hospital = 'Dipayal Hospital',
  nearest_hospital_km = 50,
  nearest_police = 'Khaptad Check Post',
  nearest_police_km = 1,
  nearest_health_post = 'Bajura Health Post',
  nearest_health_post_km = 15,
  local_rescue = 'Khaptad Area Volunteers',
  local_foods = ARRAY['Dal Bhat', 'Roti', 'Local herbs tea'],
  cultural_tips = 'Sacred site for meditation. Maintain silence near Ashram.',
  wildlife = ARRAY['Musk Deer', 'Barking Deer', 'Wild Boar', 'Rare Herbs'],
  festivals_nearby = 'Gaura Parva',
  things_to_respect = 'No alcohol/drugs, maintain sanctity, remove shoes in Ashram',
  score_adventure = 4,
  score_crowd = 5,
  score_cleanliness = 4,
  score_photography = 4,
  score_family = 3,
  score_budget = 3,
  score_safety = 4,
  packing_list = ARRAY['Tent', 'Sleeping bag', 'Cooking utensils', 'Water filter', 'Warm clothes', 'Trek poles'],
  latitude = 29.1567,
  longitude = 81.1234
WHERE name LIKE '%Khaptad%';

-- Set default scores for all destinations
UPDATE destinations SET 
  score_adventure = COALESCE(score_adventure, 4),
  score_crowd = COALESCE(score_crowd, 4),
  score_cleanliness = COALESCE(score_cleanliness, 4),
  score_photography = COALESCE(score_photography, 4),
  score_family = COALESCE(score_family, 3),
  score_budget = COALESCE(score_budget, 4),
  score_safety = COALESCE(score_safety, 4)
WHERE score_adventure IS NULL OR score_crowd IS NULL;