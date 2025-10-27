import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import dataService, {
  Routine,
  Habit,
  Goal,
  Todo,
  DailyData,
} from '@/services/dataService';

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

  const loadData = async () => {
    // Don't load data if user is not authenticated
    if (!user || authLoading) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure default routines and habits exist
      console.log('useData - Ensuring default routines exist...');
      await dataService.ensureDefaultRoutines();

      const [routinesData, habitsData, goalsData, todosData, dailyDataResult] =
        await Promise.all([
          dataService.getRoutines(),
          dataService.getHabits(),
          dataService.getGoals(),
          dataService.getTodos(),
          dataService.getTodayData(dataService.getTodayString()),
        ]);

      console.log('useData - Data loaded from Firebase:', {
        routines: routinesData,
        habits: habitsData,
        goals: goalsData,
        todos: todosData,
        dailyData: dailyDataResult
      });

      setRoutines(routinesData);
      setHabits(habitsData);
      setGoals(goalsData);
      setTodos(todosData);
      setDailyData(dailyDataResult);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, authLoading]);

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
