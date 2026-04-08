-- ==========================================
-- Ride Reviews & Rating System
-- Run this in Supabase SQL Editor
-- ==========================================

-- Reviews table: one review per passenger per ride
CREATE TABLE ride_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ride_id, reviewer_id)
);

CREATE INDEX idx_ride_reviews_driver ON ride_reviews(driver_id);
CREATE INDEX idx_ride_reviews_ride ON ride_reviews(ride_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE ride_reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON ride_reviews FOR SELECT
  USING (true);

-- Only authenticated passengers can create reviews
CREATE POLICY "Passengers can create reviews"
  ON ride_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- ==========================================
-- Auto-update driver rating on new review
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_driver_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC(3,2);
  count_ratings INTEGER;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)
  INTO avg_rating, count_ratings
  FROM ride_reviews
  WHERE driver_id = NEW.driver_id;

  UPDATE profiles
  SET rating = avg_rating,
      total_ratings = count_ratings
  WHERE id = NEW.driver_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_created
  AFTER INSERT ON ride_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_driver_rating();
