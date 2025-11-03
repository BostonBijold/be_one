import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
            backgroundColor: AGM_STONE,
            borderTopColor: '#d0ccc0',
            borderTopWidth: 1,
            height: 100,
            paddingBottom: 16,
            paddingTop: 12,
            paddingHorizontal: 32,
            justifyContent: 'space-between',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 6,
          },
          tabBarIconStyle: {
            marginBottom: 2,
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
              marginRight: 24,
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
              marginLeft: 24,
            },
          }}
        />
        {/* Habits tab hidden - accessible from Routines tab */}
        {/* Admin tab hidden - accessible from Settings tab */}

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

      {/* FAB Container with background glow */}
      <View
        style={{
          position: 'absolute',
          bottom: 35,
          left: '50%',
          marginLeft: -45,
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: 'rgba(75, 83, 32, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}
      />

      {/* Floating Action Button (FAB) - Start Button */}
      <TouchableOpacity
        onPress={handleFABPress}
        style={{
          position: 'absolute',
          bottom: 42,
          left: '50%',
          marginLeft: -38,
          width: 76,
          height: 76,
          borderRadius: 38,
          backgroundColor: AGM_GREEN,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 12,
          zIndex: 50,
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }}
      >
        <MaterialCommunityIcons name="play" size={42} color="white" />
      </TouchableOpacity>
    </View>
  );
}
