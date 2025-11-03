import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const AGM_GREEN = '#4b5320';


  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: AGM_GREEN,
          tabBarInactiveTintColor: '#666666',
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
    </View>
  );
}