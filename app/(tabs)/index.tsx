import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import dataService from '@/services/dataService';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

// Weekly virtues - rotates through these each week
const WEEKLY_VIRTUES = [
  {
    virtue: 'Present',
    focus: 'A Good Man Is Present. Be fully where you are this week.',
    description: 'Being present means giving your full attention to the current moment, whether in conversation, work, or daily activities. It\'s about being mentally and emotionally engaged rather than distracted by past regrets or future worries. Practice this by putting away your phone during conversations, focusing on one task at a time, and truly listening when others speak.',
    challenges: [
      { text: 'Have a phone-free conversation for at least 10 minutes', difficulty: 'easy' },
      { text: 'Complete one task without checking your phone', difficulty: 'easy' },
      { text: 'Practice active listening in all conversations today', difficulty: 'medium' },
      { text: 'Meditate or practice mindfulness for 15 minutes', difficulty: 'medium' },
      { text: 'Be fully present during all meals today', difficulty: 'hard' },
    ],
  },
  {
    virtue: 'Determined',
    focus: 'A Good Man Is Determined. Know your why and stand firm this week.',
    description: 'Determination is the unwavering commitment to your goals and values, even when faced with obstacles or setbacks. It means having a clear sense of purpose and the persistence to see things through. Practice this by setting clear daily intentions, staying committed to your routines, and not giving up when things get difficult.',
    challenges: [
      { text: 'Write down your top 3 goals and why they matter', difficulty: 'easy' },
      { text: 'Complete all your routines without skipping', difficulty: 'easy' },
      { text: 'Overcome one obstacle you\'ve been avoiding', difficulty: 'medium' },
      { text: 'Stay committed to your routines even when tired', difficulty: 'medium' },
      { text: 'Push through a challenging task for 1 hour straight', difficulty: 'hard' },
    ],
  },
  {
    virtue: 'Confident',
    focus: 'A Good Man Is Confident. Keep your promises to yourself this week.',
    description: 'True confidence comes from keeping the promises you make to yourself, not from external validation. It\'s about trusting in your abilities and decisions while remaining humble. Practice this by following through on your commitments, speaking up for what you believe in, and making decisions based on your values rather than others\' opinions.',
    challenges: [
      { text: 'Keep one promise you made to yourself', difficulty: 'easy' },
      { text: 'Share your opinion respectfully in a conversation', difficulty: 'easy' },
      { text: 'Make a decision based on your values alone', difficulty: 'medium' },
      { text: 'Keep all promises to yourself today', difficulty: 'medium' },
      { text: 'Stand up for what you believe in publicly', difficulty: 'hard' },
    ],
  },
  {
    virtue: 'Patient',
    focus: 'A Good Man Is Patient. Do not complain this week.',
    description: 'Patience is the ability to remain calm and composed in the face of delays, difficulties, or frustration. It means accepting what you cannot control and focusing on what you can. Practice this by taking deep breaths when frustrated, reframing setbacks as learning opportunities, and avoiding complaints about things beyond your control.',
    challenges: [
      { text: 'Go through one frustrating situation without complaining', difficulty: 'easy' },
      { text: 'Take 3 deep breaths when feeling impatient', difficulty: 'easy' },
      { text: 'Reframe one setback as a learning opportunity', difficulty: 'medium' },
      { text: 'Avoid complaining for the entire day', difficulty: 'medium' },
      { text: 'Wait patiently without frustration for an hour', difficulty: 'hard' },
    ],
  },
  {
    virtue: 'Genuine',
    focus: 'A Good Man Is Genuine. Be your authentic self this week.',
    description: 'Being genuine means staying true to your values, beliefs, and personality without pretense or artificial behavior. It\'s about being honest with yourself and others about who you are. Practice this by expressing your true opinions respectfully, admitting when you\'re wrong, and not pretending to be someone you\'re not to fit in.',
    challenges: [
      { text: 'Admit a mistake you made and apologize', difficulty: 'easy' },
      { text: 'Express your true opinion honestly today', difficulty: 'easy' },
      { text: 'Be yourself without trying to impress anyone', difficulty: 'medium' },
      { text: 'Have an honest conversation about your struggles', difficulty: 'medium' },
      { text: 'Stand out by being completely authentic all day', difficulty: 'hard' },
    ],
  },
  {
    virtue: 'Responsible',
    focus: 'A Good Man Is Responsible. Take ownership this week.',
    description: 'Responsibility means accepting accountability for your actions, decisions, and their consequences. It\'s about being reliable and dependable in all areas of your life. Practice this by admitting mistakes without making excuses, following through on commitments, and taking initiative to solve problems rather than waiting for others to act.',
    challenges: [
      { text: 'Take responsibility for one mistake without excuses', difficulty: 'easy' },
      { text: 'Follow through on all your commitments today', difficulty: 'easy' },
      { text: 'Solve a problem without waiting for help', difficulty: 'medium' },
      { text: 'Take full ownership of all your actions today', difficulty: 'medium' },
      { text: 'Be the one who steps up to fix a major issue', difficulty: 'hard' },
    ],
  },
  {
    virtue: 'Strong',
    focus: 'A Good Man Is Strong. Build your strength in all forms this week.',
    description: 'Strength encompasses physical, mental, emotional, and spiritual resilience. It\'s about developing the capacity to handle challenges and support others. Practice this by maintaining physical fitness, developing emotional intelligence, standing up for what\'s right, and being a source of support for those around you.',
    challenges: [
      { text: 'Do a physical workout or exercise today', difficulty: 'easy' },
      { text: 'Help someone with their problem', difficulty: 'easy' },
      { text: 'Face a fear and work through it', difficulty: 'medium' },
      { text: 'Be emotionally strong for someone who needs you', difficulty: 'medium' },
      { text: 'Stand up against something you know is wrong', difficulty: 'hard' },
    ],
  },
  {
    virtue: 'Disciplined',
    focus: 'A Good Man Is Disciplined. Master yourself this week.',
    description: 'Discipline is the ability to control your impulses, maintain consistent habits, and work toward long-term goals despite short-term temptations. It\'s about self-mastery and delayed gratification. Practice this by maintaining consistent routines, resisting unhealthy temptations, and staying focused on your priorities even when it\'s difficult.',
    challenges: [
      { text: 'Resist one temptation that usually gets you', difficulty: 'easy' },
      { text: 'Complete your full routine without shortcuts', difficulty: 'easy' },
      { text: 'Stay focused on work for 2 hours straight', difficulty: 'medium' },
      { text: 'Master your impulses all day long', difficulty: 'medium' },
      { text: 'Maintain perfect discipline with all habits and goals', difficulty: 'hard' },
    ],
  },
  {
    virtue: 'Humble',
    focus: 'A Good Man Is Humble. Serve others before yourself this week.',
    description: 'Humility is the recognition that you are not the center of the universe and that others\' needs matter as much as your own. It\'s about putting others first and recognizing your own limitations. Practice this by listening more than you speak, helping others without expecting recognition, and acknowledging when others have better ideas or solutions.',
    challenges: [
      { text: 'Help someone without expecting recognition', difficulty: 'easy' },
      { text: 'Listen more than you speak in a conversation', difficulty: 'easy' },
      { text: 'Acknowledge someone else\'s better idea', difficulty: 'medium' },
      { text: 'Put someone else\'s needs before your own today', difficulty: 'medium' },
      { text: 'Serve others all day with genuine humility', difficulty: 'hard' },
    ],
  },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { routines, habits, dailyData, loading, refetch } = useData();
  const [expandedRoutines, setExpandedRoutines] = useState<number[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<{ [key: string]: { accepted: boolean; completed: boolean; completedAt?: string } }>({});

  // Get the current week's virtue based on week number of the year
  const getWeeklyVirtue = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / millisecondsPerDay);
    const weekNumber = Math.floor(daysSinceStart / 7);
    return WEEKLY_VIRTUES[weekNumber % WEEKLY_VIRTUES.length];
  };

  // Get today's date string for tracking
  const getTodayString = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get the daily challenge for today based on virtue and day
  const getDailyChallenge = () => {
    const virtue = getWeeklyVirtue();
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const challengeIndex = dayOfYear % virtue.challenges.length;
    return virtue.challenges[challengeIndex];
  };

  // Get challenge state for today
  const getTodaysChallengeState = () => {
    const dateKey = getTodayString();
    return dailyChallenges[dateKey] || { accepted: false, completed: false };
  };

  // Accept the daily challenge
  const acceptChallenge = async () => {
    const dateKey = getTodayString();
    const newState = { ...dailyChallenges };
    newState[dateKey] = { accepted: true, completed: false };
    setDailyChallenges(newState);
    // TODO: Save to Firestore when backend is ready
  };

  // Complete the daily challenge
  const completeChallenge = async () => {
    const dateKey = getTodayString();
    const newState = { ...dailyChallenges };
    newState[dateKey] = { accepted: true, completed: true, completedAt: new Date().toISOString() };
    setDailyChallenges(newState);
    // TODO: Save to Firestore when backend is ready
  };

  const toggleRoutineExpansion = (routineId: number) => {
    setExpandedRoutines(prev =>
      prev.includes(routineId)
        ? prev.filter(id => id !== routineId)
        : [...prev, routineId]
    );
  };

  const getCompletionStats = () => {
    if (!dailyData) return { completed: 0, total: 0 };

    const completions = dailyData.habitCompletions || {};
    const completed = Object.values(completions).filter((c: any) => c.completed).length;
    const total = Object.keys(completions).length;

    return { completed, total };
  };

  const { completed, total } = getCompletionStats();

  const toggleHabitCompletion = async (habitId: number) => {
    try {
      const currentStatus = dailyData?.habitCompletions?.[habitId]?.completed || false;
      await dataService.updateHabitCompletion(habitId, !currentStatus);
      refetch();
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View style={{ backgroundColor: AGM_DARK, paddingHorizontal: 24, paddingVertical: 24 }}>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 4 }}>
            Dashboard
          </Text>
          <Text style={{ color: '#ccc', fontSize: 14 }}>
            Welcome back, {user?.name || 'User'}!
          </Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={AGM_GREEN} />
            <Text style={{ color: AGM_DARK, marginTop: 12, fontSize: 14 }}>Loading your data...</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
            {/* Stats Overview */}
            <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: AGM_DARK }}>Today's Progress</Text>
                <View style={{ backgroundColor: AGM_GREEN, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                    {total > 0 ? `${completed}/${total}` : '0/0'}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={{ backgroundColor: '#e5e7eb', borderRadius: 10, height: 12, overflow: 'hidden', marginBottom: 12 }}>
                <View
                  style={{
                    backgroundColor: AGM_GREEN,
                    height: '100%',
                    width: `${total > 0 ? (completed / total) * 100 : 0}%`,
                  }}
                />
              </View>

              <Text style={{ color: '#666666', fontSize: 13 }}>
                {total === 0
                  ? 'No habits tracked yet'
                  : `${completed} of ${total} habits completed`}
              </Text>
            </View>

            {/* Weekly Virtue Card */}
            {(() => {
              const weeklyVirtue = getWeeklyVirtue();
              return (
                <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderLeftWidth: 4, borderLeftColor: AGM_GREEN }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#666666', opacity: 0.7, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>This Week's Virtue</Text>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: AGM_DARK, marginBottom: 8 }}>{weeklyVirtue.virtue}</Text>
                  <Text style={{ fontSize: 14, color: AGM_DARK, marginBottom: 12, fontWeight: '600' }}>{weeklyVirtue.focus}</Text>
                  <Text style={{ fontSize: 13, color: '#666666', lineHeight: 20 }}>{weeklyVirtue.description}</Text>
                </View>
              );
            })()}

            {/* Daily Challenge Card */}
            {(() => {
              const challenge = getDailyChallenge();
              const challengeState = getTodaysChallengeState();

              const getDifficultyColor = (difficulty: string) => {
                switch(difficulty) {
                  case 'easy': return '#dcfce7';
                  case 'medium': return '#fef3c7';
                  case 'hard': return '#fee2e2';
                  default: return '#f3f4f6';
                }
              };

              const getDifficultyTextColor = (difficulty: string) => {
                switch(difficulty) {
                  case 'easy': return '#16a34a';
                  case 'medium': return '#d97706';
                  case 'hard': return '#dc2626';
                  default: return '#666666';
                }
              };

              if (!challengeState.completed) {
                return (
                  <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                    <View style={{ paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#666666', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Today's Challenge</Text>
                    </View>

                    {!challengeState.accepted ? (
                      <>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>Ready for today's challenge?</Text>
                        <View style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                          <Text style={{ fontSize: 14, color: AGM_DARK, marginBottom: 8 }}>{challenge.text}</Text>
                          <View style={{ backgroundColor: getDifficultyColor(challenge.difficulty), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: getDifficultyTextColor(challenge.difficulty), textTransform: 'capitalize' }}>
                              {challenge.difficulty}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={acceptChallenge}
                          style={{ backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
                        >
                          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Accept Challenge</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                          <Text style={{ fontSize: 13, fontWeight: '500', color: AGM_DARK, marginBottom: 8 }}>Your challenge:</Text>
                          <Text style={{ fontSize: 14, color: AGM_DARK, marginBottom: 8 }}>{challenge.text}</Text>
                          <View style={{ backgroundColor: getDifficultyColor(challenge.difficulty), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: getDifficultyTextColor(challenge.difficulty), textTransform: 'capitalize' }}>
                              {challenge.difficulty}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={completeChallenge}
                          style={{ backgroundColor: AGM_GREEN, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
                        >
                          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Mark Complete</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                );
              } else {
                // Challenge completed
                return (
                  <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                    <View style={{ backgroundColor: AGM_GREEN + '15', borderRadius: 8, padding: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 18, color: AGM_GREEN, marginRight: 8 }}>✓</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_GREEN }}>Challenge Completed!</Text>
                      </View>
                      <Text style={{ fontSize: 13, color: AGM_GREEN, marginBottom: 4 }}>{challenge.text}</Text>
                      {challengeState.completedAt && (
                        <Text style={{ fontSize: 12, color: AGM_GREEN, opacity: 0.7 }}>
                          Completed at {new Date(challengeState.completedAt).toLocaleTimeString()}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }
            })()}

            {/* Routines Section */}
            {routines.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK, marginBottom: 12 }}>
                  Routines ({routines.length})
                </Text>

                {routines.map((routine) => {
                  const routineHabits = habits.filter((h) => h.routineId === routine.id);
                  const routineCompletion = dailyData?.routineCompletions?.[routine.id];
                  const isExpanded = expandedRoutines.includes(routine.id);

                  return (
                    <View key={routine.id} style={{ marginBottom: 12 }}>
                      {/* Routine Header */}
                      <TouchableOpacity
                        onPress={() => toggleRoutineExpansion(routine.id)}
                        style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderLeftWidth: 4, borderLeftColor: AGM_GREEN }}
                      >
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="repeat" size={24} color={AGM_GREEN} style={{ marginRight: 12 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK }}>
                              {routine.name}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#666666', marginTop: 4 }}>
                              {routineHabits.length} {routineHabits.length === 1 ? 'habit' : 'habits'}
                            </Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ backgroundColor: routineCompletion?.completed ? '#dcfce7' : '#f3f4f6', borderRadius: 20, padding: 6 }}>
                            <MaterialCommunityIcons
                              name={routineCompletion?.completed ? 'check-circle' : 'circle-outline'}
                              size={20}
                              color={routineCompletion?.completed ? '#16a34a' : '#9ca3af'}
                            />
                          </View>
                          <MaterialCommunityIcons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color="#666666"
                          />
                        </View>
                      </TouchableOpacity>

                      {/* Routine Habits (Expandable) */}
                      {isExpanded && (
                        <View style={{ paddingLeft: 12, marginTop: 8 }}>
                          {routineHabits.map((habit) => {
                            const habitCompletion = dailyData?.habitCompletions?.[habit.id];
                            const isCompleted = habitCompletion?.completed || false;

                            return (
                              <TouchableOpacity
                                key={habit.id}
                                onPress={() => toggleHabitCompletion(habit.id)}
                                style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, opacity: isCompleted ? 0.6 : 1 }}
                              >
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                  <MaterialCommunityIcons name="check-circle" size={20} color={isCompleted ? AGM_GREEN : '#d1d5db'} style={{ marginRight: 10 }} />
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '500', color: isCompleted ? '#999999' : AGM_DARK, textDecorationLine: isCompleted ? 'line-through' : 'none' }}>
                                      {habit.name}
                                    </Text>
                                    {habit.description && (
                                      <Text style={{ fontSize: 12, color: '#999999', marginTop: 2 }}>
                                        {habit.description}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Single Habits Section */}
            {habits.filter((h) => !h.routineId).length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK, marginBottom: 12 }}>
                  Single Habits ({habits.filter((h) => !h.routineId).length})
                </Text>

                {habits
                  .filter((h) => !h.routineId)
                  .map((habit) => {
                    const habitCompletion = dailyData?.habitCompletions?.[habit.id];
                    const isCompleted = habitCompletion?.completed || false;

                    return (
                      <TouchableOpacity
                        key={habit.id}
                        onPress={() => toggleHabitCompletion(habit.id)}
                        style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, opacity: isCompleted ? 0.65 : 1 }}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <MaterialCommunityIcons name="star" size={16} color={AGM_GREEN} style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '600', color: isCompleted ? '#999999' : AGM_DARK, textDecorationLine: isCompleted ? 'line-through' : 'none' }}>
                              {habit.name}
                            </Text>
                          </View>
                          {habit.description && (
                            <Text style={{ fontSize: 13, color: '#999999', marginLeft: 24 }}>
                              {habit.description}
                            </Text>
                          )}
                        </View>
                        <MaterialCommunityIcons
                          name={isCompleted ? 'check-circle' : 'circle-outline'}
                          size={28}
                          color={isCompleted ? AGM_GREEN : '#d1d5db'}
                          style={{ marginLeft: 12 }}
                        />
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}

            {/* Empty State */}
            {routines.length === 0 && habits.length === 0 && (
              <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                <MaterialCommunityIcons name="plus-circle-outline" size={56} color={AGM_GREEN} />
                <Text style={{ fontSize: 20, fontWeight: '600', color: AGM_DARK, marginTop: 16 }}>
                  Get Started!
                </Text>
                <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center', marginTop: 12 }}>
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
