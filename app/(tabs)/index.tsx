import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import { Ionicons } from '@expo/vector-icons'
import clsx from 'clsx'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import MapView, { Marker } from '@/components/Map'
import type { LatLng } from 'react-native-maps'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const QUICK_ACTIONS = [
  { label: 'Find Ride', icon: 'search', route: '/(tabs)/search' },
  { label: 'Offer Ride', icon: 'car', route: '/create-ride' },
  { label: 'My Rides', icon: 'list', route: '/(tabs)/my_rides' },
]

export default function Index() {
  const { profile, user } = useAuth()
  const { source, destination } = useLocation()
  const router = useRouter()
  const [isRider, setIsRider] = useState(true)
  const [marker, setMarker] = useState<LatLng>({
    latitude: 13.0827,
    longitude: 80.2707,
  })

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const timeGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const handleSearch = () => {
    if (isRider) {
      router.push('/(tabs)/search')
    } else {
      router.push('/create-ride')
    }
  }

  return (
    <View className="flex-1 bg-shride-background">
      {/* Map Background */}
      <View className="absolute inset-0">
        <MapView
          provider="google"
          style={{ width: '100%', height: '100%' }}
          initialRegion={{
            latitude: 13.0827,
            longitude: 80.2707,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            draggable
            coordinate={marker}
            onDragEnd={(e) => setMarker(e.nativeEvent.coordinate)}
          />
        </MapView>
      </View>

      {/* Overlay Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: '100%' }}
        bounces={false}
      >
        {/* Top Section */}
        <View className="pt-16 px-6">
          {/* Header */}
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            className="flex-row justify-between items-center mb-4"
          >
            <View>
              <Text className="font-display text-3xl font-bold text-shride-primary">
                Shride
              </Text>
            </View>
            <TouchableOpacity
              className="bg-shride-primary rounded-full w-11 h-11 items-center justify-center"
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person" size={20} color="#FEF9E7" />
            </TouchableOpacity>
          </Animated.View>

          {/* Greeting Card */}
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            className="bg-shride-surface/95 rounded-3xl p-5 mb-4"
          >
            <Text className="font-body text-base text-shride-text-secondary">
              {timeGreeting()},
            </Text>
            <Text className="font-display text-2xl font-bold text-shride-primary mt-0.5">
              {firstName}! 👋
            </Text>
            <Text className="font-body text-sm text-shride-text-secondary mt-1">
              Where are you heading today?
            </Text>
          </Animated.View>
        </View>

        {/* Spacer to push the card towards bottom */}
        <View className="flex-1" />

        {/* Main Search Card */}
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="mx-5 mb-4"
        >
          <View className="bg-white/95 rounded-3xl p-5 shadow-lg">
            {/* Rider / Driver Toggle */}
            <View className="flex-row bg-shride-secondary/30 rounded-2xl p-1 mb-5">
              <TouchableOpacity
                className={clsx(
                  'flex-1 py-3 rounded-xl items-center flex-row justify-center',
                  isRider && 'bg-shride-primary'
                )}
                onPress={() => setIsRider(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person"
                  size={16}
                  color={isRider ? '#FEF9E7' : '#60683D'}
                />
                <Text
                  className={clsx(
                    'font-body text-base font-semibold ml-2',
                    isRider ? 'text-shride-surface' : 'text-shride-text-secondary'
                  )}
                >
                  Rider
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={clsx(
                  'flex-1 py-3 rounded-xl items-center flex-row justify-center',
                  !isRider && 'bg-shride-primary'
                )}
                onPress={() => setIsRider(false)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="car"
                  size={16}
                  color={!isRider ? '#FEF9E7' : '#60683D'}
                />
                <Text
                  className={clsx(
                    'font-body text-base font-semibold ml-2',
                    !isRider ? 'text-shride-surface' : 'text-shride-text-secondary'
                  )}
                >
                  Driver
                </Text>
              </TouchableOpacity>
            </View>

            {/* Location Inputs */}
            <View className="mb-4">
              {/* Source */}
              <TouchableOpacity
                className="flex-row items-center bg-shride-accent/25 rounded-xl px-4 py-4 mb-3"
                onPress={() =>
                  router.push({
                    pathname: '/location-picker',
                    params: { field: 'source' },
                  })
                }
                activeOpacity={0.7}
              >
                <View className="bg-shride-secondary/40 rounded-full w-8 h-8 items-center justify-center mr-3">
                  <Ionicons name="radio-button-on" size={14} color="#41431B" />
                </View>
                <Text
                  className={clsx(
                    'flex-1 font-body text-base',
                    source ? 'text-shride-text-primary' : 'text-shride-text-secondary'
                  )}
                  numberOfLines={1}
                >
                  {source?.name || 'Pick-up location'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#79786b" />
              </TouchableOpacity>

              {/* Dotted Line */}
              <View className="ml-8 -my-1.5 mb-1.5">
                <View className="w-px h-2 bg-shride-accent ml-0" />
                <View className="w-px h-2 bg-shride-accent ml-0 mt-1" />
              </View>

              {/* Destination */}
              <TouchableOpacity
                className="flex-row items-center bg-shride-accent/25 rounded-xl px-4 py-4"
                onPress={() =>
                  router.push({
                    pathname: '/location-picker',
                    params: { field: 'destination' },
                  })
                }
                activeOpacity={0.7}
              >
                <View className="bg-shride-primary/20 rounded-full w-8 h-8 items-center justify-center mr-3">
                  <Ionicons name="location" size={14} color="#41431B" />
                </View>
                <Text
                  className={clsx(
                    'flex-1 font-body text-base',
                    destination
                      ? 'text-shride-text-primary'
                      : 'text-shride-text-secondary'
                  )}
                  numberOfLines={1}
                >
                  {destination?.name || 'Where to?'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#79786b" />
              </TouchableOpacity>
            </View>

            {/* Search Button */}
            <TouchableOpacity
              className={clsx(
                'rounded-xl py-4 items-center flex-row justify-center',
                source && destination
                  ? 'bg-shride-primary'
                  : 'bg-shride-primary/30'
              )}
              onPress={handleSearch}
              disabled={!source || !destination}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isRider ? 'search' : 'add-circle'}
                size={20}
                color="#FEF9E7"
              />
              <Text className="font-body text-lg font-semibold text-shride-surface ml-2">
                {isRider ? 'Find a Shride' : 'Offer a Shride'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="px-5 mb-32"
        >
          <View className="flex-row gap-3">
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                className="flex-1 bg-shride-surface/90 rounded-2xl py-4 items-center"
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View className="bg-shride-secondary/30 rounded-full w-10 h-10 items-center justify-center mb-2">
                  <Ionicons
                    name={action.icon as any}
                    size={20}
                    color="#41431B"
                  />
                </View>
                <Text className="font-body text-xs font-medium text-shride-text-primary">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}
