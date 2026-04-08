import React from 'react'
import { Text, View } from 'react-native'

export const Marker = ({ children, ...props }: any) => <>{children}</>

const MapView = React.forwardRef((props: any, ref: any) => (
  <View style={[{ backgroundColor: '#e5e5e5', justifyContent: 'center', alignItems: 'center' }, props.style]}>
    <Text style={{ color: '#666', marginBottom: 10 }}>Interactive maps are only available on the mobile app.</Text>
    {props.children}
  </View>
))

export default MapView
