import { useAuth } from '@/hooks/useAuth';
import dataService, { DailyData, Habit, Routine } from '@/services/dataService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Load data directly
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [weeklyVirtue, setWeeklyVirtue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoutines, setExpandedRoutines] = useState<number[]>([]);

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
        dataService.getWeeklyVirtue(),
      ]);

      console.log('Dashboard - Data loaded:', {
        routinesCount: routinesData.length,
        routines: routinesData,
        habitsCount: habitsData.length,
        hasDailyData: !!dailyDataResult,
        dailyChallenge: dailyDataResult?.dailyChallenge,
        weeklyVirtue: weeklyVirtueData,
      });

      setRoutines(routinesData);
      setHabits(habitsData);
      setDailyData(dailyDataResult);
      setWeeklyVirtue(weeklyVirtueData);

      // Auto-load daily challenge if not already set and weekly virtue exists
      if (weeklyVirtueData && !dailyDataResult?.dailyChallenge) {
        try {
          const dayOfWeek = new Date().getDay();
          const challenge = await dataService.getDailyChallengeForVirtue(weeklyVirtueData, dayOfWeek);

          if (challenge) {
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

            console.log('Dashboard - Daily challenge loaded:', challenge);
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

  const progress = calculateProgress();

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: AGM_DARK, paddingHorizontal: 24, paddingVertical: 32 }}>
          <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
            Dashboard
          </Text>
          <Text style={{ color: '#ccc', fontSize: 16 }}>
            Welcome back, {user?.displayName || 'User'}!
          </Text>
        </View>

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
                        <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginBottom: 4 }}>
                          {routine.name}
                        </Text>
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

                  {/* Expanded Habits List */}
                  {isExpanded && (
                    <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingHorizontal: 16, paddingVertical: 12 }}>
                      {routineHabits.map((habit, index) => {
                        const habitCompletion = dailyData?.habitCompletions?.[habit.id];
                        const isCompleted = habitCompletion?.completed || false;

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
                              backgroundColor: isCompleted ? '#f0f9f0' : '#f9f9f9',
                            }}
                          >
                            <MaterialCommunityIcons
                              name={isCompleted ? 'check-circle' : 'circle-outline'}
                              size={20}
                              color={isCompleted ? AGM_GREEN : '#d1d5db'}
                              style={{ marginRight: 12 }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '500',
                                  color: isCompleted ? AGM_GREEN : AGM_DARK,
                                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                                }}
                              >
                                {habit.name}
                              </Text>
                            </View>
                            {isCompleted && habitCompletion?.duration && (
                              <Text style={{ fontSize: 11, color: '#999999' }}>
                                {Math.floor(habitCompletion.duration / 1000)}s
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}

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

              return (
                <View
                  key={habit.id}
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
                    borderLeftColor: isCompleted ? AGM_GREEN : '#e5e7eb',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: AGM_DARK, marginBottom: 2 }}>
                        {habit.name}
                      </Text>
                      {habit.description && (
                        <Text style={{ fontSize: 13, color: '#666666' }}>{habit.description}</Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name={isCompleted ? 'check-circle' : 'circle-outline'}
                      size={24}
                      color={isCompleted ? AGM_GREEN : '#d1d5db'}
                    />
                  </View>
                </View>
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