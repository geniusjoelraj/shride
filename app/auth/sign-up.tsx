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

export default function SignUp() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { signUp } = useAuth()
    const router = useRouter()

    const handleSignUp = async () => {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields')
            return
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match')
            return
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters')
            return
        }
        setLoading(true)
        const { error } = await signUp(email.trim(), password, fullName.trim())
        setLoading(false)
        if (error) {
            Alert.alert('Sign Up Failed', error.message)
        } else {
            Alert.alert(
                'Account Created',
                'Please check your email to verify your account, then sign in.',
                [{ text: 'OK', onPress: () => router.back() }]
            )
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
                    <View className="items-center mb-10">
                        <Text className="font-display text-5xl font-bold text-shride-primary">
                            Shride
                        </Text>
                        <Text className="font-body text-lg text-shride-text-secondary mt-2">
                            Join the community
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="bg-shride-surface rounded-3xl p-6 shadow-sm">
                        <Text className="font-display text-2xl font-bold text-shride-primary mb-6">
                            Create Account
                        </Text>

                        <Text className="font-body text-sm text-shride-text-secondary mb-2 ml-1">
                            Full Name
                        </Text>
                        <TextInput
                            className="bg-shride-accent/40 rounded-xl px-4 py-4 font-body text-base text-shride-text-primary mb-4"
                            placeholder="Your name"
                            placeholderTextColor="#79786b"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />

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
                            className="bg-shride-accent/40 rounded-xl px-4 py-4 font-body text-base text-shride-text-primary mb-4"
                            placeholder="Min. 6 characters"
                            placeholderTextColor="#79786b"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Text className="font-body text-sm text-shride-text-secondary mb-2 ml-1">
                            Confirm Password
                        </Text>
                        <TextInput
                            className="bg-shride-accent/40 rounded-xl px-4 py-4 font-body text-base text-shride-text-primary mb-6"
                            placeholder="Re-enter password"
                            placeholderTextColor="#79786b"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            className="bg-shride-primary rounded-xl py-4 items-center"
                            onPress={handleSignUp}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FEF9E7" />
                            ) : (
                                <Text className="font-body text-lg font-semibold text-shride-surface">
                                    Create Account
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Sign In Link */}
                    <TouchableOpacity
                        className="mt-6 items-center"
                        onPress={() => router.back()}
                    >
                        <Text className="font-body text-base text-shride-text-secondary">
                            Already have an account?{' '}
                            <Text className="text-shride-primary font-semibold">Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
