-- Auto-create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, user_type, phone, vendor_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'traveler'),
    NEW.raw_user_meta_data->>'phone',
    CASE 
      WHEN NEW.raw_user_meta_data->>'user_type' = 'vendor' THEN 'approved'
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    user_type = COALESCE(EXCLUDED.user_type, profiles.user_type);
  
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

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policy to allow the trigger to work
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile (including during signup when auth.uid() might be delayed)
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Ensure policy allows updates
DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Select policy
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (auth.uid() = id);