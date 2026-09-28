import { useState, useEffect, useRef, useCallback } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';
import tokenStorage from '../services/tokenStorage';
import { AuthContext } from './AuthContextCore';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generation counter to prevent race condition when user logs out while profile is still fetching
  const authSessionId = useRef(0);

  // Initialize and restore user session on mount
  useEffect(() => {
    let active = true;
    const currentSession = ++authSessionId.current;

    async function restoreSession() {
      const hasToken = tokenStorage.getAccessToken() || tokenStorage.getRefreshToken();
      if (!hasToken) {
        if (active && currentSession === authSessionId.current) {
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
        }
        return;
      }

      try {
        const profile = await userService.getProfile();
        if (active && currentSession === authSessionId.current) {
          setUser(profile);
        }
      } catch (err) {
        // If 401 or refresh failed with invalid token, tokenStorage has been cleared by apiClient
        // DO NOT delete tokens on network error (err.isNetworkError) or 5xx server errors
        if ((err?.status === 401 || !tokenStorage.hasTokens()) && active && currentSession === authSessionId.current) {
          tokenStorage.clearTokens();
          setUser(null);
        }
      } finally {
        if (active && currentSession === authSessionId.current) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    }

    restoreSession();

    // Listen to token expiration event dispatched by apiClient
    const handleAuthExpired = () => {
      if (active) {
        authSessionId.current++;
        setUser(null);
      }
    };

    window.addEventListener('cine_auth_expired', handleAuthExpired);

    return () => {
      active = false;
      window.removeEventListener('cine_auth_expired', handleAuthExpired);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const currentSession = ++authSessionId.current;
    const result = await authService.login(credentials);

    if (result.user && currentSession === authSessionId.current) {
      setUser(result.user);
    } else if (currentSession === authSessionId.current) {
      // If user object was not included in response, fetch /users/me
      try {
        const profile = await userService.getProfile();
        if (currentSession === authSessionId.current) {
          setUser(profile);
        }
      } catch {
        // Ignored, user will be set on next load
      }
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    // Invalidate any ongoing profile fetches immediately
    authSessionId.current++;
    // Clear user state immediately
    setUser(null);
    return await authService.logout();
  }, []);

  // Sync profile update from /profile page directly to AuthContext
  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        isInitialized,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
