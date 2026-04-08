-- Seed script: 10 mock drivers + 10 rides within Chennai
-- Run via: psql <connection_string> -f supabase/seed.sql

-- ── Create 10 mock users in auth.users ─────────────────────────────
-- Using gen_random_uuid() for UUIDs

DO $$
DECLARE
  u1 UUID := gen_random_uuid();
  u2 UUID := gen_random_uuid();
  u3 UUID := gen_random_uuid();
  u4 UUID := gen_random_uuid();
  u5 UUID := gen_random_uuid();
  u6 UUID := gen_random_uuid();
  u7 UUID := gen_random_uuid();
  u8 UUID := gen_random_uuid();
  u9 UUID := gen_random_uuid();
  u10 UUID := gen_random_uuid();
BEGIN

-- Insert mock users into auth.users
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_user_meta_data)
VALUES
  (u1,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'arun.kumar@shride.app',    crypt('Test@1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '{"full_name":"Arun Kumar"}'::jsonb),
  (u2,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya.sharma@shride.app',  crypt('Test@1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '{"full_name":"Priya Sharma"}'::jsonb),
  (u3,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'karthik.rajan@shride.app', crypt('Test@1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '{"full_name":"Karthik Rajan"}'::jsonb),
  (u4,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'deepa.lakshmi@shride.app', crypt('Test@1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '{"full_name":"Deepa Lakshmi"}'::jsonb),
  (u5,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vikram.sundar@shride.app', crypt('Test@1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '{"full_name":"Vikram Sundar"}'::jsonb),
  (u6,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'meera.iyer@shride.app',    crypt('Test@1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '{"full_name":"Meera Iyer"}'::jsonb),
  (u7,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rajesh.babu@shride.app',   crypt('Test@1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '{"full_name":"Rajesh Babu"}'::jsonb),
  (u8,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anitha.devi@shride.app',   crypt('Test@1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '{"full_name":"Anitha Devi"}'::jsonb),
  (u9,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'suresh.nair@shride.app',   crypt('Test@1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '{"full_name":"Suresh Nair"}'::jsonb),
  (u10, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kavitha.murali@shride.app',crypt('Test@1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '{"full_name":"Kavitha Murali"}'::jsonb);

-- Insert auth.identities (required by Supabase Auth)
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (u1,  u1,  u1::text, json_build_object('sub', u1::text, 'email', 'arun.kumar@shride.app')::jsonb,    'email', NOW(), NOW(), NOW()),
  (u2,  u2,  u2::text, json_build_object('sub', u2::text, 'email', 'priya.sharma@shride.app')::jsonb,  'email', NOW(), NOW(), NOW()),
  (u3,  u3,  u3::text, json_build_object('sub', u3::text, 'email', 'karthik.rajan@shride.app')::jsonb, 'email', NOW(), NOW(), NOW()),
  (u4,  u4,  u4::text, json_build_object('sub', u4::text, 'email', 'deepa.lakshmi@shride.app')::jsonb, 'email', NOW(), NOW(), NOW()),
  (u5,  u5,  u5::text, json_build_object('sub', u5::text, 'email', 'vikram.sundar@shride.app')::jsonb, 'email', NOW(), NOW(), NOW()),
  (u6,  u6,  u6::text, json_build_object('sub', u6::text, 'email', 'meera.iyer@shride.app')::jsonb,    'email', NOW(), NOW(), NOW()),
  (u7,  u7,  u7::text, json_build_object('sub', u7::text, 'email', 'rajesh.babu@shride.app')::jsonb,   'email', NOW(), NOW(), NOW()),
  (u8,  u8,  u8::text, json_build_object('sub', u8::text, 'email', 'anitha.devi@shride.app')::jsonb,   'email', NOW(), NOW(), NOW()),
  (u9,  u9,  u9::text, json_build_object('sub', u9::text, 'email', 'suresh.nair@shride.app')::jsonb,   'email', NOW(), NOW(), NOW()),
  (u10, u10, u10::text, json_build_object('sub', u10::text, 'email', 'kavitha.murali@shride.app')::jsonb,'email', NOW(), NOW(), NOW());

-- The trigger will auto-create profiles, but let's update them with richer data
UPDATE profiles SET
  full_name = 'Arun Kumar',
  bio = 'Hi! I''m Arun. I commute daily from Anna Nagar to Guindy. Love chatting during rides! 🚗',
  gender = 'male', rating = 4.5, total_ratings = 32, is_verified = true,
  preferences = '{"music": true, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": true}'::jsonb
WHERE id = u1;

UPDATE profiles SET
  full_name = 'Priya Sharma',
  bio = 'Software engineer at Sholinganallur. Prefer calm and quiet rides. 📚',
  gender = 'female', rating = 4.8, total_ratings = 45, is_verified = true,
  preferences = '{"music": false, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": true}'::jsonb
WHERE id = u2;

UPDATE profiles SET
  full_name = 'Karthik Rajan',
  bio = 'Part-time Uber driver, full-time foodie. Ask me about the best biryani in Chennai!',
  gender = 'male', rating = 4.2, total_ratings = 67, is_verified = true,
  preferences = '{"music": true, "no_smoking": false, "pets_ok": true, "ac": true, "luggage_ok": true}'::jsonb
WHERE id = u3;

UPDATE profiles SET
  full_name = 'Deepa Lakshmi',
  bio = 'Teacher at DAV school. Safe driver, 8 years experience. 🏫',
  gender = 'female', rating = 4.9, total_ratings = 28, is_verified = true,
  preferences = '{"music": true, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": false}'::jsonb
WHERE id = u4;

UPDATE profiles SET
  full_name = 'Vikram Sundar',
  bio = 'IT professional. Daily commuter on OMR. Chill vibes only. 🎧',
  gender = 'male', rating = 3.9, total_ratings = 15, is_verified = false,
  preferences = '{"music": true, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": true}'::jsonb
WHERE id = u5;

UPDATE profiles SET
  full_name = 'Meera Iyer',
  bio = 'Architect. Love exploring new routes around the city. 🏗️',
  gender = 'female', rating = 4.6, total_ratings = 38, is_verified = true,
  preferences = '{"music": true, "no_smoking": true, "pets_ok": true, "ac": true, "luggage_ok": true}'::jsonb
WHERE id = u6;

UPDATE profiles SET
  full_name = 'Rajesh Babu',
  bio = 'Bank employee. Punctual and reliable. Always on time! ⏰',
  gender = 'male', rating = 4.3, total_ratings = 22, is_verified = true,
  preferences = '{"music": false, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": true}'::jsonb
WHERE id = u7;

UPDATE profiles SET
  full_name = 'Anitha Devi',
  bio = 'Nurse at Apollo Hospital. Night shift commuter. 🏥',
  gender = 'female', rating = 4.7, total_ratings = 19, is_verified = false,
  preferences = '{"music": false, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": false}'::jsonb
WHERE id = u8;

UPDATE profiles SET
  full_name = 'Suresh Nair',
  bio = 'Startup founder. Believe in sustainable commuting. 🌿',
  gender = 'male', rating = 4.1, total_ratings = 41, is_verified = true,
  preferences = '{"music": true, "no_smoking": true, "pets_ok": true, "ac": false, "luggage_ok": true}'::jsonb
WHERE id = u9;

UPDATE profiles SET
  full_name = 'Kavitha Murali',
  bio = 'College student at Anna University. Budget rides preferred! 🎓',
  gender = 'female', rating = 4.4, total_ratings = 11, is_verified = false,
  preferences = '{"music": true, "no_smoking": true, "pets_ok": false, "ac": false, "luggage_ok": true}'::jsonb
WHERE id = u10;

-- ── 10 Rides across Chennai ────────────────────────────────────────

INSERT INTO rides (driver_id, source_name, source_lat, source_lng, dest_name, dest_lat, dest_lng, departure_time, available_seats, price_per_seat, gender_preference, preferences, vehicle_model, vehicle_plate, vehicle_color, status)
VALUES
  -- 1. Anna Nagar → Guindy (tomorrow morning)
  (u1, 'Anna Nagar', 13.0860, 80.2101, 'Guindy', 13.0067, 80.2206,
   NOW() + INTERVAL '1 day' + INTERVAL '7 hours', 3, 75, 'anyone',
   '{"music": true, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": true}'::jsonb,
   'Maruti Swift', 'TN 07 AB 1234', 'White', 'open'),

  -- 2. Sholinganallur → T. Nagar
  (u2, 'Sholinganallur', 12.9010, 80.2279, 'T. Nagar', 13.0418, 80.2341,
   NOW() + INTERVAL '1 day' + INTERVAL '8 hours', 2, 120, 'female_only',
   '{"music": false, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": true}'::jsonb,
   'Hyundai i20', 'TN 09 CD 5678', 'Silver', 'open'),

  -- 3. Tambaram → Egmore
  (u3, 'Tambaram', 12.9249, 80.1000, 'Egmore', 13.0732, 80.2609,
   NOW() + INTERVAL '2 days' + INTERVAL '6 hours', 4, 50, 'anyone',
   '{"music": true, "no_smoking": false, "pets_ok": true, "ac": true, "luggage_ok": true}'::jsonb,
   'Tata Nexon', 'TN 11 EF 9012', 'Red', 'open'),

  -- 4. Velachery → Nungambakkam
  (u4, 'Velachery', 12.9815, 80.2180, 'Nungambakkam', 13.0569, 80.2425,
   NOW() + INTERVAL '2 days' + INTERVAL '9 hours', 2, 100, 'female_only',
   '{"music": true, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": false}'::jsonb,
   'Maruti Dzire', 'TN 04 GH 3456', 'Black', 'open'),

  -- 5. Porur → OMR Thoraipakkam
  (u5, 'Porur', 13.0382, 80.1565, 'OMR Thoraipakkam', 12.9364, 80.2333,
   NOW() + INTERVAL '3 days' + INTERVAL '7 hours 30 minutes', 3, 150, 'anyone',
   '{"music": true, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": true}'::jsonb,
   'Honda City', 'TN 10 JK 7890', 'Grey', 'open'),

  -- 6. Mylapore → Chromepet
  (u6, 'Mylapore', 13.0368, 80.2676, 'Chromepet', 12.9516, 80.1462,
   NOW() + INTERVAL '3 days' + INTERVAL '17 hours', 2, 100, 'anyone',
   '{"music": true, "no_smoking": true, "pets_ok": true, "ac": true, "luggage_ok": true}'::jsonb,
   'Hyundai Creta', 'TN 06 LM 2345', 'Blue', 'open'),

  -- 7. Perambur → Adyar
  (u7, 'Perambur', 13.1185, 80.2363, 'Adyar', 13.0063, 80.2574,
   NOW() + INTERVAL '4 days' + INTERVAL '8 hours', 1, 80, 'anyone',
   '{"music": false, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": true}'::jsonb,
   'Kia Seltos', 'TN 14 NP 6789', 'Brown', 'open'),

  -- 8. Ashok Nagar → Pallavaram
  (u8, 'Ashok Nagar', 13.0373, 80.2122, 'Pallavaram', 12.9675, 80.1491,
   NOW() + INTERVAL '4 days' + INTERVAL '20 hours', 3, 60, 'female_only',
   '{"music": false, "no_smoking": true, "pets_ok": false, "ac": true, "luggage_ok": false}'::jsonb,
   'Toyota Innova', 'TN 02 QR 0123', 'Beige', 'open'),

  -- 9. Kilpauk → Thiruvanmiyur
  (u9, 'Kilpauk', 13.0842, 80.2420, 'Thiruvanmiyur', 12.9830, 80.2594,
   NOW() + INTERVAL '5 days' + INTERVAL '9 hours', 2, 90, 'anyone',
   '{"music": true, "no_smoking": true, "pets_ok": true, "ac": false, "luggage_ok": true}'::jsonb,
   'Maruti Baleno', 'TN 18 ST 4567', 'Green', 'open'),

  -- 10. Kodambakkam → Vadapalani
  (u10, 'Kodambakkam', 13.0520, 80.2247, 'Vadapalani', 13.0500, 80.2121,
   NOW() + INTERVAL '1 day' + INTERVAL '10 hours', 1, 30, 'anyone',
   '{"music": true, "no_smoking": true, "pets_ok": false, "ac": false, "luggage_ok": true}'::jsonb,
   'Tata Altroz', 'TN 05 UV 8901', 'Orange', 'open');

RAISE NOTICE 'Seeding complete: 10 users and 10 rides created in Chennai!';

END $$;
