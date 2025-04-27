import io from 'socket.io-client';
import { API_URL } from '../constants/api';
import { getToken } from './auth-storage';

let socket = null;

export const initializeSocket = async () => {
  if (socket && socket.connected) {
    return socket;
  }

  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    socket = io(API_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    throw error;
  }
};

export const getSocket = () => {
  return socket;
};

export const authenticateSocket = async (userData) => {
  if (!socket || !socket.connected) {
    await initializeSocket();
  }

  if (socket && socket.connected) {
    socket.emit('authenticate', userData);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinCampaignRoom = (campaignId) => {
  if (socket && socket.connected) {
    socket.emit('join-campaign', campaignId);
  }
};
