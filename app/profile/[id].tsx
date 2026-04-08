import { supabase } from '@/lib/supabase'
import type { Profile, UserPreferences } from '@/types'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const PREFERENCE_OPTIONS: { key: keyof UserPreferences; label: string; icon: string; iconSet: 'ionicons' | 'material' }[] = [
  { key: 'music', label: 'Music', icon: 'musical-notes', iconSet: 'ionicons' },
  { key: 'no_smoking', label: 'No Smoking', icon: 'smoking-off', iconSet: 'material' },
  { key: 'pets_ok', label: 'Pets OK', icon: 'paw', iconSet: 'ionicons' },
  { key: 'ac', label: 'AC', icon: 'snow', iconSet: 'ionicons' },
  { key: 'luggage_ok', label: 'Luggage', icon: 'bag-handle', iconSet: 'ionicons' },
]

export default function PublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [id])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data as Profile)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<Ionicons key={i} name="star" size={16} color="#D4A017" />)
      } else if (i - 0.5 <= rating) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color="#D4A017" />)
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color="#D4A017" />)
      }
    }
    return stars
  }

  if (loading) {
    return (
      <View className="flex-1 bg-shride-background items-center justify-center">
        <ActivityIndicator size="large" color="#41431B" />
      </View>
    )
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-shride-background items-center justify-center px-6">
        <Ionicons name="person-outline" size={48} color="#AEB784" />
        <Text className="font-body text-base text-shride-text-secondary mt-4 text-center">
          Profile not found.
        </Text>
        <TouchableOpacity
          className="mt-4 bg-shride-primary rounded-xl px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="font-body text-sm font-semibold text-shride-surface">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : ''

  const preferences = profile.preferences || {}

  return (
    <View className="flex-1 bg-shride-background">
      {/* Header */}
      <View className="bg-shride-surface pt-14 pb-6 px-5 items-center">
        {/* Back Button */}
        <TouchableOpacity
          className="absolute top-14 left-5 p-1"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#41431B" />
        </TouchableOpacity>

        {/* Avatar */}
        <View className="bg-shride-primary rounded-full w-20 h-20 items-center justify-center mb-3">
          <Ionicons name="person" size={40} color="#FEF9E7" />
        </View>

        <Text className="font-display text-xl font-bold text-shride-primary">
          {profile.full_name || 'No Name'}
        </Text>

        {/* Rating & Verified */}
        <View className="flex-row items-center mt-2">
          <View className="flex-row items-center">
            {renderStars(profile.rating || 0)}
            <Text className="font-body text-sm text-shride-text-secondary ml-1">
              ({profile.total_ratings || 0})
            </Text>
          </View>
          {profile.is_verified && (
            <View className="flex-row items-center ml-3 bg-shride-secondary/30 px-2.5 py-1 rounded-full">
              <Ionicons name="shield-checkmark" size={14} color="#41431B" />
              <Text className="font-body text-xs text-shride-primary ml-1 font-medium">Verified</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View className="flex-row mb-5 gap-3">
          <View className="flex-1 bg-shride-surface rounded-2xl p-4 items-center">
            <Text className="font-display text-2xl font-bold text-shride-primary">
              {profile.total_ratings || 0}
            </Text>
            <Text className="font-body text-xs text-shride-text-secondary">Reviews</Text>
          </View>
          <View className="flex-1 bg-shride-surface rounded-2xl p-4 items-center">
            <Text className="font-display text-2xl font-bold text-shride-primary">
              {(profile.rating || 0).toFixed(1)}
            </Text>
            <Text className="font-body text-xs text-shride-text-secondary">Rating</Text>
          </View>
          <View className="flex-1 bg-shride-surface rounded-2xl p-4 items-center">
            <Text className="font-display text-sm font-bold text-shride-primary">
              {memberSince}
            </Text>
            <Text className="font-body text-xs text-shride-text-secondary">Member Since</Text>
          </View>
        </View>

        {/* Bio */}
        <Text className="font-display text-lg font-bold text-shride-primary mb-3">About</Text>
        <View className="bg-shride-surface rounded-2xl p-4 mb-5">
          <Text className="font-body text-base text-shride-text-primary">
            {profile.bio || 'No bio provided.'}
          </Text>
        </View>

        {/* Gender */}
        {profile.gender && (
          <>
            <Text className="font-display text-lg font-bold text-shride-primary mb-3">Details</Text>
            <View className="bg-shride-surface rounded-2xl p-4 mb-5">
              <View className="flex-row items-center">
                <Ionicons
                  name={profile.gender === 'male' ? 'male' : profile.gender === 'female' ? 'female' : 'male-female'}
                  size={18}
                  color="#41431B"
                />
                <Text className="font-body text-base text-shride-text-primary ml-2 capitalize">
                  {profile.gender}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Preferences */}
        <Text className="font-display text-lg font-bold text-shride-primary mb-3">Preferences</Text>
        <View className="bg-shride-surface rounded-2xl p-4 mb-10">
          <View className="flex-row flex-wrap gap-3">
            {PREFERENCE_OPTIONS.map((pref) => {
              const isActive = preferences[pref.key]
              return (
                <View
                  key={pref.key}
                  className={`flex-row items-center px-4 py-2.5 rounded-full border ${isActive
                    ? 'bg-shride-primary border-shride-primary'
                    : 'bg-transparent border-shride-accent'
                    }`}
                >
                  {pref.iconSet === 'ionicons' ? (
                    <Ionicons
                      name={pref.icon as any}
                      size={16}
                      color={isActive ? '#FEF9E7' : '#60683D'}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={pref.icon as any}
                      size={16}
                      color={isActive ? '#FEF9E7' : '#60683D'}
                    />
                  )}
                  <Text
                    className={`font-body text-sm font-medium ml-2 ${isActive ? 'text-shride-surface' : 'text-shride-text-secondary'
                      }`}
                  >
                    {pref.label}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
