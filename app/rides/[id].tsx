import RatingModal from '@/app/components/RatingModal'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Ride, RidePassenger, RideStatus, UserPreferences } from '@/types'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import MapView, { Marker } from '@/components/Map'

const PREFERENCE_ICONS: Record<keyof UserPreferences, { name: string; set: 'ionicons' | 'material'; label: string }> = {
  music: { name: 'musical-notes', set: 'ionicons', label: 'Music' },
  no_smoking: { name: 'smoking-off', set: 'material', label: 'No Smoking' },
  pets_ok: { name: 'paw', set: 'ionicons', label: 'Pets OK' },
  ac: { name: 'snow', set: 'ionicons', label: 'AC' },
  luggage_ok: { name: 'bag-handle', set: 'ionicons', label: 'Luggage' },
}

const STATUS_CONFIG: Record<RideStatus, { label: string; bg: string; text: string; icon: string }> = {
  open: { label: 'Open', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'radio-button-on' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'navigate' },
  completed: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-600', icon: 'checkmark-circle' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', icon: 'close-circle' },
}

export default function RideDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [ride, setRide] = useState<Ride | null>(null)
  const [passengers, setPassengers] = useState<RidePassenger[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)

  const isDriver = ride?.driver_id === user?.id
  const myPassengerEntry = passengers.find((p) => p.passenger_id === user?.id)
  const acceptedPassengers = passengers.filter((p) => p.status === 'accepted')

  useEffect(() => {
    fetchRide()
  }, [id])

  const fetchRide = async () => {
    setLoading(true)
    try {
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select('*, driver:profiles!driver_id(*)')
        .eq('id', id)
        .single()

      if (rideError) {
        Alert.alert('Error', 'Ride not found')
        router.back()
        return
      }

      setRide(rideData as Ride)

      const { data: passData } = await supabase
        .from('ride_passengers')
        .select('*, passenger:profiles!passenger_id(*)')
        .eq('ride_id', id)

      setPassengers((passData as RidePassenger[]) || [])

      // Check if current user has already reviewed this ride
      if (user && rideData.status === 'completed' && rideData.driver_id !== user.id) {
        const { data: reviewData } = await supabase
          .from('ride_reviews')
          .select('id')
          .eq('ride_id', id)
          .eq('reviewer_id', user.id)
          .maybeSingle()

        setHasReviewed(!!reviewData)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const requestToJoin = async () => {
    if (!user || !ride) return
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('ride_passengers')
        .insert({
          ride_id: ride.id,
          passenger_id: user.id,
          status: 'requested',
        })

      if (error) {
        Alert.alert('Error', error.message)
      } else {
        Alert.alert('Request Sent', 'The driver will review your request.')
        await fetchRide()
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
    setActionLoading(false)
  }

  const leaveRide = async () => {
    if (!user || !ride) return
    Alert.alert('Leave Ride', 'Are you sure you want to leave this ride?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true)
          const { error } = await supabase
            .from('ride_passengers')
            .delete()
            .eq('ride_id', ride.id)
            .eq('passenger_id', user.id)

          if (error) Alert.alert('Error', error.message)
          else await fetchRide()
          setActionLoading(false)
        },
      },
    ])
  }

  const cancelRide = async () => {
    if (!ride) return
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Ride',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true)
          const { error } = await supabase
            .from('rides')
            .update({ status: 'cancelled' })
            .eq('id', ride.id)

          if (error) Alert.alert('Error', error.message)
          else {
            Alert.alert('Cancelled', 'The ride has been cancelled.')
            await fetchRide()
          }
          setActionLoading(false)
        },
      },
    ])
  }

  const startJourney = async () => {
    if (!ride) return
    const accepted = passengers.filter((p) => p.status === 'accepted')
    if (accepted.length === 0) {
      Alert.alert('No Passengers', 'Accept at least one passenger before starting the journey.')
      return
    }
    Alert.alert('Start Journey', 'Are you ready to start this ride?', [
      { text: 'Not Yet', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          setActionLoading(true)
          const { error } = await supabase
            .from('rides')
            .update({ status: 'in_progress' })
            .eq('id', ride.id)

          if (error) Alert.alert('Error', error.message)
          else {
            Alert.alert('🚗 Journey Started!', 'Drive safe and enjoy the ride!')
            await fetchRide()
          }
          setActionLoading(false)
        },
      },
    ])
  }

  const endJourney = async () => {
    if (!ride) return
    Alert.alert('End Journey', 'Have you reached your destination?', [
      { text: 'Not Yet', style: 'cancel' },
      {
        text: 'End Ride',
        onPress: async () => {
          setActionLoading(true)
          const { error } = await supabase
            .from('rides')
            .update({ status: 'completed' })
            .eq('id', ride.id)

          if (error) Alert.alert('Error', error.message)
          else {
            Alert.alert('🎉 Ride Completed!', 'Thanks for driving with Shride!')
            await fetchRide()
          }
          setActionLoading(false)
        },
      },
    ])
  }

  const handlePassengerAction = async (passengerId: string, action: 'accepted' | 'rejected') => {
    setActionLoading(true)
    const { error } = await supabase
      .from('ride_passengers')
      .update({ status: action })
      .eq('ride_id', ride!.id)
      .eq('passenger_id', passengerId)

    if (error) Alert.alert('Error', error.message)
    else await fetchRide()
    setActionLoading(false)
  }

  const formatDepartureTime = (time: string) => {
    const date = new Date(time)
    return `${date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })}, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
  }

  if (loading) {
    return (
      <View className="flex-1 bg-shride-background items-center justify-center">
        <ActivityIndicator size="large" color="#41431B" />
      </View>
    )
  }

  if (!ride) return null

  const statusConfig = STATUS_CONFIG[ride.status]
  const activePrefs = Object.entries(ride.preferences || {}).filter(
    ([, val]) => val
  ) as [keyof UserPreferences, boolean][]

  // Show rating prompt for passengers on completed rides they haven't reviewed
  const showRatingPrompt =
    ride.status === 'completed' &&
    !isDriver &&
    myPassengerEntry &&
    myPassengerEntry.status === 'accepted' &&
    !hasReviewed

  return (
    <View className="flex-1 bg-shride-background">
      {/* Map Header */}
      <View className="h-56">
        <MapView
          provider="google"
          style={{ flex: 1 }}
          initialRegion={{
            latitude: (ride.source_lat + ride.dest_lat) / 2,
            longitude: (ride.source_lng + ride.dest_lng) / 2,
            latitudeDelta: Math.abs(ride.source_lat - ride.dest_lat) * 1.5 + 0.02,
            longitudeDelta: Math.abs(ride.source_lng - ride.dest_lng) * 1.5 + 0.02,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            coordinate={{ latitude: ride.source_lat, longitude: ride.source_lng }}
            title="Pick-up"
            pinColor="#41431B"
          />
          <Marker
            coordinate={{ latitude: ride.dest_lat, longitude: ride.dest_lng }}
            title="Drop-off"
            pinColor="#AEB784"
          />
        </MapView>
        <TouchableOpacity
          className="absolute top-14 left-5 bg-shride-surface/90 rounded-full p-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#41431B" />
        </TouchableOpacity>

        {/* Status Badge */}
        <View className="absolute top-14 right-5">
          <View className={`flex-row items-center px-3 py-1.5 rounded-full ${statusConfig.bg}`}>
            <Ionicons name={statusConfig.icon as any} size={14} color={
              ride.status === 'open' ? '#047857' :
              ride.status === 'in_progress' ? '#B45309' :
              ride.status === 'completed' ? '#4B5563' : '#DC2626'
            } />
            <Text className={`font-body text-xs font-semibold ml-1 ${statusConfig.text}`}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* In-Progress Banner */}
        {ride.status === 'in_progress' && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex-row items-center">
            <View className="bg-amber-100 rounded-full p-2 mr-3">
              <Ionicons name="navigate" size={20} color="#B45309" />
            </View>
            <View className="flex-1">
              <Text className="font-display text-base font-bold text-amber-800">
                Ride in Progress
              </Text>
              <Text className="font-body text-xs text-amber-600 mt-0.5">
                {isDriver ? 'Drive safe! End the ride when you arrive.' : 'Sit back and enjoy the ride!'}
              </Text>
            </View>
          </View>
        )}

        {/* Rating Prompt for Passengers */}
        {showRatingPrompt && (
          <TouchableOpacity
            className="bg-shride-primary/10 border border-shride-primary/30 rounded-2xl p-4 mb-4 flex-row items-center"
            onPress={() => setShowRatingModal(true)}
            activeOpacity={0.7}
          >
            <View className="bg-shride-secondary/40 rounded-full p-2 mr-3">
              <Ionicons name="star" size={20} color="#D4A017" />
            </View>
            <View className="flex-1">
              <Text className="font-display text-base font-bold text-shride-primary">
                Rate Your Driver
              </Text>
              <Text className="font-body text-xs text-shride-text-secondary mt-0.5">
                Tap to rate your experience with {(ride.driver as any)?.full_name || 'the driver'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#41431B" />
          </TouchableOpacity>
        )}

        {/* Already Reviewed Badge */}
        {ride.status === 'completed' && !isDriver && hasReviewed && (
          <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex-row items-center">
            <View className="bg-emerald-100 rounded-full p-2 mr-3">
              <Ionicons name="checkmark-circle" size={20} color="#047857" />
            </View>
            <View className="flex-1">
              <Text className="font-display text-sm font-bold text-emerald-800">
                Review Submitted
              </Text>
              <Text className="font-body text-xs text-emerald-600 mt-0.5">
                Thanks for rating this ride!
              </Text>
            </View>
          </View>
        )}

        {/* Route */}
        <View className="bg-shride-surface rounded-2xl p-4 mb-4">
          <View className="flex-row items-start">
            <View className="items-center mr-3 pt-1">
              <Ionicons name="radio-button-on" size={14} color="#41431B" />
              <View className="w-px h-6 bg-shride-accent" />
              <Ionicons name="location" size={14} color="#41431B" />
            </View>
            <View className="flex-1">
              <Text className="font-body text-base text-shride-text-primary mb-3">
                {ride.source_name}
              </Text>
              <Text className="font-body text-base text-shride-text-primary">
                {ride.dest_name}
              </Text>
            </View>
          </View>
        </View>

        {/* Time, Price, Seats */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-shride-surface rounded-2xl p-4 items-center">
            <Ionicons name="time-outline" size={22} color="#41431B" />
            <Text className="font-body text-xs text-shride-text-secondary mt-1">Departure</Text>
            <Text className="font-display text-sm font-bold text-shride-primary mt-0.5 text-center">
              {formatDepartureTime(ride.departure_time)}
            </Text>
          </View>
          <View className="flex-1 bg-shride-surface rounded-2xl p-4 items-center">
            <Ionicons name="cash-outline" size={22} color="#41431B" />
            <Text className="font-body text-xs text-shride-text-secondary mt-1">Price</Text>
            <Text className="font-display text-lg font-bold text-shride-primary mt-0.5">
              ₹{ride.price_per_seat}
            </Text>
          </View>
          <View className="flex-1 bg-shride-surface rounded-2xl p-4 items-center">
            <Ionicons name="people-outline" size={22} color="#41431B" />
            <Text className="font-body text-xs text-shride-text-secondary mt-1">Seats</Text>
            <Text className="font-display text-lg font-bold text-shride-primary mt-0.5">
              {ride.available_seats}
            </Text>
          </View>
        </View>

        {/* Driver */}
        <Text className="font-display text-lg font-bold text-shride-primary mb-3">Driver</Text>
        <TouchableOpacity 
          className="bg-shride-surface rounded-2xl p-4 mb-4 flex-row items-center"
          onPress={() => router.push(`/profile/${ride.driver_id}`)}
          activeOpacity={0.7}
        >
          <View className="bg-shride-secondary/30 rounded-full w-12 h-12 items-center justify-center mr-3">
            <Ionicons name="person" size={24} color="#41431B" />
          </View>
          <View className="flex-1">
            <Text className="font-body text-base font-semibold text-shride-text-primary">
              {(ride.driver as any)?.full_name || 'Driver'}
            </Text>
            <View className="flex-row items-center mt-0.5">
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
          <Ionicons name="chevron-forward" size={16} color="#79786b" />
        </TouchableOpacity>

        {/* Vehicle */}
        {ride.vehicle_model && (
          <>
            <Text className="font-display text-lg font-bold text-shride-primary mb-3">Vehicle</Text>
            <View className="bg-shride-surface rounded-2xl p-4 mb-4 flex-row items-center">
              <Ionicons name="car" size={24} color="#41431B" />
              <View className="ml-3">
                <Text className="font-body text-base text-shride-text-primary">
                  {ride.vehicle_model} • {ride.vehicle_color}
                </Text>
                {ride.vehicle_plate && (
                  <Text className="font-mono text-sm text-shride-text-secondary mt-0.5">
                    {ride.vehicle_plate}
                  </Text>
                )}
              </View>
            </View>
          </>
        )}

        {/* Preferences */}
        {activePrefs.length > 0 && (
          <>
            <Text className="font-display text-lg font-bold text-shride-primary mb-3">Ride Preferences</Text>
            <View className="bg-shride-surface rounded-2xl p-4 mb-4">
              <View className="flex-row flex-wrap gap-2">
                {activePrefs.map(([key]) => {
                  const item = PREFERENCE_ICONS[key]
                  if (!item) return null
                  return (
                    <View key={key} className="flex-row items-center bg-shride-secondary/20 px-3 py-2 rounded-full">
                      {item.set === 'ionicons' ? (
                        <Ionicons name={item.name as any} size={16} color="#41431B" />
                      ) : (
                        <MaterialCommunityIcons name={item.name as any} size={16} color="#41431B" />
                      )}
                      <Text className="font-body text-sm text-shride-text-primary ml-1.5">{item.label}</Text>
                    </View>
                  )
                })}
                {ride.gender_preference === 'female_only' && (
                  <View className="flex-row items-center bg-pink-50 px-3 py-2 rounded-full">
                    <Ionicons name="female" size={16} color="#DB2777" />
                    <Text className="font-body text-sm text-pink-600 ml-1.5">Female Only</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Passengers (driver view) */}
        {isDriver && passengers.length > 0 && (
          <>
            <Text className="font-display text-lg font-bold text-shride-primary mb-3">
              Passengers ({passengers.length})
            </Text>
            <View className="bg-shride-surface rounded-2xl p-4 mb-4">
              {passengers.map((p) => (
                <TouchableOpacity 
                  key={p.passenger_id} 
                  className="flex-row items-center py-2 border-b border-shride-accent/20 last:border-b-0"
                  onPress={() => router.push(`/profile/${p.passenger_id}`)}
                  activeOpacity={0.7}
                >
                  <View className="bg-shride-secondary/30 rounded-full w-9 h-9 items-center justify-center mr-3">
                    <Ionicons name="person" size={18} color="#41431B" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-body text-sm text-shride-text-primary">
                      {(p.passenger as any)?.full_name || 'Passenger'}
                    </Text>
                    <Text className="font-body text-xs text-shride-text-secondary capitalize">
                      {p.status}
                    </Text>
                  </View>
                  {p.status === 'requested' && ride.status === 'open' && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="bg-emerald-100 rounded-lg px-3 py-1.5"
                        onPress={() => handlePassengerAction(p.passenger_id, 'accepted')}
                      >
                        <Text className="font-body text-xs text-emerald-700 font-medium">Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-red-50 rounded-lg px-3 py-1.5"
                        onPress={() => handlePassengerAction(p.passenger_id, 'rejected')}
                      >
                        <Text className="font-body text-xs text-red-600 font-medium">Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {!(p.status === 'requested' && ride.status === 'open') && (
                    <Ionicons name="chevron-forward" size={16} color="#79786b" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Action Buttons */}
        <View className="mb-10">
          {isDriver ? (
            <>
              {/* Driver: Start Journey (only when ride is open and has accepted passengers) */}
              {ride.status === 'open' && (
                <View className="gap-3">
                  <TouchableOpacity
                    className="bg-shride-primary rounded-xl py-4 items-center flex-row justify-center"
                    onPress={startJourney}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#FEF9E7" />
                    ) : (
                      <>
                        <Ionicons name="navigate" size={20} color="#FEF9E7" />
                        <Text className="font-body text-base font-semibold text-shride-surface ml-2">
                          Start Journey
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="border border-red-200 bg-red-50 rounded-xl py-4 items-center"
                    onPress={cancelRide}
                    disabled={actionLoading}
                  >
                    <Text className="font-body text-base font-semibold text-red-600">Cancel Ride</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Driver: End Journey (only when ride is in progress) */}
              {ride.status === 'in_progress' && (
                <TouchableOpacity
                  className="bg-shride-primary rounded-xl py-4 items-center flex-row justify-center"
                  onPress={endJourney}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FEF9E7" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FEF9E7" />
                      <Text className="font-body text-base font-semibold text-shride-surface ml-2">
                        End Journey
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : myPassengerEntry ? (
            <>
              {/* Passenger: Leave / Cancel / Rate */}
              {(ride.status === 'open' || ride.status === 'in_progress') && (
                <TouchableOpacity
                  className="border border-red-200 bg-red-50 rounded-xl py-4 items-center"
                  onPress={leaveRide}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#DC2626" />
                  ) : (
                    <Text className="font-body text-base font-semibold text-red-600">
                      {myPassengerEntry.status === 'requested' ? 'Cancel Request' : 'Leave Ride'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Passenger: Rate button for completed rides */}
              {showRatingPrompt && (
                <TouchableOpacity
                  className="bg-shride-primary rounded-xl py-4 items-center flex-row justify-center mt-3"
                  onPress={() => setShowRatingModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="star" size={20} color="#FEF9E7" />
                  <Text className="font-body text-base font-semibold text-shride-surface ml-2">
                    Rate Driver
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            ride.status === 'open' &&
            ride.available_seats > 0 && (
              <TouchableOpacity
                className="bg-shride-primary rounded-xl py-4 items-center"
                onPress={requestToJoin}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FEF9E7" />
                ) : (
                  <Text className="font-body text-lg font-semibold text-shride-surface">
                    Request to Join
                  </Text>
                )}
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>

      {/* Rating Modal */}
      {ride && user && (
        <RatingModal
          visible={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSubmit={() => {
            setShowRatingModal(false)
            setHasReviewed(true)
            fetchRide() // Refresh to get updated driver rating
          }}
          rideId={ride.id}
          driverId={ride.driver_id}
          driverName={(ride.driver as any)?.full_name || 'the driver'}
          reviewerId={user.id}
        />
      )}
    </View>
  )
}
