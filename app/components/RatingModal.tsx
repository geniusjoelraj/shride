import { supabase } from '@/lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

interface RatingModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: () => void
  rideId: string
  driverId: string
  driverName: string
  reviewerId: string
}

export default function RatingModal({
  visible,
  onClose,
  onSubmit,
  rideId,
  driverId,
  driverName,
  reviewerId,
}: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [scaleAnims] = useState(() =>
    Array.from({ length: 5 }, () => new Animated.Value(1))
  )

  const handleStarPress = (star: number) => {
    setRating(star)
    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnims[star - 1], {
        toValue: 1.4,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[star - 1], {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('ride_reviews').insert({
        ride_id: rideId,
        reviewer_id: reviewerId,
        driver_id: driverId,
        rating,
        comment: comment.trim() || null,
      })

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already Reviewed', 'You have already reviewed this ride.')
        } else {
          Alert.alert('Error', error.message)
        }
      } else {
        Alert.alert('Thank You!', 'Your review has been submitted.', [
          { text: 'OK', onPress: onSubmit },
        ])
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.')
    }
    setSubmitting(false)
  }

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-shride-surface rounded-3xl p-6 w-full max-w-sm">
          {/* Header */}
          <View className="items-center mb-5">
            <View className="bg-shride-secondary/30 rounded-full w-16 h-16 items-center justify-center mb-3">
              <Ionicons name="star" size={32} color="#D4A017" />
            </View>
            <Text className="font-display text-xl font-bold text-shride-primary text-center">
              Rate Your Ride
            </Text>
            <Text className="font-body text-sm text-shride-text-secondary text-center mt-1">
              How was your experience with {driverName}?
            </Text>
          </View>

          {/* Star Rating */}
          <View className="flex-row justify-center items-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                activeOpacity={0.7}
                className="mx-1.5"
              >
                <Animated.View
                  style={{ transform: [{ scale: scaleAnims[star - 1] }] }}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? '#D4A017' : '#C8CBA9'}
                  />
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating Label */}
          <Text className="font-body text-sm text-shride-primary font-medium text-center mb-4">
            {rating > 0 ? ratingLabels[rating] : 'Tap a star to rate'}
          </Text>

          {/* Comment Input */}
          <TextInput
            className="bg-shride-accent/30 rounded-xl px-4 py-3 font-body text-base text-shride-text-primary mb-5"
            placeholder="Add a comment (optional)"
            placeholderTextColor="#79786b"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
          />

          {/* Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 border border-shride-accent rounded-xl py-3.5 items-center"
              onPress={onClose}
              disabled={submitting}
            >
              <Text className="font-body text-base font-semibold text-shride-text-secondary">
                Skip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-shride-primary rounded-xl py-3.5 items-center"
              onPress={handleSubmit}
              disabled={submitting || rating === 0}
              activeOpacity={0.8}
              style={{ opacity: rating === 0 ? 0.5 : 1 }}
            >
              {submitting ? (
                <ActivityIndicator color="#FEF9E7" />
              ) : (
                <Text className="font-body text-base font-semibold text-shride-surface">
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
