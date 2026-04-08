import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import { supabase } from '@/lib/supabase'
import type { GenderPreference, UserPreferences } from '@/types'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'

const PREFERENCE_OPTIONS: { key: keyof UserPreferences; label: string; icon: string; iconSet: 'ionicons' | 'material' }[] = [
    { key: 'music', label: 'Music', icon: 'musical-notes', iconSet: 'ionicons' },
    { key: 'no_smoking', label: 'No Smoking', icon: 'smoking-off', iconSet: 'material' },
    { key: 'pets_ok', label: 'Pets OK', icon: 'paw', iconSet: 'ionicons' },
    { key: 'ac', label: 'AC', icon: 'snow', iconSet: 'ionicons' },
    { key: 'luggage_ok', label: 'Luggage', icon: 'bag-handle', iconSet: 'ionicons' },
]

export default function CreateRide() {
    const router = useRouter()
    const { user } = useAuth()
    const { source, destination } = useLocation()

    const [departureDate, setDepartureDate] = useState(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [seats, setSeats] = useState(3)
    const [pricePerSeat, setPricePerSeat] = useState('')
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
        if (!pricePerSeat.trim()) {
            Alert.alert('Missing Info', 'Please enter the price per seat')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.from('rides').insert({
                driver_id: user?.id,
                source_name: source.name,
                source_lat: source.latitude,
                source_lng: source.longitude,
                dest_name: destination.name,
                dest_lat: destination.latitude,
                dest_lng: destination.longitude,
                departure_time: departureDate.toISOString(),
                available_seats: seats,
                price_per_seat: parseFloat(pricePerSeat) || 0,
                gender_preference: genderPreference,
                preferences,
                vehicle_model: vehicleModel.trim(),
                vehicle_plate: vehiclePlate.trim(),
                vehicle_color: vehicleColor.trim(),
                status: 'open',
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
                <Text className="font-display text-xl font-bold text-shride-primary">
                    Offer a Shride
                </Text>
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

                {/* Seats & Price */}
                <Text className="font-display text-lg font-bold text-shride-primary mb-3">Details</Text>
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

                    {/* Price */}
                    <View className="flex-row items-center">
                        <Ionicons name="cash-outline" size={20} color="#41431B" />
                        <Text className="font-body text-base text-shride-text-primary ml-2 mr-3">Price / Seat</Text>
                        <View className="flex-1 flex-row items-center bg-shride-accent/40 rounded-xl px-3">
                            <Text className="font-body text-base text-shride-text-secondary">₹</Text>
                            <TextInput
                                className="flex-1 py-3 px-1 font-body text-base text-shride-text-primary"
                                placeholder="0"
                                placeholderTextColor="#79786b"
                                value={pricePerSeat}
                                onChangeText={setPricePerSeat}
                                keyboardType="numeric"
                            />
                        </View>
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
                            Create Ride
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    )
}
