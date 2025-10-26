# React Native App Setup & Build Guide

## Completed Backend Setup ✅

Your React Native project now has:
- ✅ Firebase services configured (`services/firebase.ts`)
- ✅ Authentication service (`services/authService.ts`)
- ✅ Data service with full Firestore integration (`services/dataService.ts`)
- ✅ NativeWind/Tailwind configuration
- ✅ Expo Router setup

## Next Steps - Create Frontend Components

### 1. Create Authentication Layout
File: `app/(auth)/_layout.tsx`

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
```

### 2. Create Login Screen
File: `app/(auth)/login.tsx`

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import authService from '@/services/authService';

export default function LoginScreen() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      // For iOS, you need to use native Google Sign-In
      // Install: npx expo install @react-native-google-signin/google-signin
      // Then configure as shown below

      // For now, show message
      alert('Configure Google Sign-In with native library');
    } catch (error) {
      alert('Sign in failed');
    }
  };

  return (
    <View className="flex-1 bg-agm-stone items-center justify-center px-4">
      <View className="items-center mb-8">
        <MaterialCommunityIcons name="check-circle" size={80} color="#4b5320" />
        <Text className="text-4xl font-bold text-agm-dark mt-4">Be One</Text>
        <Text className="text-lg text-gray-600">Habit & Goal Tracker</Text>
      </View>

      <TouchableOpacity
        onPress={handleGoogleSignIn}
        className="bg-white border border-gray-300 rounded-lg px-6 py-3 w-full"
      >
        <Text className="text-center font-semibold text-agm-dark">
          Sign in with Google
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 3. Create Main Tabs Layout
File: `app/(tabs)/_layout.tsx`

```typescript
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4b5320',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="checkbox-marked-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 4. Create Dashboard Screen
File: `app/(tabs)/index.tsx`

```typescript
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import authService from '@/services/authService';
import dataService from '@/services/dataService';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [routines, setRoutines] = useState([]);
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        loadData();
      }
    });

    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      const [routinesData, habitsData] = await Promise.all([
        dataService.getRoutines(),
        dataService.getHabits(),
      ]);
      setRoutines(routinesData);
      setHabits(habitsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-agm-stone"
      contentInsetAdjustmentBehavior="automatic"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View className="px-4 py-4">
        <Text className="text-3xl font-bold text-agm-dark mb-2">Dashboard</Text>
        <Text className="text-gray-600">Welcome back, {user?.name}!</Text>
      </View>

      <View className="px-4">
        <Text className="text-xl font-semibold text-agm-dark mb-3">Routines</Text>
        {routines.length === 0 ? (
          <Text className="text-gray-500">No routines yet</Text>
        ) : (
          routines.map((routine: any) => (
            <View key={routine.id} className="bg-white rounded-lg p-4 mb-2">
              <Text className="font-semibold text-agm-dark">{routine.name}</Text>
              <Text className="text-sm text-gray-600">{routine.habits?.length || 0} habits</Text>
            </View>
          ))
        )}
      </View>

      <View className="px-4 mt-6">
        <Text className="text-xl font-semibold text-agm-dark mb-3">Habits</Text>
        {habits.length === 0 ? (
          <Text className="text-gray-500">No habits yet</Text>
        ) : (
          habits.map((habit: any) => (
            <View key={habit.id} className="bg-white rounded-lg p-4 mb-2">
              <Text className="font-semibold text-agm-dark">{habit.name}</Text>
              <Text className="text-sm text-gray-600">{habit.description}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
```

### 5. Create Stub Screens
Create these files as placeholders:

**File: `app/(tabs)/habits.tsx`**
```typescript
import { View, Text } from 'react-native';

export default function HabitsScreen() {
  return (
    <View className="flex-1 bg-agm-stone items-center justify-center">
      <Text className="text-2xl font-bold text-agm-dark">Habits</Text>
      <Text className="text-gray-600 mt-2">Coming soon</Text>
    </View>
  );
}
```

**File: `app/(tabs)/history.tsx`**
```typescript
import { View, Text } from 'react-native';

export default function HistoryScreen() {
  return (
    <View className="flex-1 bg-agm-stone items-center justify-center">
      <Text className="text-2xl font-bold text-agm-dark">History</Text>
      <Text className="text-gray-600 mt-2">Coming soon</Text>
    </View>
  );
}
```

**File: `app/(tabs)/settings.tsx`**
```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import authService from '@/services/authService';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      alert('Sign out failed');
    }
  };

  return (
    <View className="flex-1 bg-agm-stone px-4">
      <View className="mt-8">
        <Text className="text-2xl font-bold text-agm-dark mb-6">Settings</Text>

        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500 rounded-lg px-4 py-3"
        >
          <Text className="text-white text-center font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

## Installing Custom Hooks

Create `hooks/useColorScheme.ts`:
```typescript
import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme() {
  return useNativeColorScheme();
}
```

Create `hooks/useAuth.ts`:
```typescript
import { useEffect, useState } from 'react';
import authService, { UserData } from '@/services/authService';

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
```

## Setting Up Google Sign-In for iOS

### Step 1: Install Native Google Sign-In
```bash
npx expo install @react-native-google-signin/google-signin
```

### Step 2: Update Firebase Console
1. Go to Firebase Console > Project Settings > Your Apps
2. Create/Select iOS App
3. Register your iOS bundle ID
4. Download GoogleService-Info.plist
5. Copy to your project root

### Step 3: Update app.json
Add to `app.json` in the `"ios"` section:
```json
"googleServicesFile": "./GoogleService-Info.plist"
```

### Step 4: Update Login Screen
```typescript
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

useEffect(() => {
  GoogleSignin.configure({
    iosClientId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    webClientId: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  });
}, []);

const handleGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    // Use idToken with Firebase
  } catch (error) {
    // Handle error
  }
};
```

## Running the App

### Development
```bash
# Start Expo dev server
npm start

# Run on iOS simulator (requires Xcode)
npm run ios

# Run on Android emulator
npm run android
```

### Building for iOS

#### Using EAS Build (Recommended)
```bash
# First, login to EAS
npx eas login

# Build for iOS
eas build --platform ios --auto-submit

# Or build locally
eas build --platform ios --local
```

#### Manual iOS Build
```bash
# Build production
npm run build

# Navigate to ios folder
cd ios

# Build with Xcode
xcodebuild -workspace dagmrn.xcworkspace -scheme dagmrn -configuration Release
```

## App Store Submission Checklist

- [ ] Apple Developer Account created
- [ ] Bundle ID registered in Apple Developer
- [ ] Provisioning profile created
- [ ] App name finalized
- [ ] Screenshots (5.5", 6.5" iPhone sizes)
- [ ] App icon 1024x1024
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] Support email configured
- [ ] Category selected
- [ ] Age rating questionnaire completed
- [ ] Content rights confirmed
- [ ] App Review Information section filled

## Troubleshooting

### "Module not found" errors
```bash
npm install
npm start -- --clear
```

### NativeWind styles not applying
- Rebuild: `npm start -- --clear`
- Check babel.config.js has nativewind preset
- Verify tailwind.config.js paths

### Firebase authentication not working
- Check .env variables
- Verify Firebase project settings
- Ensure iOS OAuth client configured

### iOS build fails
- Run `pod install` in ios folder
- Clean build folder: `Cmd+Shift+K` in Xcode
- Update Xcode to latest version

## Support Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Firebase React Native Guide](https://firebase.google.com/docs/storage/client-side)
- [NativeWind Documentation](https://www.nativewind.dev)
- [Expo Router Guide](https://expo.github.io/router/introduction)

## Next Actions

1. Create the React files listed above in your app/ directory
2. Test with `npm run ios`
3. Configure Google Sign-In for iOS
4. Add more screens (habits, routines, history)
5. Implement virtue check-ins
6. Implement daily challenges
7. Submit to TestFlight

Good luck! 🚀

