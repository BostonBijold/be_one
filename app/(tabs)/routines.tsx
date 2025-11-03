import dataService, { Habit, Routine, HabitCompletion, DailyData } from '@/services/dataService';
import AppHeader from '@/components/AppHeader';
import ReportModal from '@/components/ReportModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function RoutinesScreen() {
  const insets = useSafeAreaInsets();

  // Load data directly instead of using useData hook
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedRoutineId, setExpandedRoutineId] = useState<number | null>(null);
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);
  const [showEditRoutineModal, setShowEditRoutineModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Form states
  const [routineName, setRoutineName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<number[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [newHabitExcusable, setNewHabitExcusable] = useState(false);
  const [showNewHabitForm, setShowNewHabitForm] = useState(false);

  // Delete confirmation modal state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Habits and History modal states
  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedRoutineForReport, setSelectedRoutineForReport] = useState<Routine | null>(null);

  // Add Individual Habit modal state
  const [showAddIndividualHabitModal, setShowAddIndividualHabitModal] = useState(false);
  const [individualHabitName, setIndividualHabitName] = useState('');
  const [individualHabitDescription, setIndividualHabitDescription] = useState('');
  const [individualHabitDuration, setIndividualHabitDuration] = useState('10'); // in minutes
  const [individualHabitExcusable, setIndividualHabitExcusable] = useState(false);

  // Edit Individual Habit modal state
  const [showEditIndividualHabitModal, setShowEditIndividualHabitModal] = useState(false);
  const [editingIndividualHabit, setEditingIndividualHabit] = useState<Habit | null>(null);
  const [editIndividualHabitName, setEditIndividualHabitName] = useState('');
  const [editIndividualHabitDescription, setEditIndividualHabitDescription] = useState('');
  const [editIndividualHabitDuration, setEditIndividualHabitDuration] = useState('10'); // in minutes
  const [editIndividualHabitExcusable, setEditIndividualHabitExcusable] = useState(false);

  // Delete confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  // Habits modal states
  const [habitCompletions, setHabitCompletions] = useState<{ [key: number]: HabitCompletion }>({});
  const [habitsLoading, setHabitsLoading] = useState(false);
  const [habitsError, setHabitsError] = useState<string | null>(null);

  // History modal states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyViewType, setHistoryViewType] = useState<'day' | 'week' | 'month'>('day');
  const [expandedRoutines, setExpandedRoutines] = useState<number[]>([]);
  const [weekData, setWeekData] = useState<{ [date: string]: DailyData | null }>({});
  const [monthData, setMonthData] = useState<{ [date: string]: DailyData | null }>({});

  // Report modal: store 7 days of history for min/max calculations
  const [reportDailyDataArray, setReportDailyDataArray] = useState<DailyData[]>([]);

  // Load routines and habits directly
  const loadData = async () => {
    try {
      console.log('Routines Screen - Starting data load...');
      setLoading(true);
      setError(null);

      const [routinesData, habitsData] = await Promise.all([
        dataService.getRoutines(),
        dataService.getHabits(),
      ]);

      console.log('Routines Screen - Data loaded:', {
        routinesCount: routinesData.length,
        routines: routinesData,
        habitsCount: habitsData.length,
      });

      setRoutines(routinesData);
      setHabits(habitsData);
    } catch (err: any) {
      console.error('Routines Screen - Error loading data:', err);
      setError(err.message || 'Failed to load routines. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load habits for Habits modal
  const loadHabitsModal = async () => {
    try {
      setHabitsLoading(true);
      const completions = await dataService.getHabitCompletions();
      setHabitCompletions(completions);
    } catch (err: any) {
      setHabitsError(err.message || 'Failed to load habits');
    } finally {
      setHabitsLoading(false);
    }
  };

  // Load history for History modal
  const loadHistoryData = async (date: Date) => {
    try {
      setHistoryLoading(true);
      const dateString = dataService.formatDateString(date);
      const data = await dataService.getDailyData(dateString);
      setDailyData(data);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load week data (7 days starting from Monday of the week)
  const loadWeekData = async (date: Date) => {
    try {
      setHistoryLoading(true);
      const data: { [date: string]: DailyData | null } = {};
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        const dateStr = dataService.formatDateString(d);
        const dailyData = await dataService.getDailyData(dateStr);
        data[dateStr] = dailyData;
      }
      setWeekData(data);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to load week data');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load month data (all days in the month)
  const loadMonthData = async (date: Date) => {
    try {
      setHistoryLoading(true);
      const data: { [date: string]: DailyData | null } = {};
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateStr = dataService.formatDateString(d);
        const dailyData = await dataService.getDailyData(dateStr);
        data[dateStr] = dailyData;
      }
      setMonthData(data);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to load month data');
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleExpandedRoutine = (routineId: number) => {
    setExpandedRoutines(prev =>
      prev.includes(routineId) ? prev.filter(id => id !== routineId) : [...prev, routineId]
    );
  };

  // Toggle habit completion in Habits modal
  const toggleHabitCompletion = async (habitId: number) => {
    try {
      const currentCompletion = habitCompletions[habitId];
      const isCompleted = currentCompletion?.completed || false;
      const now = new Date().toISOString();
      const todayString = dataService.getTodayString();

      const updatedCompletion: HabitCompletion = {
        completed: !isCompleted,
        completedAt: !isCompleted ? now : null,
        duration: null,
        startTime: null,
        endTime: !isCompleted ? now : null,
        notes: currentCompletion?.notes || '',
      };

      setHabitCompletions(prev => ({
        ...prev,
        [habitId]: updatedCompletion,
      }));

      await dataService.updateTodayHabits(
        { [habitId]: updatedCompletion },
        todayString
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update habit');
      loadHabitsModal();
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleHabit = (habitId: number) => {
    setSelectedHabits(prev =>
      prev.includes(habitId) ? prev.filter(id => id !== habitId) : [...prev, habitId]
    );
  };

  const resetForm = () => {
    setRoutineName('');
    setSelectedDays([]);
    setSelectedHabits([]);
    setTimeOfDay('');
    setEditingRoutine(null);
    setNewHabitName('');
    setNewHabitDescription('');
    setNewHabitExcusable(false);
    setShowNewHabitForm(false);
  };

  // Create a new individual habit (standalone)
  const handleAddIndividualHabit = async () => {
    if (!individualHabitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    try {
      setSaving(true);
      // Convert duration from minutes to milliseconds
      const durationMs = parseInt(individualHabitDuration) * 60 * 1000;

      await dataService.addSingleHabit({
        name: individualHabitName.trim(),
        description: individualHabitDescription.trim(),
        trackingType: 'timer',
        duration: null,
        expectedCompletionTime: null,
        routineId: null,
        excusable: individualHabitExcusable,
        expectedDuration: durationMs,
      });

      // Reload habits list
      const habitsData = await dataService.getHabits();
      setHabits(habitsData);

      // Reset and close modal
      setIndividualHabitName('');
      setIndividualHabitDescription('');
      setIndividualHabitDuration('10');
      setIndividualHabitExcusable(false);
      setShowAddIndividualHabitModal(false);

      Alert.alert('Success', 'Individual habit created!');
    } catch (err: any) {
      console.error('Error adding individual habit:', err);
      Alert.alert('Error', err.message || 'Failed to create habit');
    } finally {
      setSaving(false);
    }
  };

  // Open edit modal for individual habit
  const handleEditIndividualHabit = (habit: Habit) => {
    setEditingIndividualHabit(habit);
    setEditIndividualHabitName(habit.name);
    setEditIndividualHabitDescription(habit.description || '');
    // Convert duration from milliseconds back to minutes for display
    const durationMinutes = habit.expectedDuration ? Math.round(habit.expectedDuration / 60 / 1000) : 10;
    setEditIndividualHabitDuration(durationMinutes.toString());
    setEditIndividualHabitExcusable(habit.excusable || false);
    setShowEditIndividualHabitModal(true);
  };

  // Save edited individual habit
  const handleSaveEditIndividualHabit = async () => {
    if (!editIndividualHabitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    if (!editingIndividualHabit) return;

    try {
      setSaving(true);
      // Convert duration from minutes to milliseconds
      const durationMs = parseInt(editIndividualHabitDuration) * 60 * 1000;

      // Update the habit using the dataService
      await dataService.updateHabit(editingIndividualHabit.id, {
        name: editIndividualHabitName.trim(),
        description: editIndividualHabitDescription.trim(),
        excusable: editIndividualHabitExcusable,
        expectedDuration: durationMs,
      });

      // Reload habits list
      const habitsData = await dataService.getHabits();
      setHabits(habitsData);

      // Reset and close modal
      setEditingIndividualHabit(null);
      setEditIndividualHabitName('');
      setEditIndividualHabitDescription('');
      setEditIndividualHabitDuration('10');
      setEditIndividualHabitExcusable(false);
      setShowEditIndividualHabitModal(false);

      Alert.alert('Success', 'Individual habit updated!');
    } catch (err: any) {
      console.error('Error updating individual habit:', err);
      Alert.alert('Error', err.message || 'Failed to update habit');
    } finally {
      setSaving(false);
    }
  };

  // Delete individual habit
  const handleDeleteIndividualHabit = (habit: Habit) => {
    console.log('Delete button tapped, habit:', habit);
    setHabitToDelete(habit);
    setShowDeleteConfirmation(true);
  };

  // Confirm and execute delete
  const handleConfirmDelete = async () => {
    if (!habitToDelete) return;

    try {
      console.log('Confirming delete for habit ID:', habitToDelete.id);
      setSaving(true);
      await dataService.deleteHabit(habitToDelete.id);

      // Reload habits list
      const habitsData = await dataService.getHabits();
      setHabits(habitsData);

      setShowDeleteConfirmation(false);
      setHabitToDelete(null);

      Alert.alert('Success', 'Individual habit deleted!');
    } catch (err: any) {
      console.error('Error deleting individual habit:', err);
      Alert.alert('Error', err.message || 'Failed to delete habit');
    } finally {
      setSaving(false);
    }
  };

  // Create a new habit and add it to selected habits
  const handleAddNewHabit = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    try {
      setSaving(true);
      const newHabit = await dataService.addSingleHabit({
        name: newHabitName.trim(),
        description: newHabitDescription.trim(),
        trackingType: 'timer',
        duration: null,
        expectedCompletionTime: null,
        routineId: null,
        excusable: newHabitExcusable,
      });

      // Add the new habit to selected habits and reload habits list
      setSelectedHabits([...selectedHabits, newHabit.id]);
      const habitsData = await dataService.getHabits();
      setHabits(habitsData);

      // Reset new habit form
      setNewHabitName('');
      setNewHabitDescription('');
      setNewHabitExcusable(false);
      setShowNewHabitForm(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create habit');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    try {
      setSaving(true);
      await dataService.addRoutine({
        name: routineName,
        days: selectedDays,
        habits: selectedHabits,
        timeOfDay: timeOfDay || null,
        order: routines.length,
      });

      setShowAddRoutineModal(false);
      resetForm();
      await loadData(); // Reload data after adding
      Alert.alert('Success', 'Routine created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create routine');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRoutine = async () => {
    if (!editingRoutine) return;

    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    try {
      setSaving(true);
      await dataService.updateRoutine(editingRoutine.id, {
        name: routineName,
        days: selectedDays,
        habits: selectedHabits,
        timeOfDay: timeOfDay || null,
      });

      setShowEditRoutineModal(false);
      resetForm();
      await loadData(); // Reload data after updating
      Alert.alert('Success', 'Routine updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update routine');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoutine = (routine: Routine) => {
    console.log('Delete button pressed for routine:', routine.name, 'ID:', routine.id);
    setRoutineToDelete(routine);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteRoutine = async () => {
    if (!routineToDelete) return;

    try {
      setDeleteLoading(true);
      console.log('Attempting to delete routine with ID:', routineToDelete.id);
      const result = await dataService.deleteRoutine(routineToDelete.id, true);
      console.log('Delete result:', result);
      await loadData(); // Reload data after deleting
      console.log('Data reloaded after delete');
      setShowDeleteConfirmModal(false);
      setRoutineToDelete(null);
      setShowEditRoutineModal(false);
      resetForm();
      Alert.alert('Success', 'Routine deleted successfully!');
    } catch (error: any) {
      console.error('Delete error:', error);
      Alert.alert('Error', error.message || 'Failed to delete routine');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setRoutineName(routine.name);
    setSelectedDays(routine.days);
    setSelectedHabits(routine.habits);
    setTimeOfDay(routine.timeOfDay || '');
    setShowEditRoutineModal(true);
  };

  const getRoutineHabits = (habitIds: number[]) => {
    return habits.filter(h => habitIds.includes(h.id));
  };

  const getDayLabel = (dayShort: string) => {
    const index = DAYS_SHORT.indexOf(dayShort);
    return index >= 0 ? DAYS_OF_WEEK[index] : dayShort;
  };


  // Format milliseconds to MM:SS format
  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AGM_GREEN} />
          <Text style={{ marginTop: 16, color: AGM_DARK }}>Loading routines...</Text>
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
      {/* App Header */}
      <AppHeader />

      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        {/* Routines Header with Add Button */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 24, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: AGM_DARK, fontSize: 28, fontWeight: 'bold', marginBottom: 4 }}>Routines</Text>
              <Text style={{ color: '#666666', fontSize: 14 }}>{routines.length} routines</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                setShowAddRoutineModal(true);
              }}
              style={{ backgroundColor: AGM_GREEN, borderRadius: 8, padding: 12 }}
            >
              <MaterialCommunityIcons name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Habits and History Buttons */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <TouchableOpacity
              onPress={async () => {
                setShowHabitsModal(true);
                await loadHabitsModal();
              }}
              style={{ flex: 1, backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginRight: 8 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="checkbox-marked-circle" size={20} color="white" style={{ marginRight: 6 }} />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Habits</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                setShowHistoryModal(true);
                await loadHistoryData(new Date());
              }}
              style={{ flex: 1, backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="history" size={20} color="white" style={{ marginRight: 6 }} />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>History</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Routines List */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {routines.length === 0 ? (
            <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={56} color={AGM_GREEN} />
              <Text style={{ fontSize: 20, fontWeight: '600', color: AGM_DARK, marginTop: 16 }}>No Routines Yet</Text>
              <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center', marginTop: 12 }}>
                Create your first routine to get started!
              </Text>
            </View>
          ) : (
            routines.map((routine) => {
              const isExpanded = expandedRoutineId === routine.id;
              const routineHabits = getRoutineHabits(routine.habits);

              return (
                <View key={routine.id} style={{ marginBottom: 12 }}>
                  {/* Routine Header */}
                  <TouchableOpacity
                    onPress={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                    style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK }}>
                          {routine.name}
                        </Text>
                        {routine.completionCount && routine.completionCount > 0 && routine.totalDurationSum && (
                          <Text style={{ fontSize: 13, color: '#666666', marginLeft: 8 }}>
                            (avg. {formatDuration(routine.totalDurationSum / routine.completionCount)})
                          </Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 13, color: '#666666' }}>
                        {routine.days.map(d => getDayLabel(d)).join(', ')}
                      </Text>
                      {routineHabits.length > 0 && (
                        <Text style={{ fontSize: 12, color: '#666666', marginTop: 4 }}>
                          {routineHabits.length} {routineHabits.length === 1 ? 'habit' : 'habits'}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color="#666666"
                    />
                  </TouchableOpacity>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <View style={{ backgroundColor: '#f9fafb', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingHorizontal: 16, paddingVertical: 12, paddingTop: 0, marginTop: -4 }}>
                      {/* Habits List */}
                      {routineHabits.length > 0 ? (
                        <View style={{ marginBottom: 12 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>Habits</Text>
                          {routineHabits.map((habit) => (
                            <View key={habit.id} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#ffffff', borderRadius: 6, marginBottom: 6 }}>
                              <Text style={{ fontSize: 13, fontWeight: '500', color: AGM_DARK }}>{habit.name}</Text>
                              {habit.description && (
                                <Text style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>{habit.description}</Text>
                              )}
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={{ fontSize: 13, color: '#666666', marginBottom: 12, fontStyle: 'italic' }}>No habits in this routine</Text>
                      )}

                      {/* Edit and Report Buttons */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => openEditModal(routine)}
                          style={{ flex: 1, backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name="pencil" size={18} color="white" style={{ marginRight: 6 }} />
                            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Edit</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={async () => {
                            // Load past 7 days of daily data for min/max calculations
                            const today = new Date();
                            const dailyDataArray: DailyData[] = [];

                            for (let i = 6; i >= 0; i--) {
                              const date = new Date(today);
                              date.setDate(date.getDate() - i);
                              const dateString = dataService.formatDateString(date);
                              try {
                                const dayData = await dataService.getTodayData(dateString);
                                if (dayData) {
                                  dailyDataArray.push(dayData);
                                }
                              } catch (err) {
                                console.error(`Error loading daily data for ${dateString}:`, err);
                              }
                            }

                            setReportDailyDataArray(dailyDataArray);
                            setSelectedRoutineForReport(routine);
                            setShowReportModal(true);
                          }}
                          style={{ flex: 1, backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name="chart-bar" size={18} color="white" style={{ marginRight: 6 }} />
                            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Report</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Individual Habits Section */}
          <View style={{ marginTop: 32, paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK }}>
                Individual Habits
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddIndividualHabitModal(true)}
                style={{ backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="plus-circle" size={16} color="white" style={{ marginRight: 4 }} />
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>Add</Text>
                </View>
              </TouchableOpacity>
            </View>

            {habits.filter(h => !h.routineId).length > 0 ? (
              <>
                {habits.filter(h => !h.routineId).map((habit) => (
                <View
                  key={habit.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginBottom: 4 }}>
                      {habit.name}
                    </Text>
                    {habit.description && (
                      <Text style={{ fontSize: 13, color: '#666666' }}>
                        {habit.description}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleEditIndividualHabit(habit)}
                    style={{
                      backgroundColor: AGM_GREEN,
                      borderRadius: 8,
                      paddingVertical: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="pencil" size={16} color="white" style={{ marginRight: 6 }} />
                      <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>Edit</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </>
            ) : (
              <Text style={{ fontSize: 13, color: '#666666', fontStyle: 'italic' }}>
                No individual habits yet. Tap "Add" to create one.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Routine Modal - Simplified for space */}
      <Modal
        visible={showAddRoutineModal || showEditRoutineModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddRoutineModal(false);
          setShowEditRoutineModal(false);
          resetForm();
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK }}>
                {showEditRoutineModal ? 'Edit Routine' : 'Create Routine'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddRoutineModal(false);
                  setShowEditRoutineModal(false);
                  resetForm();
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color={AGM_DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Routine Name */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>Routine Name</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, color: AGM_DARK }}
                placeholder="Enter routine name"
                placeholderTextColor="#999999"
                value={routineName}
                onChangeText={setRoutineName}
              />

              {/* Days Selection */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>Select Days</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {DAYS_OF_WEEK.map((day, index) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(DAYS_SHORT[index])}
                    style={{
                      backgroundColor: selectedDays.includes(DAYS_SHORT[index]) ? AGM_GREEN : '#f3f4f6',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderWidth: selectedDays.includes(DAYS_SHORT[index]) ? 2 : 1,
                      borderColor: selectedDays.includes(DAYS_SHORT[index]) ? AGM_GREEN : '#e5e7eb',
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: selectedDays.includes(DAYS_SHORT[index]) ? 'white' : AGM_DARK, fontWeight: '600', fontSize: 13 }}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Habits Selection */}
              <View style={{ marginTop: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK }}>
                    Select Habits ({selectedHabits.length})
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowNewHabitForm(!showNewHabitForm)}
                    style={{
                      backgroundColor: AGM_GREEN,
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>
                      {showNewHabitForm ? 'Cancel' : '+ New'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* New Habit Form */}
                {showNewHabitForm && (
                  <View style={{ backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        marginBottom: 8,
                        color: AGM_DARK,
                        fontSize: 14,
                      }}
                      placeholder="Habit name"
                      placeholderTextColor="#999999"
                      value={newHabitName}
                      onChangeText={setNewHabitName}
                    />
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        marginBottom: 8,
                        color: AGM_DARK,
                        fontSize: 14,
                        minHeight: 60,
                        textAlignVertical: 'top',
                      }}
                      placeholder="Description (optional)"
                      placeholderTextColor="#999999"
                      value={newHabitDescription}
                      onChangeText={setNewHabitDescription}
                      multiline
                    />

                    {/* Excusable Toggle for New Habit */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: AGM_DARK }}>
                          Allow Exceptions
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
                          Can skip if needed
                        </Text>
                      </View>
                      <Switch
                        value={newHabitExcusable}
                        onValueChange={setNewHabitExcusable}
                        trackColor={{ false: '#d1d5db', true: AGM_GREEN }}
                        thumbColor={'white'}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={handleAddNewHabit}
                      disabled={saving}
                      style={{
                        backgroundColor: AGM_GREEN,
                        borderRadius: 6,
                        paddingVertical: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
                        Create & Add Habit
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Existing Habits List */}
                {habits.length === 0 ? (
                  <Text style={{ fontSize: 13, color: '#999999', fontStyle: 'italic', marginBottom: 12 }}>
                    No habits available. Create one using the "+ New" button.
                  </Text>
                ) : (
                  <View style={{ maxHeight: 250 }}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {habits.map((habit) => (
                        <TouchableOpacity
                          key={habit.id}
                          onPress={() => toggleHabit(habit.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            backgroundColor: selectedHabits.includes(habit.id) ? '#f0f9f0' : '#f9f9f9',
                            borderRadius: 8,
                            marginBottom: 8,
                            borderLeftWidth: selectedHabits.includes(habit.id) ? 3 : 1,
                            borderLeftColor: selectedHabits.includes(habit.id) ? AGM_GREEN : '#e5e7eb',
                          }}
                        >
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: selectedHabits.includes(habit.id) ? AGM_GREEN : '#d1d5db',
                              backgroundColor: selectedHabits.includes(habit.id) ? AGM_GREEN : 'transparent',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 12,
                            }}
                          >
                            {selectedHabits.includes(habit.id) && (
                              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>✓</Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '500', color: AGM_DARK }}>
                              {habit.name}
                            </Text>
                            {habit.description && (
                              <Text style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
                                {habit.description}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={showEditRoutineModal ? handleUpdateRoutine : handleAddRoutine}
                disabled={saving}
                style={{ backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                    {showEditRoutineModal ? 'Update Routine' : 'Create Routine'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Delete Button (only shown when editing) */}
              {showEditRoutineModal && editingRoutine && (
                <TouchableOpacity
                  onPress={() => {
                    handleDeleteRoutine(editingRoutine);
                  }}
                  style={{ backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 12 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="trash-can" size={18} color="white" style={{ marginRight: 6 }} />
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Delete Routine</Text>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, marginHorizontal: 24, maxWidth: 400 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: AGM_DARK, marginBottom: 12 }}>
              Delete Routine?
            </Text>
            <Text style={{ fontSize: 14, color: '#666666', marginBottom: 24, lineHeight: 20 }}>
              Are you sure you want to delete "{routineToDelete?.name}"? This will not delete the individual habits.
            </Text>

            {/* Buttons */}
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirmModal(false)}
                disabled={deleteLoading}
                style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginRight: 8 }}
              >
                <Text style={{ color: AGM_DARK, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteRoutine}
                disabled={deleteLoading}
                style={{ flex: 1, backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Habits Modal */}
      <Modal visible={showHabitsModal} animationType="slide" transparent={false} onRequestClose={() => setShowHabitsModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0ddd0' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: AGM_DARK }}>Habits</Text>
            <TouchableOpacity onPress={() => setShowHabitsModal(false)}>
              <MaterialCommunityIcons name="close" size={28} color={AGM_DARK} />
            </TouchableOpacity>
          </View>

          {habitsLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={AGM_GREEN} />
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {habits.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={56} color="#666666" />
                  <Text style={{ fontSize: 14, color: '#666666', marginTop: 12, textAlign: 'center' }}>No habits yet</Text>
                </View>
              ) : (
                habits.map((habit) => {
                  const isRoutineHabit = habit.routineId !== null;
                  return (
                    <TouchableOpacity
                      key={habit.id}
                      onPress={() => {
                        handleEditIndividualHabit(habit);
                        setShowHabitsModal(false);
                      }}
                      style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK }}>
                          {habit.name}
                        </Text>
                        {habit.description && <Text style={{ fontSize: 13, color: '#666666', marginTop: 4 }}>{habit.description}</Text>}
                        {isRoutineHabit && <Text style={{ fontSize: 12, color: AGM_GREEN, marginTop: 4 }}>Part of routine</Text>}
                      </View>
                      <MaterialCommunityIcons name="pencil" size={20} color={AGM_GREEN} style={{ marginLeft: 12 }} />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistoryModal} animationType="slide" transparent={false} onRequestClose={() => setShowHistoryModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0ddd0' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: AGM_DARK }}>History</Text>
            <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
              <MaterialCommunityIcons name="close" size={28} color={AGM_DARK} />
            </TouchableOpacity>
          </View>

          {/* View Type Tabs */}
          <View style={{ flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e0ddd0' }}>
            {(['day', 'week', 'month'] as const).map((viewType) => (
              <TouchableOpacity
                key={viewType}
                onPress={async () => {
                  setHistoryViewType(viewType);
                  if (viewType === 'week') await loadWeekData(selectedDate);
                  else if (viewType === 'month') await loadMonthData(selectedDate);
                  else await loadHistoryData(selectedDate);
                  setExpandedRoutines([]);
                }}
                style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: historyViewType === viewType ? AGM_GREEN : 'transparent' }}
              >
                <Text style={{ fontWeight: '600', color: historyViewType === viewType ? AGM_GREEN : '#666666', fontSize: 14, textTransform: 'capitalize' }}>
                  {viewType}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {historyLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={AGM_GREEN} />
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {historyViewType === 'day' && (
                <>
                  {/* Date Navigation */}
                  <View style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TouchableOpacity onPress={async () => {const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); await loadHistoryData(d);}} style={{ padding: 8 }}>
                      <MaterialCommunityIcons name="chevron-left" size={24} color={AGM_DARK} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK }}>
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={async () => {const d = new Date(selectedDate); d.setDate(d.getDate() + 1); if (d <= new Date()) { setSelectedDate(d); await loadHistoryData(d); }}} style={{ padding: 8, opacity: selectedDate.toDateString() === new Date().toDateString() ? 0.3 : 1 }} disabled={selectedDate.toDateString() === new Date().toDateString()}>
                      <MaterialCommunityIcons name="chevron-right" size={24} color={AGM_DARK} />
                    </TouchableOpacity>
                  </View>

                  {/* Routines for Day View */}
                  {!dailyData || Object.keys(dailyData.routineCompletions).length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <MaterialCommunityIcons name="calendar-blank" size={48} color="#999" />
                      <Text style={{ fontSize: 14, color: '#999', marginTop: 12 }}>No routine data for this date</Text>
                    </View>
                  ) : (
                    Object.entries(dailyData.routineCompletions).map(([routineIdStr, completion]) => {
                      const routineId = parseInt(routineIdStr);
                      const routine = routines.find(r => r.id === routineId);
                      const isExpanded = expandedRoutines.includes(routineId);
                      const routineHabits = routine ? habits.filter(h => routine.habits.includes(h.id)) : [];

                      return routine ? (
                        <View key={routineId} style={{ marginBottom: 12 }}>
                          <TouchableOpacity
                            onPress={() => toggleExpandedRoutine(routineId)}
                            style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
                          >
                            <MaterialCommunityIcons
                              name={completion.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                              size={28}
                              color={completion.completed ? AGM_GREEN : '#666666'}
                              style={{ marginRight: 12 }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, textDecorationLine: completion.completed ? 'line-through' : 'none' }}>
                                {routine.name}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                {completion.completedAt ? new Date(completion.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Not completed'}
                              </Text>
                            </View>
                            <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#666666" />
                          </TouchableOpacity>

                          {isExpanded && routineHabits.length > 0 && (
                            <View style={{ backgroundColor: '#f9fafb', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: -4 }}>
                              {routineHabits.map((habit) => {
                                const habitCompletion = dailyData?.habitCompletions?.[habit.id];
                                const habitTiming = completion.habitTimes?.[habit.id];
                                return (
                                  <View key={habit.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                                    <MaterialCommunityIcons
                                      name={habitCompletion?.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                                      size={20}
                                      color={habitCompletion?.completed ? AGM_GREEN : '#666666'}
                                      style={{ marginRight: 10 }}
                                    />
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 14, color: AGM_DARK, textDecorationLine: habitCompletion?.completed ? 'line-through' : 'none' }}>
                                        {habit.name}
                                      </Text>
                                      {habitTiming && (
                                        <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                                          Duration: {habitTiming.duration ? Math.floor(habitTiming.duration / 1000) + 's' : 'N/A'}
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      ) : null;
                    })
                  )}
                </>
              )}

              {historyViewType === 'week' && (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>Weekly Overview</Text>
                  {Object.entries(weekData).map(([dateStr, dayData]) => {
                    const dayDate = new Date(dateStr);
                    const completedRoutines = dayData ? Object.values(dayData.routineCompletions).filter(r => r.completed).length : 0;
                    const totalRoutines = dayData ? Object.keys(dayData.routineCompletions).length : 0;

                    return (
                      <View key={dateStr} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 12, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK }}>
                            {dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Text>
                          <Text style={{ fontSize: 12, color: completedRoutines === totalRoutines && totalRoutines > 0 ? AGM_GREEN : '#666666' }}>
                            {completedRoutines}/{totalRoutines} routines
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}

              {historyViewType === 'month' && (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>Monthly Overview</Text>
                  {Object.entries(monthData).map(([dateStr, dayData]) => {
                    const dayDate = new Date(dateStr);
                    const completedRoutines = dayData ? Object.values(dayData.routineCompletions).filter(r => r.completed).length : 0;
                    const totalRoutines = dayData ? Object.keys(dayData.routineCompletions).length : 0;

                    return (
                      <View key={dateStr} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: AGM_DARK }}>
                          {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                        <View style={{ width: 100, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                          <View style={{ width: totalRoutines > 0 ? `${(completedRoutines / totalRoutines) * 100}%` : 0, height: '100%', backgroundColor: AGM_GREEN }} />
                        </View>
                        <Text style={{ fontSize: 12, color: '#666', minWidth: 40, textAlign: 'right' }}>
                          {totalRoutines > 0 ? Math.round((completedRoutines / totalRoutines) * 100) : 0}%
                        </Text>
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Add Individual Habit Modal */}
      <Modal
        visible={showAddIndividualHabitModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddIndividualHabitModal(false);
          setIndividualHabitName('');
          setIndividualHabitDescription('');
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 24,
              paddingBottom: 32,
              paddingTop: 24,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: AGM_DARK }}>
                Add Individual Habit
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddIndividualHabitModal(false);
                  setIndividualHabitName('');
                  setIndividualHabitDescription('');
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color={AGM_DARK} />
              </TouchableOpacity>
            </View>

            {/* Habit Name Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                Habit Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: AGM_DARK,
                  fontSize: 14,
                }}
                placeholder="e.g., Drink Water, Exercise, Meditate"
                placeholderTextColor="#999999"
                value={individualHabitName}
                onChangeText={setIndividualHabitName}
              />
            </View>

            {/* Habit Description Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                Description (Optional)
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: AGM_DARK,
                  fontSize: 14,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Add notes about this habit..."
                placeholderTextColor="#999999"
                value={individualHabitDescription}
                onChangeText={setIndividualHabitDescription}
                multiline={true}
                numberOfLines={4}
              />
            </View>

            {/* Expected Duration Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                Expected Duration (minutes)
              </Text>
              <Text style={{ fontSize: 12, color: '#666666', marginBottom: 8 }}>
                Your goal time. Helps track if you're getting faster!
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: AGM_DARK,
                  fontSize: 14,
                }}
                placeholder="10"
                placeholderTextColor="#999999"
                value={individualHabitDuration}
                onChangeText={setIndividualHabitDuration}
                keyboardType="number-pad"
              />
            </View>

            {/* Excusable Toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK }}>
                  Allow Exceptions
                </Text>
                <Text style={{ fontSize: 12, color: '#666666', marginTop: 4 }}>
                  Can skip due to sick day, travel, etc.
                </Text>
              </View>
              <Switch
                value={individualHabitExcusable}
                onValueChange={setIndividualHabitExcusable}
                trackColor={{ false: '#d1d5db', true: AGM_GREEN }}
                thumbColor={'white'}
              />
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddIndividualHabitModal(false);
                  setIndividualHabitName('');
                  setIndividualHabitDescription('');
                  setIndividualHabitDuration('10');
                  setIndividualHabitExcusable(false);
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
                onPress={handleAddIndividualHabit}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: AGM_GREEN,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                  {saving ? 'Creating...' : 'Create Habit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Individual Habit Modal */}
      <Modal
        visible={showEditIndividualHabitModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditIndividualHabitModal(false);
          setEditingIndividualHabit(null);
          setEditIndividualHabitName('');
          setEditIndividualHabitDescription('');
          setEditIndividualHabitDuration('10');
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 24,
              paddingBottom: 32,
              paddingTop: 24,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: AGM_DARK }}>
                Edit Individual Habit
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEditIndividualHabitModal(false);
                  setEditingIndividualHabit(null);
                  setEditIndividualHabitName('');
                  setEditIndividualHabitDescription('');
                  setEditIndividualHabitDuration('10');
                  setEditIndividualHabitExcusable(false);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color={AGM_DARK} />
              </TouchableOpacity>
            </View>

            {/* Habit Name Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                Habit Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: AGM_DARK,
                  fontSize: 14,
                }}
                placeholder="Habit name"
                placeholderTextColor="#999999"
                value={editIndividualHabitName}
                onChangeText={setEditIndividualHabitName}
              />
            </View>

            {/* Habit Description Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                Description (Optional)
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: AGM_DARK,
                  fontSize: 14,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Add notes about this habit..."
                placeholderTextColor="#999999"
                value={editIndividualHabitDescription}
                onChangeText={setEditIndividualHabitDescription}
                multiline={true}
                numberOfLines={4}
              />
            </View>

            {/* Expected Duration Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                Expected Duration (minutes)
              </Text>
              <Text style={{ fontSize: 12, color: '#666666', marginBottom: 8 }}>
                Your goal time. Helps track if you're getting faster!
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: AGM_DARK,
                  fontSize: 14,
                }}
                placeholder="10"
                placeholderTextColor="#999999"
                value={editIndividualHabitDuration}
                onChangeText={setEditIndividualHabitDuration}
                keyboardType="number-pad"
              />
            </View>

            {/* Excusable Toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK }}>
                  Allow Exceptions
                </Text>
                <Text style={{ fontSize: 12, color: '#666666', marginTop: 4 }}>
                  Can skip due to sick day, travel, etc.
                </Text>
              </View>
              <Switch
                value={editIndividualHabitExcusable}
                onValueChange={setEditIndividualHabitExcusable}
                trackColor={{ false: '#d1d5db', true: AGM_GREEN }}
                thumbColor={'white'}
              />
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => {
                if (editingIndividualHabit) {
                  setShowEditIndividualHabitModal(false);
                  handleDeleteIndividualHabit(editingIndividualHabit);
                }
              }}
              style={{
                backgroundColor: '#d32f2f',
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="trash-can" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Delete Habit</Text>
              </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowEditIndividualHabitModal(false);
                  setEditingIndividualHabit(null);
                  setEditIndividualHabitName('');
                  setEditIndividualHabitDescription('');
                  setEditIndividualHabitDuration('10');
                  setEditIndividualHabitExcusable(false);
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
                onPress={handleSaveEditIndividualHabit}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: AGM_GREEN,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmation}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowDeleteConfirmation(false);
          setHabitToDelete(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: AGM_DARK, marginBottom: 12 }}>
              Delete Habit?
            </Text>
            <Text style={{ fontSize: 14, color: '#666666', marginBottom: 24 }}>
              Are you sure you want to delete "{habitToDelete?.name}"? This action cannot be undone.
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteConfirmation(false);
                  setHabitToDelete(null);
                }}
                disabled={saving}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ color: AGM_DARK, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: '#d32f2f',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                  {saving ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      {selectedRoutineForReport && (
        <ReportModal
          visible={showReportModal}
          routine={selectedRoutineForReport}
          habits={getRoutineHabits(selectedRoutineForReport.habits)}
          dailyDataArray={reportDailyDataArray}
          onClose={() => {
            setShowReportModal(false);
            setSelectedRoutineForReport(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}