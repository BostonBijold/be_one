import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { user } = useAuth();
  const AGM_GREEN = '#4b5320';
  const AGM_DARK = '#333333';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AGM_GREEN,
        tabBarInactiveTintColor: '#666666',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#f5f1e8',
          borderTopColor: '#e0ddd0',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 8,
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
      {/* Habits and History tabs hidden - accessible from Routines tab */}

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
  );
}
