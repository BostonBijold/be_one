import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import authService from '../../services/authService';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';
const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              console.log('Settings - Starting sign out...');
              await authService.signOut();
              console.log('Settings - Sign out successful');
              // Root layout will handle navigation when auth state changes
              // The auth state listener will trigger and navigate to login
            } catch (error: any) {
              console.error('Settings - Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'About DAGM',
      'DAGM - Daily Achievement & Goal Manager\n\nA habit tracking and goal management app designed to help you build better habits and achieve your goals.\n\nVersion: ' + APP_VERSION,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
      {/* Header */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0ddd0' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: AGM_DARK }}>
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Account Section */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK }}>
              Account
            </Text>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <MaterialCommunityIcons name="account" size={24} color={AGM_DARK} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: AGM_DARK }}>
              Profile
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* App Information Section */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK }}>
              App Information
            </Text>
          </View>

          <TouchableOpacity
            onPress={showAbout}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6',
            }}
          >
            <MaterialCommunityIcons name="information" size={24} color={AGM_DARK} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: AGM_DARK }}>
              About DAGM
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <MaterialCommunityIcons name="tag" size={24} color={AGM_DARK} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: AGM_DARK }}>
              Version
            </Text>
            <Text style={{ fontSize: 16, color: '#999' }}>
              {APP_VERSION}
            </Text>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK }}>
              Preferences
            </Text>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6',
            }}
          >
            <MaterialCommunityIcons name="bell" size={24} color={AGM_DARK} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: AGM_DARK }}>
              Notifications
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <MaterialCommunityIcons name="palette" size={24} color={AGM_DARK} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: AGM_DARK }}>
              Theme
            </Text>
            <Text style={{ fontSize: 14, color: '#999', marginRight: 8 }}>
              AGM Classic
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Data Section */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK }}>
              Data Management
            </Text>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6',
            }}
          >
            <MaterialCommunityIcons name="download" size={24} color={AGM_DARK} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: AGM_DARK }}>
              Export Data
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <MaterialCommunityIcons name="upload" size={24} color={AGM_DARK} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: AGM_DARK }}>
              Import Data
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK }}>
              Support
            </Text>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6',
            }}
          >
            <MaterialCommunityIcons name="help-circle" size={24} color={AGM_DARK} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: AGM_DARK }}>
              Help & FAQ
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6',
            }}
          >
            <MaterialCommunityIcons name="email" size={24} color={AGM_DARK} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: AGM_DARK }}>
              Contact Support
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <MaterialCommunityIcons name="shield-check" size={24} color={AGM_DARK} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: AGM_DARK }}>
              Privacy Policy
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={signingOut}
          style={{
            backgroundColor: '#dc2626',
            padding: 16,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            opacity: signingOut ? 0.6 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {signingOut ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                Signing Out...
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="logout" size={24} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                Sign Out
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={{ alignItems: 'center', paddingBottom: 24 }}>
          <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
            DAGM - Daily Achievement & Goal Manager
          </Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 4, textAlign: 'center' }}>
            Made with dedication to personal growth
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
