-- supabase/migrations/01_core_schema.sql

-- Create a table for public profiles
CREATE TABLE agencies (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  billing_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for agencies
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies are viewable by everyone." ON agencies
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own agencies." ON agencies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); -- Further checks might be needed for roles

CREATE POLICY "Users can update their own agencies." ON agencies
  FOR UPDATE USING (auth.uid() IS NOT NULL); -- Further checks for agency ownership/admin

-- Add to supabase/migrations/01_core_schema.sql

-- Create a table for public user profiles
CREATE TABLE users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('individual', 'company')), -- Enum like constraint
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  name TEXT,
  phone TEXT,
  profile_picture TEXT, -- URL to Supabase Storage
  settings JSONB, -- store preferences like language, dark mode, notifications
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to copy new users from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role) -- Default role, can be updated post-signup
  VALUES (new.id, new.email, 'individual');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function upon new user creation in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User profiles are viewable by authenticated users." ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile." ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON users
  FOR UPDATE USING (auth.uid() = id);

-- Add to supabase/migrations/01_core_schema.sql

-- Enum types for properties
CREATE TYPE property_purpose AS ENUM ('rent', 'sale');
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'commercial');
CREATE TYPE property_status AS ENUM ('active', 'pending', 'sold', 'rented');

CREATE TABLE properties (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  city TEXT,
  district TEXT,
  street TEXT,
  house_number TEXT,
  heating_type TEXT,
  floor_number INTEGER,
  num_rooms INTEGER,
  area_m2 FLOAT,
  price FLOAT,
  purpose property_purpose,
  type property_type,
  description TEXT,
  invoices JSONB, -- store owner/renter invoice records
  comments JSONB, -- store user comments
  images TEXT[], -- Array of URLs to Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status property_status DEFAULT 'pending',
  -- Search Optimization
  fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(city, '') || ' ' || coalesce(district, '') || ' ' || coalesce(street, '') || ' ' || coalesce(description, ''))
  ) STORED
);

-- Create an index for the FTS column
CREATE INDEX properties_fts_idx ON properties USING GIN (fts);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_properties_timestamp
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS policies for properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Properties are viewable by everyone." ON properties
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert properties." ON properties
  FOR INSERT TO authenticated WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Brokers can update their own properties." ON properties
  FOR UPDATE TO authenticated USING (broker_id = auth.uid()) WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Brokers can delete their own properties." ON properties
  FOR DELETE TO authenticated USING (broker_id = auth.uid());

-- Add to supabase/migrations/01_core_schema.sql
-- Create a bucket for property images if it doesn't exist
-- You might need to run this part manually in the Supabase dashboard or ensure the bucket 'property_images' exists.
-- Example: INSERT INTO storage.buckets (id, name, public) VALUES ('property_images', 'property_images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Allow public read access to 'property_images' bucket
CREATE POLICY "Property images are publicly viewable."
ON storage.objects FOR SELECT
USING ( bucket_id = 'property_images' );

-- Storage RLS: Allow authenticated users to upload to 'property_images' bucket
-- Users can only upload to a folder named after their user_id
CREATE POLICY "Authenticated users can upload property images."
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'property_images' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Storage RLS: Allow users to update their own images
CREATE POLICY "Users can update their own property images."
ON storage.objects FOR UPDATE TO authenticated
USING ( bucket_id = 'property_images' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Storage RLS: Allow users to delete their own images
CREATE POLICY "Users can delete their own property images."
ON storage.objects FOR DELETE TO authenticated
USING ( bucket_id = 'property_images' AND (storage.foldername(name))[1] = auth.uid()::text );
