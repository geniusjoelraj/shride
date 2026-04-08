# 🚗 Shride

**Shride** is a seamless, modern ride-pooling application built with **React Native (Expo)**, **Supabase**, and **NativeWind**. It connects drivers with available seats to passengers looking for a cost-effective, eco-friendly way to travel.

---

## ✨ Key Features

- **📍 Interactive Maps:** Drag-and-drop location selection with real-time reverse geocoding powered by Expo Location.
- **🛣️ Ride Management:** Create, find, and join rides easily. Manage your "Upcoming" and "Past" trips.
- **🔍 Advanced Search:** Easily filter available rides based on date, gender preference, and specific ride preferences (Music, No Smoking, Pets OK, AC, Luggage).
- **🧑‍🤝‍🧑 Profiles & Reviews:** View public profiles, leave reviews for your drivers post-ride, and establish a trusted community system.
- **📱 Cross-Platform:** Works seamlessly natively on iOS and Android (as well as handling gracefully on the Web).

---

## 📸 Screenshots

*(Replace the placeholder links below with your actual screenshot images once uploaded!)*

### 1. Home / Dashboard
> Explore the map and launch right into searching or creating a ride.
![Home Screen](docs/screenshots/home.png)

### 2. Search & Filters
> Find the perfect ride using detailed preferences, date, and status filters.
![Search & Filters](docs/screenshots/search.png)

### 3. Location Picker
> A sleek map-pin interface to quickly pinpoint the exact pickup or drop-off spot without fuss.
![Location Picker](docs/screenshots/location_picker.png)

### 4. My Rides Lifecycle
> View open, in-progress, completed, and cancelled rides in dedicated driver or passenger views.
![My Rides Management](docs/screenshots/my_rides.png)

### 5. Profile & Ratings
> Leave reviews and check out verified driver scoreboards.
![Profile & Ratings](docs/screenshots/profile_ratings.png)

---

## 🛠️ Technology Stack

- **Framework:** [React Native](https://reactnative.dev) & [Expo](https://expo.dev)
- **Styling:** [NativeWind](https://www.nativewind.dev/) (TailwindCSS)
- **Database / Backend:** [Supabase](https://supabase.com) (PostgreSQL, Auth, RLS, Storage)
- **Maps / Geocoding:** `react-native-maps` + `expo-location`

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed, as well as the Expo CLI. You'll also need a Supabase project set up for your backend.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder and add your Supabase credentials, as well as your Google Maps API Key:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### 3. Setup Supabase Database
Run the provided SQL schemas/migrations inside Supabase's SQL editor to set up the necessary tables (`profiles`, `rides`, `ride_passengers`, `ride_reviews`, etc.) and their respective triggers.

### 4. Start the Application
```bash
npx expo start
```
Use the Expo Go app on your physical device, or press `a` to run on Android / `i` for iOS simulators.

---

## 📦 Building an APK
To compile an Android binary for physical testing, we use standard EAS servers:
```bash
npm install -g eas-cli
npx eas build -p android --profile preview
```

---

*Built with 🤖.*
