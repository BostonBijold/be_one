import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import authService from '../../services/authService';
import dataService, { Habit, HabitCompletion } from '../../services/dataService';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<{ [key: number]: HabitCompletion }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [adding, setAdding] = useState(false);

  const todayString = dataService.getTodayString();

  // Load habits and today's completions
  const loadHabits = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all habits (including routine habits)
      const allHabits = await dataService.getHabits();
      setHabits(allHabits);

      // Get today's habit completions
      const completions = await dataService.getHabitCompletions();
      setHabitCompletions(completions);
    } catch (err: any) {
      console.error('Error loading habits:', err);
      setError(err.message || 'Failed to load habits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  // Toggle habit completion
  const toggleHabitCompletion = async (habitId: number) => {
    try {
      const currentCompletion = habitCompletions[habitId];
      const isCompleted = currentCompletion?.completed || false;
      const now = new Date().toISOString();

      const updatedCompletion: HabitCompletion = {
        completed: !isCompleted,
        completedAt: !isCompleted ? now : null,
        duration: null,
        startTime: null,
        endTime: !isCompleted ? now : null,
        notes: currentCompletion?.notes || '',
      };

      // Update local state immediately for responsiveness
      setHabitCompletions(prev => ({
        ...prev,
        [habitId]: updatedCompletion,
      }));

      // Update in Firestore
      await dataService.updateTodayHabits(
        { [habitId]: updatedCompletion },
        todayString
      );
    } catch (err: any) {
      console.error('Error toggling habit:', err);
      Alert.alert('Error', err.message || 'Failed to update habit. Please try again.');
      // Reload to get correct state
      loadHabits();
    }
  };

  // Add new habit
  const addNewHabit = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    try {
      setAdding(true);
      await dataService.addSingleHabit({
        name: newHabitName.trim(),
        description: newHabitDescription.trim(),
        trackingType: 'simple',
      });

      // Clear form and reload
      setNewHabitName('');
      setNewHabitDescription('');
      setShowAddForm(false);
      await loadHabits();
    } catch (err: any) {
      console.error('Error adding habit:', err);
      Alert.alert('Error', err.message || 'Failed to add habit. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  // Delete habit
  const deleteHabit = async (habitId: number, habitName: string) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habitName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.deleteHabit(habitId);
              await loadHabits();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete habit.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AGM_GREEN} />
          <Text style={{ marginTop: 16, color: AGM_DARK, fontSize: 16 }}>
            Loading habits...
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
            Error Loading Habits
          </Text>
          <Text style={{ marginTop: 8, color: AGM_DARK, fontSize: 14, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadHabits}
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
          Habits
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Add Habit Button */}
        {!showAddForm && (
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            style={{
              backgroundColor: AGM_GREEN,
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
              Add New Habit
            </Text>
          </TouchableOpacity>
        )}

        {/* Add Habit Form */}
        {showAddForm && (
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
              New Habit
            </Text>
            <TextInput
              placeholder="Habit name (e.g., Morning meditation)"
              value={newHabitName}
              onChangeText={setNewHabitName}
              style={{
                backgroundColor: AGM_STONE,
                padding: 12,
                borderRadius: 8,
                fontSize: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#e0ddd0',
              }}
            />
            <TextInput
              placeholder="Description (optional)"
              value={newHabitDescription}
              onChangeText={setNewHabitDescription}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: AGM_STONE,
                padding: 12,
                borderRadius: 8,
                fontSize: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#e0ddd0',
                textAlignVertical: 'top',
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  setNewHabitName('');
                  setNewHabitDescription('');
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#e5e7eb',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: AGM_DARK, fontSize: 16, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addNewHabit}
                disabled={adding}
                style={{
                  flex: 1,
                  backgroundColor: AGM_GREEN,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: adding ? 0.6 : 1,
                }}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                    Add Habit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Habits List */}
        {habits.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={64} color="#999" />
            <Text style={{ color: '#999', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
              No habits yet. Add your first habit to get started!
            </Text>
          </View>
        ) : (
          habits.map((habit) => {
            const isCompleted = habitCompletions[habit.id]?.completed || false;
            const isRoutineHabit = habit.routineId !== null;

            return (
              <View
                key={habit.id}
                style={{
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                {/* Completion Checkbox */}
                <TouchableOpacity
                  onPress={() => toggleHabitCompletion(habit.id)}
                  style={{ marginRight: 16 }}
                >
                  <MaterialCommunityIcons
                    name={isCompleted ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={32}
                    color={isCompleted ? AGM_GREEN : '#999'}
                  />
                </TouchableOpacity>

                {/* Habit Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: AGM_DARK,
                    textDecorationLine: isCompleted ? 'line-through' : 'none',
                  }}>
                    {habit.name}
                  </Text>
                  {habit.description && (
                    <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                      {habit.description}
                    </Text>
                  )}
                  {isRoutineHabit && (
                    <Text style={{ fontSize: 12, color: AGM_GREEN, marginTop: 4 }}>
                      Part of routine
                    </Text>
                  )}
                </View>

                {/* Delete Button (only for non-routine habits) */}
                {!isRoutineHabit && (
                  <TouchableOpacity
                    onPress={() => deleteHabit(habit.id, habit.name)}
                    style={{ marginLeft: 8, padding: 8 }}
                  >
                    <MaterialCommunityIcons name="delete" size={24} color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
