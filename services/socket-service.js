import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './auth-service';

let socket = null;

export const SocketService = {
  connect: async () => {
    try {
      if (socket) return socket;

      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Initialize socket with authentication
      socket = io(API_BASE_URL, {
        auth: {
          token,
        },
      });

      // Set up event handlers
      socket.on('connect', () => {
        console.log('Socket connected');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return socket;
    } catch (error) {
      console.error('Socket initialization error:', error);
      return null;
    }
  },

  authenticate: async (userId) => {
    if (!socket) return;
    socket.emit('authenticate', { userId });
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  joinCampaignRoom: (campaignId) => {
    if (!socket) return;
    socket.emit('join-campaign', campaignId);
  },

  leaveCampaignRoom: (campaignId) => {
    if (!socket) return;
    socket.emit('leave-campaign', campaignId);
  },

  sendCampaignMessage: (campaignId, message) => {
    if (!socket || !socket.connected) {
      console.error('Socket not connected, cannot send message');
      return false;
    }

    // Ensure campaignId matches the expected format
    socket.emit('campaign-message', {
      campaignId,
      message: typeof message === 'string' ? message : message.text || message,
    });

    return true;
  },

  subscribeToCampaignMessages: (callback) => {
    if (!socket) return () => {};

    socket.on('campaign-message', callback);

    // Return a function to unsubscribe
    return () => {
      socket.off('campaign-message', callback);
    };
  },
};
