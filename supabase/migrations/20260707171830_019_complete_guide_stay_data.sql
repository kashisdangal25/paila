/*
# Complete remaining guide and stay data
*/

-- Update guides missing region
UPDATE guides SET 
  region = CASE 
    WHEN specialties @> ARRAY['Everest'] OR specialties @> ARRAY['Everest Base Camp'] THEN 'Solukhumbu'
    WHEN specialties @> ARRAY['Annapurna'] OR specialties @> ARRAY['Ghorepani'] THEN 'Kaski'
    WHEN specialties @> ARRAY['Langtang'] OR specialties @> ARRAY['Helambu'] THEN 'Rasuwa'
    WHEN specialties @> ARRAY['Dolpo'] OR specialties @> ARRAY['Shey Phoksundo'] THEN 'Dolpa'
    WHEN specialties @> ARRAY['Mustang'] THEN 'Mustang'
    WHEN specialties @> ARRAY['Manaslu'] THEN 'Gorkha'
    ELSE 'Kathmandu'
  END
WHERE region IS NULL;

-- Update guides missing bio
UPDATE guides SET 
  bio = 'Experienced local guide with deep knowledge of the region. Passionate about sharing Nepal beauty with travelers.'
WHERE bio IS NULL;

-- Update stays missing host info
UPDATE stays SET 
  host_name = CASE 
    WHEN type = 'homestay' THEN 'Local Family Host'
    WHEN type = 'lodge' THEN 'Lodge Manager'
    ELSE 'Property Owner'
  END,
  contact_phone = '+977-98XXXXXXXX',
  description = COALESCE(description, 
    CASE 
      WHEN type = 'homestay' THEN 'Traditional homestay with authentic local hospitality and home-cooked meals.'
      WHEN type = 'lodge' THEN 'Mountain lodge with basic amenities and stunning views.'
      ELSE 'Comfortable accommodation with modern facilities.'
    END
  )
WHERE host_name IS NULL;

-- Add missing amenities to stays
UPDATE stays SET 
  amenities = ARRAY['Hot shower', 'WiFi', 'Meals available']
WHERE amenities IS NULL;