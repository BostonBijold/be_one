import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const AGM_GREEN = '#4b5320';
  const AGM_DARK = '#333333';
  const AGM_STONE = '#f5f1e8';

  const handleFABPress = () => {
    // Navigate to the next routine via the dashboard's logic
    // The dashboard will handle finding the next routine
    router.push('/(tabs)');
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: AGM_GREEN,
          tabBarInactiveTintColor: '#999999',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e5e5e5',
            borderTopWidth: 1,
            height: 88,
            paddingBottom: 20,
            paddingTop: 8,
            paddingHorizontal: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="home" size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="routines"
          options={{
            title: 'Routines',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="repeat" size={26} color={color} />
            ),
            tabBarItemStyle: {
              marginRight: 40,
            },
          }}
        />
        {/* Virtues tab hidden - accessible via action button */}
        <Tabs.Screen
          name="virtues"
          options={{
            title: 'Virtues',
            href: null,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="heart" size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="history" size={26} color={color} />
            ),
            tabBarItemStyle: {
              marginLeft: 40,
            },
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cog" size={26} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* FAB Background Glow */}
      <View
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          marginLeft: -42,
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: '#ffffff',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          borderWidth: 2,
          borderColor: '#d0d0d0',
        }}
      />

      {/* Floating Action Button (FAB) - Start Button */}
      <TouchableOpacity
        onPress={handleFABPress}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: 38,
          left: '50%',
          marginLeft: -36,
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: AGM_GREEN,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#ffffff',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 12,
          zIndex: 50,
          borderWidth: 4,
          borderColor: '#ffffff',
        }}
      >
        <MaterialCommunityIcons name="play" size={36} color="white" />
      </TouchableOpacity>
    </View>
  );
}