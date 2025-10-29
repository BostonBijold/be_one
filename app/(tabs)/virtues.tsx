import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dataService, { Virtue, VirtueCheckIn } from '@/services/dataService';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

export default function VirtuesScreen() {
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<{ [virtueId: number]: VirtueCheckIn }>({});
  const [loading, setLoading] = useState(true);
  const [currentVirtueIndex, setCurrentVirtueIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const todayString = dataService.getTodayString();

  // Load virtues and today's check-ins
  useEffect(() => {
    loadVirtuesData();
  }, []);

  const loadVirtuesData = async () => {
    try {
      setLoading(true);
      const [virtuesData, todayData] = await Promise.all([
        dataService.getVirtues(),
        dataService.getTodayData(todayString),
      ]);

      setVirtues(virtuesData.sort((a, b) => a.order - b.order));
      setTodayCheckIns(todayData?.virtueCheckIns || {});

      // Count completed virtues
      const completed = Object.values(todayData?.virtueCheckIns || {}).filter(
        (checkIn) => checkIn.completed
      ).length;
      setCompletedCount(completed);

      // Reset to first virtue
      setCurrentVirtueIndex(0);
      setShowFullDescription(false);
    } catch (err: any) {
      console.error('Error loading virtues:', err);
      Alert.alert('Error', 'Failed to load virtues');
    } finally {
      setLoading(false);
    }
  };

  const currentVirtue = virtues[currentVirtueIndex];

  const handleToggleVirtue = async () => {
    if (!currentVirtue) return;

    try {
      const isCurrentlyCompleted = todayCheckIns[currentVirtue.id]?.completed || false;
      const now = new Date().toISOString();

      const updatedCheckIn: VirtueCheckIn = {
        completed: !isCurrentlyCompleted,
        completedAt: !isCurrentlyCompleted ? now : null,
      };

      // Update local state
      const updatedCheckIns = {
        ...todayCheckIns,
        [currentVirtue.id]: updatedCheckIn,
      };
      setTodayCheckIns(updatedCheckIns);

      // Update count
      const completed = Object.values(updatedCheckIns).filter(
        (checkIn) => checkIn.completed
      ).length;
      setCompletedCount(completed);

      // Save to Firebase
      await dataService.updateTodayVirtueCheckIns(
        { [currentVirtue.id]: updatedCheckIn },
        todayString
      );
    } catch (err: any) {
      console.error('Error updating virtue check-in:', err);
      Alert.alert('Error', 'Failed to save check-in');
      // Revert optimistic update
      loadVirtuesData();
    }
  };

  const handleNext = () => {
    if (currentVirtueIndex < virtues.length - 1) {
      setCurrentVirtueIndex(currentVirtueIndex + 1);
      setShowFullDescription(false);
    }
  };

  const handlePrevious = () => {
    if (currentVirtueIndex > 0) {
      setCurrentVirtueIndex(currentVirtueIndex - 1);
      setShowFullDescription(false);
    }
  };

  const isCurrentVirtueCompleted = currentVirtue
    ? todayCheckIns[currentVirtue.id]?.completed || false
    : false;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AGM_GREEN} />
          <Text style={{ marginTop: 16, color: AGM_DARK }}>Loading virtues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (virtues.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <MaterialCommunityIcons name="lightbulb-outline" size={64} color={AGM_GREEN} />
          <Text style={{ fontSize: 20, fontWeight: '600', color: AGM_DARK, marginTop: 16, textAlign: 'center' }}>
            No Virtues Yet
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 12, textAlign: 'center' }}>
            An admin needs to add virtues. Check back soon!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show summary if all virtues viewed
  if (currentVirtueIndex >= virtues.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          {/* Header */}
          <View style={{ backgroundColor: AGM_DARK, marginHorizontal: -24, marginTop: -24, paddingHorizontal: 24, paddingVertical: 32, marginBottom: 24 }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
              Daily Virtue Check-in
            </Text>
            <Text style={{ color: '#ccc', fontSize: 14 }}>
              Summary
            </Text>
          </View>

          {/* Summary Card */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginBottom: 16, textAlign: 'center' }}>
              Today's Summary
            </Text>

            {/* Progress */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1, backgroundColor: '#e5e7eb', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <View
                    style={{
                      width: `${(completedCount / virtues.length) * 100}%`,
                      height: '100%',
                      backgroundColor: AGM_GREEN,
                    }}
                  />
                </View>
                <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: '700', color: AGM_GREEN }}>
                  {completedCount}/{virtues.length}
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                {completedCount === virtues.length
                  ? "Perfect! You've confirmed all virtues today. 🎉"
                  : `${virtues.length - completedCount} more to confirm`}
              </Text>
            </View>

            {/* Virtues List */}
            <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
                Virtues Confirmed:
              </Text>
              {virtues.map((virtue) => {
                const isChecked = todayCheckIns[virtue.id]?.completed || false;
                return (
                  <View
                    key={virtue.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: '#f3f4f6',
                    }}
                  >
                    <MaterialCommunityIcons
                      name={isChecked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={24}
                      color={isChecked ? AGM_GREEN : '#999'}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={{ fontSize: 14, color: AGM_DARK, textDecorationLine: isChecked ? 'line-through' : 'none' }}>
                      {virtue.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Restart Button */}
          <TouchableOpacity
            onPress={() => setCurrentVirtueIndex(0)}
            style={{
              backgroundColor: AGM_GREEN,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                Review Again
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: AGM_DARK, paddingHorizontal: 24, paddingVertical: 32 }}>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
            Daily Virtue Check-in
          </Text>
          <Text style={{ color: '#ccc', fontSize: 14 }}>
            {currentVirtueIndex + 1} of {virtues.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          <View style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
            <View
              style={{
                width: `${((currentVirtueIndex + 1) / virtues.length) * 100}%`,
                height: '100%',
                backgroundColor: AGM_GREEN,
              }}
            />
          </View>
        </View>

        {/* Virtue Card */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, flex: 1 }}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Virtue Name */}
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: AGM_DARK, marginBottom: 8, textAlign: 'center' }}>
              {currentVirtue?.name}
            </Text>

            {/* Short Description */}
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center', lineHeight: 20 }}>
              {currentVirtue?.shortDescription}
            </Text>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 16 }} />

            {/* Full Description (Expandable) */}
            {!showFullDescription ? (
              <TouchableOpacity
                onPress={() => setShowFullDescription(true)}
                style={{ marginBottom: 24 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={AGM_GREEN} />
                  <Text style={{ fontSize: 13, color: AGM_GREEN, fontWeight: '600', marginLeft: 4 }}>
                    Show Full Description
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, color: '#333', lineHeight: 22, marginBottom: 12 }}>
                  {currentVirtue?.fullDescription}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFullDescription(false)}
                  style={{ alignSelf: 'center' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="chevron-up" size={20} color={AGM_GREEN} />
                    <Text style={{ fontSize: 13, color: AGM_GREEN, fontWeight: '600', marginLeft: 4 }}>
                      Show Less
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Virtue Check Button */}
            <TouchableOpacity
              onPress={handleToggleVirtue}
              style={{
                backgroundColor: isCurrentVirtueCompleted ? AGM_GREEN : '#f3f4f6',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 16,
                borderWidth: 2,
                borderColor: isCurrentVirtueCompleted ? AGM_GREEN : '#e5e7eb',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons
                  name={isCurrentVirtueCompleted ? 'check-circle' : 'circle-outline'}
                  size={28}
                  color={isCurrentVirtueCompleted ? 'white' : '#999'}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: isCurrentVirtueCompleted ? 'white' : AGM_DARK,
                  }}
                >
                  {isCurrentVirtueCompleted ? 'Confirmed ✓' : 'Confirm Virtue'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Completion Status */}
            {isCurrentVirtueCompleted && (
              <Text style={{ fontSize: 12, color: AGM_GREEN, textAlign: 'center', fontWeight: '600' }}>
                Confirmed at {todayCheckIns[currentVirtue!.id]?.completedAt
                  ? new Date(todayCheckIns[currentVirtue!.id]!.completedAt!).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'today'}
              </Text>
            )}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24, flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentVirtueIndex === 0}
            style={{ flex: 1, marginRight: 8 }}
          >
            <View
              style={{
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                backgroundColor: currentVirtueIndex === 0 ? '#e5e7eb' : '#f3f4f6',
              }}
            >
              <Text style={{ color: currentVirtueIndex === 0 ? '#999' : AGM_DARK, fontWeight: '600', fontSize: 14 }}>
                Previous
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={{ flex: 1, marginLeft: 8 }}
          >
            <View
              style={{
                backgroundColor: AGM_GREEN,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                {currentVirtueIndex === virtues.length - 1 ? 'Finish' : 'Next'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
