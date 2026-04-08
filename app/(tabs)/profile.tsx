import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { UserPreferences } from '@/types'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'

const PREFERENCE_OPTIONS: { key: keyof UserPreferences; label: string; icon: string; iconSet: 'ionicons' | 'material' }[] = [
  { key: 'music', label: 'Music', icon: 'musical-notes', iconSet: 'ionicons' },
  { key: 'no_smoking', label: 'No Smoking', icon: 'smoking-off', iconSet: 'material' },
  { key: 'pets_ok', label: 'Pets OK', icon: 'paw', iconSet: 'ionicons' },
  { key: 'ac', label: 'AC', icon: 'snow', iconSet: 'ionicons' },
  { key: 'luggage_ok', label: 'Luggage', icon: 'bag-handle', iconSet: 'ionicons' },
]

export default function Profile() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Editable fields
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({
    music: false,
    no_smoking: true,
    pets_ok: false,
    ac: true,
    luggage_ok: true,
  })

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setBio(profile.bio || '')
      setPhone(profile.phone || '')
      setGender(profile.gender)
      setPreferences(profile.preferences || {
        music: false,
        no_smoking: true,
        pets_ok: false,
        ac: true,
        luggage_ok: true,
      })
    }
  }, [profile])

  const togglePreference = (key: keyof UserPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          bio: bio.trim() || null,
          phone: phone.trim() || null,
          gender,
          preferences,
        })
        .eq('id', user.id)

      if (error) {
        Alert.alert('Error', error.message)
      } else {
        await refreshProfile()
        setEditing(false)
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
    setSaving(false)
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
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

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : ''

  return (
    <View className="flex-1 bg-shride-background">
      {/* Header */}
      <View className="bg-shride-surface pt-14 pb-6 px-5 items-center">
        {/* Avatar */}
        <View className="bg-shride-primary rounded-full w-20 h-20 items-center justify-center mb-3">
          <Ionicons name="person" size={40} color="#FEF9E7" />
        </View>

        {editing ? (
          <TextInput
            className="text-center font-display text-xl font-bold text-shride-primary bg-shride-accent/40 rounded-xl px-4 py-2 min-w-48"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor="#79786b"
          />
        ) : (
          <Text className="font-display text-xl font-bold text-shride-primary">
            {profile?.full_name || 'No Name'}
          </Text>
        )}

        {/* Rating & Verified */}
        <View className="flex-row items-center mt-2">
          <View className="flex-row items-center">
            {renderStars(profile?.rating || 0)}
            <Text className="font-body text-sm text-shride-text-secondary ml-1">
              ({profile?.total_ratings || 0})
            </Text>
          </View>
          {profile?.is_verified && (
            <View className="flex-row items-center ml-3 bg-shride-secondary/30 px-2.5 py-1 rounded-full">
              <Ionicons name="shield-checkmark" size={14} color="#41431B" />
              <Text className="font-body text-xs text-shride-primary ml-1 font-medium">Verified</Text>
            </View>
          )}
        </View>

        <Text className="font-body text-xs text-shride-text-secondary mt-1">
          {user?.email}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row mb-5 gap-3">
          <View className="flex-1 bg-shride-surface rounded-2xl p-4 items-center">
            <Text className="font-display text-2xl font-bold text-shride-primary">
              {profile?.total_ratings || 0}
            </Text>
            <Text className="font-body text-xs text-shride-text-secondary">Rides</Text>
          </View>
          <View className="flex-1 bg-shride-surface rounded-2xl p-4 items-center">
            <Text className="font-display text-2xl font-bold text-shride-primary">
              {(profile?.rating || 0).toFixed(1)}
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

        {/* View Reviews Button */}
        <TouchableOpacity
          className="bg-shride-primary/10 border border-shride-primary/30 rounded-2xl p-4 mb-5 flex-row items-center justify-between"
          onPress={() => router.push('/my-reviews')}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <View className="bg-shride-secondary/40 rounded-full p-2 mr-3">
              <Ionicons name="star" size={20} color="#D4A017" />
            </View>
            <Text className="font-body text-base font-semibold text-shride-primary">
              View My Reviews
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#41431B" />
        </TouchableOpacity>

        {/* Bio */}
        <Text className="font-display text-lg font-bold text-shride-primary mb-3">About</Text>
        <View className="bg-shride-surface rounded-2xl p-4 mb-5">
          {editing ? (
            <TextInput
              className="font-body text-base text-shride-text-primary bg-shride-accent/40 rounded-xl px-4 py-3"
              placeholder="Tell others about yourself..."
              placeholderTextColor="#79786b"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          ) : (
            <Text className="font-body text-base text-shride-text-primary">
              {profile?.bio || 'No bio yet. Tap edit to add one!'}
            </Text>
          )}
        </View>

        {/* Contact */}
        {editing && (
          <>
            <Text className="font-display text-lg font-bold text-shride-primary mb-3">Contact</Text>
            <View className="bg-shride-surface rounded-2xl p-4 mb-5">
              <Text className="font-body text-sm text-shride-text-secondary mb-2 ml-1">Phone</Text>
              <TextInput
                className="bg-shride-accent/40 rounded-xl px-4 py-3.5 font-body text-base text-shride-text-primary mb-3"
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor="#79786b"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Text className="font-body text-sm text-shride-text-secondary mb-2 ml-1">Gender</Text>
              <View className="flex-row bg-shride-accent/40 rounded-xl p-1">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    className={`flex-1 py-2.5 rounded-lg items-center ${gender === g ? 'bg-shride-primary' : ''}`}
                    onPress={() => setGender(g)}
                  >
                    <Text className={`font-body text-sm font-medium capitalize ${gender === g ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Preferences */}
        <Text className="font-display text-lg font-bold text-shride-primary mb-3">Preferences</Text>
        <View className="bg-shride-surface rounded-2xl p-4 mb-5">
          <View className="flex-row flex-wrap gap-3">
            {PREFERENCE_OPTIONS.map((pref) => {
              const isActive = preferences[pref.key]
              return (
                <TouchableOpacity
                  key={pref.key}
                  className={`flex-row items-center px-4 py-2.5 rounded-full border ${isActive
                      ? 'bg-shride-primary border-shride-primary'
                      : 'bg-transparent border-shride-accent'
                    }`}
                  onPress={() => editing && togglePreference(pref.key)}
                  disabled={!editing}
                  activeOpacity={editing ? 0.7 : 1}
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
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Action Buttons */}
        {editing ? (
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              className="flex-1 border border-shride-accent rounded-xl py-3.5 items-center"
              onPress={() => {
                setEditing(false)
                // Reset to profile values
                if (profile) {
                  setFullName(profile.full_name || '')
                  setBio(profile.bio || '')
                  setPhone(profile.phone || '')
                  setGender(profile.gender)
                  setPreferences(profile.preferences)
                }
              }}
            >
              <Text className="font-body text-base font-semibold text-shride-text-secondary">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-shride-primary rounded-xl py-3.5 items-center"
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FEF9E7" />
              ) : (
                <Text className="font-body text-base font-semibold text-shride-surface">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-shride-primary rounded-xl py-3.5 items-center mb-4"
            onPress={() => setEditing(true)}
            activeOpacity={0.8}
          >
            <Text className="font-body text-base font-semibold text-shride-surface">Edit Profile</Text>
          </TouchableOpacity>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          className="border border-red-200 bg-red-50 rounded-xl py-3.5 items-center mb-10"
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text className="font-body text-base font-semibold text-red-600">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}
