import { useLocation } from '@/contexts/LocationContext'
import { Ionicons } from '@expo/vector-icons'
import clsx from 'clsx'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const RideSearch = () => {
  const [isRider, setIsRider] = useState(true)
  const { source, destination } = useLocation()
  const router = useRouter()

  const handleSearch = () => {
    if (!source || !destination) return
    if (isRider) {
      // Navigate to search tab (rider wants to find a ride)
      router.push('/(tabs)/search')
    } else {
      // Navigate to create ride screen (driver wants to offer a ride)
      router.push('/create-ride')
    }
  }

  return (
    <View className='bg-white p-5 min-h-10 w-auto mt-10 mx-10 rounded-2xl'>
      <View
        className='flex flex-row bg-shride-secondary justify-between rounded-2xl'>
        <View className='flex-1'>
          <Text
            className={
              clsx('font-body text-xl font-semibold text-center m-1 rounded-xl py-2',
                { 'bg-shride-primary font-bold text-shride-secondary': isRider })
            }
            onPress={() => { setIsRider(true) }}>
            Rider
          </Text>
        </View>
        <View className='flex-1'>
          <Text
            className={
              clsx('font-body text-xl font-semibold flex-1 text-center m-1 rounded-xl py-2',
                { 'bg-shride-primary font-bold text-shride-secondary': !isRider })
            }
            onPress={() => { setIsRider(false) }}>
            Driver
          </Text>
        </View>
      </View>
      <View className='mt-10'>
        <TouchableOpacity
          className='flex-row items-center bg-shride-secondary rounded-xl pl-3 py-4'
          onPress={() => router.push({ pathname: '/location-picker', params: { field: 'source' } })}
          activeOpacity={0.7}
        >
          <Ionicons name="radio-button-on" size={16} color="#41431B" />
          <Text
            className={clsx(
              'flex-1 ml-2 font-body text-base',
              source ? 'text-shride-text-primary' : 'text-[#79786b]'
            )}
            numberOfLines={1}
          >
            {source?.name || 'Starting Point'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className='flex-row items-center bg-shride-secondary rounded-xl pl-3 py-4 mt-5'
          onPress={() => router.push({ pathname: '/location-picker', params: { field: 'destination' } })}
          activeOpacity={0.7}
        >
          <Ionicons name="location" size={16} color="#41431B" />
          <Text
            className={clsx(
              'flex-1 ml-2 font-body text-base',
              destination ? 'text-shride-text-primary' : 'text-[#79786b]'
            )}
            numberOfLines={1}
          >
            {destination?.name || 'Destination'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={clsx(
            'rounded-xl py-4 mt-5 items-center',
            source && destination ? 'bg-shride-primary' : 'bg-shride-primary/40'
          )}
          onPress={handleSearch}
          disabled={!source || !destination}
          activeOpacity={0.8}
        >
          <Text className='text-shride-surface text-center font-semibold text-xl font-body'>
            {isRider ? 'Find a Shride' : 'Offer a Shride'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default RideSearch
