import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { RideReview } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function MyReviews() {
  const router = useRouter()
  const { user } = useAuth()
  const [reviews, setReviews] = useState<RideReview[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchReviews = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ride_reviews')
        .select('*, reviewer:profiles!reviewer_id(*)')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews:', error)
      } else {
        setReviews((data as RideReview[]) || [])
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReviews()
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchReviews()
    setRefreshing(false)
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
        stars.push(
          <Ionicons 
            key={i} 
            name={i <= Math.floor(rating) ? "star" : (i - 0.5 <= rating ? "star-half" : "star-outline")} 
            size={14} 
            color="#D4A017" 
          />
        )
    }
    return stars
  }

  return (
    <View className="flex-1 bg-shride-background">
      {/* Header */}
      <View className="bg-shride-surface pt-14 pb-4 px-5 flex-row items-center border-b border-shride-accent/30">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#41431B" />
        </TouchableOpacity>
        <Text className="font-display text-xl font-bold text-shride-primary">
          My Reviews
        </Text>
      </View>

      {/* Reviews List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#41431B" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#41431B" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="star-outline" size={48} color="#AEB784" />
              <Text className="font-body text-base text-shride-text-secondary mt-4 text-center">
                You don't have any reviews yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-shride-surface border border-shride-accent/30 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <TouchableOpacity 
                   className="flex-row items-center flex-1"
                   onPress={() => router.push(`/profile/${item.reviewer_id}`)}
                   activeOpacity={0.7}
                >
                  <View className="bg-shride-primary/10 rounded-full w-10 h-10 items-center justify-center mr-3">
                    <Ionicons name="person" size={20} color="#41431B" />
                  </View>
                  <View className="flex-1 mr-2">
                    <Text className="font-body text-base font-semibold text-shride-text-primary" numberOfLines={1}>
                      {item.reviewer?.full_name || 'Passenger'}
                    </Text>
                    <Text className="font-body text-xs text-shride-text-secondary">
                      {new Date(item.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View className="flex-row items-center ml-2">
                  {renderStars(item.rating)}
                </View>
              </View>
              {item.comment ? (
                <Text className="font-body text-sm text-shride-text-primary italic">
                  "{item.comment}"
                </Text>
              ) : (
                <Text className="font-body text-sm text-shride-text-secondary italic">
                  No comment provided.
                </Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  )
}
