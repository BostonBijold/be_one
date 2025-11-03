import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import dataService, { Habit, DailyData } from '@/services/dataService';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const DEFAULT_EXPECTED_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

interface TimerModalProps {
  visible: boolean;
  habit: Habit | null;
  dailyData: DailyData | null;
  onClose: () => void;
  onDailyDataUpdate: (dailyData: DailyData) => void;
}

export default function TimerModal({
  visible,
  habit,
  dailyData,
  onClose,
  onDailyDataUpdate,
}: TimerModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [habitStartTime, setHabitStartTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Excuse modal state
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [selectedExcuseReason, setSelectedExcuseReason] = useState<string>('');
  const [excuseReasons] = useState([
    'Sick Day',
    'Travel',
    'Family Emergency',
    'Work Conflict',
    'Weather',
  ]);

  const todayString = dataService.getTodayString();

  // Initialize timer when modal opens
  useEffect(() => {
    if (visible && habit) {
      setElapsedSeconds(0);
      setHabitStartTime(Date.now());
      setLoading(false);
    }
  }, [visible, habit?.id]);

  // Auto-start timer when component loads (only if not completed or excused)
  useEffect(() => {
    if (!visible || !habit || loading) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const completion = dailyData?.habitCompletions?.[habit.id];
    const isCompleted = completion?.completed || false;
    const isExcused = completion?.excused || false;

    // Stop timer if already completed or excused
    if (isCompleted || isExcused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Start the timer if not already running
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [habit, loading, dailyData, visible]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!habit) {
    return null;
  }

  const completion = dailyData?.habitCompletions?.[habit.id];
  const isCompleted = completion?.completed || false;
  const isExcused = completion?.excused || false;

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get expected duration for this habit (convert from milliseconds to seconds for timer)
  const expectedDurationMs = habit?.expectedDuration || DEFAULT_EXPECTED_DURATION;
  const expectedDurationSeconds = expectedDurationMs / 1000;

  // Calculate average duration from history
  const averageDurationMs = habit?.completionCount && habit?.completionCount > 0
    ? habit.totalDurationSum! / habit.completionCount
    : null;
  const averageDurationSeconds = averageDurationMs ? averageDurationMs / 1000 : null;

  // Calculate progress (0-1, based on expected duration)
  const progressInCycle = expectedDurationSeconds > 0
    ? (elapsedSeconds % expectedDurationSeconds) / expectedDurationSeconds
    : 0;

  // Calculate average marker position
  const averageProgress = averageDurationSeconds && expectedDurationSeconds > 0
    ? Math.min(averageDurationSeconds / expectedDurationSeconds, 1)
    : null;

  // SVG arc path generator - center at (170, 170) for 340x340 viewBox
  const generateArcPath = (radius: number, progress: number): string => {
    const cx = 170; // Center X
    const cy = 170; // Center Y

    // Ensure minimum progress to render visible arc (at least 1 degree)
    const minProgress = 1 / 360; // 1 degree minimum
    const displayProgress = Math.max(progress, minProgress);

    // Start from top (12 o'clock) and go clockwise
    const angle = displayProgress * 360;
    const radians = (angle - 90) * (Math.PI / 180); // -90 to start from top

    const x = cx + radius * Math.cos(radians);
    const y = cy + radius * Math.sin(radians);

    // Start position (12 o'clock)
    const startX = cx;
    const startY = cy - radius;

    // Use large arc flag if angle > 180
    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathString = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x} ${y}`;

    return pathString;
  };

  // Handle marking habit as complete
  const handleCompleteHabit = async () => {
    if (!habit || !habitStartTime) return;

    try {
      // Haptic feedback - light impact on button press
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setLoading(true);
      const endTimeMs = Date.now();
      const durationMs = endTimeMs - habitStartTime;

      // Initialize dailyData if it doesn't exist
      const updatedDailyData = dailyData || {
        date: todayString,
        habitCompletions: {},
        routineCompletions: {},
      };

      if (!updatedDailyData.habitCompletions) {
        updatedDailyData.habitCompletions = {};
      }

      updatedDailyData.habitCompletions[habit.id] = {
        completed: true,
        completedAt: new Date(endTimeMs).toISOString(),
        duration: durationMs,
        startTime: new Date(habitStartTime).toISOString(),
        endTime: new Date(endTimeMs).toISOString(),
        notes: '',
      };

      // Save to Firebase
      await dataService.updateDailyData(todayString, updatedDailyData);
      onDailyDataUpdate(updatedDailyData);

      // Update habit aggregate stats for average calculation
      const newTotalSum = (habit.totalDurationSum || 0) + durationMs;
      const newCount = (habit.completionCount || 0) + 1;

      await dataService.updateHabit(habit.id, {
        totalDurationSum: newTotalSum,
        completionCount: newCount,
      });

      // Haptic feedback - success pattern on completion
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setLoading(false);
    } catch {
      setLoading(false);
      // Haptic feedback - error pattern
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save habit completion');
    }
  };

  // Handle restarting a completed habit
  const handleRestartHabit = async () => {
    if (!habit) return;

    try {
      setLoading(true);
      // Get the current completion to retrieve stats
      const completion = dailyData?.habitCompletions?.[habit.id];
      if (!completion || !completion.completed) {
        setLoading(false);
        return;
      }

      const durationMs = completion.duration || 0;

      // Remove completion from daily data
      const updatedDailyData = { ...dailyData };
      if (updatedDailyData.habitCompletions) {
        delete updatedDailyData.habitCompletions[habit.id];
      }

      // Save updated daily data
      await dataService.updateDailyData(todayString, updatedDailyData);
      onDailyDataUpdate(updatedDailyData);

      // Reverse habit aggregate stats
      const newTotalSum = Math.max((habit.totalDurationSum || 0) - durationMs, 0);
      const newCount = Math.max((habit.completionCount || 0) - 1, 0);

      await dataService.updateHabit(habit.id, {
        totalDurationSum: newTotalSum,
        completionCount: newCount,
      });

      // Reset timer state
      setElapsedSeconds(0);
      setHabitStartTime(Date.now());
      setLoading(false);
    } catch {
      setLoading(false);
      Alert.alert('Error', 'Failed to restart habit');
    }
  };

  // Handle excuse habit
  const handleExcuseHabit = async () => {
    if (!habit || !selectedExcuseReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }

    try {
      // Haptic feedback - light impact on button press
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setLoading(true);
      // Initialize dailyData if it doesn't exist
      const updatedDailyData = dailyData || {
        date: todayString,
        habitCompletions: {},
        routineCompletions: {},
      };

      if (!updatedDailyData.habitCompletions) {
        updatedDailyData.habitCompletions = {};
      }

      // Mark habit as excused (not completed, but excused)
      updatedDailyData.habitCompletions[habit.id] = {
        completed: false,
        completedAt: null,
        duration: null,
        startTime: null,
        endTime: null,
        notes: '',
        excused: true,
        excuseReason: selectedExcuseReason,
      };

      // Save to Firebase
      await dataService.updateDailyData(todayString, updatedDailyData);
      onDailyDataUpdate(updatedDailyData);

      // Close excuse modal
      setShowExcuseModal(false);
      setSelectedExcuseReason('');
      setLoading(false);

      // Haptic feedback - success pattern
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert('Done', `${habit.name} marked as excused`);
    } catch {
      setLoading(false);
      // Haptic feedback - error pattern
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to excuse habit');
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: Math.max(32, insets.left + 16, insets.right + 16),
            paddingTop: 32,
            paddingBottom: Math.max(40, insets.bottom + 16),
            maxHeight: '90%',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Excuse Button - top right of card (only show if in progress and excusable) */}
          {!isCompleted && !isExcused && habit.excusable && (
            <TouchableOpacity
              onPress={() => setShowExcuseModal(true)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 107, 107, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <MaterialCommunityIcons name="clock-remove" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: '100%' }}
            contentContainerStyle={{ alignItems: 'center', paddingTop: 20 }}
          >
            {/* Expected duration - above circle */}
            <View style={{ marginBottom: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#666666' }}>Expected</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK }}>
                {formatTime(Math.floor(expectedDurationSeconds))}
              </Text>
            </View>

            {/* SVG Circle with Progress Arc and Center Time Display */}
            <View
              style={{
                width: 340,
                height: 340,
                marginBottom: 24,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* SVG Circle with Progress Arc */}
              <Svg
                width={340}
                height={340}
                viewBox="0 0 340 340"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                }}
              >
                {/* Grey background circle */}
                <Circle
                  cx={170}
                  cy={170}
                  r={75}
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth={14}
                />

                {/* Green progress arc - only show if not completed/excused */}
                {!isCompleted && !isExcused ? (
                  <Path
                    d={generateArcPath(75, progressInCycle)}
                    fill="none"
                    stroke={AGM_GREEN}
                    strokeWidth={14}
                    strokeLinecap="round"
                  />
                ) : null}

                {/* Average marker - show as a line crossing the arc */}
                {averageProgress !== null && averageProgress >= 0 ? (() => {
                  const avgAngle = averageProgress * 360;
                  const avgRadians = (avgAngle - 90) * (Math.PI / 180);
                  const innerRadius = 60; // Extend beyond inner edge
                  const outerRadius = 90; // Extend beyond outer edge
                  const cx = 170;
                  const cy = 170;

                  const x1 = cx + innerRadius * Math.cos(avgRadians);
                  const y1 = cy + innerRadius * Math.sin(avgRadians);
                  const x2 = cx + outerRadius * Math.cos(avgRadians);
                  const y2 = cy + outerRadius * Math.sin(avgRadians);

                  return (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeLinecap="butt"
                    />
                  );
                })() : null}
              </Svg>

              {/* Current elapsed time display in center of circle */}
              <View style={{ alignItems: 'center', zIndex: 10 }}>
                <Text style={{ fontSize: 48, fontWeight: 'bold', color: AGM_DARK }}>
                  {formatTime(elapsedSeconds)}
                </Text>
                <Text style={{ fontSize: 11, color: '#666666', marginTop: 4 }}>Elapsed</Text>
              </View>
            </View>

            {/* Average duration - below circle */}
            <View style={{ alignItems: 'center' }}>
              {averageDurationSeconds ? (
                <>
                  <Text style={{ fontSize: 12, color: '#666666' }}>Average</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#ff6b6b' }}>
                    {formatTime(Math.floor(averageDurationSeconds))}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: 12, color: '#999999' }}>No completion history</Text>
              )}
            </View>

            {/* Habit Name */}
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: AGM_DARK, textAlign: 'center', marginBottom: 8, marginTop: 24 }}>
              {habit.name}
            </Text>

            {/* Habit Description */}
            {habit.description && (
              <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 24 }}>
                {habit.description}
              </Text>
            )}

            {/* Status Message */}
            {isCompleted && (
              <Text style={{ fontSize: 13, color: AGM_GREEN, marginBottom: 32, fontWeight: 'bold' }}>
                ✓ Completed
              </Text>
            )}
            {isExcused && (
              <View style={{ marginBottom: 32, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#ff6b6b', fontWeight: 'bold' }}>
                  Excused: {completion?.excuseReason}
                </Text>
              </View>
            )}

            {/* In Progress Controls */}
            {!isCompleted && !isExcused && (
              <View style={{ justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                {/* Complete Button */}
                <TouchableOpacity
                  onPress={handleCompleteHabit}
                  disabled={loading}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: loading ? '#999' : AGM_GREEN,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="large" />
                  ) : (
                    <MaterialCommunityIcons name="check" size={40} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Completed/Excused Controls - show Restart and Back buttons */}
            {(isCompleted || isExcused) && (
              <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 24 }}>
                <TouchableOpacity
                  onPress={handleRestartHabit}
                  disabled={loading}
                  style={{
                    flex: 1,
                    backgroundColor: loading ? '#ddd' : '#f0f0f0',
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: AGM_DARK, fontWeight: '600', fontSize: 14 }}>
                    {loading ? 'Loading...' : 'Restart'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    backgroundColor: loading ? '#999' : AGM_GREEN,
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Excuse Modal */}
      <Modal
        visible={showExcuseModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowExcuseModal(false);
          setSelectedExcuseReason('');
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 24,
              paddingVertical: 24,
              paddingBottom: 32,
            }}
          >
            {/* Header */}
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: AGM_DARK, marginBottom: 8 }}>
              Why are you skipping this?
            </Text>
            <Text style={{ fontSize: 14, color: '#666666', marginBottom: 24 }}>
              Select a reason for skipping {habit.name}
            </Text>

            {/* Excuse Reason Options */}
            <View style={{ marginBottom: 24, gap: 12 }}>
              {excuseReasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedExcuseReason(reason)}
                  style={{
                    borderWidth: 2,
                    borderColor: selectedExcuseReason === reason ? AGM_GREEN : '#e5e7eb',
                    borderRadius: 12,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    backgroundColor: selectedExcuseReason === reason ? '#f0f8f0' : '#ffffff',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: selectedExcuseReason === reason ? AGM_GREEN : '#d1d5db',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    {selectedExcuseReason === reason && (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: AGM_GREEN,
                        }}
                      />
                    )}
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, flex: 1 }}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowExcuseModal(false);
                  setSelectedExcuseReason('');
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  backgroundColor: loading ? '#f5f5f5' : 'white',
                }}
              >
                <Text style={{ color: AGM_DARK, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExcuseHabit}
                disabled={!selectedExcuseReason || loading}
                style={{
                  flex: 1,
                  backgroundColor:
                    !selectedExcuseReason || loading ? '#ccc' : AGM_GREEN,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
