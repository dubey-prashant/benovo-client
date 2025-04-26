import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService } from '../services/auth-service';
import { SocketService } from '../services/socket-service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Connect to socket if user is logged in
          const socket = await SocketService.connect();
          if (socket) {
            SocketService.authenticate(currentUser.id);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    return () => {
      // Disconnect socket when component unmounts
      SocketService.disconnect();
    };
  }, []);

  const signIn = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const { user, error } = await AuthService.signIn(email, password);

      if (error) throw new Error(error.message || 'Login failed');

      setUser(user);
      const socket = await SocketService.connect();
      if (socket && user) {
        SocketService.authenticate(user.id);
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      return {
        success: false,
        error: err.message,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { success, error } = await AuthService.signUp(userData);

      if (!success) throw new Error(error.message || 'Registration failed');

      return { success: true };
    } catch (err) {
      console.log('Registration error:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await SocketService.disconnect();
      await AuthService.signOut();
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
