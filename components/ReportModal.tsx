import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Routine, Habit, DailyData } from '@/services/dataService';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

interface ReportModalProps {
  visible: boolean;
  routine: Routine | null;
  habits: Habit[];
  onClose: () => void;
  dailyDataArray?: DailyData[]; // Optional: 7 days of daily data for min/max calculations
}

type ReportView = 'bars' | 'timeline' | 'table';

export default function ReportModal({
  visible,
  routine,
  habits,
  onClose,
  dailyDataArray,
}: ReportModalProps) {
  const [reportView, setReportView] = useState<ReportView>('bars');
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'alltime'>('7days');

  if (!visible || !routine) {
    return null;
  }

  // Use habits passed to this component (already filtered by parent)
  // The parent component (Routines tab) uses getRoutineHabits() to filter by habit ID
  const routineHabits = habits;

  // Function to calculate min/max durations for a habit from daily data
  const getHabitDurationStats = (habitId: number) => {
    if (!dailyDataArray || dailyDataArray.length === 0) {
      return { minSeconds: 0, maxSeconds: 0 };
    }

    const durations: number[] = [];
    dailyDataArray.forEach(day => {
      if (day.habitCompletions && day.habitCompletions[habitId]) {
        const completion = day.habitCompletions[habitId];
        if (completion.completed && completion.duration) {
          durations.push(Math.round(completion.duration / 1000)); // Convert to seconds
        }
      }
    });

    if (durations.length === 0) {
      return { minSeconds: 0, maxSeconds: 0 };
    }

    const minSeconds = Math.min(...durations);
    const maxSeconds = Math.max(...durations);
    return { minSeconds, maxSeconds };
  };

  // Debug logging
  console.log('ReportModal - Routine:', routine.name);
  console.log('ReportModal - Total habits passed:', habits.length);
  console.log('ReportModal - Routine habits:', routineHabits.length);
  routineHabits.forEach(h => {
    console.log(`  - ${h.name}: completionCount=${h.completionCount}, totalDurationSum=${h.totalDurationSum}`);
  });

  // Calculate average times
  const habitStats = routineHabits.map(habit => {
    const avgTimeMs = habit.completionCount && habit.completionCount > 0
      ? (habit.totalDurationSum || 0) / habit.completionCount
      : 0;
    const avgTimeSeconds = Math.round(avgTimeMs / 1000);
    const durationStats = getHabitDurationStats(habit.id);

    return {
      habit,
      avgTimeMs,
      avgTimeSeconds,
      completionCount: habit.completionCount || 0,
      minSeconds: durationStats.minSeconds,
      maxSeconds: durationStats.maxSeconds,
    };
  }).sort((a, b) => b.avgTimeSeconds - a.avgTimeSeconds);

  const totalRoutineTimeSeconds = habitStats.reduce((sum, s) => sum + s.avgTimeSeconds, 0);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format seconds to minutes with decimals
  const formatMinutes = (seconds: number): string => {
    return (seconds / 60).toFixed(1);
  };

  // Find max time for scaling bars
  const maxTime = Math.max(...habitStats.map(s => s.avgTimeSeconds), 1);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: 40,
            maxHeight: '95%',
            position: 'relative',
          }}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <MaterialCommunityIcons name="close" size={24} color={AGM_DARK} />
          </TouchableOpacity>

          {/* Header */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: AGM_DARK, marginBottom: 4 }}>
              Routine Report
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
              {routine.name}
            </Text>

            {/* Report View Selector */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setReportView('bars')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: reportView === 'bars' ? AGM_GREEN : '#e5e7eb',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={16}
                  color={reportView === 'bars' ? 'white' : AGM_DARK}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: reportView === 'bars' ? 'white' : AGM_DARK,
                  }}
                >
                  Bars
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setReportView('timeline')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: reportView === 'timeline' ? AGM_GREEN : '#e5e7eb',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <MaterialCommunityIcons
                  name="layers"
                  size={16}
                  color={reportView === 'timeline' ? 'white' : AGM_DARK}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: reportView === 'timeline' ? 'white' : AGM_DARK,
                  }}
                >
                  Stack
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setReportView('table')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: reportView === 'table' ? AGM_GREEN : '#e5e7eb',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <MaterialCommunityIcons
                  name="table"
                  size={16}
                  color={reportView === 'table' ? 'white' : AGM_DARK}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: reportView === 'table' ? 'white' : AGM_DARK,
                  }}
                >
                  Table
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 16 }}>
            {/* Total Routine Time Card */}
            <View
              style={{
                backgroundColor: AGM_GREEN,
                padding: 16,
                borderRadius: 12,
                marginBottom: 20,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                Average Routine Time
              </Text>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>
                {formatTime(totalRoutineTimeSeconds)}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                {formatMinutes(totalRoutineTimeSeconds)} minutes
              </Text>
            </View>

            {/* Report Views */}
            {reportView === 'bars' && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
                  Time per Habit
                </Text>
                {habitStats.map((stat) => {
                  const barWidth = (stat.avgTimeSeconds / maxTime) * 100;
                  const isLong = stat.avgTimeSeconds > 300; // > 5 min
                  const isMedium = stat.avgTimeSeconds > 120; // > 2 min
                  const barColor = isLong ? '#ef4444' : isMedium ? '#f59e0b' : AGM_GREEN;

                  return (
                    <View key={stat.habit.id} style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: AGM_DARK, flex: 1 }}>
                          {stat.habit.name}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: AGM_DARK }}>
                          {formatTime(stat.avgTimeSeconds)}
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View style={{ backgroundColor: '#e5e7eb', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                        <View
                          style={{
                            width: `${barWidth}%`,
                            height: '100%',
                            backgroundColor: barColor,
                          }}
                        />
                      </View>
                      <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                        {stat.completionCount} completion{stat.completionCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {reportView === 'timeline' && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 16 }}>
                  Routine Composition
                </Text>

                {/* Stacked Bar Chart */}
                <View style={{ marginBottom: 24 }}>
                  {/* Color Legend with Min/Avg/Max */}
                  <View style={{ marginBottom: 16 }}>
                    {habitStats.map((stat, index) => {
                      const colors = ['#4b5320', '#8b7355', '#5a8a6b', '#a89b6f', '#6b8f9a', '#9b7b8f', '#8a7b6b'];
                      const barColor = colors[index % colors.length];

                      return (
                        <View key={stat.habit.id} style={{ marginBottom: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <View
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 2,
                                backgroundColor: barColor,
                                marginRight: 10,
                              }}
                            />
                            <Text style={{ fontSize: 13, fontWeight: '600', color: AGM_DARK }}>
                              {stat.habit.name}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22 }}>
                            <View style={{ alignItems: 'center' }}>
                              <Text style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Min</Text>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: AGM_DARK }}>
                                {stat.minSeconds > 0 ? formatTime(stat.minSeconds) : '—'}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                              <Text style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Avg</Text>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: AGM_GREEN }}>
                                {formatTime(stat.avgTimeSeconds)}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                              <Text style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Max</Text>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: AGM_DARK }}>
                                {stat.maxSeconds > 0 ? formatTime(stat.maxSeconds) : '—'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Stacked Bar */}
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', height: 60, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                      {habitStats.map((stat, index) => {
                        const colors = ['#4b5320', '#8b7355', '#5a8a6b', '#a89b6f', '#6b8f9a', '#9b7b8f', '#8a7b6b'];
                        const barColor = colors[index % colors.length];
                        const percentage = totalRoutineTimeSeconds > 0 ? (stat.avgTimeSeconds / totalRoutineTimeSeconds) * 100 : 0;

                        return (
                          <View
                            key={stat.habit.id}
                            style={{
                              flex: percentage,
                              backgroundColor: barColor,
                              justifyContent: 'center',
                              alignItems: 'center',
                              paddingHorizontal: 4,
                            }}
                          >
                            {percentage > 12 && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '600',
                                  color: 'white',
                                  textAlign: 'center',
                                }}
                                numberOfLines={1}
                              >
                                {formatTime(stat.avgTimeSeconds)}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Total Time Display */}
                  <View style={{ paddingHorizontal: 8 }}>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                      Total Routine Time
                    </Text>
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: AGM_GREEN }}>
                      {formatTime(totalRoutineTimeSeconds)}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#999', marginTop: 2 }}>
                      {formatMinutes(totalRoutineTimeSeconds)} minutes average
                    </Text>
                  </View>
                </View>

                {/* Variance Graph - 7 Day Trend */}
                <View style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
                    7-Day Variance
                  </Text>
                  {habitStats.map((stat) => {
                    // Get daily durations for this habit
                    const dailyDurations: (number | null)[] = [];
                    if (dailyDataArray) {
                      dailyDataArray.forEach(day => {
                        if (day.habitCompletions && day.habitCompletions[stat.habit.id]) {
                          const completion = day.habitCompletions[stat.habit.id];
                          if (completion.completed && completion.duration) {
                            dailyDurations.push(Math.round(completion.duration / 1000));
                          } else {
                            dailyDurations.push(null);
                          }
                        } else {
                          dailyDurations.push(null);
                        }
                      });
                    }

                    // Find the max of min/avg/max for scaling
                    const graphMax = Math.max(stat.maxSeconds || stat.avgTimeSeconds, stat.avgTimeSeconds) + 30;

                    return (
                      <View key={stat.habit.id} style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: AGM_DARK, marginBottom: 6 }}>
                          {stat.habit.name}
                        </Text>

                        {/* Range Visualization with Daily Points */}
                        <View style={{ height: 70, backgroundColor: '#ffffff', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
                          {/* Y-axis labels */}
                          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 35, justifyContent: 'space-between', paddingVertical: 4 }}>
                            <Text style={{ fontSize: 8, color: '#999', textAlign: 'right', paddingRight: 4 }}>
                              {formatTime(stat.maxSeconds || stat.avgTimeSeconds)}
                            </Text>
                            <Text style={{ fontSize: 8, color: '#999', textAlign: 'right', paddingRight: 4 }}>
                              {formatTime(stat.avgTimeSeconds)}
                            </Text>
                            <Text style={{ fontSize: 8, color: '#999', textAlign: 'right', paddingRight: 4 }}>
                              {formatTime(stat.minSeconds || 0)}
                            </Text>
                          </View>

                          {/* Graph Area */}
                          <View style={{ flex: 1, marginLeft: 35, position: 'relative' }}>
                            {/* Min-Max Range Background */}
                            {stat.minSeconds > 0 && stat.maxSeconds > 0 && (
                              <View
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  right: 0,
                                  backgroundColor: 'rgba(75, 83, 32, 0.08)',
                                  borderRadius: 4,
                                  top: `${((stat.maxSeconds - (stat.maxSeconds || 0)) / graphMax) * 100}%`,
                                  height: `${((stat.maxSeconds - stat.minSeconds) / graphMax) * 100}%`,
                                }}
                              />
                            )}

                            {/* Average Line */}
                            <View
                              style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                height: 2,
                                backgroundColor: AGM_GREEN,
                                top: `${((stat.maxSeconds - stat.avgTimeSeconds) / graphMax) * 100}%`,
                              }}
                            />

                            {/* Daily Data Points */}
                            <View style={{ flexDirection: 'row', flex: 1, alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 2 }}>
                              {dailyDurations.map((duration, idx) => (
                                <View
                                  key={idx}
                                  style={{
                                    width: 6,
                                    height: duration !== null ? `${((stat.maxSeconds - duration) / graphMax) * 100}%` : 2,
                                    backgroundColor: duration !== null ? '#4b5320' : '#ddd',
                                    borderRadius: 3,
                                    opacity: duration !== null ? 1 : 0.5,
                                  }}
                                />
                              ))}
                            </View>
                          </View>
                        </View>

                        {/* Range Stats */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 35 }}>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 8, color: '#999' }}>Min</Text>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: AGM_DARK }}>
                              {stat.minSeconds > 0 ? formatTime(stat.minSeconds) : '—'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 8, color: '#999' }}>Avg</Text>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: AGM_GREEN }}>
                              {formatTime(stat.avgTimeSeconds)}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 8, color: '#999' }}>Max</Text>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: AGM_DARK }}>
                              {stat.maxSeconds > 0 ? formatTime(stat.maxSeconds) : '—'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Habit Breakdown Details */}
                <View style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: AGM_DARK, marginBottom: 10 }}>
                    Habit Details
                  </Text>
                  {habitStats.map((stat) => (
                    <View key={stat.habit.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: AGM_DARK }}>
                          {stat.habit.name}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: AGM_GREEN }}>
                          {formatTime(stat.avgTimeSeconds)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                        Completed {stat.completionCount} time{stat.completionCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {reportView === 'table' && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
                  Time Breakdown
                </Text>

                {/* Table Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    paddingBottom: 12,
                    marginBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e7eb',
                  }}
                >
                  <Text style={{ flex: 2, fontSize: 11, fontWeight: '600', color: '#666' }}>
                    Habit
                  </Text>
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: '#666', textAlign: 'center' }}>
                    Time
                  </Text>
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: '#666', textAlign: 'center' }}>
                    Count
                  </Text>
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: '#666', textAlign: 'center' }}>
                    % of Total
                  </Text>
                </View>

                {/* Table Rows */}
                {habitStats.map((stat) => {
                  const percentOfTotal = totalRoutineTimeSeconds > 0
                    ? (stat.avgTimeSeconds / totalRoutineTimeSeconds) * 100
                    : 0;

                  return (
                    <View
                      key={stat.habit.id}
                      style={{
                        flexDirection: 'row',
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f3f4f6',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          flex: 2,
                          fontSize: 12,
                          fontWeight: '500',
                          color: AGM_DARK,
                        }}
                        numberOfLines={2}
                      >
                        {stat.habit.name}
                      </Text>

                      <Text
                        style={{
                          flex: 1,
                          fontSize: 12,
                          fontWeight: '600',
                          color: AGM_DARK,
                          textAlign: 'center',
                        }}
                      >
                        {formatTime(stat.avgTimeSeconds)}
                      </Text>

                      <Text
                        style={{
                          flex: 1,
                          fontSize: 12,
                          fontWeight: '600',
                          color: '#666',
                          textAlign: 'center',
                        }}
                      >
                        {stat.completionCount}
                      </Text>

                      {/* Progress Ring */}
                      <View
                        style={{
                          flex: 1,
                          alignItems: 'center',
                        }}
                      >
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: '#f0f0f0',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 3,
                            borderColor: percentOfTotal > 30 ? '#ef4444' : percentOfTotal > 15 ? '#f59e0b' : AGM_GREEN,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: 'bold',
                              color: AGM_DARK,
                            }}
                          >
                            {Math.round(percentOfTotal)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Total Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 12,
                    marginTop: 8,
                    paddingTop: 12,
                    borderTopWidth: 2,
                    borderTopColor: AGM_GREEN,
                  }}
                >
                  <Text style={{ flex: 2, fontSize: 12, fontWeight: 'bold', color: AGM_DARK }}>
                    Total
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: AGM_GREEN,
                      textAlign: 'center',
                    }}
                  >
                    {formatTime(totalRoutineTimeSeconds)}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: AGM_DARK,
                      textAlign: 'center',
                    }}
                  >
                    -
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: AGM_GREEN,
                      textAlign: 'center',
                    }}
                  >
                    100%
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
