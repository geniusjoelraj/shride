-- ==========================================
-- Shride Database Schema
-- Run this in Supabase SQL Editor
-- ==========================================

-- Enable UUID extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================
-- ENUM TYPES
-- ==========================================

CREATE TYPE gender_preference AS ENUM ('anyone', 'female_only');
CREATE TYPE ride_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE passenger_status AS ENUM ('requested', 'accepted', 'rejected');

-- ==========================================
-- PROFILES TABLE
-- ==========================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  preferences JSONB NOT NULL DEFAULT '{"music": false, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- RIDES TABLE
-- ==========================================

CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_lat DOUBLE PRECISION NOT NULL,
  source_lng DOUBLE PRECISION NOT NULL,
  dest_name TEXT NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats >= 0 AND available_seats <= 8),
  price_per_seat NUMERIC(10,2) NOT NULL DEFAULT 0,
  gender_preference gender_preference NOT NULL DEFAULT 'anyone',
  preferences JSONB NOT NULL DEFAULT '{"music": false, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": true}'::jsonb,
  vehicle_model TEXT NOT NULL DEFAULT '',
  vehicle_plate TEXT NOT NULL DEFAULT '',
  vehicle_color TEXT NOT NULL DEFAULT '',
  status ride_status NOT NULL DEFAULT 'open',
  route_geom GEOMETRY(LineString, 4326),
  estimated_duration INTEGER NOT NULL DEFAULT 0,
  distance_meters INTEGER NOT NULL DEFAULT 0,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_days INTEGER[] DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rides_route_geom ON rides USING GIST (route_geom);

CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_departure ON rides(departure_time);
CREATE INDEX idx_rides_status ON rides(status);

-- ==========================================
-- RIDE PASSENGERS TABLE
-- ==========================================

CREATE TABLE ride_passengers (
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status passenger_status NOT NULL DEFAULT 'requested',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ride_id, passenger_id)
);

CREATE INDEX idx_ride_passengers_passenger ON ride_passengers(passenger_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_passengers ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, but only update their own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Rides: everyone can read open rides, only driver can update/delete
CREATE POLICY "Open rides are viewable by everyone"
  ON rides FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rides"
  ON rides FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own rides"
  ON rides FOR UPDATE
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete own rides"
  ON rides FOR DELETE
  USING (auth.uid() = driver_id);

-- Ride Passengers: viewable by driver and passenger, insertable by authenticated users
CREATE POLICY "Ride participants can view passengers"
  ON ride_passengers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can request to join"
  ON ride_passengers FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Participants can update own status"
  ON ride_passengers FOR UPDATE
  USING (
    auth.uid() = passenger_id
    OR auth.uid() IN (SELECT driver_id FROM rides WHERE id = ride_id)
  );

CREATE POLICY "Passengers can leave rides"
  ON ride_passengers FOR DELETE
  USING (auth.uid() = passenger_id);

-- ==========================================
-- RPC FUNCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION public.find_compatible_rides(
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  max_distance_meters FLOAT DEFAULT 500
)
RETURNS SETOF public.rides AS $$
DECLARE
  pickup_point GEOMETRY;
  dropoff_point GEOMETRY;
BEGIN
  pickup_point := ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326);
  dropoff_point := ST_SetSRID(ST_MakePoint(dropoff_lng, dropoff_lat), 4326);

  RETURN QUERY
  SELECT r.*
  FROM public.rides r
  WHERE r.status = 'open'
  AND r.available_seats > 0
  AND r.departure_time >= NOW()
  AND r.route_geom IS NOT NULL
  AND ST_DWithin(r.route_geom::geography, pickup_point::geography, max_distance_meters)
  AND ST_DWithin(r.route_geom::geography, dropoff_point::geography, max_distance_meters)
  AND ST_LineLocatePoint(r.route_geom, pickup_point) <= ST_LineLocatePoint(r.route_geom, dropoff_point);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
