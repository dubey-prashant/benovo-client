import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './auth-service';

// Create an axios instance with authentication
const getApiInstance = async () => {
  const token = await getAuthToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
};

export const CampaignService = {
  getCampaigns: async () => {
    try {
      const api = await getApiInstance();
      const response = await api.get('/api/campaigns');
      return response.data;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  getUserCampaigns: async () => {
    try {
      const api = await getApiInstance();
      const response = await api.get('/api/campaigns');
      return response.data;
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
      throw error;
    }
  },

  getCampaign: async (id) => {
    try {
      const api = await getApiInstance();
      const response = await api.get(`/api/campaigns/${id}`);
      return response.data;
    } catch (error) {
      // Check if it's a 404 error (campaign not found)
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return undefined;
      }
      console.error('Error fetching campaign:', error);
      throw error;
    }
  },

  createCampaign: async (campaign) => {
    try {
      const api = await getApiInstance();
      const response = await api.post('/api/campaigns', campaign);
      return response.data.campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  },

  updateCampaign: async (id, campaignData) => {
    try {
      const api = await getApiInstance();
      const response = await api.put(`/api/campaigns/${id}`, campaignData);
      return response.data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  },

  deleteCampaign: async (id) => {
    try {
      const api = await getApiInstance();
      await api.delete(`/api/campaigns/${id}`);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  },

  // Member management
  addMember: async (campaignId, userId, isAdmin = false) => {
    try {
      const api = await getApiInstance();
      await api.post(`/api/campaigns/${campaignId}/members`, {
        user_id: userId,
        is_admin: isAdmin,
      });
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  },

  removeMember: async (campaignId, userId) => {
    try {
      const api = await getApiInstance();
      await api.delete(`/api/campaigns/${campaignId}/members/${userId}`);
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  // Contribution management
  recordContribution: async (campaignId, contribution) => {
    try {
      const api = await getApiInstance();
      const response = await api.post(
        `/api/campaigns/${campaignId}/contributions`,
        contribution
      );
      return response.data;
    } catch (error) {
      console.error('Error recording contribution:', error);
      throw error;
    }
  },

  // Disbursement management
  recordDisbursement: async (campaignId, disbursement) => {
    try {
      const api = await getApiInstance();
      const response = await api.post(
        `/api/campaigns/${campaignId}/disbursements`,
        disbursement
      );
      return response.data;
    } catch (error) {
      console.error('Error recording disbursement:', error);
      throw error;
    }
  },

  // Invitation management
  inviteMemberByEmail: async (campaignId, email) => {
    try {
      const api = await getApiInstance();
      await api.post(`/api/campaigns/${campaignId}/invite`, { email });
    } catch (error) {
      console.error('Error inviting member by email:', error);
      throw error;
    }
  },

  inviteMemberByPhone: async (campaignId, phone) => {
    try {
      const api = await getApiInstance();
      await api.post(`/api/campaigns/${campaignId}/invite`, { phone });
    } catch (error) {
      console.error('Error inviting member by phone:', error);
      throw error;
    }
  },

  // Get pending invitations for a campaign
  getPendingInvitations: async (campaignId) => {
    try {
      const api = await getApiInstance();
      const response = await api.get(
        `/api/campaigns/${campaignId}/invitations?status=pending`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      throw error;
    }
  },

  // Cancel an invitation
  cancelInvitation: async (campaignId, invitationId) => {
    try {
      const api = await getApiInstance();
      await api.delete(
        `/api/campaigns/${campaignId}/invitations/${invitationId}`
      );
      return true;
    } catch (error) {
      console.error('Error canceling invitation:', error);
      throw error;
    }
  },
};
