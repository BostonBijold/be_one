import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dataService, { Habit, DailyData, Routine } from '@/services/dataService';
import AppHeader from '@/components/AppHeader';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

export default function HistoryScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [weeklyData, setWeeklyData] = useState<Record<string, DailyData | null>>({});

  // Format date to YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load data for selected date
  const loadDailyData = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);

      const dateString = formatDateString(date);

      // Get habits and routines lists
      const [allHabits, allRoutines] = await Promise.all([
        dataService.getHabits(),
        dataService.getRoutines(),
      ]);
      setHabits(allHabits);
      setRoutines(allRoutines);

      // Get daily data for this date
      const data = await dataService.getDailyData(dateString);
      setDailyData(data);
    } catch (err: any) {
      console.error('Error loading history:', err);
      setError(err.message || 'Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load data for the past 7 days
  const loadWeeklyData = async (endDate: Date) => {
    try {
      setLoading(true);
      setError(null);

      // Get habits and routines lists
      const [allHabits, allRoutines] = await Promise.all([
        dataService.getHabits(),
        dataService.getRoutines(),
      ]);
      setHabits(allHabits);
      setRoutines(allRoutines);

      // Load data for each of the past 7 days
      const weekData: Record<string, DailyData | null> = {};
      for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - daysAgo);
        const dateString = formatDateString(date);

        try {
          const data = await dataService.getDailyData(dateString);
          weekData[dateString] = data;
        } catch {
          weekData[dateString] = null;
        }
      }

      setWeeklyData(weekData);
    } catch (err: any) {
      console.error('Error loading weekly history:', err);
      setError(err.message || 'Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'day') {
      loadDailyData(selectedDate);
    } else {
      loadWeeklyData(selectedDate);
    }
  }, [selectedDate, viewMode]);

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    // Don't allow future dates
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Check if selected date is today
  const isToday = formatDateString(selectedDate) === formatDateString(new Date());

  // Calculate completion stats
  const completedCount = dailyData
    ? Object.values(dailyData.habitCompletions).filter(c => c.completed).length
    : 0;
  const totalCount = dailyData ? Object.keys(dailyData.habitCompletions).length : 0;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
      return [];
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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AGM_GREEN} />
          <Text style={{ marginTop: 16, color: AGM_DARK, fontSize: 16 }}>
            Loading history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#dc2626" />
          <Text style={{ marginTop: 16, color: AGM_DARK, fontSize: 18, fontWeight: '600' }}>
            Error Loading History
          </Text>
          <Text style={{ marginTop: 8, color: AGM_DARK, fontSize: 14, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => loadDailyData(selectedDate)}
            style={{
              marginTop: 24,
              backgroundColor: AGM_GREEN,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
      {/* App Header with "be one." */}
      <AppHeader />

      {/* Page Header with "History" and View Toggle */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0ddd0' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: AGM_DARK }}>
            History
          </Text>

          {/* Day/Week Toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 8, padding: 4 }}>
            <TouchableOpacity
              onPress={() => setViewMode('day')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: viewMode === 'day' ? AGM_GREEN : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: viewMode === 'day' ? 'white' : AGM_DARK
              }}>
                Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('week')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: viewMode === 'week' ? AGM_GREEN : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: viewMode === 'week' ? 'white' : AGM_DARK
              }}>
                Week
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {viewMode === 'day' ? (
          <>
            {/* Date Selector */}
            <View style={{
              backgroundColor: '#ffffff',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={goToPreviousDay}
              style={{ padding: 8 }}
            >
              <MaterialCommunityIcons name="chevron-left" size={32} color={AGM_DARK} />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK }}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
              {isToday && (
                <Text style={{ fontSize: 14, color: AGM_GREEN, marginTop: 4 }}>
                  Today
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={goToNextDay}
              disabled={isToday}
              style={{ padding: 8, opacity: isToday ? 0.3 : 1 }}
            >
              <MaterialCommunityIcons name="chevron-right" size={32} color={AGM_DARK} />
            </TouchableOpacity>
          </View>

          {!isToday && (
            <TouchableOpacity
              onPress={goToToday}
              style={{
                marginTop: 12,
                backgroundColor: AGM_GREEN,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                Go to Today
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Card */}
        {dailyData && totalCount > 0 && (
          <View style={{
            backgroundColor: '#ffffff',
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
              Daily Summary
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flex: 1, backgroundColor: '#e5e7eb', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{
                  width: `${completionPercentage}%`,
                  height: '100%',
                  backgroundColor: AGM_GREEN
                }} />
              </View>
              <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '600', color: AGM_DARK }}>
                {completionPercentage}%
              </Text>
            </View>

            <Text style={{ fontSize: 14, color: '#666' }}>
              {completedCount} of {totalCount} habits completed
            </Text>
          </View>
        )}

        {/* Routines Section */}
        {dailyData && routines.length > 0 && Object.keys(dailyData.routineCompletions || {}).length > 0 && (
          <View style={{
            backgroundColor: '#ffffff',
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
              Routines
            </Text>

            {routines.map((routine) => {
              const routineCompletion = dailyData.routineCompletions?.[routine.id];
              if (!routineCompletion || !routineCompletion.completed) return null;

              const { composition, totalSeconds } = getRoutineCompositionData(routine, routineCompletion);
              if (composition.length === 0) return null;

              return (
                <View key={routine.id} style={{ marginBottom: 16 }}>
                  {/* Routine Name and Time */}
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 4 }}>
                      {routine.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      Total: {formatTime(totalSeconds)}
                    </Text>
                  </View>

                  {/* Stacked Bar Chart */}
                  <View
                    style={{
                      flexDirection: 'row',
                      height: 60,
                      borderRadius: 8,
                      overflow: 'hidden',
                      backgroundColor: '#f0f0f0',
                      marginBottom: 8,
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
                </View>
              );
            })}
          </View>
        )}

        {/* Habits List */}
        <View style={{
          backgroundColor: '#ffffff',
          padding: 16,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
            Habits
          </Text>

          {!dailyData || totalCount === 0 ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#999" />
              <Text style={{ color: '#999', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                No habit data for this date
              </Text>
            </View>
          ) : (
            Object.entries(dailyData.habitCompletions).map(([habitIdStr, completion]) => {
              const habitId = parseInt(habitIdStr);
              const habit = habits.find(h => h.id === habitId);

              if (!habit) return null;

              return (
                <View
                  key={habitId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f3f4f6',
                  }}
                >
                  <MaterialCommunityIcons
                    name={completion.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={28}
                    color={completion.completed ? AGM_GREEN : '#999'}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{
                      fontSize: 16,
                      color: AGM_DARK,
                      textDecorationLine: completion.completed ? 'line-through' : 'none',
                    }}>
                      {habit.name}
                    </Text>
                    {completion.completedAt && (
                      <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                        Completed at {new Date(completion.completedAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Todos Section */}
        {dailyData && dailyData.todos && dailyData.todos.length > 0 && (
          <View style={{
            backgroundColor: '#ffffff',
            padding: 16,
            borderRadius: 12,
            marginTop: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
              Daily Todos
            </Text>
            {dailyData.todos.map((todo) => (
              <View
                key={todo.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                }}
              >
                <MaterialCommunityIcons
                  name={todo.completed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={todo.completed ? AGM_GREEN : '#999'}
                />
                <Text style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 14,
                  color: AGM_DARK,
                  textDecorationLine: todo.completed ? 'line-through' : 'none',
                }}>
                  {todo.text}
                </Text>
              </View>
            ))}
          </View>
        )}
          </>
        ) : (
          <>
            {/* Weekly View */}
            <View style={{
              backgroundColor: '#ffffff',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginBottom: 16 }}>
                Past 7 Days
              </Text>

              {/* Weekly Grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {Object.entries(weeklyData).map(([dateString, data]) => {
                  const date = new Date(dateString);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const dataObj = data as DailyData | null;

                  const completed = dataObj
                    ? Object.values(dataObj.habitCompletions).filter(c => c.completed).length
                    : 0;
                  const total = dataObj ? Object.keys(dataObj.habitCompletions).length : 0;
                  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <View
                      key={dateString}
                      style={{
                        flex: 1,
                        minWidth: '30%',
                        backgroundColor: percentage === 100 ? '#d1fae5' : percentage > 0 ? '#fef3c7' : '#f3f4f6',
                        padding: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                        borderLeftWidth: 3,
                        borderLeftColor: percentage === 100 ? AGM_GREEN : percentage > 0 ? '#f59e0b' : '#999',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: AGM_DARK }}>
                        {dayName}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: AGM_DARK, marginVertical: 4 }}>
                        {dayNum}
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: percentage === 100 ? AGM_GREEN : '#666' }}>
                        {percentage}%
                      </Text>
                      <Text style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                        {completed}/{total}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Weekly Summary Stats */}
            {weeklyData && Object.values(weeklyData).some(d => d !== null) && (
              <View style={{
                backgroundColor: '#ffffff',
                padding: 16,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
                  Weekly Summary
                </Text>

                {/* Calculate weekly totals */}
                {(() => {
                  let weeklyCompleted = 0;
                  let weeklyTotal = 0;
                  let perfectDays = 0;

                  Object.values(weeklyData).forEach((data) => {
                    if (data) {
                      const completed = Object.values(data.habitCompletions).filter(c => c.completed).length;
                      const total = Object.keys(data.habitCompletions).length;
                      weeklyCompleted += completed;
                      weeklyTotal += total;
                      if (total > 0 && completed === total) {
                        perfectDays += 1;
                      }
                    }
                  });

                  const weeklyPercentage = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;

                  return (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ flex: 1, backgroundColor: '#e5e7eb', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                          <View style={{
                            width: `${weeklyPercentage}%`,
                            height: '100%',
                            backgroundColor: AGM_GREEN
                          }} />
                        </View>
                        <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '600', color: AGM_DARK }}>
                          {weeklyPercentage}%
                        </Text>
                      </View>

                      <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                        {weeklyCompleted} of {weeklyTotal} habits completed
                      </Text>
                      <Text style={{ fontSize: 14, color: AGM_GREEN, fontWeight: '600' }}>
                        🎉 {perfectDays} perfect day{perfectDays !== 1 ? 's' : ''}
                      </Text>
                    </>
                  );
                })()}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
