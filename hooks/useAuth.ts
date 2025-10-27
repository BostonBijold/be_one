import { useEffect, useState } from 'react';
import authService, { UserData } from '@/services/authService';

/**
 * Custom hook for auth state management
 * Provides access to current user and loading state
 */
export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading, error };
}
