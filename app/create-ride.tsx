import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import { supabase } from '@/lib/supabase'
import type { GenderPreference, UserPreferences } from '@/types'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import Slider from '@react-native-community/slider'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import React, { useState, useEffect, useMemo } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import MapView, { Marker, Polyline } from '@/components/Map'
import { decodePolyline } from '@/utils/polyline'

const PREFERENCE_OPTIONS: { key: keyof UserPreferences; label: string; icon: string; iconSet: 'ionicons' | 'material' }[] = [
    { key: 'music', label: 'Music', icon: 'musical-notes', iconSet: 'ionicons' },
    { key: 'no_smoking', label: 'No Smoking', icon: 'smoking-off', iconSet: 'material' },
    { key: 'pets_ok', label: 'Pets OK', icon: 'paw', iconSet: 'ionicons' },
    { key: 'ac', label: 'AC', icon: 'snow', iconSet: 'ionicons' },
    { key: 'luggage_ok', label: 'Luggage', icon: 'bag-handle', iconSet: 'ionicons' },
]

const TEST_VEHICLES = [
    'Maruti Swift Dzire', 'Hyundai i20', 'Honda City', 'Toyota Innova',
    'Maruti Baleno', 'Tata Nexon', 'Kia Seltos', 'Mahindra XUV300',
    'Hyundai Creta', 'Maruti Ertiga',
]

const TEST_COLORS = [
    'White', 'Silver', 'Black', 'Red', 'Blue',
    'Grey', 'Maroon', 'Beige', 'Orange', 'Green',
]

const randomPlate = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const d = () => Math.floor(Math.random() * 10)
    const l = () => letters[Math.floor(Math.random() * 26)]
    return `TN ${d()}${d()} ${l()}${l()} ${d()}${d()}${d()}${d()}`
}

export default function CreateRide() {
    const router = useRouter()
    const { user } = useAuth()
    const { source, destination, setSource, setDestination } = useLocation()

    const [departureDate, setDepartureDate] = useState(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [seats, setSeats] = useState(3)
    const [vehicleModel, setVehicleModel] = useState('')
    const [vehiclePlate, setVehiclePlate] = useState('')
    const [vehicleColor, setVehicleColor] = useState('')
    const [genderPreference, setGenderPreference] = useState<GenderPreference>('anyone')
    const [preferences, setPreferences] = useState<UserPreferences>({
        music: false,
        no_smoking: true,
        pets_ok: false,
        ac: true,
        luggage_ok: true,
    })
    const [loading, setLoading] = useState(false)
    const [routes, setRoutes] = useState<any[]>([])
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
    const [fetchingRoutes, setFetchingRoutes] = useState(false)

    // Dynamic pricing
    const [distanceKm, setDistanceKm] = useState(0)
    const [generatedPrice, setGeneratedPrice] = useState(0)
    const [priceSliderValue, setPriceSliderValue] = useState(0) // -30 to +30 range

    // Recurring rides
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurringDays, setRecurringDays] = useState<number[]>([])

    const WEEKDAYS = [
        { label: 'Sun', value: 0 },
        { label: 'Mon', value: 1 },
        { label: 'Tue', value: 2 },
        { label: 'Wed', value: 3 },
        { label: 'Thu', value: 4 },
        { label: 'Fri', value: 5 },
        { label: 'Sat', value: 6 },
    ]

    // Price per km rate (₹1/km base)
    const RATE_PER_KM = 1

    // Round to nearest 5
    const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

    // Max ±30% adjustment range in ₹, rounded to nearest 5
    const maxAdjustment = useMemo(() => {
        return roundTo5(generatedPrice * 0.3)
    }, [generatedPrice])

    // Compute adjusted price from slider (slider value is in ₹, steps of 5)
    const adjustedPrice = useMemo(() => {
        if (generatedPrice === 0) return 0
        return roundTo5(generatedPrice + priceSliderValue)
    }, [generatedPrice, priceSliderValue])

    // Price per seat based on passenger count plus the driver (rounded to nearest 5)
    const pricePerSeat = useMemo(() => {
        if (adjustedPrice === 0) return 0
        return roundTo5(adjustedPrice / (seats + 1))
    }, [adjustedPrice, seats])

    const fillTestData = () => {
        // Ambattur OT -> SRM University, Kattankulathur
        setSource({
            name: 'Ambattur OT, Chennai, Tamil Nadu',
            latitude: 13.1143,
            longitude: 80.1548,
            address: 'Ambattur O.T., Ambattur, Chennai, Tamil Nadu 600053',
        })
        setDestination({
            name: 'SRM University, Kattankulathur, Tamil Nadu',
            latitude: 12.8231,
            longitude: 80.0444,
            address: 'SRM Institute of Science and Technology, Kattankulathur, Tamil Nadu 603203',
        })

        // 1 hour from now
        const oneHourLater = new Date()
        oneHourLater.setHours(oneHourLater.getHours() + 1)
        setDepartureDate(oneHourLater)

        // Random vehicle
        setVehicleModel(TEST_VEHICLES[Math.floor(Math.random() * TEST_VEHICLES.length)])
        setVehicleColor(TEST_COLORS[Math.floor(Math.random() * TEST_COLORS.length)])
        setVehiclePlate(randomPlate())

        // Random seats (1-4)
        setSeats(Math.floor(Math.random() * 4) + 1)

        // Random gender preference
        setGenderPreference(Math.random() > 0.7 ? 'female_only' : 'anyone')

        // Randomize preferences
        setPreferences({
            music: Math.random() > 0.5,
            no_smoking: Math.random() > 0.3,
            pets_ok: Math.random() > 0.7,
            ac: Math.random() > 0.3,
            luggage_ok: Math.random() > 0.4,
        })

        // Directly fetch routes with the known test coordinates
        fetchRoutes(13.1143, 80.1548, 12.8231, 80.0444)
    }

    const fetchRoutes = async (
        srcLat: number, srcLng: number,
        dstLat: number, dstLng: number
    ) => {
        setFetchingRoutes(true)
        setRoutes([])
        try {
            const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY
            console.log('[Directions] API key present:', !!apiKey, apiKey ? `...${apiKey.slice(-6)}` : 'MISSING')
            const origin = `${srcLat},${srcLng}`
            const dest = `${dstLat},${dstLng}`
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&mode=driving&alternatives=true&key=${apiKey}`

            const res = await fetch(url)
            const data = await res.json()
            console.log('[Directions] Response:', JSON.stringify(data).slice(0, 500))

            if (data.routes && data.routes.length > 0) {
                const sortedRoutes = data.routes.sort((a: any, b: any) =>
                    a.legs[0].duration.value - b.legs[0].duration.value
                ).slice(0, 2)
                setRoutes(sortedRoutes)
                setSelectedRouteIndex(0)

                // Extract distance for dynamic pricing
                const distMeters = sortedRoutes[0].legs[0].distance.value
                const km = distMeters / 1000
                setDistanceKm(km)
                const basePrice = roundTo5(km * RATE_PER_KM)
                setGeneratedPrice(basePrice)
                setPriceSliderValue(0) // Reset slider on new route
            } else {
                console.warn('Directions API returned no routes:', data.status, data.error_message)
                setRoutes([])
                setDistanceKm(0)
                setGeneratedPrice(0)
            }
        } catch (err) {
            console.error('Error fetching routes:', err)
            setRoutes([])
        }
        setFetchingRoutes(false)
    }

    useEffect(() => {
        if (source && destination) {
            fetchRoutes(source.latitude, source.longitude, destination.latitude, destination.longitude)
        }
    }, [source, destination])

    const togglePreference = (key: keyof UserPreferences) => {
        setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const handleCreate = async () => {
        if (!source || !destination) {
            Alert.alert('Missing Location', 'Please select both pick-up and drop-off locations')
            return
        }
        if (!vehicleModel.trim()) {
            Alert.alert('Missing Info', 'Please enter your vehicle model')
            return
        }
        if (adjustedPrice <= 0 && generatedPrice <= 0) {
            Alert.alert('Missing Info', 'Route price not calculated yet. Please wait for the route to load.')
            return
        }
        if (isRecurring && recurringDays.length === 0) {
            Alert.alert('Missing Info', 'Please select at least one day for recurring rides')
            return
        }

        setLoading(true)
        try {
            const routeGeom = routes.length > 0 ? {
                type: 'LineString',
                coordinates: decodePolyline(routes[selectedRouteIndex].overview_polyline.points)
            } : null
            const estDuration = routes.length > 0 ? routes[selectedRouteIndex].legs[0].duration.value : 0
            const distMeters = routes.length > 0 ? routes[selectedRouteIndex].legs[0].distance.value : 0

            const baseRide = {
                driver_id: user?.id,
                source_name: source.name,
                source_lat: source.latitude,
                source_lng: source.longitude,
                dest_name: destination.name,
                dest_lat: destination.latitude,
                dest_lng: destination.longitude,
                available_seats: seats,
                price_per_seat: pricePerSeat,
                base_price: generatedPrice,
                distance_meters: distMeters,
                gender_preference: genderPreference,
                preferences,
                vehicle_model: vehicleModel.trim(),
                vehicle_plate: vehiclePlate.trim(),
                vehicle_color: vehicleColor.trim(),
                status: 'open' as const,
                route_geom: routeGeom,
                estimated_duration: estDuration,
                is_recurring: isRecurring,
                recurring_days: isRecurring ? recurringDays : null,
            }

            const { error } = await supabase.from('rides').insert({
                ...baseRide,
                departure_time: departureDate.toISOString(),
            })

            if (error) {
                Alert.alert('Error', error.message)
            } else {
                Alert.alert('Success', 'Your ride has been created!', [
                    { text: 'OK', onPress: () => router.back() },
                ])
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Something went wrong')
        }
        setLoading(false)
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <View className="flex-1 bg-shride-background">
            {/* Header */}
            <View className="bg-shride-surface pt-14 pb-4 px-5 flex-row items-center border-b border-shride-accent/30">
                <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                    <Ionicons name="arrow-back" size={24} color="#41431B" />
                </TouchableOpacity>
                <Text className="font-display text-xl font-bold text-shride-primary flex-1">
                    Offer a Shride
                </Text>
                <TouchableOpacity
                    onPress={fillTestData}
                    className="bg-amber-100 border border-amber-300 rounded-lg px-3 py-1.5 flex-row items-center"
                >
                    <Ionicons name="flask" size={14} color="#B45309" />
                    <Text className="font-body text-xs font-semibold text-amber-700 ml-1">Test Data</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                {/* Route Section */}
                <Text className="font-display text-lg font-bold text-shride-primary mb-3">Route</Text>
                <View className="bg-shride-surface rounded-2xl p-4 mb-5">
                    <TouchableOpacity
                        className="flex-row items-center py-3"
                        onPress={() => router.push({ pathname: '/location-picker', params: { field: 'source' } })}
                    >
                        <View className="bg-shride-secondary/30 rounded-full p-2 mr-3">
                            <Ionicons name="radio-button-on" size={16} color="#41431B" />
                        </View>
                        <Text className={`font-body text-base flex-1 ${source ? 'text-shride-text-primary' : 'text-[#79786b]'}`} numberOfLines={1}>
                            {source?.name || 'Select pick-up location'}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color="#79786b" />
                    </TouchableOpacity>
                    <View className="h-px bg-shride-accent/30 ml-12" />
                    <TouchableOpacity
                        className="flex-row items-center py-3"
                        onPress={() => router.push({ pathname: '/location-picker', params: { field: 'destination' } })}
                    >
                        <View className="bg-shride-secondary/30 rounded-full p-2 mr-3">
                            <Ionicons name="location" size={16} color="#41431B" />
                        </View>
                        <Text className={`font-body text-base flex-1 ${destination ? 'text-shride-text-primary' : 'text-[#79786b]'}`} numberOfLines={1}>
                            {destination?.name || 'Select drop-off location'}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color="#79786b" />
                    </TouchableOpacity>
                </View>

                {/* Routes Map */}
                {source && destination && (
                    <View className="bg-shride-surface rounded-2xl overflow-hidden mb-5 border border-shride-accent/30" style={{ height: 250 }}>
                        <MapView
                            provider="google"
                            style={{ flex: 1 }}
                            key={`${source.latitude}-${destination.latitude}`}
                            initialRegion={{
                                latitude: (source.latitude + destination.latitude) / 2,
                                longitude: (source.longitude + destination.longitude) / 2,
                                latitudeDelta: Math.abs(source.latitude - destination.latitude) * 1.5 + 0.05,
                                longitudeDelta: Math.abs(source.longitude - destination.longitude) * 1.5 + 0.05,
                            }}
                        >
                            <Marker coordinate={source} title="Pick-up" pinColor="#41431B" />
                            <Marker coordinate={destination} title="Drop-off" pinColor="#AEB784" />
                            {routes.length > 0 ? routes.map((route, idx) => {
                                const isSelected = idx === selectedRouteIndex
                                return (
                                    <Polyline
                                        key={idx}
                                        coordinates={decodePolyline(route.overview_polyline.points).map(p => ({ longitude: p[0], latitude: p[1] }))}
                                        strokeWidth={isSelected ? 4 : 3}
                                        strokeColor={isSelected ? '#41431B' : '#AEB78480'}
                                        zIndex={isSelected ? 2 : 1}
                                        tappable
                                        onPress={() => setSelectedRouteIndex(idx)}
                                    />
                                )
                            }) : (
                                <Polyline
                                    coordinates={[
                                        { latitude: source.latitude, longitude: source.longitude },
                                        { latitude: destination.latitude, longitude: destination.longitude },
                                    ]}
                                    strokeWidth={3}
                                    strokeColor="#41431B80"
                                    lineDashPattern={[10, 8]}
                                />
                            )}
                        </MapView>

                        {/* Loading Overlay */}
                        {fetchingRoutes && (
                            <View className="absolute inset-0 z-10 bg-shride-surface/70 items-center justify-center" style={{ elevation: 5 }}>
                                <ActivityIndicator color="#41431B" />
                                <Text className="font-body text-sm text-shride-text-secondary mt-2">Finding fastest routes...</Text>
                            </View>
                        )}

                        {/* Route Selection Toggle / Info */}
                        {!fetchingRoutes && routes.length > 0 && (
                            <View className="absolute bottom-3 left-3 right-3 z-10 flex-row bg-white/90 rounded-xl p-1 shadow-sm" style={{ elevation: 5 }}>
                                {routes.map((route, idx) => {
                                    const isSelected = idx === selectedRouteIndex
                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            className={`flex-1 py-2 rounded-lg items-center ${isSelected ? 'bg-shride-primary' : 'bg-transparent'}`}
                                            onPress={() => setSelectedRouteIndex(idx)}
                                            disabled={routes.length === 1}
                                        >
                                            <Text className={`font-body text-xs font-bold ${isSelected ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
                                                {routes.length === 1 ? 'Optimal Route' : `Route ${idx + 1}`}
                                            </Text>
                                            <Text className={`font-body text-[10px] ${isSelected ? 'text-shride-surface/80' : 'text-shride-text-secondary'}`}>
                                                {Math.round(route.legs[0].duration.value / 60)} min
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        )}
                    </View>
                )}

                {/* Date & Time */}
                <Text className="font-display text-lg font-bold text-shride-primary mb-3">When</Text>
                <View className="bg-shride-surface rounded-2xl p-4 mb-5 flex-row">
                    <TouchableOpacity
                        className="flex-1 flex-row items-center py-2"
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#41431B" />
                        <Text className="font-body text-base text-shride-text-primary ml-2">
                            {formatDate(departureDate)}
                        </Text>
                    </TouchableOpacity>
                    <View className="w-px bg-shride-accent/30 mx-3" />
                    <TouchableOpacity
                        className="flex-row items-center py-2"
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Ionicons name="time-outline" size={20} color="#41431B" />
                        <Text className="font-body text-base text-shride-text-primary ml-2">
                            {formatTime(departureDate)}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={departureDate}
                        mode="date"
                        minimumDate={new Date()}
                        onChange={(event, date) => {
                            setShowDatePicker(false)
                            if (date) setDepartureDate((prev) => {
                                const newDate = new Date(prev)
                                newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
                                return newDate
                            })
                        }}
                    />
                )}
                {showTimePicker && (
                    <DateTimePicker
                        value={departureDate}
                        mode="time"
                        onChange={(event, date) => {
                            setShowTimePicker(false)
                            if (date) setDepartureDate((prev) => {
                                const newDate = new Date(prev)
                                newDate.setHours(date.getHours(), date.getMinutes())
                                return newDate
                            })
                        }}
                    />
                )}

                {/* Seats & Pricing */}
                <Text className="font-display text-lg font-bold text-shride-primary mb-3">Seats & Pricing</Text>
                <View className="bg-shride-surface rounded-2xl p-4 mb-5">
                    {/* Seats */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <Ionicons name="people" size={20} color="#41431B" />
                            <Text className="font-body text-base text-shride-text-primary ml-2">Available Seats</Text>
                        </View>
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                className="bg-shride-accent rounded-lg w-9 h-9 items-center justify-center"
                                onPress={() => setSeats((s) => Math.max(1, s - 1))}
                            >
                                <Ionicons name="remove" size={20} color="#41431B" />
                            </TouchableOpacity>
                            <Text className="font-display text-xl font-bold text-shride-primary mx-4 w-6 text-center">
                                {seats}
                            </Text>
                            <TouchableOpacity
                                className="bg-shride-accent rounded-lg w-9 h-9 items-center justify-center"
                                onPress={() => setSeats((s) => Math.min(6, s + 1))}
                            >
                                <Ionicons name="add" size={20} color="#41431B" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Dynamic Price Section */}
                    <View className="border-t border-shride-accent/30 pt-4">
                        {generatedPrice > 0 ? (
                            <>
                                {/* Distance & Base Price Info */}
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center">
                                        <Ionicons name="speedometer-outline" size={16} color="#60683D" />
                                        <Text className="font-body text-sm text-shride-text-secondary ml-1">
                                            {distanceKm.toFixed(1)} km
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Text className="font-body text-sm text-shride-text-secondary">
                                            Base: ₹{generatedPrice}
                                        </Text>
                                    </View>
                                </View>

                                {/* Price Slider */}
                                <View className="mb-3">
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text className="font-body text-sm text-shride-text-secondary">
                                            Adjust Price ({priceSliderValue > 0 ? '+' : ''}{priceSliderValue === 0 ? '0' : `₹${priceSliderValue}`})
                                        </Text>
                                        <Text className="font-display text-xl font-bold text-shride-primary">
                                            ₹{adjustedPrice}
                                        </Text>
                                    </View>
                                    <Slider
                                        style={{ width: '100%', height: 40 }}
                                        minimumValue={-maxAdjustment}
                                        maximumValue={maxAdjustment}
                                        step={5}
                                        value={priceSliderValue}
                                        onValueChange={setPriceSliderValue}
                                        minimumTrackTintColor="#41431B"
                                        maximumTrackTintColor="#D2D6B5"
                                        thumbTintColor="#41431B"
                                    />
                                    <View className="flex-row justify-between px-1">
                                        <Text className="font-body text-[10px] text-shride-text-secondary">₹{roundTo5(generatedPrice - maxAdjustment)}</Text>
                                        <Text className="font-body text-[10px] text-shride-text-secondary">₹{generatedPrice}</Text>
                                        <Text className="font-body text-[10px] text-shride-text-secondary">₹{roundTo5(generatedPrice + maxAdjustment)}</Text>
                                    </View>
                                </View>

                                {/* Cost Split Display */}
                                <View className="bg-shride-accent/30 rounded-xl p-3 flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <Ionicons name="cash-outline" size={18} color="#41431B" />
                                        <Text className="font-body text-sm font-medium text-shride-text-primary ml-2">
                                            Per Passenger
                                        </Text>
                                    </View>
                                    <Text className="font-display text-lg font-bold text-shride-primary">
                                        ₹{pricePerSeat}
                                    </Text>
                                </View>
                                <Text className="font-body text-[10px] text-shride-text-secondary text-center mt-2">
                                    ₹{adjustedPrice} total split among {seats + 1} people (including driver)
                                </Text>
                            </>
                        ) : (
                            <View className="items-center py-4">
                                <Ionicons name="calculator-outline" size={24} color="#AEB784" />
                                <Text className="font-body text-sm text-shride-text-secondary mt-2 text-center">
                                    Select pick-up & drop-off to{'\n'}auto-generate a price
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Vehicle Details */}
                <Text className="font-display text-lg font-bold text-shride-primary mb-3">Vehicle</Text>
                <View className="bg-shride-surface rounded-2xl p-4 mb-5">
                    <TextInput
                        className="bg-shride-accent/40 rounded-xl px-4 py-3.5 font-body text-base text-shride-text-primary mb-3"
                        placeholder="Car Model (e.g. Swift Dzire)"
                        placeholderTextColor="#79786b"
                        value={vehicleModel}
                        onChangeText={setVehicleModel}
                    />
                    <View className="flex-row gap-3">
                        <TextInput
                            className="flex-1 bg-shride-accent/40 rounded-xl px-4 py-3.5 font-body text-base text-shride-text-primary"
                            placeholder="Plate Number"
                            placeholderTextColor="#79786b"
                            value={vehiclePlate}
                            onChangeText={setVehiclePlate}
                            autoCapitalize="characters"
                        />
                        <TextInput
                            className="flex-1 bg-shride-accent/40 rounded-xl px-4 py-3.5 font-body text-base text-shride-text-primary"
                            placeholder="Color"
                            placeholderTextColor="#79786b"
                            value={vehicleColor}
                            onChangeText={setVehicleColor}
                        />
                    </View>
                </View>

                {/* Gender Preference */}
                <Text className="font-display text-lg font-bold text-shride-primary mb-3">Passenger Preference</Text>
                <View className="bg-shride-surface rounded-2xl p-4 mb-5">
                    <View className="flex-row bg-shride-accent/40 rounded-xl p-1">
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg items-center ${genderPreference === 'anyone' ? 'bg-shride-primary' : ''}`}
                            onPress={() => setGenderPreference('anyone')}
                        >
                            <Text className={`font-body text-base font-semibold ${genderPreference === 'anyone' ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
                                Anyone
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg items-center ${genderPreference === 'female_only' ? 'bg-shride-primary' : ''}`}
                            onPress={() => setGenderPreference('female_only')}
                        >
                            <Text className={`font-body text-base font-semibold ${genderPreference === 'female_only' ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
                                Female Only
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Preferences */}
                <Text className="font-display text-lg font-bold text-shride-primary mb-3">Ride Preferences</Text>
                <View className="bg-shride-surface rounded-2xl p-4 mb-8">
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
                                    onPress={() => togglePreference(pref.key)}
                                >
                                    {pref.iconSet === 'ionicons' ? (
                                        <Ionicons
                                            name={pref.icon as any}
                                            size={18}
                                            color={isActive ? '#FEF9E7' : '#60683D'}
                                        />
                                    ) : (
                                        <MaterialCommunityIcons
                                            name={pref.icon as any}
                                            size={18}
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

                {/* Recurring Rides */}
                <Text className="font-display text-lg font-bold text-shride-primary mb-3">Schedule</Text>
                <View className="bg-shride-surface rounded-2xl p-4 mb-8">
                    {/* Recurring Toggle */}
                    <TouchableOpacity
                        className="flex-row items-center justify-between mb-3"
                        onPress={() => setIsRecurring(!isRecurring)}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="repeat" size={20} color="#41431B" />
                            <Text className="font-body text-base text-shride-text-primary ml-2">Recurring Ride</Text>
                        </View>
                        <View className={`w-12 h-7 rounded-full p-0.5 ${isRecurring ? 'bg-shride-primary' : 'bg-shride-accent'}`}>
                            <View className={`w-6 h-6 rounded-full bg-white shadow-sm ${isRecurring ? 'ml-auto' : ''}`} />
                        </View>
                    </TouchableOpacity>

                    {isRecurring && (
                        <>
                            {/* Weekday Selector */}
                            <Text className="font-body text-sm text-shride-text-secondary mb-2">Select days</Text>
                            <View className="flex-row justify-between mb-4">
                                {WEEKDAYS.map((day) => {
                                    const isSelected = recurringDays.includes(day.value)
                                    return (
                                        <TouchableOpacity
                                            key={day.value}
                                            className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? 'bg-shride-primary' : 'bg-shride-accent/40'}`}
                                            onPress={() => {
                                                setRecurringDays(prev =>
                                                    isSelected
                                                        ? prev.filter(d => d !== day.value)
                                                        : [...prev, day.value].sort()
                                                )
                                            }}
                                        >
                                            <Text className={`font-body text-xs font-bold ${isSelected ? 'text-shride-surface' : 'text-shride-text-secondary'}`}>
                                                {day.label}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>


                            {/* Summary */}
                            {recurringDays.length > 0 && (
                                <View className="mt-3 bg-shride-accent/20 rounded-xl p-3">
                                    <Text className="font-body text-xs text-shride-text-secondary text-center">
                                        Ride will be active for{' '}
                                        <Text className="font-bold text-shride-primary">
                                            {recurringDays.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(', ')}
                                        </Text>
                                        {' '}at {formatTime(departureDate)}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Create Button */}
                <TouchableOpacity
                    className="bg-shride-primary rounded-xl py-4 items-center mb-10"
                    onPress={handleCreate}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#FEF9E7" />
                    ) : (
                        <Text className="font-body text-lg font-semibold text-shride-surface">
                            {isRecurring ? `Create Recurring Rides` : 'Create Ride'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    )
}
