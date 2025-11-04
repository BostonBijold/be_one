import authService from '@/services/authService';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

// Check if we're on web - use Platform.OS for better detection
const isWeb = Platform.OS === 'web';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only use Google.useAuthRequest on React Native, not on web
  const [request, response, promptAsync] = isWeb
    ? [null, null, null]
    : Google.useAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
        scopes: ['profile', 'email'],
        redirectUri: 'exp://dagmrn',
      });

  // Handle the auth response - ONLY on React Native
  useEffect(() => {
    if (!isWeb && response?.type === 'success') {
      console.log('Google auth success (React Native)');
      const { id_token } = response.params;
      handleGoogleSignInWithToken(id_token);
    }
  }, [response]);

  const handleGoogleSignInWithToken = async (idToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Signing in with Firebase...');
      // Sign in with Firebase using the Google ID token
      await authService.signInWithGoogle(idToken);
      // Navigation will happen automatically through auth state listener
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errorMessage = err?.message || 'Failed to sign in. Please try again.';
      setError(errorMessage);
      Alert.alert('Sign In Failed', errorMessage);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isWeb) {
        console.log('Web: using Firebase popup');
        // Web - use Firebase popup
        await authService.signInWithGooglePopup();
        // Navigation will happen automatically through auth state listener
      } else {
        console.log('Native: using expo-auth-session');
        // React Native - use expo-auth-session
        if (!promptAsync) {
          throw new Error('Google Sign-In not initialized');
        }
        const result = await promptAsync();
        if (result?.type !== 'success') {
          setError('Google Sign-In was cancelled');
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Google auth error:', err);
      const errorMessage = err?.message || 'Failed to start Google Sign-In';
      setError(errorMessage);
      Alert.alert('Error', errorMessage + '. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f1e8' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        {/* Logo Section */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 96, height: 96, marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#333333', marginBottom: 8 }}>AGM</Text>
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#4b5320' }}>Be One</Text>
        </View>

        {/* Welcome Text */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333333', marginBottom: 8 }}>Welcome</Text>
          <Text style={{ fontSize: 16, color: '#333333', textAlign: 'center', paddingHorizontal: 32 }}>
            Sign in to start your journey towards personal growth and achievement
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={{ backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#f87171', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24, width: '100%' }}>
            <Text style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        {/* Google Sign-In Button */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={isLoading || (!isWeb && !request)}
          style={{
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 8,
            paddingHorizontal: 24,
            paddingVertical: 16,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isLoading || (!isWeb && !request) ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#4b5320" />
          ) : (
            <>
              {/* Google Icon Placeholder */}
              <View style={{ width: 24, height: 24, backgroundColor: '#4b5320', borderRadius: 12, marginRight: 12 }} />
              <Text style={{ color: '#333333', fontWeight: '600', fontSize: 16 }}>
                Sign in with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#999999' }}>
            By signing in, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
