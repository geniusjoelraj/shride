import { images } from '@/assets/images'
import { View, Text, Image } from 'react-native'

const TopBar = () => {
  return (
    <View className='mt-20 bg-shride-accent w-full h-24 px-5 flex items-center flex-row justify-between'>
      <Text className="font-display text-2xl font-bold text-shride-primary">Shride</Text>
      <View className='border-2 border-shride-primary p-2 bg-shride-primary rounded-full'>
        <Image source={images.profile} className='h-7 w-7' tintColor='#fbf5e2' resizeMode='contain' />
      </View>
    </View>
  )
}

export default TopBar
