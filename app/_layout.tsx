import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import authService, { UserData } from '@/services/authService';
import { TimerModalProvider } from '@/context/TimerModalContext';
import TimerModal from '@/components/TimerModal';
import { useTimerModal } from '@/context/TimerModalContext';
import ErrorBoundary from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const rootNavigationState = useRootNavigationState();
  const [user, setUser] = useState<UserData | null>(null);
  const [initializing, setInitializing] = useState(true);
  const { state, closeTimerModal, updateDailyData } = useTimerModal();

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

      {/* Global Timer Modal that can be shown from anywhere */}
      <TimerModal
        visible={state.isVisible}
        habit={state.habit}
        dailyData={state.dailyData}
        onClose={closeTimerModal}
        onDailyDataUpdate={updateDailyData}
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <TimerModalProvider>
        <RootLayoutContent />
      </TimerModalProvider>
    </ErrorBoundary>
  );
}
