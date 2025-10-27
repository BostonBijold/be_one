import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import authService, { UserData } from '@/services/authService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const rootNavigationState = useRootNavigationState();
  const [user, setUser] = useState<UserData | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    // Initialize auth service
    authService.init();

    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setInitializing(false);
    });

    // Timeout failsafe
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Wait for navigation to be ready
  if (!rootNavigationState?.key || initializing) {
    return <View style={{ flex: 1 }} />;
  }

  // Use conditional rendering based on user state (not imperative navigation)
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ animationEnabled: false, headerShown: false }}>
        {user ? (
          <Stack.Screen name="(tabs)" options={{ title: 'Dashboard' }} />
        ) : (
          <Stack.Screen name="(auth)" options={{ title: 'Login' }} />
        )}
      </Stack>
    </ThemeProvider>
  );
}
