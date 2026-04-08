import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

export default function SignIn() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const router = useRouter()

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields')
            return
        }
        setLoading(true)
        const { error } = await signIn(email.trim(), password)
        setLoading(false)
        if (error) {
            Alert.alert('Sign In Failed', error.message)
        }
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-shride-background"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-1 justify-center px-8">
                    {/* Logo / Branding */}
                    <View className="items-center mb-12">
                        <Text className="font-display text-5xl font-bold text-shride-primary">
                            Shride
                        </Text>
                        <Text className="font-body text-lg text-shride-text-secondary mt-2">
                            Share the ride, share the vibe
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="bg-shride-surface rounded-3xl p-6 shadow-sm">
                        <Text className="font-display text-2xl font-bold text-shride-primary mb-6">
                            Welcome back
                        </Text>

                        <Text className="font-body text-sm text-shride-text-secondary mb-2 ml-1">
                            Email
                        </Text>
                        <TextInput
                            className="bg-shride-accent/40 rounded-xl px-4 py-4 font-body text-base text-shride-text-primary mb-4"
                            placeholder="you@example.com"
                            placeholderTextColor="#79786b"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text className="font-body text-sm text-shride-text-secondary mb-2 ml-1">
                            Password
                        </Text>
                        <TextInput
                            className="bg-shride-accent/40 rounded-xl px-4 py-4 font-body text-base text-shride-text-primary mb-6"
                            placeholder="••••••••"
                            placeholderTextColor="#79786b"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            className="bg-shride-primary rounded-xl py-4 items-center"
                            onPress={handleSignIn}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FEF9E7" />
                            ) : (
                                <Text className="font-body text-lg font-semibold text-shride-surface">
                                    Sign In
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Sign Up Link */}
                    <TouchableOpacity
                        className="mt-6 items-center"
                        onPress={() => router.push('/auth/sign-up')}
                    >
                        <Text className="font-body text-base text-shride-text-secondary">
                            Don't have an account?{' '}
                            <Text className="text-shride-primary font-semibold">Sign Up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
