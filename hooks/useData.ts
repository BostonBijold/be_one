import dataService, {
  DailyData,
  Goal,
  Habit,
  Routine,
  Todo,
} from '@/services/dataService';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

interface UseDataResult {
  routines: Routine[];
  habits: Habit[];
  goals: Goal[];
  todos: Todo[];
  dailyData: DailyData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for data management
 * Provides access to user's routines, habits, goals, todos
 * Only loads data when user is authenticated
 */
export function useData(): UseDataResult {
  const { user, loading: authLoading } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    console.log('useData - loadData called', { user, authLoading });
    
    // Don't load if still authenticating
    if (authLoading) {
      console.log('useData - Waiting for auth to complete...');
      return;
    }

    // Don't load if no user after auth is complete
    if (!user) {
      console.log('useData - No user, clearing data');
      setRoutines([]);
      setHabits([]);
      setGoals([]);
      setTodos([]);
      setDailyData(null);
      setLoading(false);
      return;
    }

    try {
      console.log('useData - Starting data load for user:', user.uid);
      setLoading(true);
      setError(null);

      // Ensure default routines and habits exist
      console.log('useData - Ensuring default routines exist...');
      await dataService.ensureDefaultRoutines();

      console.log('useData - Fetching all data...');
      const [routinesData, habitsData, goalsData, todosData, dailyDataResult] =
        await Promise.all([
          dataService.getRoutines(),
          dataService.getHabits(),
          dataService.getGoals(),
          dataService.getTodos(),
          dataService.getTodayData(dataService.getTodayString()),
        ]);

      console.log('useData - Data loaded from Firebase:', {
        routinesCount: routinesData.length,
        routines: routinesData,
        habitsCount: habitsData.length,
        goalsCount: goalsData.length,
        todosCount: todosData.length,
        hasDailyData: !!dailyDataResult
      });

      setRoutines(routinesData);
      setHabits(habitsData);
      setGoals(goalsData);
      setTodos(todosData);
      setDailyData(dailyDataResult);
      
      console.log('useData - State updated successfully');
    } catch (err: any) {
      console.error('useData - Error loading data:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    console.log('useData - useEffect triggered', { user: !!user, authLoading });
    loadData();
  }, [loadData]);

  return {
    routines,
    habits,
    goals,
    todos,
    dailyData,
    loading,
    error,
    refetch: loadData,
  };
}