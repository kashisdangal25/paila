/*
# Update profile auto-creation to populate new fields

## Summary
Updates the `handle_new_user()` trigger function so that when a new user signs
up, the new profile fields (username, country, nationality, preferred_language)
are populated from the sign-up metadata (`raw_user_meta_data`). The trigger
runs as SECURITY DEFINER so it bypasses RLS; the insert policy was already
tightened in migration 029 to require `auth.uid() = id`.

## Changes
1. Recreate `handle_new_user()` to insert the additional fields from
   `raw_user_meta_data` (username, country_of_residence, nationality,
   preferred_language). Uses COALESCE so existing values are preserved on
   conflict.
2. The trigger `on_auth_user_created` is dropped and recreated to bind to the
   updated function.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, name, email, user_type, phone, vendor_status,
    username, country_of_residence, nationality, preferred_language
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'traveler'),
    NEW.raw_user_meta_data->>'phone',
    CASE 
      WHEN NEW.raw_user_meta_data->>'user_type' = 'vendor' THEN 'approved'
      ELSE NULL
    END,
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.raw_user_meta_data->>'nationality', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''), 'en')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    user_type = COALESCE(EXCLUDED.user_type, profiles.user_type),
    username = COALESCE(EXCLUDED.username, profiles.username),
    country_of_residence = COALESCE(EXCLUDED.country_of_residence, profiles.country_of_residence),
    nationality = COALESCE(EXCLUDED.nationality, profiles.nationality),
    preferred_language = COALESCE(EXCLUDED.preferred_language, profiles.preferred_language);
  
  -- If user is a vendor, create vendor record
  IF NEW.raw_user_meta_data->>'user_type' = 'vendor' THEN
    INSERT INTO public.vendors (user_id, business_name, business_type, location, description, email, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'My Business') || '''s Business',
      'other',
      'Nepal',
      'Please complete your business profile',
      NEW.email,
      'approved'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();