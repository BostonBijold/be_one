import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dataService, { Habit, DailyData } from '../services/dataService';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

export default function HistoryScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Get habits list
      const allHabits = await dataService.getHabits();
      setHabits(allHabits);

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

  useEffect(() => {
    loadDailyData(selectedDate);
  }, [selectedDate]);

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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
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
      {/* Header */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0ddd0' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: AGM_DARK }}>
          History
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
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
      </ScrollView>
    </SafeAreaView>
  );
}
