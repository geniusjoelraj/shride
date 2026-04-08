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

### 1. Home / Dashboard<p align="center">
  <img src="https://github.com/user-attachments/assets/32b69c30-48e7-47f6-8b3b-c1647b794a1c" alt="Home page" width="32%">
  <img src="https://github.com/user-attachments/assets/b6671e85-6722-43ca-a5d8-993c2f15a890" alt="Home page" width="32%">
  <img src="https://github.com/user-attachments/assets/866756cd-e4d3-4359-a210-6475e5cdf384" alt="Home page" width="32%">
</p>

### 2. Search Filter and Location Pickers
<p align="center">
  <img src="https://github.com/user-attachments/assets/0c0d7203-b75a-4e59-b0cf-1946568ba2e2" alt="Search page" width="49%">
  <img src="https://github.com/user-attachments/assets/8a82fe41-6b39-4440-a4f5-eab4736669fa" alt="Search page" width="49%">
</p>


### 3. My Rides Lifecycle
<p align="center">
  <img src="https://github.com/user-attachments/assets/913674f6-513b-469e-b2c1-0e2ad85e75ec" alt="Search page" width="49%">
  <img src="https://github.com/user-attachments/assets/62f46d75-1345-46fd-a056-bbe414692495" alt="Search page" width="49%">
</p>

### 5. Profile & Ratings
<p align="center">
  <img src="https://github.com/user-attachments/assets/6ab85fd3-e812-4dce-b26e-c084b6c0a4c3" alt="Profile & Ratings" width="49%">
  <img src="https://github.com/user-attachments/assets/3eee4994-728b-4d81-a02b-e8bf40b902c7" alt="Profile & Ratings" width="49%">
</p>

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
