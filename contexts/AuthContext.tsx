import { supabase } from '@/lib/supabase'
import { DEFAULT_PREFERENCES, Profile } from '@/types'
import { Session, User } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
    session: Session | null
    user: User | null
    profile: Profile | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: any }>
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => { },
    refreshProfile: async () => { },
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchOrCreateProfile = async (userId: string, userMeta?: any) => {
        try {
            // Use maybeSingle() to avoid PGRST116 error when row doesn't exist
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                console.error('Error fetching profile:', error)
                return
            }

            if (data) {
                setProfile(data as Profile)
            } else {
                // Profile doesn't exist yet (trigger may not have fired or race condition)
                // Create it manually
                const fullName = userMeta?.full_name || ''
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        full_name: fullName,
                        preferences: DEFAULT_PREFERENCES,
                    })
                    .select()
                    .single()

                if (insertError) {
                    console.error('Error creating profile:', insertError)
                    // Try fetching again after a small delay (trigger may succeed)
                    setTimeout(async () => {
                        const { data: retryData } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', userId)
                            .maybeSingle()
                        if (retryData) setProfile(retryData as Profile)
                    }, 1500)
                } else {
                    setProfile(newProfile as Profile)
                }
            }
        } catch (err) {
            console.error('Error in fetchOrCreateProfile:', err)
        }
    }

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session?.user) {
                fetchOrCreateProfile(session.user.id, session.user.user_metadata)
            }
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            if (session?.user) {
                await fetchOrCreateProfile(session.user.id, session.user.user_metadata)
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { error }
    }

    const signUp = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        })
        return { error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setProfile(null)
    }

    const refreshProfile = async () => {
        if (session?.user) {
            await fetchOrCreateProfile(session.user.id, session.user.user_metadata)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                profile,
                loading,
                signIn,
                signUp,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
