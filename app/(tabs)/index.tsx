import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import dataService from '@/services/dataService';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { routines, habits, dailyData, loading, refetch } = useData();

  const getCompletionStats = () => {
    if (!dailyData) return { completed: 0, total: 0 };

    const completions = dailyData.habitCompletions || {};
    const completed = Object.values(completions).filter((c: any) => c.completed).length;
    const total = Object.keys(completions).length;

    return { completed, total };
  };

  const { completed, total } = getCompletionStats();

  return (
    <SafeAreaView className="flex-1 bg-agm-stone">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{
          paddingTop: insets.top,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 py-6 bg-agm-dark">
          <Text className="text-white text-3xl font-bold">Dashboard</Text>
          <Text className="text-gray-300 mt-1">Welcome back, {user?.name || 'User'}!</Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#4b5320" />
            <Text className="text-agm-dark mt-3">Loading your data...</Text>
          </View>
        ) : (
          <View className="px-6 py-6">
            {/* Stats Overview */}
            <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-agm-dark font-semibold text-lg">Today's Progress</Text>
                <View className="bg-agm-green rounded-full px-3 py-1">
                  <Text className="text-white font-semibold">
                    {total > 0 ? `${completed}/${total}` : '0/0'}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <View
                  className="bg-agm-green h-full"
                  style={{
                    width: `${total > 0 ? (completed / total) * 100 : 0}%`,
                  }}
                />
              </View>

              <Text className="text-gray-600 text-sm mt-2">
                {total === 0
                  ? 'No habits tracked yet'
                  : `${completed} of ${total} habits completed`}
              </Text>
            </View>

            {/* Routines Section */}
            {routines.length > 0 && (
              <View className="mb-6">
                <Text className="text-agm-dark font-bold text-xl mb-3">
                  Routines ({routines.length})
                </Text>

                {routines.map((routine) => {
                  const routineHabits = habits.filter((h) => h.routineId === routine.id);
                  const routineCompletion = dailyData?.routineCompletions?.[routine.id];

                  return (
                    <View
                      key={routine.id}
                      className="bg-white rounded-lg p-4 mb-3 border-l-4"
                      style={{ borderLeftColor: '#4b5320' }}
                    >
                      <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-1">
                          <Text className="text-agm-dark font-semibold text-base">
                            {routine.name}
                          </Text>
                          <Text className="text-gray-600 text-sm">
                            {routineHabits.length} habits
                          </Text>
                        </View>
                        <View
                          className={`rounded-full px-3 py-1 ${
                            routineCompletion?.completed
                              ? 'bg-green-100'
                              : 'bg-gray-100'
                          }`}
                        >
                          <MaterialCommunityIcons
                            name={routineCompletion?.completed ? 'check-circle' : 'circle'}
                            size={20}
                            color={routineCompletion?.completed ? '#22c55e' : '#9ca3af'}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Single Habits Section */}
            {habits.filter((h) => !h.routineId).length > 0 && (
              <View className="mb-6">
                <Text className="text-agm-dark font-bold text-xl mb-3">
                  Single Habits ({habits.filter((h) => !h.routineId).length})
                </Text>

                {habits
                  .filter((h) => !h.routineId)
                  .slice(0, 5)
                  .map((habit) => {
                    const habitCompletion = dailyData?.habitCompletions?.[habit.id];

                    return (
                      <View key={habit.id} className="bg-white rounded-lg p-4 mb-2">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1">
                            <Text className="text-agm-dark font-semibold">
                              {habit.name}
                            </Text>
                            {habit.description && (
                              <Text className="text-gray-600 text-sm mt-1">
                                {habit.description}
                              </Text>
                            )}
                          </View>
                          <MaterialCommunityIcons
                            name={habitCompletion?.completed ? 'check-circle' : 'circle'}
                            size={24}
                            color={
                              habitCompletion?.completed ? '#4b5320' : '#d1d5db'
                            }
                          />
                        </View>
                      </View>
                    );
                  })}

                {habits.filter((h) => !h.routineId).length > 5 && (
                  <Text className="text-gray-600 text-sm text-center mt-2">
                    +{habits.filter((h) => !h.routineId).length - 5} more habits
                  </Text>
                )}
              </View>
            )}

            {/* Empty State */}
            {routines.length === 0 && habits.length === 0 && (
              <View className="bg-white rounded-lg p-6 items-center">
                <MaterialCommunityIcons name="plus-circle-outline" size={48} color="#4b5320" />
                <Text className="text-agm-dark font-semibold text-lg mt-3">
                  Get Started!
                </Text>
                <Text className="text-gray-600 text-center mt-2">
                  Create your first habit or routine to begin tracking your progress.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
