/*
# Complete Remaining Destination Fields

Adding safety_info, packing_list, photography_tips, sunrise_spot to all destinations
*/

-- Set default safety information based on difficulty
UPDATE destinations SET 
  safety_info = CASE 
    WHEN difficulty = 'Challenging' THEN 'High altitude remote area. Guide mandatory. Carry altitude medication, first aid kit, and satellite communication. Weather can change rapidly.'
    WHEN difficulty = 'Moderate' THEN 'Moderate terrain. Stay on marked trails. Carry basic first aid and sufficient water. Inform someone of your route.'
    ELSE 'Easy access area. Suitable for families. Standard safety precautions. Carry water and sun protection.'
  END,
  sunrise_spot = COALESCE(sunrise_spot, 
    CASE 
      WHEN category = 'Lake' THEN 'Lake viewpoint'
      WHEN category = 'Trekking' THEN 'Nearby viewpoint'
      WHEN category = 'Nature' THEN 'Hill clearing'
      ELSE 'Best viewpoint'
    END
  ),
  sunset_spot = COALESCE(sunset_spot,
    CASE 
      WHEN category = 'Lake' THEN 'Western shore'
      WHEN category = 'Trekking' THEN 'High camp'
      ELSE 'Valley view'
    END
  ),
  photography_tips = COALESCE(photography_tips,
    CASE 
      WHEN category = 'Lake' THEN 'Best light is early morning for reflections. Bring polarizing filter.'
      WHEN category = 'Trekking' THEN 'Golden hour provides dramatic mountain light. Wide angle lens recommended.'
      WHEN category = 'Wildlife' THEN 'Early morning best for sightings. Bring telephoto lens and binoculars.'
      WHEN category = 'Cultural' THEN 'Respect local customs. Ask before photographing people. Early morning light best.'
      ELSE 'Capture during golden hour for best results.'
    END
  ),
  packing_list = COALESCE(packing_list,
    CASE 
      WHEN difficulty = 'Challenging' THEN ARRAY['Tent', 'Sleeping bag (-20C)', 'Trek poles', 'Water filter', 'First aid kit', 'Sun protection', 'Warm layers', 'Altitude meds', 'Headlamp', 'Backup batteries']
      WHEN difficulty = 'Moderate' THEN ARRAY['Backpack', 'Water bottle', 'Trek poles', 'First aid', 'Sun hat', 'Warm layer', 'Snacks', 'Camera']
      ELSE ARRAY['Water bottle', 'Sunscreen', 'Comfortable shoes', 'Camera', 'Light snack']
    END
  )
WHERE safety_info IS NULL OR packing_list IS NULL;

-- Update destinations missing elevation/budget (12 remaining)
UPDATE destinations SET 
  elevation_m = 
    CASE 
      WHEN elevation_m IS NULL AND region LIKE '%Koshi%' AND category = 'Lake' THEN 2800
      WHEN elevation_m IS NULL AND region LIKE '%Koshi%' AND category = 'Trekking' THEN 3500
      WHEN elevation_m IS NULL AND region LIKE '%Koshi%' THEN 1500
      WHEN elevation_m IS NULL AND region LIKE '%Madhesh%' THEN 150
      WHEN elevation_m IS NULL AND region LIKE '%Bagmati%' AND category = 'Hiking' THEN 2000
      WHEN elevation_m IS NULL AND region LIKE '%Bagmati%' THEN 1400
      WHEN elevation_m IS NULL AND region LIKE '%Gandaki%' AND category = 'Trekking' THEN 3200
      WHEN elevation_m IS NULL AND region LIKE '%Gandaki%' THEN 1200
      WHEN elevation_m IS NULL AND region LIKE '%Lumbini%' THEN 450
      WHEN elevation_m IS NULL AND region LIKE '%Karnali%' AND category = 'Lake' THEN 2990
      WHEN elevation_m IS NULL AND region LIKE '%Karnali%' THEN 2500
      WHEN elevation_m IS NULL AND region LIKE '%Sudurpashchim%' THEN 1800
      ELSE 1500
    END,
  budget_min = 
    CASE 
      WHEN budget_min IS NULL AND difficulty = 'Challenging' THEN 30000
      WHEN budget_min IS NULL AND difficulty = 'Moderate' THEN 15000
      WHEN budget_min IS NULL THEN 3000
    END,
  budget_max = 
    CASE 
      WHEN budget_max IS NULL AND difficulty = 'Challenging' THEN 50000
      WHEN budget_max IS NULL AND difficulty = 'Moderate' THEN 25000
      WHEN budget_max IS NULL THEN 6000
    END,
  best_season = COALESCE(best_season, 'Oct-Nov, Mar-May'),
  network = COALESCE(network, 
    CASE 
      WHEN difficulty = 'Challenging' THEN 'None/Satellite'
      WHEN difficulty = 'Moderate' THEN 'NTC Limited'
      ELSE 'Good 4G'
    END
  ),
  nearest_hospital = COALESCE(nearest_hospital, 'District Hospital'),
  nearest_hospital_km = COALESCE(nearest_hospital_km, 
    CASE 
      WHEN difficulty = 'Challenging' THEN 60
      WHEN difficulty = 'Moderate' THEN 35
      ELSE 20
    END
  ),
  nearest_police = COALESCE(nearest_police, 'Local Police Post'),
  nearest_police_km = COALESCE(nearest_police_km, 
    CASE 
      WHEN difficulty = 'Challenging' THEN 40
      WHEN difficulty = 'Moderate' THEN 20
      ELSE 5
    END
  ),
  nearest_health_post = COALESCE(nearest_health_post, 'Local Health Post'),
  nearest_health_post_km = COALESCE(nearest_health_post_km, 
    CASE 
      WHEN difficulty = 'Challenging' THEN 20
      WHEN difficulty = 'Moderate' THEN 10
      ELSE 3
    END
  ),
  local_rescue = COALESCE(local_rescue, 
    CASE 
      WHEN difficulty = 'Challenging' THEN 'HRA Rescue Team'
      ELSE 'Local Volunteer Rescue'
    END
  ),
  transport = COALESCE(transport, 
    CASE 
      WHEN difficulty = 'Challenging' THEN 'Flight to nearest airport, then trek'
      WHEN difficulty = 'Moderate' THEN 'Drive from nearest city, then trek'
      ELSE 'Road access from nearest city'
    END
  ),
  duration_days = COALESCE(duration_days,
    CASE 
      WHEN difficulty = 'Challenging' THEN '7-10 Days'
      WHEN difficulty = 'Moderate' THEN '3-5 Days'
      ELSE '1-2 Days'
    END
  )
WHERE elevation_m IS NULL OR budget_min IS NULL;