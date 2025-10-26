// Firestore Data Service for Habit Tracker - React Native TypeScript Version
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  DocumentReference,
  DocumentData,
  FieldValue,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import authService from './authService';
import NetInfo from '@react-native-community/netinfo';

// Type Definitions
export interface UserInfo {
  name: string;
  email: string;
  photoURL?: string;
  isAdmin: boolean;
  createdAt: Timestamp | Date;
  lastActive: Timestamp | Date;
}

export interface Routine {
  id: number;
  name: string;
  timeOfDay: string | null;
  days: string[];
  habits: number[];
  order: number;
}

export interface Habit {
  id: number;
  name: string;
  description: string;
  routineId: number | null;
  trackingType: 'simple' | 'timer' | 'duration';
  duration: number | null;
  expectedCompletionTime: number | null;
  createdAt: string;
}

export interface Goal {
  id: number;
  name: string;
  description: string;
  targetDate: string | null;
  completed: boolean;
  createdAt: string;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface HabitCompletion {
  completed: boolean;
  completedAt: string | null;
  duration: number | null;
  startTime: string | null;
  endTime: string | null;
  notes: string;
}

export interface RoutineCompletion {
  completed: boolean;
  completedAt: string | null;
  totalDuration: number | null;
  startTime: string | null;
  endTime: string | null;
  habitTimes: { [habitId: number]: { startTime: string; endTime: string; duration: number } };
}

export interface VirtueCheckIns {
  [virtue: string]: boolean;
}

export interface DailyChallenge {
  challengeId: string | null;
  virtue: string | null;
  challenge: string | null;
  difficulty: string | null;
  accepted: boolean;
  completed: boolean;
  acceptedAt: string | null;
  completedAt: string | null;
}

export interface DailyData {
  habitCompletions: { [habitId: number]: HabitCompletion };
  routineCompletions: { [routineId: number]: RoutineCompletion };
  todos: Todo[];
  virtueCheckIns: VirtueCheckIns;
  dailyChallenge?: DailyChallenge;
  activeHabitTimers?: any;
  activeRoutine?: any;
}

export interface UserSettings {
  [key: string]: any;
}

export interface DashboardOrderItem {
  type: 'routine' | 'habit';
  id: number;
  order: number;
}

export interface UserData {
  settings: UserSettings;
  routines: Routine[];
  habits: Habit[];
  goals: Goal[];
  todos: Todo[];
  dailyData: { [date: string]: DailyData };
  dashboardOrder: DashboardOrderItem[];
}

export interface CompleteUserData {
  userInfo: UserInfo;
  data: UserData;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  virtue: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Challenge {
  id: string;
  virtue: string;
  challenge: string;
  difficulty: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface ExportData {
  version: string;
  exportDate: string;
  userData: UserData;
  userInfo: UserInfo;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}

// Check if Firebase is available
const isFirebaseAvailable = (): boolean => {
  return db !== undefined;
};

class DataService {
  private currentUser: User | null = null;
  private listeners: any[] = [];

  constructor() {
    // Listen to auth state changes
    authService.onAuthStateChanged((user: User | null) => {
      this.currentUser = user;
    });
  }

  // Get current user ID
  getCurrentUserId(): string | undefined {
    if (!isFirebaseAvailable()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }
    return this.currentUser?.uid;
  }

  // Get user document reference
  getUserDocRef(): DocumentReference {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('No authenticated user');
    return doc(db, 'users', userId);
  }

  // Initialize user data with default structure
  async initializeUserData(): Promise<CompleteUserData> {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('No authenticated user');

    const userDocRef = this.getUserDocRef();
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create new user document with default data
      const defaultData: CompleteUserData = {
        userInfo: {
          name: this.currentUser!.name,
          email: this.currentUser!.email,
          photoURL: this.currentUser?.photoURL,
          isAdmin: false,
          createdAt: serverTimestamp() as Timestamp,
          lastActive: serverTimestamp() as Timestamp
        },
        data: {
          settings: {},
          routines: [
            {
              id: 1,
              name: "Morning Routine",
              timeOfDay: "morning",
              days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
              habits: [],
              order: 0
            },
            {
              id: 2,
              name: "Afternoon Routine",
              timeOfDay: "afternoon",
              days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
              habits: [],
              order: 1
            },
            {
              id: 3,
              name: "Evening Routine",
              timeOfDay: "evening",
              days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
              habits: [],
              order: 2
            }
          ],
          habits: [],
          goals: [],
          todos: [],
          dailyData: {},
          dashboardOrder: []
        }
      };

      await setDoc(userDocRef, defaultData);
      return defaultData;
    }

    return userDoc.data() as CompleteUserData;
  }

  // Check if online - React Native version
  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }

  // Get current user data
  async getCurrentUserData(): Promise<CompleteUserData> {
    try {
      const online = await this.isOnline();
      if (!online) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      const userDocRef = this.getUserDocRef();
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return await this.initializeUserData();
      }

      return userDoc.data() as CompleteUserData;
    } catch (error: any) {
      console.error('Error getting user data:', error);

      // Handle specific Firebase errors
      if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Please try again in a moment.');
      } else if (error.code === 'permission-denied') {
        throw new Error('Access denied. Please sign in again.');
      } else if (error.message?.includes('No internet connection')) {
        throw error; // Re-throw network errors as-is
      } else {
        throw new Error('Failed to load data. Please try again.');
      }
    }
  }

  // Update user data
  async updateUserData(data: UserData): Promise<void> {
    try {
      const online = await this.isOnline();
      if (!online) {
        throw new Error('No internet connection. Changes will be saved when you reconnect.');
      }

      const userDocRef = this.getUserDocRef();
      await updateDoc(userDocRef, {
        'data': data,
        'userInfo.lastActive': serverTimestamp()
      });
    } catch (error: any) {
      console.error('Error updating user data:', error);

      // Handle specific Firebase errors
      if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Your changes will be saved when the service is back online.');
      } else if (error.code === 'permission-denied') {
        throw new Error('Access denied. Please sign in again.');
      } else if (error.message?.includes('No internet connection')) {
        throw error; // Re-throw network errors as-is
      } else {
        throw new Error('Failed to save changes. Please try again.');
      }
    }
  }

  // Specific Data Getters
  async getRoutines(): Promise<Routine[]> {
    const userData = await this.getCurrentUserData();
    return userData?.data?.routines || [];
  }

  async getHabits(): Promise<Habit[]> {
    const userData = await this.getCurrentUserData();
    return userData?.data?.habits || [];
  }

  async getGoals(): Promise<Goal[]> {
    const userData = await this.getCurrentUserData();
    return userData?.data?.goals || [];
  }

  async getTodos(): Promise<Todo[]> {
    const userData = await this.getCurrentUserData();
    return userData?.data?.todos || [];
  }

  // Get today's daily data (habits, routines, todos)
  async getTodayData(todayString: string): Promise<DailyData | null> {
    const userData = await this.getCurrentUserData();
    return userData?.data?.dailyData?.[todayString] || null;
  }

  // Get daily data for a specific date
  async getDailyData(dateString: string): Promise<DailyData | null> {
    const userData = await this.getCurrentUserData();
    return userData?.data?.dailyData?.[dateString] || null;
  }

  // Create or update daily data
  async updateDailyData(dateString: string, dailyData: DailyData): Promise<void> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    if (!userData.data.dailyData) {
      userData.data.dailyData = {};
    }

    userData.data.dailyData[dateString] = dailyData;
    await this.updateUserData(userData.data);
  }

  // Get today's date string in device timezone
  getTodayString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get all habit completions across all dates
  async getAllHabitCompletions(): Promise<{ [date: string]: DailyData }> {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return {};

      // Return the dailyData structure which contains habitCompletions for each date
      return userData.data.dailyData || {};
    } catch (error) {
      console.error('Error getting all habit completions:', error);
      return {};
    }
  }

  // Get all habit completion times across all dates
  async getAllHabitCompletionTimes(): Promise<{}> {
    // Habit completion tracking removed - return empty data
    return {};
  }

  // Get all routine completions across all dates
  async getAllRoutineCompletions(): Promise<{ [date: string]: DailyData }> {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return {};

      // Return the dailyData structure which contains routineCompletions for each date
      return userData.data.dailyData || {};
    } catch (error) {
      console.error('Error getting all routine completions:', error);
      return {};
    }
  }

  // Get habit completions for today
  async getHabitCompletions(): Promise<{ [habitId: number]: HabitCompletion }> {
    const today = this.getTodayString();
    const todayData = await this.getTodayData(today);
    return todayData?.habitCompletions || {};
  }

  async getHabitCompletionTimes(): Promise<{}> {
    // DEPRECATED - use getHabitCompletions() instead
    console.warn('getHabitCompletionTimes is deprecated. Use getHabitCompletions() for unified completion data.');
    return {};
  }

  async getRoutineCompletions(): Promise<{ [routineId: number]: RoutineCompletion }> {
    const today = this.getTodayString();
    const todayData = await this.getTodayData(today);
    return todayData?.routineCompletions || {};
  }

  // Helper methods for unified completion data
  async getHabitCompletion(habitId: number, dateString?: string): Promise<HabitCompletion | null> {
    const today = dateString || this.getTodayString();
    const todayData = await this.getTodayData(today);
    return todayData?.habitCompletions?.[habitId] || null;
  }

  async isHabitComplete(habitId: number, dateString?: string): Promise<boolean> {
    const completion = await this.getHabitCompletion(habitId, dateString);
    return completion?.completed || false;
  }

  async getRoutineCompletion(routineId: number, dateString?: string): Promise<RoutineCompletion | null> {
    const today = dateString || this.getTodayString();
    const todayData = await this.getTodayData(today);
    return todayData?.routineCompletions?.[routineId] || null;
  }

  async isRoutineComplete(routineId: number, dateString?: string): Promise<boolean> {
    const completion = await this.getRoutineCompletion(routineId, dateString);
    return completion?.completed || false;
  }

  async getUserSettings(): Promise<UserSettings> {
    const userData = await this.getCurrentUserData();
    return userData?.data?.settings || {};
  }

  async getDashboardOrder(): Promise<DashboardOrderItem[]> {
    const userData = await this.getCurrentUserData();
    return userData?.data?.dashboardOrder || [];
  }

  // Get today's virtue check-ins
  async getTodayVirtues(todayString: string): Promise<VirtueCheckIns> {
    const todayData = await this.getTodayData(todayString);
    return todayData?.virtueCheckIns || {};
  }

  // Get today's daily challenge
  async getTodayDailyChallenge(todayString: string): Promise<DailyChallenge | null> {
    const todayData = await this.getTodayData(todayString);
    return todayData?.dailyChallenge || null;
  }

  // Get daily challenge for a specific date
  async getDailyChallenge(dateString: string): Promise<DailyChallenge | null> {
    const dailyData = await this.getDailyData(dateString);
    return dailyData?.dailyChallenge || null;
  }

  // Update today's daily challenge
  async updateTodayDailyChallenge(challengeData: DailyChallenge, todayString: string): Promise<void> {
    const todayData = await this.getTodayData(todayString) || {
      habitCompletions: {},
      routineCompletions: {},
      todos: [],
      virtueCheckIns: {}
    };
    todayData.dailyChallenge = challengeData;
    await this.updateDailyData(todayString, todayData);
  }

  // Update daily challenge for a specific date
  async updateDailyChallenge(dateString: string, challengeData: DailyChallenge): Promise<void> {
    const dailyData = await this.getDailyData(dateString) || {
      habitCompletions: {},
      routineCompletions: {},
      todos: [],
      virtueCheckIns: {}
    };
    dailyData.dailyChallenge = challengeData;
    await this.updateDailyData(dateString, dailyData);
  }

  // Get all challenges from Firestore
  async getChallenges(): Promise<Challenge[]> {
    try {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase is not configured. Please set up your Firebase project.');
      }

      const challengesRef = collection(db, 'dailyChallenges');
      const challengesSnapshot = await getDocs(challengesRef);

      const challenges: Challenge[] = [];
      challengesSnapshot.forEach((doc) => {
        challenges.push({ id: doc.id, ...doc.data() } as Challenge);
      });

      return challenges;
    } catch (error) {
      console.error('Error getting challenges:', error);
      throw new Error('Failed to load challenges. Please try again.');
    }
  }

  // Get daily challenge for a specific virtue and day of week
  async getDailyChallengeForVirtue(virtue: string, dayOfWeek: number): Promise<Challenge | null> {
    try {
      const challenges = await this.getChallenges();
      const virtueChallenges = challenges.filter(c => c.virtue === virtue);

      if (virtueChallenges.length === 0) {
        return null;
      }

      // Use day of week (0-6) to select challenge (0-6)
      const challengeIndex = dayOfWeek % virtueChallenges.length;
      return virtueChallenges[challengeIndex];
    } catch (error) {
      console.error('Error getting daily challenge for virtue:', error);
      return null;
    }
  }

  // Specific Data Setters
  async updateRoutines(routines: Routine[]): Promise<void> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    userData.data.routines = routines;
    await this.updateUserData(userData.data);
  }

  async updateHabits(habits: Habit[]): Promise<void> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    userData.data.habits = habits;
    await this.updateUserData(userData.data);
  }

  async updateGoals(goals: Goal[]): Promise<void> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    userData.data.goals = goals;
    await this.updateUserData(userData.data);
  }

  async updateTodos(todos: Todo[]): Promise<void> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    userData.data.todos = todos;
    await this.updateUserData(userData.data);
  }

  // Update today's habit completions
  async updateTodayHabits(habitCompletions: { [habitId: number]: HabitCompletion }, todayString: string): Promise<void> {
    try {
      const online = await this.isOnline();
      if (!online) {
        throw new Error('No internet connection. Changes will be saved when you reconnect.');
      }

      const todayData = await this.getTodayData(todayString) || {
        habitCompletions: {},
        routineCompletions: {},
        todos: [],
        virtueCheckIns: {}
      };

      // Merge new habit completion data with existing data
      todayData.habitCompletions = { ...todayData.habitCompletions, ...habitCompletions };
      await this.updateDailyData(todayString, todayData);
    } catch (error) {
      console.error('Error updating habit completions:', error);
      throw error;
    }
  }

  // Update today's habit completion times (DEPRECATED - use updateTodayHabits instead)
  async updateTodayHabitTimes(habitTimes: any, todayString: string): Promise<void> {
    console.warn('updateTodayHabitTimes is deprecated. Use updateTodayHabits with unified completion objects.');
    return;
  }

  // Update today's routine completions
  async updateTodayRoutines(routineCompletions: { [routineId: number]: RoutineCompletion }, todayString: string): Promise<void> {
    try {
      const online = await this.isOnline();
      if (!online) {
        throw new Error('No internet connection. Changes will be saved when you reconnect.');
      }

      const todayData = await this.getTodayData(todayString) || {
        habitCompletions: {},
        routineCompletions: {},
        todos: [],
        virtueCheckIns: {}
      };

      // Merge new routine completion data with existing data
      todayData.routineCompletions = { ...todayData.routineCompletions, ...routineCompletions };
      await this.updateDailyData(todayString, todayData);
    } catch (error) {
      console.error('Error updating routine completions:', error);
      throw error;
    }
  }

  // Update today's todos
  async updateTodayTodos(todos: Todo[], todayString: string): Promise<void> {
    const todayData = await this.getTodayData(todayString) || {
      habitCompletions: {},
      routineCompletions: {},
      todos: []
    };
    todayData.todos = todos;
    await this.updateDailyData(todayString, todayData);
  }

  // Update today's virtue check-ins
  async updateTodayVirtues(virtues: VirtueCheckIns, todayString: string): Promise<void> {
    const todayData = await this.getTodayData(todayString) || {
      habitCompletions: {},
      routineCompletions: {},
      todos: [],
      virtueCheckIns: {}
    };
    todayData.virtueCheckIns = virtues;
    await this.updateDailyData(todayString, todayData);
  }

  // Update today's active habit timers
  async updateActiveHabitTimers(timers: any, todayString: string): Promise<void> {
    const todayData = await this.getTodayData(todayString) || {
      habitCompletions: {},
      routineCompletions: {},
      todos: []
    };
    todayData.activeHabitTimers = timers;
    await this.updateDailyData(todayString, todayData);
  }

  // Update today's active routine state
  async updateActiveRoutine(routineState: any, todayString: string): Promise<void> {
    const todayData = await this.getTodayData(todayString) || {
      habitCompletions: {},
      routineCompletions: {},
      todos: []
    };
    todayData.activeRoutine = routineState;
    await this.updateDailyData(todayString, todayData);
  }

  // Get today's active habit timers
  async getActiveHabitTimers(todayString: string): Promise<any> {
    const todayData = await this.getTodayData(todayString);
    return todayData?.activeHabitTimers || null;
  }

  // Get today's active routine state
  async getActiveRoutine(todayString: string): Promise<any> {
    const todayData = await this.getTodayData(todayString);
    return todayData?.activeRoutine || null;
  }

  // Clear all active timers (for cleanup)
  async clearActiveTimers(todayString: string): Promise<void> {
    const todayData = await this.getTodayData(todayString) || {
      habitCompletions: {},
      routineCompletions: {},
      todos: []
    };
    delete todayData.activeHabitTimers;
    delete todayData.activeRoutine;
    await this.updateDailyData(todayString, todayData);
  }

  // Initialize today's data if it doesn't exist
  async initializeTodayData(habits: Habit[], routines: Routine[], todayString: string): Promise<DailyData> {
    const todayData = await this.getTodayData(todayString);

    if (!todayData) {
      // Create fresh daily data with empty habit/routine completions - they will be added as needed
      const newDailyData: DailyData = {
        habitCompletions: {},
        routineCompletions: {},
        todos: [],
        virtueCheckIns: {},
        dailyChallenge: {
          challengeId: null,
          virtue: null,
          challenge: null,
          difficulty: null,
          accepted: false,
          completed: false,
          acceptedAt: null,
          completedAt: null
        }
      };

      // Only initialize routines as incomplete (habits will be added when first interacted with)
      routines.forEach(routine => {
        newDailyData.routineCompletions[routine.id] = {
          completed: false,
          completedAt: null,
          totalDuration: null,
          startTime: null,
          endTime: null,
          habitTimes: {}
        };
      });

      await this.updateDailyData(todayString, newDailyData);
      return newDailyData;
    }

    return todayData;
  }

  async updateUserSettings(settings: UserSettings): Promise<void> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    userData.data.settings = settings;
    await this.updateUserData(userData.data);
  }

  async updateDashboardOrder(dashboardOrder: DashboardOrderItem[]): Promise<void> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    userData.data.dashboardOrder = dashboardOrder;
    await this.updateUserData(userData.data);
  }

  // Data Export/Import
  async exportUserData(): Promise<ExportData | null> {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return null;

      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        userData: userData.data,
        userInfo: userData.userInfo
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  async importUserData(importData: ExportData): Promise<boolean> {
    try {
      if (!importData.userData) throw new Error('Invalid import data');

      const userData = await this.getCurrentUserData();
      if (!userData) throw new Error('No user data found');

      userData.data = importData.userData;
      await this.updateUserData(userData.data);
      return true;
    } catch (error) {
      console.error('Error importing user data:', error);
      throw error;
    }
  }

  // Ensure default routines exist for current user
  async ensureDefaultRoutines(): Promise<boolean> {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return false;

      const defaultRoutines: Routine[] = [
        {
          id: 1,
          name: "Morning Routine",
          timeOfDay: "morning",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          habits: [],
          order: 0
        },
        {
          id: 2,
          name: "Afternoon Routine",
          timeOfDay: "afternoon",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          habits: [],
          order: 1
        },
        {
          id: 3,
          name: "Evening Routine",
          timeOfDay: "evening",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          habits: [],
          order: 2
        }
      ];

      let needsUpdate = false;

      // Check if we need to add any missing default routines
      const existingRoutineIds = userData.data.routines.map(r => r.id);
      const missingRoutines = defaultRoutines.filter(r => !existingRoutineIds.includes(r.id));

      if (missingRoutines.length > 0) {
        userData.data.routines = [...userData.data.routines, ...missingRoutines];
        needsUpdate = true;
      }

      // Virtue check-in is now standalone - no longer auto-added to routines

      // Ensure settings exist
      if (!userData.data.settings) {
        userData.data.settings = {};
        needsUpdate = true;
      }

      // Ensure dashboardOrder exists
      if (!userData.data.dashboardOrder) {
        userData.data.dashboardOrder = [];
        needsUpdate = true;
      }

      if (needsUpdate) {
        await this.updateUserData(userData.data);
      }

      return true;
    } catch (error) {
      console.error('Error ensuring default routines:', error);
      return false;
    }
  }

  // Utility Functions
  generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Routine CRUD Operations
  async addRoutine(routineData: Partial<Routine>): Promise<Routine> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    // Check routine limit (max 5)
    if (userData.data.routines.length >= 5) {
      throw new Error('Maximum of 5 routines allowed');
    }

    // Generate new ID
    const newId = Math.max(...userData.data.routines.map(r => r.id), 0) + 1;

    const newRoutine: Routine = {
      id: newId,
      name: routineData.name || '',
      timeOfDay: routineData.timeOfDay || null,
      days: routineData.days || [],
      habits: [],
      order: userData.data.routines.length
    };

    userData.data.routines.push(newRoutine);
    await this.updateUserData(userData.data);
    return newRoutine;
  }

  async updateRoutine(routineId: number, routineData: Partial<Routine>): Promise<Routine> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    const routineIndex = userData.data.routines.findIndex(r => r.id === routineId);
    if (routineIndex === -1) throw new Error('Routine not found');

    userData.data.routines[routineIndex] = {
      ...userData.data.routines[routineIndex],
      ...routineData
    };

    await this.updateUserData(userData.data);
    return userData.data.routines[routineIndex];
  }

  async deleteRoutine(routineId: number, keepHabitsAsSingles: boolean = false): Promise<boolean> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    const routineIndex = userData.data.routines.findIndex(r => r.id === routineId);
    if (routineIndex === -1) throw new Error('Routine not found');

    const routine = userData.data.routines[routineIndex];

    // Handle habits in the routine
    if (keepHabitsAsSingles) {
      // Convert routine habits to single habits
      const routineHabits = userData.data.habits.filter(h => h.routineId === routineId);
      routineHabits.forEach(habit => {
        habit.routineId = null;
        habit.trackingType = habit.trackingType || 'simple'; // Default to simple if not set
      });
    } else {
      // Delete habits that belong to this routine
      userData.data.habits = userData.data.habits.filter(h => h.routineId !== routineId);
    }

    // Remove routine
    userData.data.routines.splice(routineIndex, 1);

    // Reorder remaining routines
    userData.data.routines.forEach((r, index) => {
      r.order = index;
    });

    await this.updateUserData(userData.data);
    return true;
  }

  async addSingleHabit(habitData: Partial<Habit>): Promise<Habit> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    const newId = Math.max(...userData.data.habits.map(h => h.id), 0) + 1;

    const newHabit: Habit = {
      id: newId,
      name: habitData.name || '',
      description: habitData.description || '',
      routineId: null, // Single habit
      trackingType: habitData.trackingType || 'simple',
      duration: habitData.duration || null,
      expectedCompletionTime: habitData.expectedCompletionTime || null,
      createdAt: new Date().toISOString()
    };

    userData.data.habits.push(newHabit);
    await this.updateUserData(userData.data);
    return newHabit;
  }

  async updateHabit(habitId: number, habitData: Partial<Habit>): Promise<Habit> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    const habitIndex = userData.data.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) throw new Error('Habit not found');

    userData.data.habits[habitIndex] = {
      ...userData.data.habits[habitIndex],
      ...habitData
    };

    await this.updateUserData(userData.data);
    return userData.data.habits[habitIndex];
  }

  async deleteHabit(habitId: number): Promise<boolean> {
    const userData = await this.getCurrentUserData();
    if (!userData) throw new Error('No user data found');

    const habitIndex = userData.data.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) throw new Error('Habit not found');

    const habit = userData.data.habits[habitIndex];

    // If it's a routine habit, remove it from the routine
    if (habit.routineId) {
      const routine = userData.data.routines.find(r => r.id === habit.routineId);
      if (routine) {
        routine.habits = routine.habits.filter(hId => hId !== habitId);
      }
    }

    // Remove habit
    userData.data.habits.splice(habitIndex, 1);

    await this.updateUserData(userData.data);
    return true;
  }

  // Clear all data (for testing/reset) - Note: This only clears local state, not Firestore
  clearAllData(): void {
    console.warn('clearAllData() is not supported in Firestore mode. Data is stored in the cloud.');
  }

  // Admin check
  async checkIsAdmin(): Promise<boolean> {
    try {
      const userData = await this.getCurrentUserData();
      console.log('Checking admin status for user:', userData?.userInfo);
      return userData?.userInfo?.isAdmin || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Quote CRUD Operations
  async getQuotes(): Promise<Quote[]> {
    try {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase is not configured. Please set up your Firebase project.');
      }

      const quotesRef = collection(db, 'quotes');
      const quotesSnapshot = await getDocs(quotesRef);

      const quotes: Quote[] = [];
      quotesSnapshot.forEach((doc) => {
        quotes.push({ id: doc.id, ...doc.data() } as Quote);
      });

      return quotes;
    } catch (error: any) {
      console.error('Error getting quotes:', error);

      // If it's a permissions error and the collection doesn't exist, return empty array
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        console.warn('Quotes collection may not exist yet, returning empty array');
        return [];
      }

      throw new Error('Failed to load quotes. Please try again.');
    }
  }

  async getQuotesByVirtue(virtue: string): Promise<Quote[]> {
    try {
      const allQuotes = await this.getQuotes();
      return allQuotes.filter(quote => quote.virtue === virtue);
    } catch (error) {
      console.error('Error getting quotes by virtue:', error);
      return [];
    }
  }

  async addQuote(quoteData: Omit<Quote, 'id'>): Promise<Quote> {
    try {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase is not configured. Please set up your Firebase project.');
      }

      const isAdmin = await this.checkIsAdmin();
      if (!isAdmin) {
        throw new Error('Only admins can add quotes.');
      }

      const quotesRef = collection(db, 'quotes');
      const docRef = await addDoc(quotesRef, {
        ...quoteData,
        createdAt: serverTimestamp()
      });

      return { id: docRef.id, ...quoteData };
    } catch (error) {
      console.error('Error adding quote:', error);
      throw new Error('Failed to add quote. Please try again.');
    }
  }

  async updateQuote(quoteId: string, quoteData: Partial<Quote>): Promise<Quote> {
    try {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase is not configured. Please set up your Firebase project.');
      }

      const isAdmin = await this.checkIsAdmin();
      if (!isAdmin) {
        throw new Error('Only admins can update quotes.');
      }

      const quoteRef = doc(db, 'quotes', quoteId);
      await updateDoc(quoteRef, {
        ...quoteData,
        updatedAt: serverTimestamp()
      });

      return { id: quoteId, ...quoteData } as Quote;
    } catch (error) {
      console.error('Error updating quote:', error);
      throw new Error('Failed to update quote. Please try again.');
    }
  }

  async deleteQuote(quoteId: string): Promise<boolean> {
    try {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase is not configured. Please set up your Firebase project.');
      }

      const isAdmin = await this.checkIsAdmin();
      if (!isAdmin) {
        throw new Error('Only admins can delete quotes.');
      }

      const quoteRef = doc(db, 'quotes', quoteId);
      await deleteDoc(quoteRef);

      return true;
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw new Error('Failed to delete quote. Please try again.');
    }
  }

  // Challenge CRUD Operations
  async addChallenge(challengeData: Omit<Challenge, 'id'>): Promise<Challenge> {
    try {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase is not configured. Please set up your Firebase project.');
      }

      console.log('Attempting to add challenge:', challengeData);
      const isAdmin = await this.checkIsAdmin();
      console.log('Admin check result:', isAdmin);

      if (!isAdmin) {
        throw new Error('Only admins can add challenges.');
      }

      const challengesRef = collection(db, 'dailyChallenges');
      console.log('Adding challenge to collection:', challengesRef);

      const docRef = await addDoc(challengesRef, {
        ...challengeData,
        createdAt: serverTimestamp()
      });

      console.log('Challenge added successfully with ID:', docRef.id);
      return { id: docRef.id, ...challengeData };
    } catch (error: any) {
      console.error('Error adding challenge:', error);
      throw new Error(`Failed to add challenge: ${error.message}`);
    }
  }

  async updateChallenge(challengeId: string, challengeData: Partial<Challenge>): Promise<Challenge> {
    try {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase is not configured. Please set up your Firebase project.');
      }

      const isAdmin = await this.checkIsAdmin();
      if (!isAdmin) {
        throw new Error('Only admins can update challenges.');
      }

      const challengeRef = doc(db, 'dailyChallenges', challengeId);
      await updateDoc(challengeRef, {
        ...challengeData,
        updatedAt: serverTimestamp()
      });

      return { id: challengeId, ...challengeData } as Challenge;
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw new Error('Failed to update challenge. Please try again.');
    }
  }

  async deleteChallenge(challengeId: string): Promise<boolean> {
    try {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase is not configured. Please set up your Firebase project.');
      }

      const isAdmin = await this.checkIsAdmin();
      if (!isAdmin) {
        throw new Error('Only admins can delete challenges.');
      }

      const challengeRef = doc(db, 'dailyChallenges', challengeId);
      await deleteDoc(challengeRef);

      return true;
    } catch (error) {
      console.error('Error deleting challenge:', error);
      throw new Error('Failed to delete challenge. Please try again.');
    }
  }

  // Migrate data to new unified completion structure
  async migrateToNewStructure(): Promise<boolean> {
    try {
      const userData = await this.getCurrentUserData();
      if (!userData) return false;

      console.log('Starting data migration to unified completion structure...');

      // Migrate dailyData
      const migratedDailyData: { [date: string]: DailyData } = {};
      Object.keys(userData.data.dailyData || {}).forEach(date => {
        const dayData = userData.data.dailyData[date] as any;

        migratedDailyData[date] = {
          habitCompletions: {},
          routineCompletions: {},
          todos: dayData.todos || [],
          virtueCheckIns: dayData.virtueCheckIns || {},
          dailyChallenge: dayData.dailyChallenge || {}
        };

        // Merge habits and habitCompletionTimes into habitCompletions
        Object.keys(dayData.habits || {}).forEach(habitIdStr => {
          const habitId = parseInt(habitIdStr);
          const timeData = dayData.habitCompletionTimes?.[habitId];
          migratedDailyData[date].habitCompletions[habitId] = {
            completed: dayData.habits[habitId],
            completedAt: timeData?.endTime || null,
            duration: timeData?.duration || null,
            startTime: timeData?.startTime || null,
            endTime: timeData?.endTime || null,
            notes: ""
          };
        });

        // Copy routines as-is (already structured)
        migratedDailyData[date].routineCompletions = dayData.routines || {};
      });

      userData.data.dailyData = migratedDailyData;
      await this.updateUserData(userData.data);

      console.log('Data migration completed successfully!');
      return true;
    } catch (error) {
      console.error('Error during data migration:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const dataService = new DataService();
export default dataService;
