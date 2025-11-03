import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import dataService from '@/services/dataService';

export default function TabLayout() {
  const { user } = useAuth();
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
            borderTopColor: '#e0ddd0',
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 12,
            paddingTop: 8,
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

        {/* Admin Tab - Only visible to admin users */}
        {user?.isAdmin && (
          <Tabs.Screen
            name="admin"
            options={{
              title: 'Admin',
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="shield-admin" size={24} color={color} />
              ),
            }}
          />
        )}

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

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        onPress={handleFABPress}
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          marginLeft: -35,
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: AGM_GREEN,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
          zIndex: 100,
        }}
      >
        <MaterialCommunityIcons name="play" size={40} color="white" />
      </TouchableOpacity>
    </View>
  );
}
