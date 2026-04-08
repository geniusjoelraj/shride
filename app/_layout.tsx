import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "./globals.css";

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!session && !inAuthGroup) {
      router.replace("/auth/sign-in");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="auth/sign-in"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="auth/sign-up"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="location-picker"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="create-ride"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="rides/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="profile/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="my-reviews"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <RootLayoutNav />
      </LocationProvider>
    </AuthProvider>
  );
}
