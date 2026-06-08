import { useLocation } from '@/contexts/LocationContext'
import { Location } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import * as ExpoLocation from 'expo-location'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useRef, useState, useEffect } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import MapView, { Marker } from '@/components/Map'
import type { Region } from 'react-native-maps'

interface SearchResult {
    id: string
    name: string
    address: string
    latitude?: number
    longitude?: number
    place_id?: string
}

export default function LocationPicker() {
    const { field } = useLocalSearchParams<{ field: 'source' | 'destination' }>()
    const { setSource, setDestination } = useLocation()
    const router = useRouter()
    const mapRef = useRef<MapView>(null)

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
    const [hasPermission, setHasPermission] = useState<boolean>(false)
    const [region, setRegion] = useState<Region>({
        latitude: 13.0827,
        longitude: 80.2707,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    })

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        (async () => {
            const { status: existingStatus } = await ExpoLocation.getForegroundPermissionsAsync()
            if (existingStatus !== 'granted') {
                const { status } = await ExpoLocation.requestForegroundPermissionsAsync()
                setHasPermission(status === 'granted')
            } else {
                setHasPermission(true)
            }
        })()
    }, [])

    // Search using Google Places Autocomplete API
    const searchPlaces = async (text: string) => {
        if (text.length < 3) {
            setResults([])
            return []
        }

        setSearching(true)
        try {
            const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY
            if (!apiKey) {
                console.warn('Maps API key not found')
                return []
            }

            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&location=${region.latitude},${region.longitude}&radius=500&key=${apiKey}&components=country:in`
            const res = await fetch(url)
            const data = await res.json()

            if (data.status === 'OK' && data.predictions) {
                const mappedResults: SearchResult[] = data.predictions.map((p: any) => ({
                    id: p.place_id,
                    place_id: p.place_id,
                    name: p.structured_formatting?.main_text || p.description,
                    address: p.structured_formatting?.secondary_text || p.description,
                }))
                setResults(mappedResults)
                return mappedResults
            }
            
            setResults([])
            return []
        } catch (error) {
            console.log('Search error:', error)
            return []
        } finally {
            setSearching(false)
        }
    }

    const handleTextChange = (text: string) => {
        setQuery(text)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        searchTimeoutRef.current = setTimeout(() => searchPlaces(text), 500)
    }

    const handleSubmitSearch = async () => {
        if (query.length >= 3) {
            const res = await searchPlaces(query)
            if (res && res.length > 0) {
                selectResult(res[0])
            } else {
                Alert.alert('No results', 'Could not find that location.')
            }
        }
    }

    // Select a search result
    const selectResult = async (result: SearchResult) => {
        Keyboard.dismiss()
        setResults([])
        
        let lat = result.latitude
        let lng = result.longitude

        // Fetch coordinates if we only have a place_id
        if (result.place_id && (lat === undefined || lng === undefined)) {
            setLoading(true)
            try {
                const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY
                const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${result.place_id}&key=${apiKey}`
                const res = await fetch(url)
                const data = await res.json()
                if (data.status === 'OK' && data.results.length > 0) {
                    lat = data.results[0].geometry.location.lat
                    lng = data.results[0].geometry.location.lng
                }
            } catch (err) {
                console.log('Error fetching place details:', err)
            }
            setLoading(false)
        }

        if (lat === undefined || lng === undefined) {
            Alert.alert('Error', 'Could not get location coordinates.')
            return
        }

        const loc: Location = {
            name: result.address ? `${result.name}, ${result.address}` : result.name,
            latitude: lat,
            longitude: lng,
            address: result.address ? `${result.name}, ${result.address}` : result.name,
        }
        setSelectedLocation(loc)
        setQuery(result.name)
        const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }
        setRegion(newRegion)
        mapRef.current?.animateToRegion(newRegion, 500)
    }

    let geocodeTimeout: ReturnType<typeof setTimeout> | null = null

    // Reverse geocode from coordinates
    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY
            if (!apiKey) throw new Error('No API key')

            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
            const res = await fetch(url)
            const data = await res.json()

            if (data.status === 'OK' && data.results.length > 0) {
                const address = data.results[0].formatted_address
                // Use the first part of the formatted address as the short name, or the first component
                const name = address.split(',')[0]
                
                const loc: Location = {
                    name: name || 'Selected Location',
                    latitude: lat,
                    longitude: lng,
                    address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                }
                setSelectedLocation(loc)
            } else {
                throw new Error('No results from Google Geocoding')
            }
        } catch (error) {
            console.log('Reverse geocode error:', error)
            setSelectedLocation({
                name: 'Selected Location',
                latitude: lat,
                longitude: lng,
                address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            })
        }
    }

    // Use current location
    const useCurrentLocation = async () => {
        setLoading(true)
        setResults([])
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required')
                setLoading(false)
                return
            }
            const position = await ExpoLocation.getCurrentPositionAsync({
                accuracy: ExpoLocation.Accuracy.Balanced,
            })
            const { latitude, longitude } = position.coords
            const newRegion = {
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }
            setRegion(newRegion)
            mapRef.current?.animateToRegion(newRegion, 500)
            await reverseGeocode(latitude, longitude)
        } catch (error) {
            console.log('Current location error:', error)
            Alert.alert('Error', 'Failed to get current location')
        }
        setLoading(false)
    }

    // Handle region change (drag map)
    const handleRegionChangeComplete = (newRegion: Region, details?: any) => {
        setRegion(newRegion)

        // Prevent overwriting a location selected from autocomplete when the map programmatically animates to it
        if (details && details.isGesture === false) return

        // Fallback: Check if the new region is practically identical to the explicitly selected location
        if (selectedLocation) {
            const dLat = Math.abs(newRegion.latitude - selectedLocation.latitude)
            const dLng = Math.abs(newRegion.longitude - selectedLocation.longitude)
            if (dLat < 0.00005 && dLng < 0.00005) {
                return
            }
        }

        if (geocodeTimeout) clearTimeout(geocodeTimeout)
        geocodeTimeout = setTimeout(() => {
            reverseGeocode(newRegion.latitude, newRegion.longitude)
        }, 500)
    }

    // Confirm selection
    const confirmLocation = () => {
        if (!selectedLocation) {
            Alert.alert('Error', 'Please select a location first')
            return
        }
        const finalLocation: Location = {
            ...selectedLocation,
            name: selectedLocation.address || selectedLocation.name,
        }
        if (field === 'source') {
            setSource(finalLocation)
        } else {
            setDestination(finalLocation)
        }
        router.back()
    }

    return (
        <View className="flex-1 bg-shride-background">
            {/* Header */}
            <View className="bg-shride-surface pt-14 pb-3 px-5">
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                        <Ionicons name="arrow-back" size={24} color="#41431B" />
                    </TouchableOpacity>
                    <Text className="font-display text-xl font-bold text-shride-primary flex-1">
                        {field === 'source' ? 'Pick-up Location' : 'Drop-off Location'}
                    </Text>
                </View>

                {/* Search Input */}
                <View className="flex-row items-center bg-shride-accent/40 rounded-xl px-3">
                    <Ionicons name="search" size={20} color="#60683D" />
                    <TextInput
                        className="flex-1 py-3.5 px-2 font-body text-base text-shride-text-primary"
                        placeholder="Search for a place..."
                        placeholderTextColor="#79786b"
                        value={query}
                        onChangeText={handleTextChange}
                        onSubmitEditing={handleSubmitSearch}
                        returnKeyType="search"
                        autoFocus
                    />
                    {searching && (
                        <ActivityIndicator size="small" color="#41431B" className="mr-2" />
                    )}
                    {query.length > 0 && !searching && (
                        <TouchableOpacity
                            onPress={() => {
                                setQuery('')
                                setResults([])
                            }}
                        >
                            <Ionicons name="close-circle" size={20} color="#79786b" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Use Current Location */}
                <TouchableOpacity
                    className="flex-row items-center mt-3 mb-1 py-2"
                    onPress={useCurrentLocation}
                >
                    <View className="bg-shride-secondary/30 rounded-full p-2 mr-3">
                        <Ionicons name="locate" size={18} color="#41431B" />
                    </View>
                    <Text className="font-body text-base text-shride-primary font-medium">
                        Use current location
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Results */}
            {results.length > 0 && (
                <View className="bg-shride-surface border-t border-shride-accent/30 max-h-64">
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="flex-row items-center px-5 py-3.5 border-b border-shride-accent/20"
                                onPress={() => selectResult(item)}
                            >
                                <Ionicons name="location-outline" size={20} color="#60683D" />
                                <View className="flex-1 ml-3">
                                    <Text
                                        className="font-body text-base text-shride-text-primary"
                                        numberOfLines={1}
                                    >
                                        {item.name}
                                    </Text>
                                    <Text
                                        className="font-body text-xs text-shride-text-secondary mt-0.5"
                                        numberOfLines={1}
                                    >
                                        {item.address}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Map */}
            <View className="flex-1">
                {loading && (
                    <View className="absolute top-4 left-0 right-0 z-10 items-center">
                        <View className="bg-shride-surface rounded-full px-4 py-2 flex-row items-center shadow-sm">
                            <ActivityIndicator size="small" color="#41431B" />
                            <Text className="font-body text-sm text-shride-text-secondary ml-2">
                                Getting location...
                            </Text>
                        </View>
                    </View>
                )}
                <MapView
                    ref={mapRef}
                    provider="google"
                    style={{ flex: 1 }}
                    region={region}
                    onRegionChangeComplete={handleRegionChangeComplete}
                />
                
                {/* Center Map Pin */}
                <View 
                    className="absolute inset-0 items-center justify-center pointer-events-none"
                    pointerEvents="none"
                >
                    <View style={{ marginTop: -40 }}>
                        <Ionicons name="location" size={40} color="#41431B" />
                        <View className="w-2 h-2 bg-black/20 rounded-full mx-auto" style={{ transform: [{ scaleX: 2 }], marginTop: -4 }} />
                    </View>
                </View>
            </View>

            {/* Confirm Button */}
            <View className="bg-shride-surface px-5 py-4 border-t border-shride-accent/30 shadow-lg">
                <View className="flex-row items-center mb-3">
                    <Ionicons name="location" size={24} color="#60683D" />
                    <Text
                        className="font-body text-sm text-shride-text-primary ml-3 flex-1"
                        numberOfLines={2}
                    >
                        {selectedLocation?.address || selectedLocation?.name || 'Move map to select location'}
                    </Text>
                </View>
                <TouchableOpacity
                    className="bg-shride-primary rounded-xl py-4 items-center"
                    onPress={confirmLocation}
                    activeOpacity={0.8}
                    disabled={!selectedLocation}
                    style={{ opacity: selectedLocation ? 1 : 0.5 }}
                >
                    <Text className="font-body text-lg font-semibold text-shride-surface">
                        Confirm Location
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
