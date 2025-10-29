import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dataService, { Challenge, Virtue } from '@/services/dataService';
import { useAuth } from '@/hooks/useAuth';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

export default function AdminScreen() {
  const { user } = useAuth();
  const [weeklyVirtue, setWeeklyVirtue] = useState<string>('');
  const [virtueInput, setVirtueInput] = useState<string>('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showVirtueModal, setShowVirtueModal] = useState(false);
  const [selectedVirtueForChallenge, setSelectedVirtueForChallenge] = useState<string>('');
  const [virtueFormData, setVirtueFormData] = useState({
    name: '',
    shortDescription: '',
    fullDescription: '',
    order: 0,
  });
  const [challengeFormData, setChallengeFormData] = useState({
    virtue: '',
    challenge: '',
    difficulty: 'Medium',
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [virtue, challengesData, virtuesData] = await Promise.all([
        dataService.getWeeklyVirtue(),
        dataService.getChallenges(),
        dataService.getVirtues(),
      ]);

      setWeeklyVirtue(virtue || '');
      setChallenges(challengesData);
      setVirtues(virtuesData);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a virtue
  const handleCreateVirtue = async () => {
    if (
      !virtueFormData.name.trim() ||
      !virtueFormData.shortDescription.trim() ||
      !virtueFormData.fullDescription.trim()
    ) {
      Alert.alert('Error', 'Please fill in all virtue fields');
      return;
    }

    try {
      const newVirtue = await dataService.addVirtue({
        name: virtueFormData.name.trim(),
        shortDescription: virtueFormData.shortDescription.trim(),
        fullDescription: virtueFormData.fullDescription.trim(),
        order: virtues.length,
      });

      setVirtues([...virtues, newVirtue]);
      setVirtueFormData({ name: '', shortDescription: '', fullDescription: '', order: 0 });
      setShowVirtueModal(false);
      Alert.alert('Success', 'Virtue created!');
    } catch (err: any) {
      console.error('Error creating virtue:', err);
      Alert.alert('Error', 'Failed to create virtue');
    }
  };

  // Handle deleting a virtue
  const handleDeleteVirtue = (virtueId: number) => {
    Alert.alert(
      'Delete Virtue',
      'Are you sure you want to delete this virtue?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await dataService.deleteVirtue(virtueId);
              setVirtues(virtues.filter((v) => v.id !== virtueId));
              Alert.alert('Success', 'Virtue deleted!');
            } catch (err: any) {
              console.error('Error deleting virtue:', err);
              Alert.alert('Error', 'Failed to delete virtue');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Handle setting weekly virtue
  const handleSetVirtue = async () => {
    if (!virtueInput.trim()) {
      Alert.alert('Error', 'Please enter a virtue name');
      return;
    }

    try {
      await dataService.setWeeklyVirtue(virtueInput.trim());
      setWeeklyVirtue(virtueInput.trim());
      setVirtueInput('');
      Alert.alert('Success', 'Weekly virtue updated!');
    } catch (err: any) {
      console.error('Error setting virtue:', err);
      Alert.alert('Error', 'Failed to set virtue');
    }
  };

  // Handle creating a challenge
  const handleCreateChallenge = async () => {
    if (
      !challengeFormData.virtue.trim() ||
      !challengeFormData.challenge.trim()
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const newChallenge = await dataService.addChallenge({
        virtue: challengeFormData.virtue.trim(),
        challenge: challengeFormData.challenge.trim(),
        difficulty: challengeFormData.difficulty,
      });

      setChallenges([...challenges, newChallenge]);
      setChallengeFormData({ virtue: '', challenge: '', difficulty: 'Medium' });
      setShowChallengeModal(false);
      Alert.alert('Success', 'Challenge created!');
    } catch (err: any) {
      console.error('Error creating challenge:', err);
      Alert.alert('Error', 'Failed to create challenge');
    }
  };

  // Handle deleting a challenge
  const handleDeleteChallenge = (challengeId: string) => {
    Alert.alert(
      'Delete Challenge',
      'Are you sure you want to delete this challenge?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await dataService.deleteChallenge(challengeId);
              setChallenges(challenges.filter((c) => c.id !== challengeId));
              Alert.alert('Success', 'Challenge deleted!');
            } catch (err: any) {
              console.error('Error deleting challenge:', err);
              Alert.alert('Error', 'Failed to delete challenge');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AGM_GREEN} />
          <Text style={{ marginTop: 16, color: AGM_DARK }}>Loading admin panel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Group challenges by virtue
  const virtuesWithChallenges = Array.from(new Set(challenges.map((c) => c.virtue)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ backgroundColor: AGM_DARK, paddingHorizontal: 24, paddingVertical: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialCommunityIcons name="shield-admin" size={32} color="white" style={{ marginRight: 12 }} />
            <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>
              Admin Panel
            </Text>
          </View>
          <Text style={{ color: '#ccc', fontSize: 14 }}>
            Manage weekly virtues and challenges
          </Text>
        </View>

        {/* Weekly Virtue Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK, marginBottom: 16 }}>
            Weekly Virtue
          </Text>

          {/* Current Virtue */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#8b5cf6',
            }}
          >
            <Text style={{ fontSize: 12, color: '#666666', marginBottom: 4 }}>
              Current Virtue
            </Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK }}>
              {weeklyVirtue || 'Not set'}
            </Text>
          </View>

          {/* Set New Virtue */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
              Set New Virtue
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput
                placeholder="Enter virtue name (e.g., Temperance)"
                value={virtueInput}
                onChangeText={setVirtueInput}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: AGM_DARK,
                }}
                placeholderTextColor="#999999"
              />
            </View>
            <TouchableOpacity
              onPress={handleSetVirtue}
              style={{
                backgroundColor: '#8b5cf6',
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                Set Virtue
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Challenges Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK }}>
              Challenges ({challenges.length})
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowChallengeModal(true);
                setChallengeFormData({ virtue: '', challenge: '', difficulty: 'Medium' });
              }}
              style={{
                backgroundColor: AGM_GREEN,
                borderRadius: 8,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {challenges.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <MaterialCommunityIcons name="lightbulb-outline" size={48} color="#d1d5db" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginTop: 16, textAlign: 'center' }}>
                No Challenges Yet
              </Text>
              <Text style={{ fontSize: 13, color: '#666666', marginTop: 8, textAlign: 'center' }}>
                Create challenges to display them as daily challenges
              </Text>
            </View>
          ) : (
            virtuesWithChallenges.map((virtue) => (
              <View key={virtue} style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginBottom: 12 }}>
                  {virtue}
                </Text>
                {challenges
                  .filter((c) => c.virtue === virtue)
                  .map((challenge) => (
                    <View
                      key={challenge.id}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        borderLeftWidth: 4,
                        borderLeftColor: '#f59e0b',
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 6 }}>
                            {challenge.challenge}
                          </Text>
                          <View
                            style={{
                              backgroundColor:
                                challenge.difficulty === 'Easy'
                                  ? '#d1fae5'
                                  : challenge.difficulty === 'Medium'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 4,
                              alignSelf: 'flex-start',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color:
                                  challenge.difficulty === 'Easy'
                                    ? '#059669'
                                    : challenge.difficulty === 'Medium'
                                    ? '#d97706'
                                    : '#dc2626',
                              }}
                            >
                              {challenge.difficulty}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteChallenge(challenge.id)}
                          style={{ padding: 8 }}
                        >
                          <MaterialCommunityIcons name="trash-can" size={20} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Challenge Modal */}
      <Modal
        visible={showChallengeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChallengeModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'transparent',
            }}
          >
            <View
              style={{
                backgroundColor: AGM_STONE,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 24,
                paddingTop: 24,
                paddingBottom: 32,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK }}>
                  Create Challenge
                </Text>
                <TouchableOpacity onPress={() => setShowChallengeModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={AGM_DARK} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                {/* Virtue Input */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                  Virtue
                </Text>
                <TextInput
                  placeholder="E.g., Temperance, Presence, Courage"
                  value={challengeFormData.virtue}
                  onChangeText={(text) =>
                    setChallengeFormData({ ...challengeFormData, virtue: text })
                  }
                  style={{
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: AGM_DARK,
                    marginBottom: 16,
                  }}
                  placeholderTextColor="#999999"
                />

                {/* Challenge Input */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                  Challenge Description
                </Text>
                <TextInput
                  placeholder="E.g., Leave your phone in another room during all meals today"
                  value={challengeFormData.challenge}
                  onChangeText={(text) =>
                    setChallengeFormData({ ...challengeFormData, challenge: text })
                  }
                  style={{
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: AGM_DARK,
                    marginBottom: 16,
                    minHeight: 100,
                    textAlignVertical: 'top',
                  }}
                  placeholderTextColor="#999999"
                  multiline
                />

                {/* Difficulty Selection */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                  Difficulty
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                  {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty}
                      onPress={() =>
                        setChallengeFormData({ ...challengeFormData, difficulty })
                      }
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor:
                          challengeFormData.difficulty === difficulty
                            ? difficulty === 'Easy'
                              ? '#d1fae5'
                              : difficulty === 'Medium'
                              ? '#fef3c7'
                              : '#fee2e2'
                            : '#f3f4f6',
                        borderWidth: 2,
                        borderColor:
                          challengeFormData.difficulty === difficulty
                            ? difficulty === 'Easy'
                              ? '#059669'
                              : difficulty === 'Medium'
                              ? '#d97706'
                              : '#dc2626'
                            : '#e5e7eb',
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'center',
                          fontWeight: '600',
                          color:
                            challengeFormData.difficulty === difficulty
                              ? difficulty === 'Easy'
                                ? '#059669'
                                : difficulty === 'Medium'
                                ? '#d97706'
                                : '#dc2626'
                              : '#666666',
                        }}
                      >
                        {difficulty}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Buttons */}
                <TouchableOpacity
                  onPress={handleCreateChallenge}
                  style={{
                    backgroundColor: AGM_GREEN,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                    Create Challenge
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowChallengeModal(false)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: AGM_DARK, fontWeight: '600', fontSize: 14 }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
