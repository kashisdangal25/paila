/*
# Fix ALL Images to Nature/Culture/Hiking Only

This migration replaces ALL inappropriate images with Nepal-specific images showing:
- MOUNTAINS and HIMALAYAS
- TREKKERS and HIKERS on trails
- LAKES with mountain reflections
- WILDLIFE in natural habitat
- CULTURAL sites (temples, stupas)
- PEOPLE EXPLORING nature

NO food, cars, hotels, urban buildings, or generic stock photos.
*/

-- Update ALL destination images to proper Nepal nature/culture images
UPDATE destinations SET image_url = 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE category IN ('Trekking', 'Hiking', 'Adventure', 'Nature');
UPDATE destinations SET image_url = 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE category IN ('Lakes', 'Lake');
UPDATE destinations SET image_url = 'https://images.pexels.com/photos/162240/rhino-pexels-photo-162240.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE category IN ('Wildlife');
UPDATE destinations SET image_url = 'https://images.pexels.com/photos/161853/nepal-kathmandu-boudhanath-buddhism-161853.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE category IN ('Cultural', 'Heritage', 'Pilgrimage');
UPDATE destinations SET image_url = 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE category IN ('Adventure');
UPDATE destinations SET image_url = 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE category IN ('City', 'Trekking', 'Hiking') AND image_url IS NULL;

-- Update all hidden gems images to nature views
UPDATE hidden_gems SET image_url = 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800';

-- Update all guide avatars to show people (appropriate for guides)
UPDATE guides SET avatar_url = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200' WHERE name LIKE '%Sherpa%';
UPDATE guides SET avatar_url = 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200' WHERE name LIKE '%Tamang%' OR name LIKE '%Bhote%';
UPDATE guides SET avatar_url = 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200' WHERE name LIKE '%Lama%' OR name LIKE '%Gurung%';
UPDATE guides SET avatar_url = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200' WHERE avatar_url IS NULL OR avatar_url = '';

-- Update all stays images to show nature views (NOT hotel rooms/beds)
UPDATE stays SET image_url = 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE type IN ('Homestay', 'Lodge', 'Cottage');
UPDATE stays SET image_url = 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE type IN ('Hotel', 'Hostel');
UPDATE stays SET image_url = 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE image_url IS NULL OR image_url = '';

-- Update user_stories images to nature
UPDATE user_stories SET images = ARRAY['https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800'] WHERE images IS NULL OR array_length(images, 1) = 0;

-- Update user_events images to nature
UPDATE user_events SET images = ARRAY['https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800'] WHERE images IS NULL OR array_length(images, 1) = 0;