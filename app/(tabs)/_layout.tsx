import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

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
          tabBarInactiveTintColor: '#666666',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: AGM_STONE,
            borderTopColor: 'transparent',
            borderTopWidth: 0,
            height: 90,
            paddingBottom: 8,
            paddingTop: 16,
            paddingHorizontal: 16,
          },
          tabBarLabelStyle: {
            fontSize: 12,
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
              <MaterialCommunityIcons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="routines"
          options={{
            title: 'Routines',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="repeat" size={24} color={color} />
            ),
          }}
        />
        {/* Virtues tab hidden - accessible via action button */}
        <Tabs.Screen
          name="virtues"
          options={{
            title: 'Virtues',
            href: null,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="heart" size={24} color={color} />
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
        {/* Habits tab hidden - accessible from Routines tab */}
        {/* Admin tab hidden - accessible from Settings tab */}

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

      {/* Curved Tab Border with integrated FAB */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, zIndex: 1 }}>
        <Svg width="100%" height="100%" viewBox="0 0 375 90" preserveAspectRatio="none">
          <Path
            d="M 0 20 L 60 20 Q 75 20 75 35 Q 75 50 87.5 50 Q 100 50 112.5 50 Q 125 50 125 35 Q 125 20 140 20 L 375 20 L 375 90 L 0 90 Z"
            fill={AGM_STONE}
            stroke="#e0ddd0"
            strokeWidth="1"
          />
        </Svg>
      </View>

      {/* Floating Action Button (FAB) - Integrated with border */}
      <TouchableOpacity
        onPress={handleFABPress}
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          marginLeft: -40,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: AGM_GREEN,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
          zIndex: 50,
        }}
      >
        <MaterialCommunityIcons name="play" size={44} color="white" />
      </TouchableOpacity>
    </View>
  );
}
