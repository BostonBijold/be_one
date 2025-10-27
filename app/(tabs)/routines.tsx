import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dataService, { Routine, Habit } from '@/services/dataService';
import { useData } from '@/hooks/useData';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function RoutinesScreen() {
  const insets = useSafeAreaInsets();
  const { routines, habits, loading, refetch } = useData();

  // Debug logging
  React.useEffect(() => {
    console.log('Routines Screen - Data loaded:', {
      routines: routines,
      routinesCount: routines.length,
      habits: habits,
      habitsCount: habits.length,
      loading: loading
    });
  }, [routines, habits, loading]);

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
      await refetch();
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
      await refetch();
      Alert.alert('Success', 'Routine updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update routine');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoutine = (routine: Routine) => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.name}"? This will not delete the individual habits.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.deleteRoutine(routine.id, true);
              await refetch();
              Alert.alert('Success', 'Routine deleted successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete routine');
            }
          },
        },
      ]
    );
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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AGM_GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: AGM_DARK, paddingHorizontal: 24, paddingVertical: 24, paddingTop: insets.top + 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 4 }}>Routines</Text>
              <Text style={{ color: '#ccc', fontSize: 14 }}>{routines.length} routines</Text>
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

        {/* Routines List */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {routines.length === 0 ? (
            <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              <MaterialCommunityIcons name="plus-circle-outline" size={56} color={AGM_GREEN} />
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
                      <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK, marginBottom: 4 }}>{routine.name}</Text>
                      <Text style={{ fontSize: 13, color: '#666666' }}>
                        {routine.days.map(d => getDayLabel(d)).join(', ')}
                      </Text>
                      {routineHabits.length > 0 && (
                        <Text style={{ fontSize: 12, color: '#999999', marginTop: 4 }}>
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
                        <Text style={{ fontSize: 13, color: '#999999', marginBottom: 12, fontStyle: 'italic' }}>No habits in this routine</Text>
                      )}

                      {/* Action Buttons */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => openEditModal(routine)}
                          style={{ flex: 1, backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                        >
                          <MaterialCommunityIcons name="pencil" size={16} color="white" style={{ marginRight: 6 }} />
                          <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteRoutine(routine)}
                          style={{ flex: 1, backgroundColor: '#fee2e2', borderRadius: 8, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                        >
                          <MaterialCommunityIcons name="trash-can" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#dc2626', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Routine Modal */}
      <Modal visible={showAddRoutineModal} animationType="slide" transparent={true}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingVertical: 20, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK }}>Create Routine</Text>
              <TouchableOpacity onPress={() => setShowAddRoutineModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={AGM_DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
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
                    }}
                  >
                    <Text style={{ color: selectedDays.includes(DAYS_SHORT[index]) ? 'white' : AGM_DARK, fontWeight: '600', fontSize: 12 }}>
                      {day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time of Day */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>Time of Day (Optional)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, color: AGM_DARK }}
                placeholder="e.g., Morning, Afternoon, Evening"
                placeholderTextColor="#999999"
                value={timeOfDay}
                onChangeText={setTimeOfDay}
              />

              {/* Habits Selection */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>Select Habits</Text>
              <View style={{ marginBottom: 16 }}>
                {habits.filter(h => !h.routineId).map(habit => (
                  <TouchableOpacity
                    key={habit.id}
                    onPress={() => toggleHabit(habit.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: selectedHabits.includes(habit.id) ? '#f0fdf4' : '#f9fafb',
                      borderRadius: 8,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: selectedHabits.includes(habit.id) ? AGM_GREEN : '#e5e7eb',
                    }}
                  >
                    <MaterialCommunityIcons
                      name={selectedHabits.includes(habit.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20}
                      color={selectedHabits.includes(habit.id) ? AGM_GREEN : '#999999'}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: AGM_DARK }}>{habit.name}</Text>
                      {habit.description && (
                        <Text style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>{habit.description}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                {habits.filter(h => !h.routineId).length === 0 && (
                  <Text style={{ fontSize: 13, color: '#999999', textAlign: 'center', paddingVertical: 16 }}>
                    No available habits. Create a habit first.
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowAddRoutineModal(false)}
                  style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: AGM_DARK, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddRoutine}
                  disabled={saving}
                  style={{ flex: 1, backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 12, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Routine Modal */}
      <Modal visible={showEditRoutineModal} animationType="slide" transparent={true}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingVertical: 20, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK }}>Edit Routine</Text>
              <TouchableOpacity onPress={() => setShowEditRoutineModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={AGM_DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
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
                    }}
                  >
                    <Text style={{ color: selectedDays.includes(DAYS_SHORT[index]) ? 'white' : AGM_DARK, fontWeight: '600', fontSize: 12 }}>
                      {day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time of Day */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>Time of Day (Optional)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, color: AGM_DARK }}
                placeholder="e.g., Morning, Afternoon, Evening"
                placeholderTextColor="#999999"
                value={timeOfDay}
                onChangeText={setTimeOfDay}
              />

              {/* Habits Selection */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>Select Habits</Text>
              <View style={{ marginBottom: 16 }}>
                {habits.filter(h => !h.routineId || h.routineId === editingRoutine?.id).map(habit => (
                  <TouchableOpacity
                    key={habit.id}
                    onPress={() => toggleHabit(habit.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: selectedHabits.includes(habit.id) ? '#f0fdf4' : '#f9fafb',
                      borderRadius: 8,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: selectedHabits.includes(habit.id) ? AGM_GREEN : '#e5e7eb',
                    }}
                  >
                    <MaterialCommunityIcons
                      name={selectedHabits.includes(habit.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20}
                      color={selectedHabits.includes(habit.id) ? AGM_GREEN : '#999999'}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: AGM_DARK }}>{habit.name}</Text>
                      {habit.description && (
                        <Text style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>{habit.description}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowEditRoutineModal(false)}
                  style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: AGM_DARK, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateRoutine}
                  disabled={saving}
                  style={{ flex: 1, backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 12, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Update</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
