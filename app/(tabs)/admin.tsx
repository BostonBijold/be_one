import { useAuth } from '@/hooks/useAuth';
import dataService, { Challenge, Virtue } from '@/services/dataService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

export default function AdminScreen() {
  const { user } = useAuth();
  const [weeklyVirtue, setWeeklyVirtue] = useState<string>('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showVirtueModal, setShowVirtueModal] = useState(false);
  const [selectedVirtueForChallenge, setSelectedVirtueForChallenge] = useState<string>('');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderingVirtues, setReorderingVirtues] = useState<Virtue[]>([]);
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
      const [virtueObj, challengesData, virtuesData] = await Promise.all([
        dataService.getWeeklyVirtueObject(),
        dataService.getChallenges(),
        dataService.getVirtues(),
      ]);

      setWeeklyVirtue(virtueObj?.name || '');
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

  // Enter reorder mode
  const handleEnterReorderMode = () => {
    setReorderingVirtues([...virtues]);
    setIsReorderMode(true);
  };

  // Move virtue up in order
  const handleMoveVirtueUp = (index: number) => {
    if (index === 0) return;
    const newVirtues = [...reorderingVirtues];
    const temp = newVirtues[index];
    newVirtues[index] = newVirtues[index - 1];
    newVirtues[index - 1] = temp;

    // Update order numbers
    newVirtues.forEach((virtue, i) => {
      virtue.order = i;
    });
    setReorderingVirtues(newVirtues);
  };

  // Move virtue down in order
  const handleMoveVirtueDown = (index: number) => {
    if (index === reorderingVirtues.length - 1) return;
    const newVirtues = [...reorderingVirtues];
    const temp = newVirtues[index];
    newVirtues[index] = newVirtues[index + 1];
    newVirtues[index + 1] = temp;

    // Update order numbers
    newVirtues.forEach((virtue, i) => {
      virtue.order = i;
    });
    setReorderingVirtues(newVirtues);
  };

  // Save reorder
  const handleSaveReorder = async () => {
    try {
      await dataService.reorderVirtues(reorderingVirtues);
      setVirtues(reorderingVirtues);
      setIsReorderMode(false);
      setReorderingVirtues([]);
      Alert.alert('Success', 'Virtue order updated!');
    } catch (err: any) {
      console.error('Error reordering virtues:', err);
      Alert.alert('Error', 'Failed to reorder virtues');
    }
  };

  // Cancel reorder
  const handleCancelReorder = () => {
    setIsReorderMode(false);
    setReorderingVirtues([]);
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
            This Week's Virtue
          </Text>

          {/* Current Virtue */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: AGM_GREEN,
            }}
          >
            <Text style={{ fontSize: 12, color: '#666666', marginBottom: 8 }}>
              Current Focus Virtue (Auto-cycling)
            </Text>
            {weeklyVirtue ? (
              <>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: AGM_DARK, marginBottom: 12 }}>
                  {weeklyVirtue}
                </Text>
                <Text style={{ fontSize: 13, color: '#999999', fontStyle: 'italic' }}>
                  Changes automatically each week based on your virtue list.
                </Text>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <MaterialCommunityIcons name="lightbulb-outline" size={40} color="#d1d5db" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginTop: 12, textAlign: 'center' }}>
                  No Virtues Yet
                </Text>
                <Text style={{ fontSize: 13, color: '#666666', marginTop: 8, textAlign: 'center' }}>
                  Add virtues below to set up weekly rotation
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Manage Virtues Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: AGM_DARK }}>
              A Good Man is ({virtues.length})
            </Text>
            {!isReorderMode && virtues.length > 1 ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={handleEnterReorderMode}
                  style={{
                    backgroundColor: '#8b5cf6',
                    borderRadius: 8,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="arrow-all" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowVirtueModal(true);
                    setVirtueFormData({ name: '', shortDescription: '', fullDescription: '', order: virtues.length });
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
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setShowVirtueModal(true);
                  setVirtueFormData({ name: '', shortDescription: '', fullDescription: '', order: virtues.length });
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
            )}
          </View>

          {isReorderMode && (
            <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
              <TouchableOpacity
                onPress={handleSaveReorder}
                style={{
                  flex: 1,
                  backgroundColor: AGM_GREEN,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                  Save Order
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelReorder}
                style={{
                  flex: 1,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: AGM_DARK, fontWeight: '600', fontSize: 14 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {virtues.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <MaterialCommunityIcons name="lightbulb-outline" size={48} color="#d1d5db" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: AGM_DARK, marginTop: 16, textAlign: 'center' }}>
                No Virtues Yet
              </Text>
              <Text style={{ fontSize: 13, color: '#666666', marginTop: 8, textAlign: 'center' }}>
                Add virtues as you research Benjamin Franklin's principles
              </Text>
            </View>
          ) : (
            (isReorderMode ? reorderingVirtues : virtues).map((virtue, index) => (
              <View key={virtue.id} style={{ marginBottom: 12 }}>
                <View
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: AGM_GREEN,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 6 }}>
                        {virtue.order + 1}. {virtue.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#666666', marginBottom: 6, lineHeight: 18 }}>
                        {virtue.shortDescription}
                      </Text>
                      {virtue.fullDescription && (
                        <Text style={{ fontSize: 11, color: '#999999', fontStyle: 'italic', lineHeight: 16 }}>
                          {virtue.fullDescription.substring(0, 80)}...
                        </Text>
                      )}
                    </View>
                    {isReorderMode ? (
                      <View style={{ flexDirection: 'column', gap: 4 }}>
                        <TouchableOpacity
                          onPress={() => handleMoveVirtueUp(index)}
                          disabled={index === 0}
                          style={{ padding: 6, opacity: index === 0 ? 0.3 : 1 }}
                        >
                          <MaterialCommunityIcons name="chevron-up" size={24} color={index === 0 ? '#ccc' : AGM_GREEN} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleMoveVirtueDown(index)}
                          disabled={index === (isReorderMode ? reorderingVirtues.length - 1 : virtues.length - 1)}
                          style={{ padding: 6, opacity: index === (isReorderMode ? reorderingVirtues.length - 1 : virtues.length - 1) ? 0.3 : 1 }}
                        >
                          <MaterialCommunityIcons name="chevron-down" size={24} color={index === (isReorderMode ? reorderingVirtues.length - 1 : virtues.length - 1) ? '#ccc' : AGM_GREEN} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleDeleteVirtue(virtue.id)}
                        style={{ padding: 8 }}
                      >
                        <MaterialCommunityIcons name="trash-can" size={20} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
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

      {/* Create Virtue Modal */}
      <Modal
        visible={showVirtueModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVirtueModal(false)}
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
                  Add Virtue
                </Text>
                <TouchableOpacity onPress={() => setShowVirtueModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={AGM_DARK} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                {/* Virtue Name Input */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                  Virtue Name
                </Text>
                <TextInput
                  placeholder="E.g., Temperance, Silence, Order"
                  value={virtueFormData.name}
                  onChangeText={(text) =>
                    setVirtueFormData({ ...virtueFormData, name: text })
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

                {/* Short Description Input */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                  Short Description
                </Text>
                <TextInput
                  placeholder="Brief explanation (one sentence)"
                  value={virtueFormData.shortDescription}
                  onChangeText={(text) =>
                    setVirtueFormData({ ...virtueFormData, shortDescription: text })
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
                  multiline
                />

                {/* Full Description Input */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: AGM_DARK, marginBottom: 8 }}>
                  Full Description
                </Text>
                <TextInput
                  placeholder="Detailed explanation of this virtue and its principles"
                  value={virtueFormData.fullDescription}
                  onChangeText={(text) =>
                    setVirtueFormData({ ...virtueFormData, fullDescription: text })
                  }
                  style={{
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: AGM_DARK,
                    marginBottom: 24,
                    minHeight: 120,
                    textAlignVertical: 'top',
                  }}
                  placeholderTextColor="#999999"
                  multiline
                />

                {/* Create Button */}
                <TouchableOpacity
                  onPress={handleCreateVirtue}
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
                    Create Virtue
                  </Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={() => setShowVirtueModal(false)}
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
