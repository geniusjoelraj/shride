export interface Location {
    name: string
    latitude: number
    longitude: number
    address?: string
}

export interface Profile {
    id: string
    full_name: string
    avatar_url: string | null
    bio: string | null
    phone: string | null
    gender: 'male' | 'female' | 'other' | null
    rating: number
    total_ratings: number
    is_verified: boolean
    preferences: UserPreferences
    created_at: string
}

export interface UserPreferences {
    music: boolean
    no_smoking: boolean
    pets_ok: boolean
    ac: boolean
    luggage_ok: boolean
}

export const DEFAULT_PREFERENCES: UserPreferences = {
    music: false,
    no_smoking: true,
    pets_ok: false,
    ac: true,
    luggage_ok: true,
}

export interface Vehicle {
    id: string
    owner_id: string
    model: string
    plate_number: string
    color: string
    seats: number
}

export type GenderPreference = 'anyone' | 'female_only'
export type RideStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'
export type PassengerStatus = 'requested' | 'accepted' | 'rejected'

export interface Ride {
    id: string
    driver_id: string
    source_name: string
    source_lat: number
    source_lng: number
    dest_name: string
    dest_lat: number
    dest_lng: number
    departure_time: string
    available_seats: number
    price_per_seat: number
    gender_preference: GenderPreference
    preferences: UserPreferences
    vehicle_model: string
    vehicle_plate: string
    vehicle_color: string
    status: RideStatus
    created_at: string
    // Joined fields
    driver?: Profile
    passengers?: RidePassenger[]
}

export interface RidePassenger {
    ride_id: string
    passenger_id: string
    status: PassengerStatus
    joined_at: string
    // Joined
    passenger?: Profile
}

export interface RideReview {
    id: string
    ride_id: string
    reviewer_id: string
    driver_id: string
    rating: number
    comment: string | null
    created_at: string
    // Joined
    reviewer?: Profile
}
