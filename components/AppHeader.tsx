import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const AGM_DARK = '#333333';
const AGM_GREEN = '#4b5320';

export default function AppHeader() {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: AGM_DARK,
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {/* Logo on the left */}
      <View style={{ width: 40 }}>
        <Image
          source={require('@/assets/images/agm_logo_white.png')}
          style={{ width: 40, height: 40, resizeMode: 'contain' }}
        />
      </View>

      {/* App name in the center */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
          be one.
        </Text>
      </View>

      {/* Settings menu on the right */}
      <TouchableOpacity
        onPress={() => router.push('/settings')}
        style={{ width: 40, alignItems: 'flex-end' }}
      >
        <MaterialCommunityIcons name="account-circle" size={32} color={AGM_GREEN} />
      </TouchableOpacity>
    </View>
  );
}
