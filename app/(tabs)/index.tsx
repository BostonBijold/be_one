import { useAuth } from '@/hooks/useAuth';
import dataService, { DailyData, Habit, Routine } from '@/services/dataService';
import AppHeader from '@/components/AppHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimerModal } from '@/context/TimerModalContext';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { openTimerModal } = useTimerModal();

  // Load data directly
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [weeklyVirtue, setWeeklyVirtue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoutines, setExpandedRoutines] = useState<number[]>([]);
  const [weekVirtueObject, setWeekVirtueObject] = useState<any>(null);
  const [habitCompletionStats, setHabitCompletionStats] = useState<Record<number, { completed: number; total: number }>>({});
  const [sevenDayData, setSevenDayData] = useState<Record<string, DailyData | null>>({});
  const [showDailyReport, setShowDailyReport] = useState(false);

  const todayString = dataService.getTodayString();

  // Helper function to format completion time
  const formatCompletionTime = (startTime: string, endTime: string): string => {
    try {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const durationMs = end - start;
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    } catch {
      return '';
    }
  };

  // Format milliseconds to MM:SS format
  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate habit completion stats (completed days and total days)
  const calculateHabitCompletionStats = async (habitsData: Habit[]) => {
    const stats: Record<number, { completed: number; total: number }> = {};

    for (const habit of habitsData) {
      try {
        const completionStats = await dataService.getHabitCompletionStats(habit.id, 365);
        stats[habit.id] = completionStats;
      } catch (error) {
        console.error(`Error calculating stats for habit ${habit.id}:`, error);
        stats[habit.id] = { completed: 0, total: 0 };
      }
    }

    setHabitCompletionStats(stats);
  };

  // Format date to YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load all data directly
  const loadData = async () => {
    try {
      console.log('Dashboard - Starting data load...');
      setLoading(true);
      setError(null);

      const [routinesData, habitsData, dailyDataResult, weeklyVirtueData] = await Promise.all([
        dataService.getRoutines(),
        dataService.getHabits(),
        dataService.getTodayData(todayString),
        dataService.getWeeklyVirtueObject(),
      ]);

      // Load past 7 days of data in background
      const sevenDays: Record<string, DailyData | null> = {};
      for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const dateString = formatDateString(date);
        try {
          const dayData = await dataService.getDailyData(dateString);
          sevenDays[dateString] = dayData;
        } catch {
          sevenDays[dateString] = null;
        }
      }
      setSevenDayData(sevenDays);

      console.log('Dashboard - Data loaded:', {
        routinesCount: routinesData.length,
        routines: routinesData,
        habitsCount: habitsData.length,
        hasDailyData: !!dailyDataResult,
        dailyChallenge: dailyDataResult?.dailyChallenge,
        weeklyVirtue: weeklyVirtueData?.name,
      });

      setRoutines(routinesData);
      setHabits(habitsData);
      setDailyData(dailyDataResult);
      setWeeklyVirtue(weeklyVirtueData?.name || null);
      setWeekVirtueObject(weeklyVirtueData);

      // Calculate completion stats for all habits in the background (after a delay to not block UI)
      setTimeout(() => {
        calculateHabitCompletionStats(habitsData);
      }, 500);

      // Auto-load daily challenge if weekly virtue exists
      // Always load/update challenge to match the current weekly virtue
      if (weeklyVirtueData?.name) {
        try {
          const dayOfWeek = new Date().getDay();
          const challenge = await dataService.getDailyChallengeForVirtue(weeklyVirtueData.name, dayOfWeek);

          // If we found a challenge, check if it's different from what's stored
          if (challenge) {
            const currentChallenge = dailyDataResult?.dailyChallenge;
            const isDifferent = !currentChallenge || currentChallenge.virtue !== challenge.virtue;

            if (isDifferent) {
              const updatedDailyData = dailyDataResult || {
                habitCompletions: {},
                routineCompletions: {},
                todos: [],
                virtueCheckIns: {},
              };

              updatedDailyData.dailyChallenge = {
                challengeId: challenge.id,
                virtue: challenge.virtue,
                challenge: challenge.challenge,
                difficulty: challenge.difficulty,
                accepted: false,
                completed: false,
                acceptedAt: null,
                completedAt: null,
              };

              // Save the daily challenge to Firebase
              await dataService.updateDailyData(todayString, updatedDailyData);
              setDailyData(updatedDailyData);

              console.log('Dashboard - Daily challenge updated:', challenge);
            }
          } else {
            console.log('Dashboard - No challenge found for virtue:', weeklyVirtueData.name);
          }
        } catch (err: any) {
          console.error('Dashboard - Error loading daily challenge:', err);
        }
      }

      // Auto-expand the first incomplete routine
      const firstIncompleteRoutine = routinesData.find(
        (r) => !dailyDataResult?.routineCompletions?.[r.id]?.completed
      );
      if (firstIncompleteRoutine) {
        setExpandedRoutines([firstIncompleteRoutine.id]);
      }
    } catch (err: any) {
      console.error('Dashboard - Error loading data:', err);
      setError(err.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refetch data when dashboard comes back into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Toggle routine expansion
  const toggleRoutineExpanded = (routineId: number) => {
    setExpandedRoutines((prev) =>
      prev.includes(routineId) ? prev.filter((id) => id !== routineId) : [...prev, routineId]
    );
  };

  // Handle accepting the daily challenge
  const handleAcceptChallenge = async () => {
    if (!dailyData?.dailyChallenge) return;

    try {
      const updatedChallenge = {
        ...dailyData.dailyChallenge,
        accepted: true,
        acceptedAt: new Date().toISOString(),
      };

      const updatedDailyData = { ...dailyData };
      updatedDailyData.dailyChallenge = updatedChallenge;

      await dataService.updateDailyData(todayString, updatedDailyData);
      setDailyData(updatedDailyData);
    } catch (err: any) {
      console.error('Error accepting challenge:', err);
    }
  };

  // Handle completing the daily challenge
  const handleCompleteChallenge = async () => {
    if (!dailyData?.dailyChallenge) return;

    try {
      const updatedChallenge = {
        ...dailyData.dailyChallenge,
        completed: true,
        completedAt: new Date().toISOString(),
      };

      const updatedDailyData = { ...dailyData };
      updatedDailyData.dailyChallenge = updatedChallenge;

      await dataService.updateDailyData(todayString, updatedDailyData);
      setDailyData(updatedDailyData);
    } catch (err: any) {
      console.error('Error completing challenge:', err);
    }
  };

  // Calculate today's progress - based on ALL habits, not just completed ones
  const calculateProgress = () => {
    if (!habits || habits.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const totalHabits = habits.length;
    const completedHabits = habits.filter((h) => dailyData?.habitCompletions?.[h.id]?.completed).length;
    const percentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    return { completed: completedHabits, total: totalHabits, percentage };
  };

  // Handle toggling individual habit completion
  const handleToggleHabitCompletion = async (habitId: number) => {
    if (!dailyData) return;

    try {
      const currentCompletion = dailyData.habitCompletions?.[habitId];
      const isCurrentlyCompleted = currentCompletion?.completed || false;

      const updatedDailyData = { ...dailyData };
      updatedDailyData.habitCompletions = { ...dailyData.habitCompletions };

      if (isCurrentlyCompleted) {
        // Remove the completion
        delete updatedDailyData.habitCompletions[habitId];
      } else {
        // Mark as completed
        updatedDailyData.habitCompletions[habitId] = {
          completed: true,
          completedAt: new Date().toISOString(),
        };
      }

      await dataService.updateDailyData(todayString, updatedDailyData);
      setDailyData(updatedDailyData);
    } catch (err: any) {
      console.error('Error toggling habit completion:', err);
    }
  };

  const progress = calculateProgress();

  // Helper function to format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get habits for a routine
  const getRoutineHabits = (routineHabitIds: number[]): Habit[] => {
    return habits.filter(h => routineHabitIds.includes(h.id));
  };

  // Get routine composition data for stacked bar
  const getRoutineCompositionData = (routine: Routine, routineCompletion: any) => {
    if (!routineCompletion || !routineCompletion.habitTimes) {
      return { composition: [], totalSeconds: 0 };
    }

    const routineHabits = getRoutineHabits(routine.habits);
    const colors = ['#4b5320', '#8b7355', '#5a8a6b', '#a89b6f', '#6b8f9a', '#9b7b8f', '#8a7b6b'];

    const composition = routineHabits.map((habit, index) => {
      const habitTiming = routineCompletion.habitTimes[habit.id];
      const durationSeconds = habitTiming
        ? Math.round((habitTiming.duration || 0) / 1000)
        : 0;

      return {
        habit,
        durationSeconds,
        color: colors[index % colors.length],
      };
    });

    const totalSeconds = composition.reduce((sum, c) => sum + c.durationSeconds, 0);

    return { composition, totalSeconds };
  };

  // Calculate average routine composition from 7-day data
  const getAverageRoutineComposition = (routine: Routine): { composition: Array<any>; averageTotal: number } => {
    const routineHabits = getRoutineHabits(routine.habits);
    const colors = ['#4b5320', '#8b7355', '#5a8a6b', '#a89b6f', '#6b8f9a', '#9b7b8f', '#8a7b6b'];

    // Count completed days and sum durations for each habit
    const habitDurations: Record<number, { total: number; count: number }> = {};

    Object.values(sevenDayData).forEach((dayData) => {
      if (dayData && dayData.routineCompletions?.[routine.id]?.completed) {
        const routineCompletion = dayData.routineCompletions[routine.id];
        if (routineCompletion.habitTimes) {
          Object.keys(routineCompletion.habitTimes).forEach((habitId) => {
            const id = parseInt(habitId);
            const timing = routineCompletion.habitTimes[id];
            if (timing && timing.duration) {
              if (!habitDurations[id]) {
                habitDurations[id] = { total: 0, count: 0 };
              }
              habitDurations[id].total += timing.duration;
              habitDurations[id].count += 1;
            }
          });
        }
      }
    });

    // Calculate averages
    const composition = routineHabits.map((habit, index) => {
      const durationData = habitDurations[habit.id];
      const averageSeconds = durationData ? Math.round(durationData.total / 1000 / durationData.count) : 0;

      return {
        habit,
        durationSeconds: averageSeconds,
        color: colors[index % colors.length],
      };
    });

    const averageTotal = composition.reduce((sum, c) => sum + c.durationSeconds, 0);

    return { composition, averageTotal };
  };

  // Find the next incomplete routine
  const getNextIncompleteRoutine = (): Routine | null => {
    return routines.find((r) => !dailyData?.routineCompletions?.[r.id]?.completed) || null;
  };

  // Check if all routines are completed
  const areAllRoutinesComplete = (): boolean => {
    if (routines.length === 0) return true;
    return routines.every((r) => dailyData?.routineCompletions?.[r.id]?.completed);
  };

  // Check if virtue checkin is completed
  const isVirtueCheckinComplete = (): boolean => {
    return dailyData?.virtueCheckIns?.[weekVirtueObject?.id] !== undefined;
  };

  // Determine action button state
  const getActionButtonState = (): { label: string; action: () => void; showButton: boolean } => {
    if (showDailyReport) {
      return { label: 'Close', action: () => setShowDailyReport(false), showButton: false };
    }

    const nextRoutine = getNextIncompleteRoutine();
    const allRoutinesDone = areAllRoutinesComplete();
    const virtueCheckinDone = isVirtueCheckinComplete();

    if (nextRoutine) {
      return {
        label: 'Start Next',
        action: () => router.push(`/routine/${nextRoutine.id}`),
        showButton: true,
      };
    }

    if (allRoutinesDone && !virtueCheckinDone && weekVirtueObject) {
      return {
        label: 'Start Virtue Check-in',
        action: () => router.push('/virtues'),
        showButton: true,
      };
    }

    if (allRoutinesDone && virtueCheckinDone) {
      return {
        label: 'View Daily Report',
        action: () => setShowDailyReport(true),
        showButton: true,
      };
    }

    return { label: '', action: () => {}, showButton: false };
  };

  // Get standalone habits (not in routines)
  const standaloneHabits = habits.filter((h) => !h.routineId);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AGM_GREEN} />
          <Text style={{ marginTop: 16, color: AGM_DARK }}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <MaterialCommunityIcons name="alert-circle" size={56} color="#ef4444" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginTop: 16, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadData}
            style={{ backgroundColor: AGM_GREEN, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12, marginTop: 24 }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If showing daily report, show full-page report instead
  if (showDailyReport) {
    const { label: actionLabel, action: actionHandler } = getActionButtonState();

    // Calculate daily stats
    const totalRoutineTime = Object.values(dailyData?.routineCompletions || {}).reduce((sum, rc: any) => {
      if (!rc.habitTimes) return sum;
      return sum + Object.values(rc.habitTimes).reduce((habitSum: number, ht: any) => habitSum + (ht.duration || 0), 0);
    }, 0);

    const completedRoutinesCount = Object.values(dailyData?.routineCompletions || {}).filter((rc: any) => rc.completed).length;
    const virtueCheckinDone = isVirtueCheckinComplete();

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="check-circle" size={64} color={AGM_GREEN} />
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: AGM_DARK, marginTop: 16, textAlign: 'center' }}>
                Great Job Today!
              </Text>
              <Text style={{ fontSize: 16, color: '#666666', marginTop: 8, textAlign: 'center' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* Summary Stats */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 28, fontWeight: 'bold', color: AGM_GREEN }}>
                    {completedRoutinesCount}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#666666', marginTop: 4 }}>
                    Routines Completed
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 28, fontWeight: 'bold', color: AGM_GREEN }}>
                    {formatTime(Math.round(totalRoutineTime / 1000))}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#666666', marginTop: 4 }}>
                    Total Time
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name={virtueCheckinDone ? 'check-circle' : 'circle-outline'}
                    size={28}
                    color={virtueCheckinDone ? AGM_GREEN : '#d1d5db'}
                  />
                  <Text style={{ fontSize: 13, color: '#666666', marginTop: 4 }}>
                    Virtue Check-in
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Routine Breakdowns */}
          {Object.values(dailyData?.routineCompletions || {}).some((rc: any) => rc.completed) && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
                Routine Breakdowns
              </Text>

              {routines.map((routine) => {
                const routineCompletion = dailyData?.routineCompletions?.[routine.id];
                if (!routineCompletion?.completed || !routineCompletion.habitTimes) return null;

                const { composition, totalSeconds } = getRoutineCompositionData(routine, routineCompletion);
                if (composition.length === 0) return null;

                return (
                  <View
                    key={routine.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                      {routine.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666666', marginBottom: 12 }}>
                      Total: {formatTime(totalSeconds)}
                    </Text>

                    {/* Stacked Bar */}
                    <View style={{ flexDirection: 'row', height: 40, borderRadius: 6, overflow: 'hidden', backgroundColor: '#f0f0f0', marginBottom: 8 }}>
                      {composition.map((item) => {
                        const percentage = totalSeconds > 0 ? (item.durationSeconds / totalSeconds) * 100 : 0;
                        return (
                          <View
                            key={item.habit.id}
                            style={{
                              flex: percentage,
                              backgroundColor: item.color,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            {percentage > 15 && (
                              <Text style={{ fontSize: 9, fontWeight: '600', color: 'white' }} numberOfLines={1}>
                                {formatTime(item.durationSeconds)}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    {/* Habit Details */}
                    <View>
                      {composition.map((item) => (
                        <View key={item.habit.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingHorizontal: 4 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: item.color, marginRight: 8 }} />
                          <Text style={{ fontSize: 11, color: AGM_DARK, flex: 1 }}>
                            {item.habit.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#666666' }}>
                            {formatTime(item.durationSeconds)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Bottom Padding */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Close Button */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: AGM_STONE, paddingHorizontal: 16, paddingVertical: 12 }}>
          <TouchableOpacity
            onPress={() => setShowDailyReport(false)}
            style={{
              backgroundColor: AGM_GREEN,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
      {/* App Header - Static */}
      <AppHeader />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Week's Virtue & Daily Challenge Combined Card */}
        {(weeklyVirtue || dailyData?.dailyChallenge) && (
          <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                borderTopWidth: 4,
                borderTopColor: AGM_GREEN,
              }}
            >
              {/* Week's Virtue */}
              {weeklyVirtue && (
                <View style={{ marginBottom: dailyData?.dailyChallenge ? 20 : 0, paddingBottom: dailyData?.dailyChallenge ? 20 : 0, borderBottomWidth: dailyData?.dailyChallenge ? 1 : 0, borderBottomColor: '#e5e7eb' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons
                      name="crown"
                      size={24}
                      color={AGM_GREEN}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={{ fontSize: 12, color: AGM_GREEN, fontWeight: '600' }}>
                      WEEK'S VIRTUE
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK }}>
                    {weeklyVirtue}
                  </Text>
                </View>
              )}

              {/* Daily Challenge */}
              {dailyData?.dailyChallenge && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <MaterialCommunityIcons
                      name="lightbulb"
                      size={20}
                      color={AGM_GREEN}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ fontSize: 12, color: AGM_GREEN, fontWeight: '600', marginRight: 8 }}>
                      TODAY'S CHALLENGE
                    </Text>

                    {/* Inline Difficulty Badge */}
                    {dailyData.dailyChallenge.difficulty && (
                      <View
                        style={{
                          backgroundColor:
                            dailyData.dailyChallenge.difficulty === 'Easy'
                              ? '#d1fae5'
                              : dailyData.dailyChallenge.difficulty === 'Medium'
                              ? '#fef3c7'
                              : '#fee2e2',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color:
                              dailyData.dailyChallenge.difficulty === 'Easy'
                                ? '#059669'
                                : dailyData.dailyChallenge.difficulty === 'Medium'
                                ? '#d97706'
                                : '#dc2626',
                          }}
                        >
                          {dailyData.dailyChallenge.difficulty}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: AGM_DARK, marginBottom: 12 }}>
                    {dailyData.dailyChallenge.challenge}
                  </Text>

                  {/* Status and Actions */}
                  {!dailyData.dailyChallenge.completed ? (
                    <>
                      {!dailyData.dailyChallenge.accepted ? (
                        <TouchableOpacity
                          onPress={handleAcceptChallenge}
                          style={{
                            backgroundColor: AGM_GREEN,
                            borderRadius: 8,
                            paddingVertical: 10,
                            paddingHorizontal: 16,
                            alignItems: 'center',
                            opacity: 0.8,
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
                            Accept Challenge
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={handleCompleteChallenge}
                          style={{
                            backgroundColor: AGM_GREEN,
                            borderRadius: 8,
                            paddingVertical: 10,
                            paddingHorizontal: 16,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
                            Mark as Complete
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <View
                      style={{
                        backgroundColor: '#d1fae5',
                        borderRadius: 8,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="check-circle" size={18} color={AGM_GREEN} style={{ marginRight: 8 }} />
                      <Text style={{ color: AGM_GREEN, fontWeight: '600', fontSize: 13 }}>
                        Challenge Completed!
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Today's Progress */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 14, color: '#666666', marginBottom: 4 }}>Today's Progress</Text>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: AGM_DARK }}>
                  {progress.percentage}%
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons 
                  name={progress.percentage === 100 ? "check-circle" : "progress-clock"} 
                  size={48} 
                  color={progress.percentage === 100 ? AGM_GREEN : '#9ca3af'} 
                />
                <Text style={{ fontSize: 12, color: '#666666', marginTop: 4 }}>
                  {progress.completed}/{progress.total}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={{ backgroundColor: '#e5e7eb', borderRadius: 10, height: 12, overflow: 'hidden' }}>
              <View
                style={{
                  backgroundColor: AGM_GREEN,
                  height: '100%',
                  width: `${progress.percentage}%`,
                }}
              />
            </View>

            <Text style={{ color: '#666666', fontSize: 13, marginTop: 12 }}>
              {progress.total === 0
                ? 'No habits to complete today'
                : progress.completed === progress.total
                ? '🎉 All habits completed!'
                : `${progress.total - progress.completed} habits remaining`}
            </Text>
          </View>
        </View>

        {/* Routines Section */}
        {routines.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK, marginBottom: 12 }}>
              Routines ({routines.length})
            </Text>

            {routines.map((routine) => {
              const routineHabits = habits.filter((h) => h.routineId === routine.id);
              const routineCompletion = dailyData?.routineCompletions?.[routine.id];
              const isExpanded = expandedRoutines.includes(routine.id);
              const completionTime = routineCompletion?.completed
                ? formatCompletionTime(
                    routineCompletion.startTime || '',
                    routineCompletion.endTime || ''
                  )
                : '';

              return (
                <View
                  key={routine.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    overflow: 'hidden',
                    borderLeftWidth: 4,
                    borderLeftColor: routineCompletion?.completed ? AGM_GREEN : '#e5e7eb',
                  }}
                >
                  {/* Routine Header */}
                  <TouchableOpacity
                    onPress={() => toggleRoutineExpanded(routine.id)}
                    style={{ padding: 16 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK }}>
                            {routine.name}
                          </Text>
                          {routine.completionCount && routine.completionCount > 0 && routine.totalDurationSum && (
                            <Text style={{ fontSize: 12, color: '#999999', marginLeft: 8 }}>
                              (avg. {formatDuration(routine.totalDurationSum / routine.completionCount)})
                            </Text>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, color: '#666666', marginRight: 12 }}>
                            {routineHabits.length} {routineHabits.length === 1 ? 'habit' : 'habits'}
                          </Text>
                          {routineCompletion?.completed && completionTime && (
                            <Text style={{ fontSize: 12, color: AGM_GREEN, fontWeight: '600' }}>
                              ✓ {completionTime}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons
                          name={routineCompletion?.completed ? 'check-circle' : 'circle-outline'}
                          size={28}
                          color={routineCompletion?.completed ? AGM_GREEN : '#d1d5db'}
                          style={{ marginRight: 12 }}
                        />
                        <MaterialCommunityIcons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={24}
                          color={AGM_DARK}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingHorizontal: 16, paddingVertical: 12 }}>
                      {routineCompletion?.completed && routineCompletion?.habitTimes ? (
                        // Show stacked bar graph if routine is completed
                        <>
                          {(() => {
                            const { composition, totalSeconds } = getRoutineCompositionData(routine, routineCompletion);
                            const { averageTotal } = getAverageRoutineComposition(routine);
                            if (composition.length === 0) return null;

                            const averagePercentage = totalSeconds > 0 ? (averageTotal / totalSeconds) * 100 : 0;
                            const isAheadOfAverage = totalSeconds > averageTotal;

                            return (
                              <>
                                {/* Labels - Today vs Average */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                  <View>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: AGM_DARK }}>Today</Text>
                                    <Text style={{ fontSize: 11, color: '#666' }}>{formatTime(totalSeconds)}</Text>
                                  </View>
                                  <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#666' }}>7-Day Avg</Text>
                                    <Text style={{ fontSize: 11, color: '#999' }}>{formatTime(averageTotal)}</Text>
                                  </View>
                                </View>

                                {/* Stacked Bar Chart with Average Line */}
                                <View style={{ position: 'relative' }}>
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      height: 60,
                                      borderRadius: 8,
                                      overflow: 'hidden',
                                      backgroundColor: '#f0f0f0',
                                      marginBottom: 8,
                                      position: 'relative',
                                    }}
                                  >
                                    {composition.map((item) => {
                                      const percentage = totalSeconds > 0 ? (item.durationSeconds / totalSeconds) * 100 : 0;

                                      return (
                                        <View
                                          key={item.habit.id}
                                          style={{
                                            flex: percentage,
                                            backgroundColor: item.color,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingHorizontal: 4,
                                          }}
                                        >
                                          {percentage > 12 && (
                                            <Text
                                              style={{
                                                fontSize: 10,
                                                fontWeight: '600',
                                                color: 'white',
                                                textAlign: 'center',
                                              }}
                                              numberOfLines={1}
                                            >
                                              {formatTime(item.durationSeconds)}
                                            </Text>
                                          )}
                                        </View>
                                      );
                                    })}
                                  </View>

                                  {/* Average Line Overlay */}
                                  {averagePercentage > 0 && averagePercentage < 100 && (
                                    <View
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: `${averagePercentage}%`,
                                        width: 2,
                                        height: 60,
                                        backgroundColor: '#9ca3af',
                                        borderRadius: 1,
                                      }}
                                    />
                                  )}
                                </View>

                                {/* Comparison Badge */}
                                <View
                                  style={{
                                    marginBottom: 12,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 6,
                                    backgroundColor: '#f3f4f6',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                  }}
                                >
                                  <MaterialCommunityIcons
                                    name={isAheadOfAverage ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color={AGM_DARK}
                                  />
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      fontWeight: '600',
                                      color: AGM_DARK,
                                    }}
                                  >
                                    {isAheadOfAverage
                                      ? `+${formatTime(totalSeconds - averageTotal)} vs average`
                                      : `${formatTime(averageTotal - totalSeconds)} faster`}
                                  </Text>
                                </View>

                                {/* Habit Breakdown */}
                                <View style={{ paddingHorizontal: 4 }}>
                                  {composition.map((item) => (
                                    <View key={item.habit.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                      <View
                                        style={{
                                          width: 10,
                                          height: 10,
                                          borderRadius: 2,
                                          backgroundColor: item.color,
                                          marginRight: 8,
                                        }}
                                      />
                                      <Text style={{ fontSize: 12, color: AGM_DARK, flex: 1 }}>
                                        {item.habit.name}
                                      </Text>
                                      <Text style={{ fontSize: 12, color: '#666' }}>
                                        {formatTime(item.durationSeconds)}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        // Show habit list if routine is not completed
                        <>
                          {routineHabits.map((habit, index) => {
                            const habitCompletion = dailyData?.habitCompletions?.[habit.id];
                            const isCompleted = habitCompletion?.completed || false;
                            const isExcused = habitCompletion?.excused || false;

                            return (
                              <TouchableOpacity
                                key={habit.id}
                                onPress={() => router.push(`/routine/${routine.id}`)}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingVertical: 10,
                                  paddingHorizontal: 12,
                                  marginBottom: index < routineHabits.length - 1 ? 0 : 0,
                                  borderRadius: 8,
                                  backgroundColor: isCompleted ? '#f0f9f0' : isExcused ? '#f0f0f0' : '#f9f9f9',
                                }}
                              >
                                <MaterialCommunityIcons
                                  name={isCompleted ? 'check-circle' : isExcused ? 'minus-circle' : 'circle-outline'}
                                  size={20}
                                  color={isCompleted ? AGM_GREEN : isExcused ? '#999999' : '#d1d5db'}
                                  style={{ marginRight: 12 }}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      fontSize: 14,
                                      fontWeight: '500',
                                      color: isCompleted ? AGM_GREEN : isExcused ? '#999999' : AGM_DARK,
                                      textDecorationLine: isCompleted || isExcused ? 'line-through' : 'none',
                                    }}
                                  >
                                    {habit.name}
                                  </Text>
                                  {habitCompletionStats[habit.id] !== undefined && (
                                    <Text style={{ fontSize: 11, color: '#ff6b6b', marginTop: 2 }}>
                                      {habitCompletionStats[habit.id].completed}/{habitCompletionStats[habit.id].total}
                                    </Text>
                                  )}
                                  {isExcused && habitCompletion?.excuseReason && (
                                    <Text style={{ fontSize: 11, color: '#ff6b6b', marginTop: 2, fontStyle: 'italic' }}>
                                      Excused: {habitCompletion.excuseReason}
                                    </Text>
                                  )}
                                </View>
                                {isCompleted && habitCompletion?.duration && (
                                  <Text style={{ fontSize: 11, color: '#999999' }}>
                                    {Math.floor(habitCompletion.duration / 1000)}s
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </>
                      )}

                      {/* Start Routine Button */}
                      {!routineCompletion?.completed && (
                        <TouchableOpacity
                          onPress={() => router.push(`/routine/${routine.id}`)}
                          style={{
                            backgroundColor: AGM_GREEN,
                            borderRadius: 8,
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            marginTop: 12,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                            Start Routine
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Standalone Habits Section */}
        {standaloneHabits.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK, marginBottom: 12 }}>
              Individual Habits ({standaloneHabits.length})
            </Text>

            {standaloneHabits.slice(0, 5).map((habit) => {
              const completion = dailyData?.habitCompletions?.[habit.id];
              const isCompleted = completion?.completed || false;
              const isExcused = completion?.excused || false;

              return (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => openTimerModal(habit, dailyData)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                    borderLeftWidth: 3,
                    borderLeftColor: isCompleted ? AGM_GREEN : isExcused ? '#999999' : '#e5e7eb',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: AGM_DARK, marginBottom: 2, textDecorationLine: isExcused ? 'line-through' : 'none', color: isExcused ? '#999999' : AGM_DARK }}>
                        {habit.name}
                      </Text>
                      {habit.description && (
                        <Text style={{ fontSize: 13, color: '#666666', marginBottom: 8 }}>{habit.description}</Text>
                      )}
                      {habitCompletionStats[habit.id] !== undefined && (
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#ff6b6b' }}>
                          {habitCompletionStats[habit.id].completed} completed in {habitCompletionStats[habit.id].total} {habitCompletionStats[habit.id].total === 1 ? 'day' : 'days'}
                        </Text>
                      )}
                      {isExcused && completion?.excuseReason && (
                        <Text style={{ fontSize: 11, color: '#ff6b6b', marginTop: 4, fontStyle: 'italic' }}>
                          Excused: {completion.excuseReason}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <MaterialCommunityIcons
                        name={isCompleted ? 'check-circle' : isExcused ? 'minus-circle' : 'circle-outline'}
                        size={24}
                        color={isCompleted ? AGM_GREEN : isExcused ? '#999999' : '#d1d5db'}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {standaloneHabits.length > 5 && (
              <Text style={{ fontSize: 13, color: '#666666', textAlign: 'center', marginTop: 8 }}>
                +{standaloneHabits.length - 5} more habits
              </Text>
            )}
          </View>
        )}

        {/* Empty State */}
        {routines.length === 0 && standaloneHabits.length === 0 && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={64} color="#d1d5db" />
            <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginTop: 16, textAlign: 'center' }}>
              No Routines or Habits Yet
            </Text>
            <Text style={{ fontSize: 14, color: '#666666', marginTop: 8, textAlign: 'center' }}>
              Create routines and habits to get started on your journey!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}