import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import { supabase } from '@/lib/supabase'
import type { GenderPreference, Ride, UserPreferences } from '@/types'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const PREFERENCE_ICONS: Record<string, { name: string; set: 'ionicons' | 'material'; label: string }> = {
  music: { name: 'musical-notes', set: 'ionicons', label: 'Music' },
  no_smoking: { name: 'smoking-off', set: 'material', label: 'No Smoking' },
  pets_ok: { name: 'paw', set: 'ionicons', label: 'Pets OK' },
  ac: { name: 'snow', set: 'ionicons', label: 'AC' },
  luggage_ok: { name: 'bag-handle', set: 'ionicons', label: 'Luggage' },
}

// Haversine distance in meters between two lat/lng points
const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ~500m expressed as degrees (slightly oversized for bounding-box pre-filter)
const RADIUS_METERS = 500
const DEG_OFFSET = 0.006 // ~660m, a bit larger than 500m to cover corners

export default function Search() {
  const router = useRouter()
  const { user } = useAuth()
  const { source, destination } = useLocation()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filterDate, setFilterDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [genderFilter, setGenderFilter] = useState<GenderPreference | 'all'>('all')
  const [prefsFilter, setPrefsFilter] = useState<Partial<UserPreferences>>({})

  const togglePref = (key: keyof UserPreferences) => {
    setPrefsFilter(prev => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = true
      return next
    })
  }

  const fetchRides = useCallback(async () => {
    setLoading(true)
    try {
      // Build base query — fetch future regular rides OR any recurring ride
      let query = supabase
        .from('rides')
        .select('*, driver:profiles!driver_id(*)')
        .eq('status', 'open')
        .gt('available_seats', 0)
        .or(`departure_time.gte.${new Date().toISOString()},is_recurring.eq.true`)
        .order('departure_time', { ascending: true })

      if (user) {
        query = query.neq('driver_id', user.id)
      }

      // We fetch all potential rides and filter them client-side against their full route_geom trajectories

      if (genderFilter !== 'all') {
        query = query.eq('gender_preference', genderFilter)
      }



      if (Object.keys(prefsFilter).length > 0) {
        query = query.contains('preferences', prefsFilter as Record<string, boolean>)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching rides:', error)
        setRides([])
        setLoading(false)
        return
      }

      let results = (data as Ride[]) || []

      // Client-side date filtering (to handle recurring rides properly)
      const targetDate = filterDate || new Date()
      const targetDay = targetDate.getDay()
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      results = results.filter(ride => {
        if (ride.is_recurring) {
          // Check if this recurring ride operates on the target day of the week
          if (!ride.recurring_days || !ride.recurring_days.includes(targetDay)) return false
          
          // Check if the time has already passed for the target date
          const rideTime = new Date(ride.departure_time)
          const scheduledTimeForTarget = new Date(targetDate)
          scheduledTimeForTarget.setHours(rideTime.getHours(), rideTime.getMinutes(), 0, 0)
          
          if (scheduledTimeForTarget < new Date()) {
            return false
          }
          return true
        } else {
          // Normal ride logic
          if (filterDate) {
            const rideDate = new Date(ride.departure_time)
            return rideDate >= startOfDay && rideDate <= endOfDay
          }
          return true // If no filter date, the DB query already filtered for >= now
        }
      })

      // If locations are set, do precise 500m Haversine filtering along the route geometry
      if (source && destination && results.length > 0) {
        const matchingRides = []

        for (const ride of results) {
            let pickupDist = Infinity
            let dropDist = Infinity
            let pickupIdx = -1
            let dropIdx = -1

            // 1. Check points along the route trajectory
            if (ride.route_geom && Array.isArray((ride.route_geom as any).coordinates)) {
                const coords = (ride.route_geom as any).coordinates // Array of [lng, lat]
                
                // Find closest point to passenger's pickup
                for (let i = 0; i < coords.length; i++) {
                    const [lng, lat] = coords[i]
                    const dist = haversineMeters(source.latitude, source.longitude, lat, lng)
                    if (dist < pickupDist) {
                        pickupDist = dist
                        pickupIdx = i
                    }
                }

                // If pickup is viable, search for dropoff AFTER the pickup point
                if (pickupDist <= RADIUS_METERS) {
                    for (let i = pickupIdx; i < coords.length; i++) {
                        const [lng, lat] = coords[i]
                        const dist = haversineMeters(destination.latitude, destination.longitude, lat, lng)
                        if (dist < dropDist) {
                            dropDist = dist
                            dropIdx = i
                        }
                    }
                }
            }

            // 2. Fallback for rides without geometry (e.g. legacy test data)
            if (pickupIdx === -1 || dropIdx === -1 || pickupDist > RADIUS_METERS || dropDist > RADIUS_METERS) {
                pickupDist = haversineMeters(source.latitude, source.longitude, ride.source_lat, ride.source_lng)
                dropDist = haversineMeters(destination.latitude, destination.longitude, ride.dest_lat, ride.dest_lng)
                if (pickupDist <= RADIUS_METERS && dropDist <= RADIUS_METERS) {
                    pickupIdx = 0
                    dropIdx = 1
                }
            }

            // If both points are within radius and pickup happens before dropoff
            if (pickupDist <= RADIUS_METERS && dropDist <= RADIUS_METERS && pickupIdx <= dropIdx) {
                matchingRides.push({ ...ride, pickupDist, dropDist })
            }
        }
        
        results = matchingRides.sort((a, b) => (a.pickupDist + a.dropDist) - (b.pickupDist + b.dropDist))
      }

      setRides(results)
    } catch (err) {
      console.error('Error:', err)
    }
    setLoading(false)
  }, [source, destination, genderFilter, filterDate, prefsFilter, user])

  useEffect(() => {
    fetchRides()
  }, [fetchRides])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchRides()
    setRefreshing(false)
  }

  const formatDepartureTime = (ride: Ride) => {
    const timeStr = new Date(ride.departure_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

    if (ride.is_recurring) {
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const daysStr = ride.recurring_days?.map(d => weekdays[d]).join(', ')
      return `${daysStr} • ${timeStr}`
    }

    const date = new Date(ride.departure_time)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === now.toDateString()) {
      return `Today, ${timeStr}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${timeStr}`
    } else {
      return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${timeStr}`
    }
  }

  const RideCard = ({ ride }: { ride: Ride }) => {
    const activePrefs = Object.entries(ride.preferences || {}).filter(([, val]) => val)
    const pickupDist = (ride as any).pickupDist as number | undefined
    const dropDist = (ride as any).dropDist as number | undefined

    return (
      <TouchableOpacity
        className="bg-shride-surface rounded-2xl p-4 mb-3"
        onPress={() => router.push(`/rides/${ride.id}`)}
        activeOpacity={0.7}
      >
        {/* Driver info row */}
        <View className="flex-row items-center mb-3">
          <View className="bg-shride-secondary/30 rounded-full w-10 h-10 items-center justify-center mr-3">
            <Ionicons name="person" size={20} color="#41431B" />
          </View>
          <View className="flex-1">
            <Text className="font-body text-base font-semibold text-shride-text-primary">
              {(ride.driver as any)?.full_name || 'Driver'}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="star" size={12} color="#D4A017" />
              <Text className="font-body text-xs text-shride-text-secondary ml-1">
                {(ride.driver as any)?.rating?.toFixed(1) || '–'}
              </Text>
              {(ride.driver as any)?.is_verified && (
                <View className="flex-row items-center ml-2">
                  <Ionicons name="shield-checkmark" size={12} color="#41431B" />
                  <Text className="font-body text-xs text-shride-primary ml-0.5">Verified</Text>
                </View>
              )}
            </View>
          </View>
          <View className="items-end">
            <Text className="font-display text-lg font-bold text-shride-primary">
              ₹{ride.price_per_seat}
            </Text>
            <Text className="font-body text-xs text-shride-text-secondary">per seat</Text>
          </View>
        </View>

        {/* Route */}
        <View className="flex-row items-start mb-3 ml-1">
          <View className="items-center mr-3 pt-1">
            <Ionicons name="radio-button-on" size={12} color="#41431B" />
            <View className="w-px h-5 bg-shride-accent" />
            <Ionicons name="location" size={12} color="#41431B" />
          </View>
          <View className="flex-1">
            <Text className="font-body text-sm text-shride-text-primary mb-2" numberOfLines={1}>
              {ride.source_name}
            </Text>
            <Text className="font-body text-sm text-shride-text-primary" numberOfLines={1}>
              {ride.dest_name}
            </Text>
          </View>
        </View>

        {/* Meta row */}
        <View className="flex-row items-center justify-between border-t border-shride-accent/20 pt-3">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#60683D" />
            <Text className="font-body text-xs text-shride-text-secondary ml-1">
              {formatDepartureTime(ride)}
            </Text>
          </View>
          {pickupDist !== undefined && (
            <View className="flex-row items-center bg-emerald-50 px-2 py-0.5 rounded-full ml-2">
              <Ionicons name="navigate-outline" size={12} color="#059669" />
              <Text className="font-body text-xs text-emerald-700 ml-1">
                {Math.round(pickupDist)}m / {Math.round(dropDist!)}m
              </Text>
            </View>
          )}
          <View className="flex-1" />
          <View className="flex-row items-center mr-2">
            <Ionicons name="people-outline" size={14} color="#60683D" />
            <Text className="font-body text-xs text-shride-text-secondary ml-1">
              {ride.available_seats} seats
            </Text>
          </View>
          {ride.gender_preference === 'female_only' && (
            <View className="flex-row items-center bg-pink-50 px-2 py-0.5 rounded-full">
              <Ionicons name="female" size={12} color="#DB2777" />
              <Text className="font-body text-xs text-pink-600 ml-0.5">Female only</Text>
            </View>
          )}
          <View className="flex-row items-center gap-1.5">
            {activePrefs.slice(0, 3).map(([key]) => {
              const iconData = PREFERENCE_ICONS[key]
              if (!iconData) return null
              return iconData.set === 'ionicons' ? (
                <Ionicons key={key} name={iconData.name as any} size={14} color="#60683D" />
              ) : (
                <MaterialCommunityIcons key={key} name={iconData.name as any} size={14} color="#60683D" />
              )
            })}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View className="flex-1 bg-shride-background">
      {/* Header */}
      <View className="bg-shride-surface pt-14 pb-4 px-5">
        <Text className="font-display text-2xl font-bold text-shride-primary mb-4">
          Find a Shride
        </Text>

        {/* Location inputs */}
        <TouchableOpacity
          className="flex-row items-center bg-shride-accent/40 rounded-xl px-3 py-3 mb-2"
          onPress={() => router.push({ pathname: '/location-picker', params: { field: 'source' } })}
        >
          <Ionicons name="radio-button-on" size={14} color="#41431B" />
          <Text className={`font-body text-sm ml-2 flex-1 ${source ? 'text-shride-text-primary' : 'text-[#79786b]'}`} numberOfLines={1}>
            {source?.name || 'From where?'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center bg-shride-accent/40 rounded-xl px-3 py-3"
          onPress={() => router.push({ pathname: '/location-picker', params: { field: 'destination' } })}
        >
          <Ionicons name="location" size={14} color="#41431B" />
          <Text className={`font-body text-sm ml-2 flex-1 ${destination ? 'text-shride-text-primary' : 'text-[#79786b]'}`} numberOfLines={1}>
            {destination?.name || 'Where to?'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}>
          <TouchableOpacity
            className={`flex-row items-center px-3 py-2 rounded-full border ${filterDate ? 'bg-shride-primary border-shride-primary' : 'border-shride-accent bg-shride-surface'}`}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={14} color={filterDate ? '#FEF9E7' : '#60683D'} />
            <Text className={`font-body text-sm ml-1 ${filterDate ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
              {filterDate ? filterDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Date'}
            </Text>
            {filterDate && (
              <TouchableOpacity className="ml-1" onPress={() => setFilterDate(null)}>
                <Ionicons name="close-circle" size={14} color="#FEF9E7" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {(['all', 'anyone', 'female_only'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              className={`px-3 py-2 rounded-full border ${genderFilter === g ? 'bg-shride-primary border-shride-primary' : 'border-shride-accent bg-shride-surface'}`}
              onPress={() => setGenderFilter(g)}
            >
              <Text className={`font-body text-sm ${genderFilter === g ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
                {g === 'all' ? 'All Genders' : g === 'anyone' ? 'Anyone' : 'Female Only'}
              </Text>
            </TouchableOpacity>
          ))}

          {Object.entries(PREFERENCE_ICONS).map(([key, data]) => {
            const typedKey = key as keyof UserPreferences
            const active = !!prefsFilter[typedKey]
            return (
              <TouchableOpacity
                key={key}
                onPress={() => togglePref(typedKey)}
                className={`flex-row items-center px-3 py-2 rounded-full border ${active ? 'bg-shride-primary border-shride-primary' : 'border-shride-accent bg-shride-surface'}`}
              >
                {data.set === 'ionicons' ? (
                  <Ionicons name={data.name as any} size={14} color={active ? '#FEF9E7' : '#60683D'} />
                ) : (
                  <MaterialCommunityIcons name={data.name as any} size={14} color={active ? '#FEF9E7' : '#60683D'} />
                )}
                <Text className={`font-body text-sm ml-1 ${active ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
                  {data.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={filterDate || new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false)
            if (date) setFilterDate(date)
          }}
        />
      )}

      {/* Rides List */}
      {loading && rides.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#41431B" />
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RideCard ride={item} />}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#41431B" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="car-outline" size={48} color="#AEB784" />
              <Text className="font-body text-base text-shride-text-secondary mt-4 text-center">
                No rides available yet.{'\n'}Pull to refresh or try different filters.
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}
