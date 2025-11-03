import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Habit, DailyData } from '@/services/dataService';

interface TimerModalState {
  isVisible: boolean;
  habitId: number | null;
  habit: Habit | null;
  dailyData: DailyData | null;
}

interface TimerModalContextType {
  state: TimerModalState;
  openTimerModal: (habit: Habit, dailyData: DailyData | null) => void;
  closeTimerModal: () => void;
  updateDailyData: (dailyData: DailyData) => void;
}

const TimerModalContext = createContext<TimerModalContextType | undefined>(undefined);

export function TimerModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerModalState>({
    isVisible: false,
    habitId: null,
    habit: null,
    dailyData: null,
  });

  const openTimerModal = (habit: Habit, dailyData: DailyData | null) => {
    setState({
      isVisible: true,
      habitId: habit.id,
      habit,
      dailyData,
    });
  };

  const closeTimerModal = () => {
    setState({
      isVisible: false,
      habitId: null,
      habit: null,
      dailyData: null,
    });
  };

  const updateDailyData = (dailyData: DailyData) => {
    setState((prev) => ({
      ...prev,
      dailyData,
    }));
  };

  return (
    <TimerModalContext.Provider value={{ state, openTimerModal, closeTimerModal, updateDailyData }}>
      {children}
    </TimerModalContext.Provider>
  );
}

export function useTimerModal() {
  const context = useContext(TimerModalContext);
  if (!context) {
    throw new Error('useTimerModal must be used within TimerModalProvider');
  }
  return context;
}
