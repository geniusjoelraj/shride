-- ==========================================
-- Migration: Add Recurring Rides & Distance-Based Pricing
-- Run this in Supabase SQL Editor
-- ==========================================

-- Add recurring ride columns
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_days INTEGER[] DEFAULT NULL;
-- recurring_days stores weekday numbers: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

-- Add distance column for price calculation
ALTER TABLE rides ADD COLUMN IF NOT EXISTS distance_meters INTEGER NOT NULL DEFAULT 0;

-- Add base price (the generated price before driver adjustment)
ALTER TABLE rides ADD COLUMN IF NOT EXISTS base_price NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Index for recurring rides lookup
CREATE INDEX IF NOT EXISTS idx_rides_recurring ON rides(is_recurring) WHERE is_recurring = TRUE;
