-- ==========================================
-- Shride Route Intercept Matching Migration
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add route geometry and estimated duration to rides table
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS route_geom GEOMETRY(LineString, 4326),
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 0;

-- 3. Create spatial index for fast distance calculations
CREATE INDEX IF NOT EXISTS idx_rides_route_geom ON rides USING GIST (route_geom);

-- 4. Create RPC function to find compatible candidate rides using spatial pre-filtering
-- This uses ST_DWithin for the 500m "corridor" around the driver's route,
-- and ST_LineLocatePoint to ensure the pickup happens before the dropoff.
CREATE OR REPLACE FUNCTION find_compatible_rides(
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  max_distance_meters FLOAT DEFAULT 500
)
RETURNS SETOF rides AS $$
DECLARE
  pickup_point GEOMETRY;
  dropoff_point GEOMETRY;
BEGIN
  -- Create points from lat/lng
  pickup_point := ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326);
  dropoff_point := ST_SetSRID(ST_MakePoint(dropoff_lng, dropoff_lat), 4326);

  RETURN QUERY
  SELECT r.*
  FROM rides r
  WHERE r.status = 'open'
  AND r.available_seats > 0
  AND r.departure_time >= NOW()
  AND r.route_geom IS NOT NULL
  -- Exclude driver's own rides if authenticated (handled in app side with .neq() usually, 
  -- but we can't easily access auth.uid() here if it's called via RPC anonymously without RLS,
  -- but RLS is enabled so it's fine to leave it out or handle on client)
  
  -- Spatial Filter: Driver's route passes within max_distance_meters of BOTH pickup and dropoff
  -- ST_DWithin with geography type uses exact distance in meters
  AND ST_DWithin(r.route_geom::geography, pickup_point::geography, max_distance_meters)
  AND ST_DWithin(r.route_geom::geography, dropoff_point::geography, max_distance_meters)
  
  -- Directionality Check: Pickup must occur BEFORE dropoff on the line string trajectory
  AND ST_LineLocatePoint(r.route_geom, pickup_point) <= ST_LineLocatePoint(r.route_geom, dropoff_point);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
