import { useLocation } from '@/contexts/LocationContext'
import { Location } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import * as ExpoLocation from 'expo-location'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
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
    latitude: number
    longitude: number
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
    const [region, setRegion] = useState<Region>({
        latitude: 13.0827,
        longitude: 80.2707,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    })

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Search using expo-location geocoding (free, no API key needed)
    const searchPlaces = async (text: string) => {
        if (text.length < 3) {
            setResults([])
            return
        }

        setSearching(true)
        try {
            // Search with the text as-is and biased variants for better results
            const queries = [
                text,
                `${text}, Chennai, India`,
                `${text}, Tamil Nadu, India`,
            ]

            const allResults: SearchResult[] = []
            const seen = new Set<string>()

            for (const q of queries) {
                try {
                    const geocoded = await ExpoLocation.geocodeAsync(q)
                    for (const result of geocoded) {
                        const key = `${result.latitude.toFixed(4)}_${result.longitude.toFixed(4)}`
                        if (seen.has(key)) continue
                        seen.add(key)

                        // Reverse geocode to get the address
                        const addresses = await ExpoLocation.reverseGeocodeAsync({
                            latitude: result.latitude,
                            longitude: result.longitude,
                        })

                        if (addresses.length > 0) {
                            const a = addresses[0]
                            const parts = [a.name, a.street, a.district, a.city, a.region].filter(Boolean)
                            const address = parts.join(', ')
                            allResults.push({
                                id: key,
                                name: a.name || a.street || text,
                                address,
                                latitude: result.latitude,
                                longitude: result.longitude,
                            })
                        }
                    }
                } catch {
                    // Ignore individual query failures
                }
            }

            setResults(allResults.slice(0, 5))
            return allResults.slice(0, 5)
        } catch (error) {
            console.error('Search error:', error)
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
    const selectResult = (result: SearchResult) => {
        Keyboard.dismiss()
        setResults([])
        const loc: Location = {
            name: result.address || result.name,
            latitude: result.latitude,
            longitude: result.longitude,
            address: result.address,
        }
        setSelectedLocation(loc)
        setQuery(result.address)
        const newRegion = {
            latitude: result.latitude,
            longitude: result.longitude,
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
            const addresses = await ExpoLocation.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng,
            })
            if (addresses.length > 0) {
                const a = addresses[0]
                const parts = [a.name, a.street, a.district, a.city, a.region].filter(Boolean)
                const address = parts.join(', ')
                const loc: Location = {
                    name: address || 'Selected Location',
                    latitude: lat,
                    longitude: lng,
                    address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                }
                setSelectedLocation(loc)
            } else {
                setSelectedLocation({
                    name: 'Selected Location',
                    latitude: lat,
                    longitude: lng,
                    address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                })
            }
        } catch (error) {
            console.error('Reverse geocode error:', error)
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
            console.error('Current location error:', error)
            Alert.alert('Error', 'Failed to get current location')
        }
        setLoading(false)
    }

    // Handle region change (drag map)
    const handleRegionChangeComplete = (newRegion: Region) => {
        setRegion(newRegion)
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
