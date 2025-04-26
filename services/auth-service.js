import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Get auth token (used by other services)
export const getAuthToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

export const AuthService = {
  signIn: async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      // Store token and user data
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

      return { user: response.data.user, error: null };
    } catch (error) {
      return {
        user: null,
        error: axios.isAxiosError(error) ? error.response?.data : error,
      };
    }
  },

  signUp: async (userData) => {
    try {
      console.log('Registration userData:', API_BASE_URL, userData);
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      console.log('Registration fetch response:', response);
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return { success: true, error: null };
    } catch (error) {
      console.log('Registration error serv :', error);
      return {
        success: false,
        error: error,
      };
    }
  },

  signOut: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) return null;

      return JSON.parse(userString);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  isAuthenticated: async () => {
    const token = await getAuthToken();
    return token !== null;
  },

  getProfile: async () => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return { user: response.data, error: null };
    } catch (error) {
      return {
        user: null,
        error: axios.isAxiosError(error) ? error.response?.data : error,
      };
    }
  },

  updateProfile: async (userData) => {
    console.log('Updating user profile:', userData);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      await axios.put(`${API_BASE_URL}/api/auth/profile`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update stored user data
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: axios.isAxiosError(error) ? error.response?.data : error,
      };
    }
  },
};
