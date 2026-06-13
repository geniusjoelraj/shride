# Shride — Geospatial Route-Corridor Matching for Real-Time Ride-Pooling

> *A mobile Intelligent Transportation System (ITS) that applies PostGIS spatial algorithms, trajectory-aware route matching, and community trust mechanisms to enable peer-to-peer ride-pooling in urban environments.*

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo)](https://expo.dev)
[![PostGIS](https://img.shields.io/badge/PostGIS-Spatial_DB-336791?logo=postgresql)](https://postgis.net)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com)
---

## Abstract

Urban congestion and carbon emissions remain critical challenges in rapidly growing cities. **Shride** (*Share + Ride*) is a research-oriented mobile application that addresses the ride-pooling problem through a novel **route corridor matching algorithm** built on PostGIS spatial indexing. Unlike conventional ride-hailing platforms that rely on simple origin–destination proximity, Shride evaluates whether a passenger's pickup and dropoff points both fall within a configurable spatial buffer around the driver's *actual route geometry*, with **directionality enforcement** to prevent backtracking. This dual-layer approach — combining server-side PostGIS spatial pre-filtering with client-side Haversine verification — significantly improves match quality while maintaining sub-second query performance through GIST spatial indexing.

The system further implements a **true cost-sharing economic model** (not for-profit ride-hailing), database-level security enforcement through PostgreSQL Row-Level Security policies, and a safety-first design with gender preference filtering and a trust-based community rating system.

**Target domain:** Chennai, India — a city of 11M+ residents with significant traffic congestion challenges.

---

## Table of Contents

- [Research Motivation](#research-motivation)
- [Key Contributions](#key-contributions)
- [System Architecture](#system-architecture)
- [Core Algorithms](#core-algorithms)
  - [Route Corridor Matching](#1-route-corridor-matching-algorithm)
  - [Dual-Layer Spatial Search](#2-dual-layer-spatial-search)
  - [GeoJSON Processing Pipeline](#3-geojson-processing-pipeline)
  - [Dynamic Cost-Sharing Model](#4-dynamic-cost-sharing-pricing-model)
- [Database Design](#database-design)
- [Safety & Trust Mechanisms](#safety--trust-mechanisms)
- [Application Screenshots](#application-screenshots)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Future Research Directions](#future-research-directions)
- [References](#references)

---

## Research Motivation

Ride-pooling (also known as dynamic carpooling) has been identified as a key strategy for reducing urban vehicle-kilometers traveled (VKT) and per-capita emissions. However, existing commercial platforms face two fundamental limitations:

1. **Naïve spatial matching:** Most systems match riders based on origin–destination point proximity, ignoring the driver's actual travel trajectory. This leads to inefficient detours and poor user experience.
2. **Profit-driven economics:** Ride-hailing platforms extract significant commissions (20–30%), discouraging true cost-sharing behavior.

Shride addresses both limitations by implementing **trajectory-aware corridor matching** using PostGIS spatial functions and a **zero-commission cost-sharing model** where the driver is treated as an equal participant in the fare split.

---

## Key Contributions

| # | Contribution | Technical Approach |
|---|---|---|
| 1 | **Route Corridor Matching** | PostGIS `ST_DWithin` + `ST_LineLocatePoint` on GEOMETRY(LineString, SRID 4326) with GIST indexing |
| 2 | **Dual-Layer Spatial Search** | Server-side PostGIS pre-filtering → client-side Haversine verification with directional enforcement |
| 3 | **GeoJSON Processing Pipeline** | Google Encoded Polyline → decoded coordinate arrays → PostGIS LineString geometries |
| 4 | **True Cost-Sharing Model** | Distance-based pricing with driver-adjustable range (±30%), split equally among *all* occupants including the driver |
| 5 | **Database-Level Security** | Comprehensive Row-Level Security (RLS) policies on all tables, preventing unauthorized access even if the client is compromised |
| 6 | **Community Trust System** | PostgreSQL trigger-based automatic rating aggregation with uniqueness constraints |
| 7 | **Safety-by-Design** | Gender preference filtering, driver verification, and passenger approval workflows |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React Native / Expo)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Map Engine  │  │  Location    │  │  Haversine Verifier      │   │
│  │ (Google Maps)│  │  Context     │  │  (Client-side spatial    │   │
│  │              │  │              │  │   matching + ranking)    │   │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘   │
│         │                 │                       │                 │
│  ┌──────┴─────────────────┴───────────────────────┴──────────────┐  │
│  │            Polyline Decoder (utils/polyline.ts)               │  │
│  │          Google Encoded Polyline → GeoJSON [lng, lat]         │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS / WebSocket
┌──────────────────────────────┼──────────────────────────────────────┐
│                        BACKEND (Supabase)                           │
│  ┌───────────────────────────┴───────────────────────────────────┐  │
│  │                    PostgreSQL + PostGIS                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │  │
│  │  │ find_compatible_│  │ GIST Spatial    │  │ Row-Level    │   │  │
│  │  │ rides() RPC     │  │ Index           │  │ Security     │   │  │
│  │  │ (Route Corridor)│  │ (route_geom)    │  │ (All Tables) │   │  │
│  │  └─────────────────┘  └─────────────────┘  └──────────────┘   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                     │  │
│  │  │ Auto-Rating     │  │ Auto-Profile    │                     │  │
│  │  │ Trigger         │  │ Creation Trigger│                     │  │
│  │  └─────────────────┘  └─────────────────┘                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Auth (JWT) + Secure Token Storage                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                   EXTERNAL SERVICES                                 │
│  ┌───────────────────┐  ┌─────────────────┐                         │
│  │ Google Directions │  │ Google Places   │                         │
│  │ API (Routes +     │  │ Autocomplete    │                         │
│  │ Traffic Data)     │  │                 │                         │
│  └───────────────────┘  └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Algorithms

### 1. Route Corridor Matching Algorithm

The central innovation of Shride is the **route corridor matching** approach, implemented as a PostgreSQL RPC function (`find_compatible_rides`) leveraging PostGIS spatial operators.

**Problem:** Given a passenger's pickup point *P* and dropoff point *D*, find all active rides whose route trajectory passes near both points, in the correct directional order.

**Solution:** Three spatial predicates are evaluated against each ride's stored `route_geom` (a PostGIS `GEOMETRY(LineString, 4326)`):

```sql
-- Construct point geometries from passenger coordinates
pickup_point  := ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326);
dropoff_point := ST_SetSRID(ST_MakePoint(dropoff_lng, dropoff_lat), 4326);

-- Predicate 1: Pickup within corridor (default 500m buffer)
ST_DWithin(r.route_geom::geography, pickup_point::geography, max_distance_meters)

-- Predicate 2: Dropoff within corridor
ST_DWithin(r.route_geom::geography, dropoff_point::geography, max_distance_meters)

-- Predicate 3: Directional ordering — pickup occurs BEFORE dropoff along trajectory
ST_LineLocatePoint(r.route_geom, pickup_point)
  <= ST_LineLocatePoint(r.route_geom, dropoff_point)
```

**Key properties:**
- **Corridor width** is configurable (default: 500m), enabling the system to balance match coverage vs. detour tolerance
- **Directionality** is enforced via `ST_LineLocatePoint`, which returns a `FLOAT [0,1]` representing the fractional position along the LineString. This prevents matches where the driver would need to backtrack
- **Performance** is maintained through a GIST spatial index on `route_geom`, enabling sublinear query time even with large ride datasets

### 2. Dual-Layer Spatial Search

The search system implements a **cascading spatial filter** for maximum compatibility:

```
┌──────────────────────────────────────────────────────┐
│  LAYER 1: Server-Side PostGIS (find_compatible_rides)│
│  ─ ST_DWithin spatial pre-filter (GIST-accelerated)  │
│  ─ ST_LineLocatePoint directionality check           │
│  ─ Time window, seat availability, status filters    │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│  LAYER 2: Client-Side Haversine Verification         │
│  ─ Iterate decoded polyline coordinates              │
│  ─ Find nearest point to pickup                      │
│  ─ Search ONLY after pickup index for dropoff        │
│  ─ Rank by combined deviation (pickupDist + dropDist)│
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│  FALLBACK: Origin-Destination Proximity              │
│  ─ For rides without stored route geometry           │
│  ─ Simple Haversine radius check on endpoints        │
└──────────────────────────────────────────────────────┘
```

The **Haversine formula** implementation computes geodesic distances on the WGS84 ellipsoid:

```typescript
const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's mean radius (meters)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};
```

### 3. GeoJSON Processing Pipeline

Route geometries flow through a multi-stage pipeline:

```
Google Directions API Response
  │
  ▼
Encoded Polyline String (e.g., "_p~iF~ps|U_ulLnnqC...")
  │  Variable-length encoding + zigzag encoding
  ▼
Polyline Decoder (utils/polyline.ts)
  │  Decodes to coordinate arrays: [[lng, lat], ...]
  ▼
GeoJSON LineString Construction
  │  Client-side assembly for Supabase insertion
  ▼
PostGIS GEOMETRY(LineString, SRID 4326)
  │  Stored with GIST spatial indexing
  ▼
Spatial Query Operators (ST_DWithin, ST_LineLocatePoint)
```

### 4. Dynamic Cost-Sharing Pricing Model

Shride implements a **true cost-sharing model** distinct from for-profit ride-hailing:

```
Base Price = round₅(distance_km × ₹1/km)

                    ┌─ Driver adjustment: ±30% ─┐
                    │   (slider in ₹5 steps)     │
                    ▼                            ▼
           Adjusted Price = Base × [0.7 ... 1.3]

Price per Person = round₅(Adjusted Price ÷ (seats + 1))
                                              ▲
                               Driver is included in the split
```

**Key distinction:** The driver pays their share too — this is legally and economically a **cost-sharing arrangement**, not a commercial transportation service.

---

## Database Design

### Entity-Relationship Model

```
┌──────────┐       1:N        ┌──────────┐       N:M       ┌────────────────────────────────┐
│ profiles │◄──────────────── │  rides   │────────────────►│ profiles                       │
│          │  (driver_id)     │          │                 │ (ride_passengers)│(passenger)  │
│ • rating │                  │ • route_ │                 └────────────────────────────────┘
│ • gender │                  │   geom   │                 
│ • prefs  │                  │ • status │                 
│ (JSONB)  │                  │ • prefs  │                     
└──────┬───┘                  │ (JSONB)  │                 
       │                      └────┬─────┘
       │           1:N             │ 1:N
       │                           │
       │    ┌──────────────────────┘
       │    ▼
       │  ┌───────────────┐
       └─►│ ride_reviews  │
          │ • rating (1-5)│   ──► TRIGGER: update_driver_rating()
          │ • comment     │       Auto-recalculates avg rating
          │ UNIQUE(ride,  │
          │  reviewer)    │
          └───────────────┘
```

### Row-Level Security (RLS) Policy Matrix

All tables enforce RLS at the database level, ensuring data integrity even if client-side code is compromised:

| Table | `SELECT` | `INSERT` | `UPDATE` | `DELETE` |
|---|---|---|---|---|
| `profiles` | Public | Own record (`auth.uid() = id`) | Own record | — |
| `rides` | Public | Driver only (`auth.uid() = driver_id`) | Driver only | Driver only |
| `ride_passengers` | Public | Own entries (`auth.uid() = passenger_id`) | Passenger or ride driver | Passenger only |
| `ride_reviews` | Public | Own reviews (`auth.uid() = reviewer_id`) | — | — |

---

## Safety & Trust Mechanisms

| Feature | Implementation | Purpose |
|---|---|---|
| **Gender preference filtering** | `gender_preference ENUM ('anyone', 'female_only')` | Enables safe ride selection for women passengers |
| **Driver verification** | `is_verified BOOLEAN` on profiles | Visual trust indicator for verified drivers |
| **Passenger approval** | `ride_passengers.status ENUM ('requested', 'accepted', 'rejected')` | Drivers manually approve/reject each rider |
| **Immutable reviews** | No `UPDATE`/`DELETE` RLS policy on `ride_reviews` | Prevents tampering with trust data |
| **One review per ride** | `UNIQUE(ride_id, reviewer_id)` constraint | Prevents rating manipulation |
| **Automatic aggregation** | PostgreSQL trigger `update_driver_rating()` | Tamper-proof rolling average calculation |
| **Secure token storage** | `expo-secure-store` for auth tokens | Hardware-backed credential protection |

---

## Application Screenshots

### Home Dashboard & Navigation
<p align="center">
  <img src="https://github.com/user-attachments/assets/32b69c30-48e7-47f6-8b3b-c1647b794a1c" alt="Home — Map view with driver/rider toggle" width="32%">
  <img src="https://github.com/user-attachments/assets/b6671e85-6722-43ca-a5d8-993c2f15a890" alt="Home — Ride creation entry point" width="32%">
  <img src="https://github.com/user-attachments/assets/866756cd-e4d3-4359-a210-6475e5cdf384" alt="Home — Active rides overview" width="32%">
</p>

### Spatial Search & Location Selection
<p align="center">
  <img src="https://github.com/user-attachments/assets/0c0d7203-b75a-4e59-b0cf-1946568ba2e2" alt="Search — Preference-based filtering with spatial matching" width="49%">
  <img src="https://github.com/user-attachments/assets/8a82fe41-6b39-4440-a4f5-eab4736669fa" alt="Location Picker — Interactive map with reverse geocoding" width="49%">
</p>

### Ride Lifecycle Management
<p align="center">
  <img src="https://github.com/user-attachments/assets/913674f6-513b-469e-b2c1-0e2ad85e75ec" alt="My Rides — Upcoming rides with passenger management" width="49%">
  <img src="https://github.com/user-attachments/assets/62f46d75-1345-46fd-a056-bbe414692495" alt="My Rides — Completed rides and review prompts" width="49%">
</p>

### Community Trust System
<p align="center">
  <img src="https://github.com/user-attachments/assets/6ab85fd3-e812-4dce-b26e-c084b6c0a4c3" alt="Profile — Public driver profile with aggregated ratings" width="49%">
  <img src="https://github.com/user-attachments/assets/3eee4994-728b-4d81-a02b-e8bf40b902c7" alt="Reviews — Star rating system with review history" width="49%">
</p>

---

## Technology Stack

| Layer | Technology | Role |
|---|---|---|
| **Mobile Framework** | React Native 0.81 + Expo SDK 54 | Cross-platform native application |
| **Routing** | expo-router v6 (file-based) | Type-safe navigation with deep linking |
| **Styling** | NativeWind v4 (TailwindCSS v3) | Utility-first responsive design |
| **Backend** | Supabase (PostgreSQL 15+) | Database, authentication, RLS |
| **Geospatial Engine** | PostGIS 3.x | Spatial indexing, geometry operations |
| **Maps** | react-native-maps + Google Maps SDK | Interactive map rendering |
| **Geolocation** | expo-location v19 | Device GPS + reverse geocoding |
| **Animations** | react-native-reanimated v4 | 60 FPS native-thread animations |
| **Auth Storage** | expo-secure-store + AsyncStorage | Hardware-backed secure token storage |
| **Build System** | EAS Build (Expo) | Cloud-based native compilation |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18 and npm
- Expo CLI (`npx expo`)
- A [Supabase](https://supabase.com) project with PostGIS enabled
- Google Maps API key (Directions + Places + Maps SDK)

### Installation

```bash
# 1. Clone and install dependencies
git clone https://github.com/your-username/shride.git
cd shride
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials:
#   EXPO_PUBLIC_SUPABASE_URL=...
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
#   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...

# 3. Initialize database schema (run in Supabase SQL Editor)
#   → supabase/schema.sql          (core tables + PostGIS + RLS)
#   → supabase/route_matching.sql  (spatial matching RPC)
#   → supabase/migration_reviews.sql (reviews + rating trigger)
#   → supabase/seed.sql            (optional: 10 Chennai test users + rides)

# 4. Launch development server
npx expo start
```

### Building for Android

```bash
npm install -g eas-cli
npx eas build -p android --profile preview
```

---

## Future Research Directions

1. **Multi-modal route matching** — Extend corridor matching to incorporate two-wheeler and public transit segments (preliminary testing via `test_bike.js` with Google Directions `mode=two_wheeler`)
2. **Predictive demand modeling** — Leverage recurring ride patterns (`recurring_days[]`) to forecast ride availability and preemptively suggest matches
3. **Dynamic corridor width** — Adaptively adjust the 500m buffer based on urban density, time-of-day, and real-time demand
4. **Carbon emission estimation** — Quantify per-ride CO₂ savings by comparing pooled vs. individual trip emissions using vehicle occupancy data
5. **Game-theoretic pricing** — Model cost-sharing equilibria to optimize the ±30% pricing adjustment range
6. **Real-time trajectory tracking** — Integrate live GPS streams for dynamic re-matching of en-route passengers
7. **Trust network analysis** — Apply graph-theoretic methods to the review network for anomaly detection and trust propagation

---

## Project Structure

```
shride/
├── app/                        # Screen components (file-based routing)
│   ├── (tabs)/                 # Bottom tab navigation screens
│   ├── auth/                   # Authentication flow
│   ├── rides/                  # Ride detail & lifecycle
│   └── profile/                # Public profile views
├── components/                 # Reusable UI components
├── contexts/                   # React Context providers (Auth, Location)
├── lib/                        # Client initialization (Supabase)
├── services/                   # API service layer
├── utils/                      # Algorithms (polyline decoder)
├── types/                      # TypeScript interface definitions
├── supabase/                   # Database schemas, migrations, seeds
│   ├── schema.sql              # Core schema + PostGIS + RLS policies
│   ├── route_matching.sql      # Spatial matching RPC function
│   └── migration_reviews.sql   # Review system + rating triggers
└── assets/                     # Fonts, images, static resources
```

---

## References

- Shaheen, S., & Cohen, A. (2019). "Shared ride services in North America: definitions, impacts, and the future of pooling." *Transport Reviews*, 39(4), 427–442.
- Agatz, N., Erera, A., Savelsbergh, M., & Wang, X. (2012). "Optimization for dynamic ride-sharing: A review." *European Journal of Operational Research*, 223(2), 295–303.
- Furuhata, M., Dessouky, M., Ordóñez, F., Brunet, M. E., Wang, X., & Koenig, S. (2013). "Ridesharing: The state-of-the-art and future directions." *Transportation Research Part B*, 57, 28–46.
- PostGIS Development Team. (2023). *PostGIS 3.4 Manual — Spatial Functions Reference.* https://postgis.net/docs/

---

<p align="center">
  <em>Developed as a research prototype exploring geospatial algorithms for sustainable urban mobility.</em>
</p>
