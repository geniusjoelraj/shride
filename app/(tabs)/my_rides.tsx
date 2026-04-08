import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Ride, RideStatus } from '@/types'
import { Ionicons } from '@expo/vector-icons'
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

const STATUS_COLORS: Record<RideStatus, { bg: string; text: string }> = {
  open: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-600' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600' },
}

const STATUS_LABELS: Record<RideStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function MyRides() {
  const router = useRouter()
  const { user } = useAuth()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'driver' | 'passenger'>('driver')
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming')
  const [filterDate, setFilterDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [statusFilter, setStatusFilter] = useState<RideStatus | 'all'>('all')

  const fetchRides = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const now = new Date().toISOString()

      if (viewMode === 'driver') {
        let query = supabase
          .from('rides')
          .select('*')
          .eq('driver_id', user.id)
          .order('departure_time', { ascending: timeFilter === 'upcoming' })

        if (timeFilter === 'upcoming') {
          query = query.gte('departure_time', now)
        } else {
          query = query.lt('departure_time', now)
        }

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        if (filterDate) {
          const startOfDay = new Date(filterDate)
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(filterDate)
          endOfDay.setHours(23, 59, 59, 999)
          query = query
            .gte('departure_time', startOfDay.toISOString())
            .lte('departure_time', endOfDay.toISOString())
        }

        const { data, error } = await query
        if (error) console.error(error)
        else setRides((data as Ride[]) || [])
      } else {
        // As passenger — get ride_ids from ride_passengers, then fetch rides
        let passengerQuery = supabase
          .from('ride_passengers')
          .select('ride_id')
          .eq('passenger_id', user.id)

        const { data: passengerData, error: pError } = await passengerQuery
        if (pError) {
          console.error(pError)
          setRides([])
        } else if (passengerData && passengerData.length > 0) {
          const rideIds = passengerData.map((p: any) => p.ride_id)
          let ridesQuery = supabase
            .from('rides')
            .select('*, driver:profiles!driver_id(*)')
            .in('id', rideIds)
            .order('departure_time', { ascending: timeFilter === 'upcoming' })

          if (timeFilter === 'upcoming') {
            ridesQuery = ridesQuery.gte('departure_time', now)
          } else {
            ridesQuery = ridesQuery.lt('departure_time', now)
          }

          if (statusFilter !== 'all') {
            ridesQuery = ridesQuery.eq('status', statusFilter)
          }

          if (filterDate) {
            const startOfDay = new Date(filterDate)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(filterDate)
            endOfDay.setHours(23, 59, 59, 999)
            ridesQuery = ridesQuery
              .gte('departure_time', startOfDay.toISOString())
              .lte('departure_time', endOfDay.toISOString())
          }

          const { data: ridesData, error: rError } = await ridesQuery
          if (rError) console.error(rError)
          else setRides((ridesData as Ride[]) || [])
        } else {
          setRides([])
        }
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [user, viewMode, timeFilter, filterDate, statusFilter])

  useEffect(() => {
    fetchRides()
  }, [fetchRides])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchRides()
    setRefreshing(false)
  }

  const formatDepartureTime = (time: string) => {
    const date = new Date(time)
    return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
  }

  const RideCard = ({ ride }: { ride: Ride }) => {
    const statusStyle = STATUS_COLORS[ride.status] || STATUS_COLORS.open

    return (
      <TouchableOpacity
        className="bg-shride-surface rounded-2xl p-4 mb-3"
        onPress={() => router.push(`/rides/${ride.id}`)}
        activeOpacity={0.7}
      >
        {/* Status & Time */}
        <View className="flex-row items-center justify-between mb-3">
          <View className={`px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
            <Text className={`font-body text-xs font-medium ${statusStyle.text}`}>
              {STATUS_LABELS[ride.status]}
            </Text>
          </View>
          <Text className="font-body text-xs text-shride-text-secondary">
            {formatDepartureTime(ride.departure_time)}
          </Text>
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

        {/* Meta */}
        <View className="flex-row items-center justify-between border-t border-shride-accent/20 pt-3">
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={14} color="#60683D" />
            <Text className="font-body text-xs text-shride-text-secondary ml-1">
              {ride.available_seats} seats left
            </Text>
          </View>
          <Text className="font-display text-base font-bold text-shride-primary">
            ₹{ride.price_per_seat}/seat
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View className="flex-1 bg-shride-background">
      {/* Header */}
      <View className="bg-shride-surface pt-14 pb-4 px-5">
        <Text className="font-display text-2xl font-bold text-shride-primary mb-4">
          My Rides
        </Text>

        {/* Driver / Passenger Toggle */}
        <View className="flex-row bg-shride-accent/40 rounded-xl p-1 mb-3">
          <TouchableOpacity
            className={`flex-1 py-2.5 rounded-lg items-center ${viewMode === 'driver' ? 'bg-shride-primary' : ''}`}
            onPress={() => setViewMode('driver')}
          >
            <Text className={`font-body text-sm font-semibold ${viewMode === 'driver' ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
              As Driver
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2.5 rounded-lg items-center ${viewMode === 'passenger' ? 'bg-shride-primary' : ''}`}
            onPress={() => setViewMode('passenger')}
          >
            <Text className={`font-body text-sm font-semibold ${viewMode === 'passenger' ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
              As Passenger
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming / Past Toggle */}
        <View className="flex-row bg-shride-accent/40 rounded-xl p-1">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${timeFilter === 'upcoming' ? 'bg-shride-primary' : ''}`}
            onPress={() => setTimeFilter('upcoming')}
          >
            <Text className={`font-body text-xs font-semibold ${timeFilter === 'upcoming' ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${timeFilter === 'past' ? 'bg-shride-primary' : ''}`}
            onPress={() => setTimeFilter('past')}
          >
            <Text className={`font-body text-xs font-semibold ${timeFilter === 'past' ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
              Past
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters Row */}
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

          {(['all', 'open', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-full border ${statusFilter === s ? 'bg-shride-primary border-shride-primary' : 'border-shride-accent bg-shride-surface'}`}
            >
              <Text className={`font-body text-sm font-medium ${statusFilter === s ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
                {s === 'all' ? 'All Statuses' : STATUS_LABELS[s as RideStatus]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={filterDate || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false)
            if (date) setFilterDate(date)
          }}
        />
      )}

      {/* Rides List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#41431B" />
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RideCard ride={item} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#41431B" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="car-outline" size={48} color="#AEB784" />
              <Text className="font-body text-base text-shride-text-secondary mt-4 text-center">
                {viewMode === 'driver'
                  ? "You haven't created any rides yet."
                  : "You haven't joined any rides yet."}
              </Text>
              <TouchableOpacity
                className="mt-4 bg-shride-primary rounded-xl px-6 py-3"
                onPress={() => viewMode === 'driver' ? router.push('/create-ride') : router.push('/(tabs)/search')}
              >
                <Text className="font-body text-sm font-semibold text-shride-surface">
                  {viewMode === 'driver' ? 'Create a Ride' : 'Find a Ride'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}
