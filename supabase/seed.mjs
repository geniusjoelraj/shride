/**
 * Seed script: creates 10 mock driver profiles and 10 rides within Chennai.
 *
 * Usage:  node supabase/seed.mjs
 *
 * Requirements:
 *   npm install @supabase/supabase-js   (already installed)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jrvsojumzjhwcpqxngyh.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydnNvanVtempod2NwcXhuZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzc3NTMsImV4cCI6MjA5MDcxMzc1M30.km2oS_kQQdhCaimOQtNdK-cpHC8bsRT7qZZJ5RKFF7M'

// Use service role key if available, otherwise anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
})

// ── Chennai locations ──────────────────────────────────────────────
const CHENNAI_LOCATIONS = [
    { name: 'T. Nagar', lat: 13.0418, lng: 80.2341 },
    { name: 'Adyar', lat: 13.0063, lng: 80.2574 },
    { name: 'Anna Nagar', lat: 13.0860, lng: 80.2101 },
    { name: 'Velachery', lat: 12.9815, lng: 80.2180 },
    { name: 'Guindy', lat: 13.0067, lng: 80.2206 },
    { name: 'Tambaram', lat: 12.9249, lng: 80.1000 },
    { name: 'Porur', lat: 13.0382, lng: 80.1565 },
    { name: 'Sholinganallur', lat: 12.9010, lng: 80.2279 },
    { name: 'Egmore', lat: 13.0732, lng: 80.2609 },
    { name: 'Mylapore', lat: 13.0368, lng: 80.2676 },
    { name: 'Chromepet', lat: 12.9516, lng: 80.1462 },
    { name: 'Perambur', lat: 13.1185, lng: 80.2363 },
    { name: 'Kilpauk', lat: 13.0842, lng: 80.2420 },
    { name: 'Ashok Nagar', lat: 13.0373, lng: 80.2122 },
    { name: 'Thiruvanmiyur', lat: 12.9830, lng: 80.2594 },
    { name: 'OMR Thoraipakkam', lat: 12.9364, lng: 80.2333 },
    { name: 'Nungambakkam', lat: 13.0569, lng: 80.2425 },
    { name: 'Kodambakkam', lat: 13.0520, lng: 80.2247 },
    { name: 'Vadapalani', lat: 13.0500, lng: 80.2121 },
    { name: 'Pallavaram', lat: 12.9675, lng: 80.1491 },
]

const VEHICLE_MODELS = [
    'Maruti Swift',
    'Hyundai i20',
    'Tata Nexon',
    'Maruti Dzire',
    'Honda City',
    'Hyundai Creta',
    'Kia Seltos',
    'Toyota Innova',
    'Maruti Baleno',
    'Tata Altroz',
]

const VEHICLE_COLORS = ['White', 'Silver', 'Black', 'Red', 'Blue', 'Grey', 'Brown', 'Beige', 'Green', 'Orange']

const DRIVER_NAMES = [
    'Arun Kumar',
    'Priya Sharma',
    'Karthik Rajan',
    'Deepa Lakshmi',
    'Vikram Sundar',
    'Meera Iyer',
    'Rajesh Babu',
    'Anitha Devi',
    'Suresh Nair',
    'Kavitha Murali',
]

function randomPlate() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const l1 = letters[Math.floor(Math.random() * letters.length)]
    const l2 = letters[Math.floor(Math.random() * letters.length)]
    const num = Math.floor(1000 + Math.random() * 9000)
    return `TN ${Math.floor(1 + Math.random() * 20)} ${l1}${l2} ${num}`
}

function futureDate(daysAhead, hour) {
    const d = new Date()
    d.setDate(d.getDate() + daysAhead)
    d.setHours(hour, Math.floor(Math.random() * 60), 0, 0)
    return d.toISOString()
}

function pickTwo(arr) {
    const i = Math.floor(Math.random() * arr.length)
    let j = Math.floor(Math.random() * arr.length)
    while (j === i) j = Math.floor(Math.random() * arr.length)
    return [arr[i], arr[j]]
}

// ── Main ───────────────────────────────────────────────────────────
async function seed() {
    console.log('🌱 Seeding Shride database with 10 mock rides in Chennai...\n')

    // Step 1: Create 10 mock driver users via Supabase Auth
    const driverIds = []

    for (let i = 0; i < 10; i++) {
        const email = `driver${i + 1}@shride.test`
        const password = 'Test@1234'

        // Try to create user (admin API if service key, otherwise signUp)
        let userId
        if (SUPABASE_SERVICE_ROLE_KEY) {
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: DRIVER_NAMES[i] },
            })
            if (error && error.message.includes('already been registered')) {
                // User exists, look up by email
                const { data: listData } = await supabase.auth.admin.listUsers()
                const existing = listData?.users?.find((u) => u.email === email)
                userId = existing?.id
                console.log(`  ↪ User ${email} already exists (${userId})`)
            } else if (error) {
                console.error(`  ✗ Failed to create ${email}:`, error.message)
                continue
            } else {
                userId = data.user.id
                console.log(`  ✓ Created user ${email} (${userId})`)
            }
        } else {
            // No service role key — use signUp (won't work if email confirm is on)
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: DRIVER_NAMES[i] } },
            })
            if (error) {
                console.error(`  ✗ Failed to create ${email}:`, error.message)
                continue
            }
            userId = data.user?.id
            console.log(`  ✓ Signed up ${email} (${userId})`)
        }

        if (!userId) continue
        driverIds.push(userId)

        // Update profile with more details
        const { error: profError } = await supabase
            .from('profiles')
            .update({
                full_name: DRIVER_NAMES[i],
                bio: `Hi! I'm ${DRIVER_NAMES[i]}. Regular commuter in Chennai. Let's share rides! 🚗`,
                gender: i % 2 === 0 ? 'male' : 'female',
                rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(2)),
                total_ratings: Math.floor(5 + Math.random() * 50),
                is_verified: Math.random() > 0.3,
                preferences: {
                    music: Math.random() > 0.5,
                    no_smoking: Math.random() > 0.3,
                    pets_ok: Math.random() > 0.6,
                    ac: Math.random() > 0.2,
                    luggage_ok: Math.random() > 0.4,
                },
            })
            .eq('id', userId)

        if (profError) console.error(`  ⚠ Profile update failed for ${DRIVER_NAMES[i]}:`, profError.message)
    }

    if (driverIds.length === 0) {
        console.error('\n✗ No driver users could be created. Aborting.')
        console.error('  Tip: Set SUPABASE_SERVICE_ROLE_KEY env var, or disable email confirmation in Supabase dashboard.')
        process.exit(1)
    }

    // Step 2: Create 10 rides
    console.log(`\n📍 Creating 10 rides across Chennai...\n`)

    const rides = []
    for (let i = 0; i < 10; i++) {
        const driverId = driverIds[i % driverIds.length]
        const [src, dst] = pickTwo(CHENNAI_LOCATIONS)
        const daysAhead = Math.floor(1 + Math.random() * 6) // 1–7 days from now
        const hour = 6 + Math.floor(Math.random() * 14) // 6 AM – 8 PM

        const ride = {
            driver_id: driverId,
            source_name: src.name,
            source_lat: src.lat,
            source_lng: src.lng,
            dest_name: dst.name,
            dest_lat: dst.lat,
            dest_lng: dst.lng,
            departure_time: futureDate(daysAhead, hour),
            available_seats: 1 + Math.floor(Math.random() * 4),
            price_per_seat: [30, 50, 75, 100, 120, 150][Math.floor(Math.random() * 6)],
            gender_preference: i === 3 || i === 7 ? 'female_only' : 'anyone',
            preferences: {
                music: Math.random() > 0.5,
                no_smoking: Math.random() > 0.3,
                pets_ok: Math.random() > 0.7,
                ac: Math.random() > 0.2,
                luggage_ok: Math.random() > 0.3,
            },
            vehicle_model: VEHICLE_MODELS[i],
            vehicle_plate: randomPlate(),
            vehicle_color: VEHICLE_COLORS[i],
            status: 'open',
        }

        rides.push(ride)
    }

    const { data: insertedRides, error: ridesError } = await supabase
        .from('rides')
        .insert(rides)
        .select('id, source_name, dest_name, departure_time')

    if (ridesError) {
        console.error('✗ Failed to insert rides:', ridesError.message)
        process.exit(1)
    }

    console.log('✓ Created 10 rides:\n')
    insertedRides.forEach((r, i) => {
        const date = new Date(r.departure_time).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        })
        console.log(`  ${i + 1}. ${r.source_name} → ${r.dest_name}  (${date})`)
    })

    console.log('\n✅ Seeding complete! You can now see these rides in the app.')
}

seed().catch(console.error)
