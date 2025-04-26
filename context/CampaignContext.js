import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import { CampaignService } from '../services/campaign-service';
import { useAuth } from './AuthContext';

const CampaignContext = createContext();

export const CampaignProvider = ({ children }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const loadCampaigns = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await CampaignService.getUserCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load campaigns when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCampaigns();
    } else {
      setCampaigns([]);
    }
  }, [isAuthenticated, loadCampaigns]);

  const createCampaign = async (campaignData) => {
    setIsLoading(true);
    setError(null);

    try {
      const campaign = await CampaignService.createCampaign(campaignData);

      // Reload campaigns to include the new one
      await loadCampaigns();

      return { success: true, campaign };
    } catch (err) {
      setError(err.message || 'Failed to create campaign');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const getCampaign = async (campaignId) => {
    setIsLoading(true);
    setError(null);

    try {
      const campaign = await CampaignService.getCampaign(campaignId);
      return { campaign, error: null };
    } catch (err) {
      setError(err.message || 'Failed to get campaign');
      return { campaign: null, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const inviteMember = async (campaignId, memberData) => {
    setIsLoading(true);
    setError(null);

    try {
      let result;

      if (memberData.email) {
        await CampaignService.inviteMemberByEmail(campaignId, memberData.email);
        result = { success: true };
      } else if (memberData.phone) {
        await CampaignService.inviteMemberByPhone(campaignId, memberData.phone);
        result = { success: true };
      } else {
        throw new Error('Email or phone is required');
      }

      return result;
    } catch (err) {
      setError(err.message || 'Failed to invite member');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        isLoading,
        error,
        loadCampaigns,
        createCampaign,
        getCampaign,
        inviteMember,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

// Custom hook to use the campaign context
export const useCampaigns = () => useContext(CampaignContext);
