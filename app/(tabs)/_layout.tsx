import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

const TabIcon = ({ focused, text, icon }: { focused: boolean; text: string; icon: keyof typeof Ionicons.glyphMap }) => {
  return (
    <View
      className={`flex justify-center items-center mt-10 rounded-full min-w-28 mb-5 min-h-16 px-5 ${focused ? 'bg-[#dedfa9]' : ''}`}
    >
      <Ionicons name={icon} size={24} color={focused ? '#2B2D07' : '#60683D'} />
      <Text className={`font-body text-xs mt-1 ${focused ? 'text-shride-text-primary font-semibold' : 'text-shride-text-secondary'}`}>
        {text}
      </Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          backgroundColor: "#f7f2e1",
          height: 100,
          paddingBottom: 10,
          paddingTop: 25,
          paddingLeft: 25,
          paddingRight: 25,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          overflow: "hidden",
          position: "absolute",
          borderTopWidth: 0,
          elevation: 0,
        }
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} text='Home' icon='compass' />
          )
        }}
      />
      <Tabs.Screen
        name='my_rides'
        options={{
          title: 'My Rides',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} text='My Rides' icon='car' />
          )
        }}
      />
      <Tabs.Screen
        name='search'
        options={{
          title: 'Search',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} text='Search' icon='search' />
          )
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} text='Profile' icon='person' />
          )
        }}
      />
    </Tabs>
  )
}
