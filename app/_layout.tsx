import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import authService, { UserData } from '@/services/authService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
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
      console.log('Root layout - Auth state changed:', authUser);
      console.log('Root layout - User is:', authUser ? authUser.name : 'null');
      setUser(authUser);
      setInitializing(false);

      // Navigate after routes are ready
      if (rootNavigationState?.key) {
        console.log('Root layout - Routes ready, navigating...');
        setTimeout(() => {
          if (authUser) {
            console.log('Root layout - Navigating to dashboard');
            router.replace('/');
          } else {
            console.log('Root layout - Navigating to login');
            router.replace('/login');
          }
        }, 0);
      }
    });

    // Timeout failsafe
    const timer = setTimeout(() => {
      console.log('Auth initialization timeout, proceeding...');
      setInitializing(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [router, rootNavigationState?.key]);

  console.log('Root layout rendering - user state:', user ? user.name : 'null', 'initializing:', initializing);

  // Show nothing while initializing
  if (initializing) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ animationEnabled: false, headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ title: 'Login' }} />
        <Stack.Screen name="(tabs)" options={{ title: 'Dashboard' }} />
      </Stack>
    </ThemeProvider>
  );
}
