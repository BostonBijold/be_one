import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  StyleSheet,
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
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [viewMode, setViewMode] = useState<'start' | 'checklist'>('start');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [currentVirtueIndex, setCurrentVirtueIndex] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ [date: string]: { [virtueId: number]: VirtueCheckIn } }>({});
  const [weeklyVirtue, setWeeklyVirtue] = useState<Virtue | null>(null);

  const todayString = dataService.getTodayString();

  // Load virtues and today's check-ins
  useEffect(() => {
    loadVirtuesData();
  }, []);

  const loadVirtuesData = async () => {
    try {
      setLoading(true);
      const [virtuesData, todayData, weeklyVirtueData] = await Promise.all([
        dataService.getVirtues(),
        dataService.getTodayData(todayString),
        dataService.getWeeklyVirtueObject(),
      ]);

      setVirtues(virtuesData.sort((a, b) => a.order - b.order));
      setTodayCheckIns(todayData?.virtueCheckIns || {});
      setWeeklyVirtue(weeklyVirtueData);

      // Count completed virtues
      const completed = Object.values(todayData?.virtueCheckIns || {}).filter(
        (checkIn) => checkIn.completed
      ).length;
      setCompletedCount(completed);

      // Reset state
      setShowFullDescription(false);
      setViewMode('start');

      // Load weekly data in background
      loadWeeklyData();
    } catch (err: any) {
      console.error('Error loading virtues:', err);
      Alert.alert('Error', 'Failed to load virtues');
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyData = async () => {
    try {
      const weekData: { [date: string]: { [virtueId: number]: VirtueCheckIn } } = {};

      // Load past 7 days (including today)
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        const dailyData = await dataService.getDailyData(dateString);
        weekData[dateString] = dailyData?.virtueCheckIns || {};
      }

      setWeeklyData(weekData);
    } catch (err: any) {
      console.error('Error loading weekly virtue data:', err);
    }
  };

  const handleToggleVirtue = async (virtue: Virtue) => {
    try {
      const isCurrentlyCompleted = todayCheckIns[virtue.id]?.completed || false;
      const now = new Date().toISOString();

      const updatedCheckIn: VirtueCheckIn = {
        completed: !isCurrentlyCompleted,
        completedAt: !isCurrentlyCompleted ? now : null,
      };

      // Update local state
      const updatedCheckIns = {
        ...todayCheckIns,
        [virtue.id]: updatedCheckIn,
      };
      setTodayCheckIns(updatedCheckIns);

      // Update count
      const completed = Object.values(updatedCheckIns).filter(
        (checkIn) => checkIn.completed
      ).length;
      setCompletedCount(completed);

      // Save to Firebase
      await dataService.updateTodayVirtueCheckIns(
        { [virtue.id]: updatedCheckIn },
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
    }
  };

  const handlePrevious = () => {
    if (currentVirtueIndex > 0) {
      setCurrentVirtueIndex(currentVirtueIndex - 1);
    }
  };

  const handleFinishCheckin = () => {
    setViewMode('start');
    setCurrentVirtueIndex(0);
  };

  const currentVirtue = virtues[currentVirtueIndex];
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

  // Show start screen if check-in not started
  if (viewMode === 'start') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        {/* Fixed Header */}
        <View style={{ backgroundColor: AGM_DARK, paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#444' }}>
          <Text style={{ color: 'white', fontSize: 26, fontWeight: 'bold' }}>
            Daily Virtue Check-in
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
          {/* Spacer for visual balance */}
          <View style={{ height: 12 }} />

          {/* Week's Focus Section Header */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginBottom: 16 }}>
            This Week's Focus
          </Text>

          {/* Focus Virtue Card */}
          {weeklyVirtue ? (
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 6,
              marginBottom: 32,
              borderLeftWidth: 4,
              borderLeftColor: AGM_GREEN,
            }}>
              {/* Virtue Icon */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: AGM_STONE,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MaterialCommunityIcons name="lightbulb-on" size={44} color={AGM_GREEN} />
                </View>
              </View>

              {/* Virtue Name */}
              <Text style={{
                fontSize: 28,
                fontWeight: '800',
                color: AGM_GREEN,
                marginBottom: 12,
                textAlign: 'center',
                letterSpacing: 0.5,
              }}>
                {weeklyVirtue.name}
              </Text>

              {/* Short Description */}
              <Text style={{
                fontSize: 15,
                color: '#555',
                marginBottom: 20,
                textAlign: 'center',
                lineHeight: 24,
                fontWeight: '500',
              }}>
                {weeklyVirtue.shortDescription}
              </Text>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 20 }} />

              {/* Full Description */}
              {!showFullDescription ? (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(true)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: AGM_STONE,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={AGM_GREEN} />
                    <Text style={{ fontSize: 13, color: AGM_GREEN, fontWeight: '700', marginLeft: 6 }}>
                      Read Full Description
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View>
                  <Text style={{
                    fontSize: 15,
                    color: '#444',
                    lineHeight: 24,
                    marginBottom: 16,
                    fontWeight: '400',
                  }}>
                    {weeklyVirtue.fullDescription}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowFullDescription(false)}
                    style={{ alignSelf: 'center' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="chevron-up" size={20} color={AGM_GREEN} />
                      <Text style={{ fontSize: 13, color: AGM_GREEN, fontWeight: '700', marginLeft: 6 }}>
                        Show Less
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null}

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 20, marginTop: 16 }} />

          {/* Today's Virtues Checklist */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
            Today's Check-in Status
          </Text>

          {virtues.map((virtue) => {
            const isCompleted = todayCheckIns[virtue.id]?.completed || false;
            return (
              <View
                key={virtue.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: '#f9f9f9',
                  borderRadius: 10,
                  marginBottom: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: isCompleted ? AGM_GREEN : '#ddd',
                }}
              >
                <MaterialCommunityIcons
                  name={isCompleted ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={24}
                  color={isCompleted ? AGM_GREEN : '#ccc'}
                  style={{ marginRight: 12 }}
                />
                <Text style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '600',
                  color: AGM_DARK,
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                }}>
                  {virtue.name}
                </Text>
              </View>
            );
          })}

          {/* Bottom Action Buttons */}
          <View style={{ marginTop: 24, gap: 12 }}>
            {/* Start Check-in Button */}
            <TouchableOpacity
              onPress={() => {
                setViewMode('checklist');
                setCurrentVirtueIndex(0);
                setShowFullDescription(false);
              }}
              style={{
                backgroundColor: AGM_GREEN,
                borderRadius: 14,
                paddingVertical: 18,
                paddingHorizontal: 20,
                alignItems: 'center',
                shadowColor: AGM_GREEN,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="play-circle-outline" size={22} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 }}>
                  Start Check-in
                </Text>
              </View>
            </TouchableOpacity>

            {/* View History Button */}
            <TouchableOpacity
              onPress={() => setShowHistoryDrawer(true)}
              style={{
                backgroundColor: 'white',
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 20,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: AGM_GREEN,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="calendar-week" size={20} color={AGM_GREEN} style={{ marginRight: 8 }} />
                <Text style={{ color: AGM_GREEN, fontWeight: '700', fontSize: 15, letterSpacing: 0.3 }}>
                  View Weekly History
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacer */}
          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Checklist view - one virtue at a time
  if (viewMode === 'checklist') {
    const virtue = virtues[currentVirtueIndex];
    const isCompleted = todayCheckIns[virtue?.id]?.completed || false;
    const isLastVirtue = currentVirtueIndex === virtues.length - 1;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        {/* Fixed Header */}
        <View style={{ backgroundColor: AGM_DARK, paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#444' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: 'white', fontSize: 26, fontWeight: 'bold' }}>
              Check-in
            </Text>
            <TouchableOpacity onPress={() => handleFinishCheckin()}>
              <MaterialCommunityIcons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={{ height: 6, backgroundColor: '#555555', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            <View
              style={{
                width: `${((currentVirtueIndex + 1) / virtues.length) * 100}%`,
                height: '100%',
                backgroundColor: AGM_GREEN,
              }}
            />
          </View>
          <Text style={{ color: '#ccc', fontSize: 13 }}>
            {currentVirtueIndex + 1} of {virtues.length}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          {/* Virtue Card */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 28,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 6,
            borderLeftWidth: 4,
            borderLeftColor: AGM_GREEN,
            marginBottom: 24,
          }}>
            {/* Virtue Icon */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: AGM_STONE,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaterialCommunityIcons name="lightbulb-on" size={44} color={AGM_GREEN} />
              </View>
            </View>

            {/* Virtue Name */}
            <Text style={{
              fontSize: 28,
              fontWeight: '800',
              color: AGM_GREEN,
              marginBottom: 12,
              textAlign: 'center',
            }}>
              {virtue?.name}
            </Text>

            {/* Short Description */}
            <Text style={{
              fontSize: 15,
              color: '#555',
              marginBottom: 20,
              textAlign: 'center',
              lineHeight: 24,
              fontWeight: '500',
            }}>
              {virtue?.shortDescription}
            </Text>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 20 }} />

            {/* Full Description */}
            {!showFullDescription ? (
              <TouchableOpacity
                onPress={() => setShowFullDescription(true)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: AGM_STONE,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={AGM_GREEN} />
                  <Text style={{ fontSize: 13, color: AGM_GREEN, fontWeight: '700', marginLeft: 6 }}>
                    Read Full Description
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={{
                  fontSize: 15,
                  color: '#444',
                  lineHeight: 24,
                  marginBottom: 16,
                  fontWeight: '400',
                }}>
                  {virtue?.fullDescription}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFullDescription(false)}
                  style={{ alignSelf: 'center' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="chevron-up" size={20} color={AGM_GREEN} />
                    <Text style={{ fontSize: 13, color: AGM_GREEN, fontWeight: '700', marginLeft: 6 }}>
                      Show Less
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Question */}
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: AGM_DARK,
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 28,
          }}>
            Did you practice{' '}
            <Text style={{ color: AGM_GREEN, fontWeight: '800' }}>
              {virtue?.name}
            </Text>
            {' '}today?
          </Text>

          {/* Three Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Previous Button */}
            <TouchableOpacity
              onPress={handlePrevious}
              disabled={currentVirtueIndex === 0}
              style={{ flex: 0.8 }}
            >
              <View style={{
                backgroundColor: currentVirtueIndex === 0 ? '#e5e7eb' : '#f3f4f6',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
              }}>
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color={currentVirtueIndex === 0 ? '#999' : AGM_DARK}
                />
              </View>
            </TouchableOpacity>

            {/* Needs Work Button */}
            <TouchableOpacity
              onPress={() => {
                if (isCompleted) {
                  handleToggleVirtue(virtue);
                }
                // Auto advance after selecting
                setTimeout(() => {
                  if (isLastVirtue) {
                    handleFinishCheckin();
                  } else {
                    handleNext();
                  }
                }, 300);
              }}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  backgroundColor: !isCompleted ? AGM_STONE : '#f3f4f6',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: !isCompleted ? AGM_GREEN : '#e5e7eb',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: AGM_DARK,
                  }}
                >
                  Needs Work
                </Text>
              </View>
            </TouchableOpacity>

            {/* Yes Button */}
            <TouchableOpacity
              onPress={() => {
                if (!isCompleted) {
                  handleToggleVirtue(virtue);
                }
                // Auto advance after selecting
                setTimeout(() => {
                  if (isLastVirtue) {
                    handleFinishCheckin();
                  } else {
                    handleNext();
                  }
                }, 300);
              }}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  backgroundColor: isCompleted ? AGM_GREEN : '#f3f4f6',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: isCompleted ? AGM_GREEN : '#e5e7eb',
                }}
              >
                <MaterialCommunityIcons
                  name={isCompleted ? 'check-circle' : 'circle-outline'}
                  size={28}
                  color={isCompleted ? 'white' : '#999'}
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: isCompleted ? 'white' : AGM_DARK,
                  }}
                >
                  Yes
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Default render - Start Screen (with optional History Drawer overlay)
  return (
    <View style={{ flex: 1 }}>
      {/* Start Screen */}
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        {/* Fixed Header */}
        <View style={{ backgroundColor: AGM_DARK, paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#444' }}>
          <Text style={{ color: 'white', fontSize: 26, fontWeight: 'bold' }}>
            Daily Virtue Check-in
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
          {/* Spacer */}
          <View style={{ height: 12 }} />

          {/* Week's Focus Section Header */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginBottom: 16 }}>
            This Week's Focus
          </Text>

          {/* Focus Virtue Card */}
          {weeklyVirtue ? (
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 6,
              marginBottom: 32,
              borderLeftWidth: 4,
              borderLeftColor: AGM_GREEN,
            }}>
              {/* Virtue Icon */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: AGM_STONE,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MaterialCommunityIcons name="lightbulb-on" size={44} color={AGM_GREEN} />
                </View>
              </View>

              {/* Virtue Name */}
              <Text style={{
                fontSize: 28,
                fontWeight: '800',
                color: AGM_GREEN,
                marginBottom: 12,
                textAlign: 'center',
                letterSpacing: 0.5,
              }}>
                {weeklyVirtue.name}
              </Text>

              {/* Short Description */}
              <Text style={{
                fontSize: 15,
                color: '#555',
                marginBottom: 20,
                textAlign: 'center',
                lineHeight: 24,
                fontWeight: '500',
              }}>
                {weeklyVirtue.shortDescription}
              </Text>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 20 }} />

              {/* Full Description */}
              {!showFullDescription ? (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(true)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: AGM_STONE,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={AGM_GREEN} />
                    <Text style={{ fontSize: 13, color: AGM_GREEN, fontWeight: '700', marginLeft: 6 }}>
                      Read Full Description
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View>
                  <Text style={{
                    fontSize: 15,
                    color: '#444',
                    lineHeight: 24,
                    marginBottom: 16,
                    fontWeight: '400',
                  }}>
                    {weeklyVirtue.fullDescription}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowFullDescription(false)}
                    style={{ alignSelf: 'center' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="chevron-up" size={20} color={AGM_GREEN} />
                      <Text style={{ fontSize: 13, color: AGM_GREEN, fontWeight: '700', marginLeft: 6 }}>
                        Show Less
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null}

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 20, marginTop: 16 }} />

          {/* Today's Virtues Checklist */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
            Today's Check-in Status
          </Text>

          {virtues.map((virtue) => {
            const isCompleted = todayCheckIns[virtue.id]?.completed || false;
            return (
              <View
                key={virtue.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: '#f9f9f9',
                  borderRadius: 10,
                  marginBottom: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: isCompleted ? AGM_GREEN : '#ddd',
                }}
              >
                <MaterialCommunityIcons
                  name={isCompleted ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={24}
                  color={isCompleted ? AGM_GREEN : '#ccc'}
                  style={{ marginRight: 12 }}
                />
                <Text style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '600',
                  color: AGM_DARK,
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                }}>
                  {virtue.name}
                </Text>
              </View>
            );
          })}

          {/* Bottom Action Buttons */}
          <View style={{ marginTop: 24, gap: 12 }}>
            {/* Start Check-in Button */}
            <TouchableOpacity
              onPress={() => {
                setViewMode('checklist');
                setCurrentVirtueIndex(0);
                setShowFullDescription(false);
              }}
              style={{
                backgroundColor: AGM_GREEN,
                borderRadius: 14,
                paddingVertical: 18,
                paddingHorizontal: 20,
                alignItems: 'center',
                shadowColor: AGM_GREEN,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="play-circle-outline" size={22} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 }}>
                  Start Check-in
                </Text>
              </View>
            </TouchableOpacity>

            {/* View History Button */}
            <TouchableOpacity
              onPress={() => setShowHistoryDrawer(true)}
              style={{
                backgroundColor: 'white',
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 20,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: AGM_GREEN,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="calendar-week" size={20} color={AGM_GREEN} style={{ marginRight: 8 }} />
                <Text style={{ color: AGM_GREEN, fontWeight: '700', fontSize: 15, letterSpacing: 0.3 }}>
                  View Weekly History
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacer */}
          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>

      {/* History Drawer Modal - slides up from bottom */}
      {showHistoryDrawer && (
        <View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}>
          <View style={{
            flex: 1,
            justifyContent: 'flex-end',
          }}>
            <View style={{
              backgroundColor: AGM_STONE,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 24,
              maxHeight: '85%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 10,
            }}>
              {/* Header with close button */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 24,
                marginBottom: 16,
              }}>
                <Text style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: AGM_DARK,
                }}>
                  Weekly History
                </Text>
                <TouchableOpacity onPress={() => setShowHistoryDrawer(false)}>
                  <MaterialCommunityIcons name="close" size={28} color={AGM_DARK} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Content */}
              <ScrollView contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                {/* Weekly Grid View */}
                <View style={{ backgroundColor: 'white', borderRadius: 16, margin: 0, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, overflow: 'hidden' }}>
                  {/* Day Headers Row */}
                  <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                    <View style={{ width: 100, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: AGM_DARK }}>Virtue</Text>
                    </View>
                    {Object.keys(weeklyData)
                      .sort()
                      .map((dateStr) => {
                        const date = new Date(dateStr);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = date.getDate();
                        return (
                          <View key={dateStr} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: AGM_DARK }}>
                              {dayName}
                            </Text>
                            <Text style={{ fontSize: 9, color: '#666' }}>
                              {dayNum}
                            </Text>
                          </View>
                        );
                      })}
                  </View>

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 12 }} />

                  {/* Virtue Rows */}
                  {virtues.map((virtue, index) => {
                    return (
                      <View key={virtue.id} style={{ marginBottom: index < virtues.length - 1 ? 12 : 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 100 }}>
                            <Text style={{ fontSize: 11, fontWeight: '500', color: AGM_DARK, lineHeight: 14 }}>
                              {virtue.name}
                            </Text>
                          </View>
                          {Object.keys(weeklyData)
                            .sort()
                            .map((dateStr) => {
                              const checkIn = weeklyData[dateStr]?.[virtue.id];
                              const hasData = weeklyData[dateStr] && Object.keys(weeklyData[dateStr]).length > 0;
                              const isCompleted = checkIn?.completed || false;

                              return (
                                <View
                                  key={`${virtue.id}-${dateStr}`}
                                  style={{
                                    flex: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 8,
                                    paddingHorizontal: 4,
                                    backgroundColor: !hasData ? '#f0f0f0' : 'transparent',
                                    borderRadius: 6,
                                  }}
                                >
                                  {hasData ? (
                                    <MaterialCommunityIcons
                                      name={isCompleted ? 'checkbox-marked-circle' : 'circle-outline'}
                                      size={18}
                                      color={isCompleted ? AGM_GREEN : '#ccc'}
                                    />
                                  ) : (
                                    <View style={{ width: 18, height: 18 }} />
                                  )}
                                </View>
                              );
                            })}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Legend */}
                <View style={{ marginTop: 16, paddingHorizontal: 12 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: '600' }}>
                    Legend:
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <MaterialCommunityIcons name="checkbox-marked-circle" size={16} color={AGM_GREEN} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 12, color: '#666' }}>Confirmed</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <MaterialCommunityIcons name="circle-outline" size={16} color="#ccc" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 12, color: '#666' }}>Not Confirmed</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 16, height: 16, backgroundColor: '#f0f0f0', borderRadius: 4, marginRight: 8 }} />
                    <Text style={{ fontSize: 12, color: '#666' }}>No Check-in Data</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
