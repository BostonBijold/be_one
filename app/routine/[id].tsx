import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import dataService, { Routine, Habit, DailyData } from '@/services/dataService';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';
const EXPECTED_DURATION = 10 * 60; // 10 minutes in seconds

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentHabitIndex, setCurrentHabitIndex] = useState(0);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [habitStartTimes, setHabitStartTimes] = useState<{ [habitId: number]: number }>({});
  const [routineStartTime, setRoutineStartTime] = useState<number | null>(null);
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

  // Load routine, habits, and daily data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [routinesData, habitsData, dailyDataResult] = await Promise.all([
          dataService.getRoutines(),
          dataService.getHabits(),
          dataService.getTodayData(todayString),
        ]);

        // Find the routine by ID
        const foundRoutine = routinesData.find((r) => r.id === parseInt(id || '0'));
        if (!foundRoutine) {
          setError('Routine not found');
          return;
        }

        setRoutine(foundRoutine);

        // Filter habits for this routine
        const routineHabits = habitsData.filter((h) => h.routineId === foundRoutine.id);
        setHabits(routineHabits);

        setDailyData(dailyDataResult);

        // Set routine start time if not already set
        if (!routineStartTime) {
          setRoutineStartTime(Date.now());
        }
      } catch (err: any) {
        console.error('Error loading routine detail:', err);
        setError(err.message || 'Failed to load routine');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Auto-start timer when habit changes
  useEffect(() => {
    const currentHabit = habits[currentHabitIndex];
    if (!currentHabit || loading) return;

    // Reset elapsed time for this habit
    setElapsedSeconds(0);

    // Check if this habit already has a start time
    const existingStartTime = habitStartTimes[currentHabit.id];
    if (!existingStartTime) {
      // Start the timer for this habit
      habitStartTimes[currentHabit.id] = Date.now();
      setHabitStartTimes({ ...habitStartTimes });
    }

    // Start the timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentHabitIndex, habits, loading]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AGM_GREEN} />
          <Text style={{ marginTop: 16, color: AGM_DARK }}>Loading routine...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !routine) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <MaterialCommunityIcons name="alert-circle" size={56} color="#ef4444" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginTop: 16, textAlign: 'center' }}>
            {error || 'Routine not found'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ backgroundColor: AGM_GREEN, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12, marginTop: 24 }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentHabit = habits[currentHabitIndex];
  const completionData = dailyData?.habitCompletions || {};

  // Count habits by status
  const completedCount = habits.filter((h) => completionData[h.id]?.completed).length;

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress (0-1, cycles every 10 minutes)
  const progressInCycle = (elapsedSeconds % EXPECTED_DURATION) / EXPECTED_DURATION;

  // SVG arc path generator - center at (170, 170) for 340x340 viewBox
  const generateArcPath = (radius: number, progress: number): string => {
    const cx = 170; // Center X
    const cy = 170; // Center Y

    // Start from top (12 o'clock) and go clockwise
    const angle = progress * 360;
    const radians = (angle - 90) * (Math.PI / 180); // -90 to start from top

    const x = cx + radius * Math.cos(radians);
    const y = cy + radius * Math.sin(radians);

    // Start position (12 o'clock)
    const startX = cx;
    const startY = cy - radius;

    // Use large arc flag if angle > 180
    const largeArcFlag = angle > 180 ? 1 : 0;

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x} ${y}`;
  };

  // Handle marking habit as complete
  const handleCompleteHabit = async () => {
    if (!currentHabit) return;

    try {
      const startTimeMs = habitStartTimes[currentHabit.id] || Date.now();
      const endTimeMs = Date.now();
      const durationMs = endTimeMs - startTimeMs;

      // Initialize dailyData if it doesn't exist
      const updatedDailyData = dailyData || {
        date: todayString,
        habitCompletions: {},
        routineCompletions: {},
      };

      if (!updatedDailyData.habitCompletions) {
        updatedDailyData.habitCompletions = {};
      }

      updatedDailyData.habitCompletions[currentHabit.id] = {
        completed: true,
        completedAt: new Date(endTimeMs).toISOString(),
        duration: durationMs,
        startTime: new Date(startTimeMs).toISOString(),
        endTime: new Date(endTimeMs).toISOString(),
        notes: '',
      };

      // Save to Firebase
      await dataService.updateDailyData(todayString, updatedDailyData);
      setDailyData(updatedDailyData);

      // Move to next incomplete habit
      console.log(`handleCompleteHabit: currentHabitIndex=${currentHabitIndex}, habits.length=${habits.length}`);
      if (currentHabitIndex < habits.length - 1) {
        console.log('Moving to next habit');
        setCurrentHabitIndex(currentHabitIndex + 1);
      } else {
        // All habits completed - mark routine as complete
        console.log('All habits completed! Marking routine as complete');
        if (routine && routineStartTime) {
          const routineEndTime = Date.now();
          const routineDurationMs = routineEndTime - routineStartTime;

          if (!updatedDailyData.routineCompletions) {
            updatedDailyData.routineCompletions = {};
          }

          // Build habitTimes from the completed habits
          const habitTimes: { [habitId: number]: { startTime: string; endTime: string; duration: number } } = {};
          habits.forEach((habit) => {
            const habitCompletion = updatedDailyData.habitCompletions[habit.id];
            if (habitCompletion) {
              habitTimes[habit.id] = {
                startTime: habitCompletion.startTime || '',
                endTime: habitCompletion.endTime || '',
                duration: habitCompletion.duration || 0,
              };
            }
          });

          updatedDailyData.routineCompletions[routine.id] = {
            completed: true,
            completedAt: new Date(routineEndTime).toISOString(),
            totalDuration: routineDurationMs,
            startTime: new Date(routineStartTime).toISOString(),
            endTime: new Date(routineEndTime).toISOString(),
            habitTimes: habitTimes,
          };

          // Save routine completion to Firebase
          await dataService.updateDailyData(todayString, updatedDailyData);
          setDailyData(updatedDailyData);

          // Update routine aggregate stats for average calculation
          const newTotalSum = (routine.totalDurationSum || 0) + routineDurationMs;
          const newCount = (routine.completionCount || 0) + 1;

          await dataService.updateRoutine(routine.id, {
            totalDurationSum: newTotalSum,
            completionCount: newCount,
          });
        }

        console.log('Routine complete! Showing alert and returning to home');
        Alert.alert('Congratulations!', 'You have completed all habits in this routine!', [
          { text: 'OK', onPress: () => {
            console.log('Alert dismissed, navigating back');
            router.back();
          }},
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save habit completion');
      console.error('Error completing habit:', err);
    }
  };

  // Handle skip habit (clear start time and move to next)
  const handleSkipHabit = () => {
    const newStartTimes = { ...habitStartTimes };
    delete newStartTimes[currentHabit.id];
    setHabitStartTimes(newStartTimes);

    console.log(`handleSkipHabit: currentHabitIndex=${currentHabitIndex}, habits.length=${habits.length}`);
    if (currentHabitIndex < habits.length - 1) {
      console.log('Moving to next habit');
      setCurrentHabitIndex(currentHabitIndex + 1);
    } else {
      console.log('All habits skipped! Showing alert and returning to home');
      Alert.alert('Done', 'No more habits in this routine', [
        { text: 'OK', onPress: () => {
          console.log('Alert dismissed, navigating back');
          router.back();
        }},
      ]);
    }
  };

  // Handle excuse habit
  const handleExcuseHabit = async () => {
    if (!currentHabit || !selectedExcuseReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }

    try {
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
      updatedDailyData.habitCompletions[currentHabit.id] = {
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
      setDailyData(updatedDailyData);

      // Close modal and reset
      setShowExcuseModal(false);
      setSelectedExcuseReason('');

      // Move to next habit
      if (currentHabitIndex < habits.length - 1) {
        setCurrentHabitIndex(currentHabitIndex + 1);
      } else {
        Alert.alert('Done', 'No more habits in this routine', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error('Error excusing habit:', error);
      Alert.alert('Error', error.message || 'Failed to excuse habit');
    }
  };

  // Handle previous habit
  const handlePreviousHabit = () => {
    if (currentHabitIndex > 0) {
      setCurrentHabitIndex(currentHabitIndex - 1);
    }
  };

  // Handle ending routine
  const handleEndRoutine = async () => {
    if (!routine || !routineStartTime) return;

    try {
      const routineEndTime = Date.now();
      const routineDurationMs = routineEndTime - routineStartTime;

      // Initialize dailyData if it doesn't exist
      const updatedDailyData = dailyData || {
        date: todayString,
        habitCompletions: {},
        routineCompletions: {},
      };

      if (!updatedDailyData.routineCompletions) {
        updatedDailyData.routineCompletions = {};
      }

      // Mark routine as completed
      updatedDailyData.routineCompletions[routine.id] = {
        completed: true,
        completedAt: new Date(routineEndTime).toISOString(),
        totalDuration: routineDurationMs,
        startTime: new Date(routineStartTime).toISOString(),
        endTime: new Date(routineEndTime).toISOString(),
        notes: '',
      };

      // Save to Firebase
      await dataService.updateDailyData(todayString, updatedDailyData);
      setDailyData(updatedDailyData);

      // Update routine aggregate stats for average calculation
      if (routine) {
        const currentRoutine = routine;
        const newTotalSum = (currentRoutine.totalDurationSum || 0) + routineDurationMs;
        const newCount = (currentRoutine.completionCount || 0) + 1;

        await dataService.updateRoutine(routine.id, {
          totalDurationSum: newTotalSum,
          completionCount: newCount,
        });
      }

      // Navigate back to dashboard
      router.back();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save routine completion');
      console.error('Error ending routine:', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Header with back button */}
        <View style={{ backgroundColor: AGM_DARK, paddingHorizontal: 16, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="white" />
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
            {routine.name}
          </Text>
          <Text style={{ color: '#ccc', fontSize: 14, marginTop: 4 }}>
            {completedCount} of {habits.length} completed
          </Text>
        </View>

        {/* Music Player Style Current Habit Display */}
        {currentHabit && (
          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 }}>
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 32,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
                alignItems: 'center',
              }}
            >
              {/* Circular Timer with SVG Progress Arc */}
              <View
                style={{
                  width: 340,
                  height: 340,
                  marginBottom: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                {/* SVG Arc Background and Progress */}
                <Svg
                  width={340}
                  height={340}
                  viewBox="0 0 340 340"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                >
                  {/* Grey background circle */}
                  <Circle
                    cx="170"
                    cy="170"
                    r="75"
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="14"
                  />

                  {/* Green progress arc - only show if progress > 0 */}
                  {progressInCycle > 0 ? (
                    <Path
                      d={generateArcPath(75, progressInCycle)}
                      fill="none"
                      stroke={AGM_GREEN}
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                  ) : null}
                </Svg>

                {/* Time display in center */}
                <View style={{ alignItems: 'center', zIndex: 10 }}>
                  <Text style={{ fontSize: 48, fontWeight: 'bold', color: AGM_DARK }}>
                    {formatTime(elapsedSeconds)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#666666', marginTop: 4 }}>
                    of {formatTime(EXPECTED_DURATION)}
                  </Text>
                </View>
              </View>

              {/* Habit Name */}
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: AGM_DARK, textAlign: 'center', marginBottom: 8 }}>
                {currentHabit.name}
              </Text>

              {/* Habit Description */}
              {currentHabit.description && (
                <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 24 }}>
                  {currentHabit.description}
                </Text>
              )}

              {/* Progress Indicator */}
              <Text style={{ fontSize: 13, color: '#999999', marginBottom: 32 }}>
                Habit {currentHabitIndex + 1} of {habits.length}
              </Text>

              {/* Player Controls */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                {/* Previous Button */}
                <TouchableOpacity
                  onPress={handlePreviousHabit}
                  disabled={currentHabitIndex === 0}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: currentHabitIndex === 0 ? '#e5e7eb' : '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}
                >
                  <MaterialCommunityIcons
                    name="skip-previous"
                    size={24}
                    color={currentHabitIndex === 0 ? '#999999' : AGM_DARK}
                  />
                </TouchableOpacity>

                {/* Play/Complete Button */}
                <TouchableOpacity
                  onPress={handleCompleteHabit}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: AGM_GREEN,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <MaterialCommunityIcons name="play" size={40} color="white" />
                </TouchableOpacity>

                {/* Skip/Next Button */}
                <TouchableOpacity
                  onPress={handleSkipHabit}
                  disabled={currentHabitIndex === habits.length - 1}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: currentHabitIndex === habits.length - 1 ? '#e5e7eb' : '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: 16,
                  }}
                >
                  <MaterialCommunityIcons
                    name="skip-next"
                    size={24}
                    color={currentHabitIndex === habits.length - 1 ? '#999999' : AGM_DARK}
                  />
                </TouchableOpacity>

                {/* Excuse Button (only if habit is excusable) */}
                {currentHabit?.excusable && (
                  <TouchableOpacity
                    onPress={() => setShowExcuseModal(true)}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: '#f0f0f0',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: 12,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="clock-remove"
                      size={24}
                      color="#ff6b6b"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Habit List */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: AGM_DARK, marginBottom: 16 }}>
            Routine Progress
          </Text>

          {habits.map((habit, index) => {
            const isCompleted = completionData[habit.id]?.completed || false;
            const isActive = index === currentHabitIndex;

            return (
              <TouchableOpacity
                key={habit.id}
                onPress={() => setCurrentHabitIndex(index)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isActive ? AGM_GREEN : 'white',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2,
                  borderLeftWidth: 4,
                  borderLeftColor: isCompleted ? AGM_GREEN : isActive ? AGM_GREEN : '#e5e7eb',
                }}
              >
                {/* Status Icon */}
                {isCompleted ? (
                  <MaterialCommunityIcons name="check-circle" size={24} color={isActive ? 'white' : AGM_GREEN} style={{ marginRight: 12 }} />
                ) : isActive ? (
                  <MaterialCommunityIcons name="play-circle" size={24} color="white" style={{ marginRight: 12 }} />
                ) : (
                  <MaterialCommunityIcons name="circle-outline" size={24} color="#d1d5db" style={{ marginRight: 12 }} />
                )}

                {/* Habit Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: isActive ? 'white' : AGM_DARK,
                      marginBottom: 2,
                    }}
                  >
                    {habit.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isActive ? 'rgba(255,255,255,0.8)' : '#666666',
                    }}
                  >
                    {isCompleted ? 'Completed' : isActive ? 'Active' : 'Incomplete'}
                  </Text>
                </View>

                {/* Show duration if completed */}
                {isCompleted && completionData[habit.id]?.duration && (
                  <Text style={{ fontSize: 12, color: isActive ? 'white' : '#666666', fontWeight: '500' }}>
                    {formatTime(Math.floor(completionData[habit.id].duration! / 1000))}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Complete/End Routine Button - always available */}
          {habits.length > 0 && (
            <TouchableOpacity
              onPress={handleEndRoutine}
              style={{
                backgroundColor: AGM_GREEN,
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 24,
                marginTop: 24,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
                {completedCount === habits.length ? '✓ Routine Complete' : `End Routine (${completedCount}/${habits.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

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
              Select a reason for skipping {currentHabit?.name}
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
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: AGM_DARK, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExcuseHabit}
                disabled={!selectedExcuseReason}
                style={{
                  flex: 1,
                  backgroundColor: selectedExcuseReason ? AGM_GREEN : '#d1d5db',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: selectedExcuseReason ? 1 : 0.6,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Mark as Excused</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
