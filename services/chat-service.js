import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add this helper function
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

export const ChatService = {
  // Get chat messages for a campaign
  getChatMessages: async (campaignId) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await axios.get(
        `${API_BASE_URL}/api/chat/${campaignId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return { messages: response.data, error: null };
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return {
        messages: [],
        error: axios.isAxiosError(error) ? error.response?.data : error,
      };
    }
  },

  // Send a new message
  sendMessage: async (messageData) => {
    console.log('Sending message:', messageData);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await axios.post(
        `${API_BASE_URL}/api/chat/${messageData.campaign_id}`,
        messageData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return { message: response.data, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        message: null,
        error: axios.isAxiosError(error) ? error.response?.data : error,
      };
    }
  },
};
