import '../../../assets/global.css';
import React, { useState, useCallback } from 'react';
import { FlatList, ActivityIndicator, StatusBar } from 'react-native';
import {
  Box,
  Button,
  ButtonText,
  Text,
  Heading,
  VStack,
  HStack,
  Icon,
  Pressable,
  Badge,
  BadgeText,
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@gluestack-ui/themed';
import { useRouter, useFocusEffect } from 'expo-router';
import { CampaignService } from '../../../services/campaign-service';
import { useAuth } from '../../../context/AuthContext';
import { Feather } from '@expo/vector-icons';

export default function CampaignsList() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!user || !user.id) {
          console.error('No authenticated user found');
          setLoading(false);
          setInvitationsLoading(false);
          return;
        }

        // Fetch campaigns
        setLoading(true);
        try {
          const campaignsData = await CampaignService.getUserCampaigns(user.id);
          setCampaigns(campaignsData);
        } catch (error) {
          console.error('Error fetching user campaigns:', error);
        } finally {
          setLoading(false);
        }

        // Fetch invitations
        setInvitationsLoading(true);
        try {
          const invitationsData = await CampaignService.getUserInvitations();
          setInvitations(invitationsData);
        } catch (error) {
          console.error('Error fetching user invitations:', error);
        } finally {
          setInvitationsLoading(false);
        }
      };

      fetchData();
      return () => {};
    }, [user])
  );

  // Safe navigation function to prevent context errors
  const handleNavigation = (path) => {
    try {
      router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation if router fails
      if (typeof window !== 'undefined') {
        window.location.href = path;
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const handleInvitationAction = async (action) => {
    if (!selectedInvitation) return;

    setActionLoading(true);
    try {
      await CampaignService.respondToInvitation(selectedInvitation._id, action);

      if (action === 'accept') {
        // Refresh campaigns list to include the newly joined campaign
        const campaignsData = await CampaignService.getUserCampaigns(user.id);
        setCampaigns(campaignsData);
      }

      // Remove the invitation from the list
      setInvitations(
        invitations.filter((inv) => inv._id !== selectedInvitation._id)
      );
      setShowDialog(false);
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
    } finally {
      setActionLoading(false);
      setSelectedInvitation(null);
    }
  };

  const renderCampaignCard = ({ item }) => (
    <Pressable onPress={() => handleNavigation(`/campaigns/${item._id}`)}>
      <Box className='mb-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
        <Box className='px-5 pt-5 pb-3'>
          <HStack className='justify-between items-start mb-2'>
            <Heading size='md' className='flex-1 pr-2'>
              {item.name}
            </Heading>
            <Box
              className={`px-2 py-1 rounded-full ${getStatusColor(
                item.status
              )}`}
            >
              <Text className='text-xs font-medium'>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </Box>
          </HStack>

          <Text className='text-gray-600 mb-3' numberOfLines={2}>
            {item.description || 'No description provided'}
          </Text>

          <Box className='h-[1px] bg-gray-100 my-2' />

          <HStack className='justify-between mt-2'>
            <VStack>
              <Text className='text-xs text-gray-500'>Target Amount</Text>
              <Text className='font-bold text-blue-600'>
                ${item.target_amount || 0}
              </Text>
            </VStack>

            <VStack>
              <Text className='text-xs text-gray-500'>Per Member</Text>
              <Text className='font-medium'>
                ${item.contribution_amount || 0}
              </Text>
            </VStack>

            <VStack>
              <Text className='text-xs text-gray-500'>Members</Text>
              <HStack className='items-center'>
                <Text className='font-medium'>{item.members || 0}</Text>
                <Text className='text-gray-400'>
                  /{item.max_members || '∞'}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </Box>

        <Pressable
          onPress={() => handleNavigation(`/campaigns/${item._id}`)}
          className='bg-gray-50 py-3 px-5 flex-row justify-center items-center border-t border-gray-100'
        >
          <Text className='text-blue-600 font-medium text-sm mr-1'>
            View Campaign
          </Text>
          <Icon as={Feather} name='chevron-right' size={16} color='#2563eb' />
        </Pressable>
      </Box>
    </Pressable>
  );

  const renderInvitationCard = ({ item }) => (
    <Box className='mb-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
      <Box className='px-5 pt-5 pb-3'>
        <HStack className='justify-between items-start mb-2'>
          <Heading size='sm' className='flex-1 pr-2'>
            {item.campaign_id?.name || 'Unnamed Campaign'}
          </Heading>
          <Badge className='bg-yellow-50 border border-yellow-100'>
            <BadgeText className='text-yellow-700 text-xs'>
              Invitation
            </BadgeText>
          </Badge>
        </HStack>

        <Text className='text-gray-600 mb-3' numberOfLines={2}>
          {item.campaign_id?.description || 'No description provided'}
        </Text>

        <HStack className='mt-2 items-center'>
          <Icon as={Feather} name='user' size={14} color='#6B7280' />
          <Text className='text-sm text-gray-500 ml-1'>
            Invited by {item.invited_by?.name || 'A campaign admin'}
          </Text>
        </HStack>

        <Text className='text-xs text-gray-400 mt-1'>
          Invited on {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </Box>

      <HStack className='bg-gray-50 py-3 px-5 justify-between items-center border-t border-gray-100'>
        <Button
          variant='outline'
          onPress={() => {
            setSelectedInvitation(item);
            setShowDialog(true);
          }}
          className='flex-1 py-2 border border-blue-500'
        >
          <ButtonText className='text-blue-600 font-medium text-sm'>
            View Details
          </ButtonText>
        </Button>
      </HStack>
    </Box>
  );

  const renderEmptyState = () => (
    <Box className='flex-1 items-center justify-center px-6'>
      <Box className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 items-center max-w-md w-full'>
        <Box className='w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4'>
          <Icon as={Feather} name='flag' size={30} color='#3b82f6' />
        </Box>
        <Heading size='md' className='text-center mb-2'>
          No Campaigns Yet
        </Heading>
        <Text className='text-gray-500 text-center mb-6'>
          Start your first fundraising campaign to track contributions and reach
          your goals together.
        </Text>

        <Button
          onPress={() => handleNavigation('/campaigns/create')}
          className='bg-blue-600 w-full h-12 rounded-lg shadow-sm flex items-center justify-center flex-row gap-2'
        >
          <ButtonText className='text-white font-medium'>
            Create Your First Campaign
          </ButtonText>
          <Icon as={Feather} name='plus' size={18} color='white' />
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box className='flex-1 bg-slate-50'>
      <StatusBar barStyle='dark-content' />

      {/* Header */}
      <Box className='bg-white border-b border-gray-200 pt-2 pb-2 px-4 shadow-sm flex-row justify-between items-center'>
        <Box>
          <Heading size='xl' className='text-gray-800 font-bold'>
            Campaigns
          </Heading>
        </Box>

        <Button
          onPress={() => handleNavigation('/campaigns/create')}
          className='bg-blue-600 h-10 rounded-lg px-4 shadow-sm flex items-center justify-center flex-row gap-2'
        >
          <Icon as={Feather} name='plus' size={18} color='white' />
          <ButtonText className='text-white font-medium'>
            New Campaign
          </ButtonText>
        </Button>
      </Box>

      {loading ? (
        <Box className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#3b82f6' />
          <Text className='text-gray-500 mt-3'>Loading campaigns...</Text>
        </Box>
      ) : (
        <FlatList
          data={campaigns}
          renderItem={renderCampaignCard}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            campaigns.length === 0 && invitations.length === 0
              ? renderEmptyState
              : null
          }
          ListFooterComponent={() => (
            <>
              {/* Invitations Section */}
              {invitations.length > 0 && (
                <Box>
                  <HStack className='px-1 mb-2 items-center'>
                    <Icon
                      as={Feather}
                      name='mail'
                      size={16}
                      color='#4B5563'
                      className='mr-2'
                    />
                    <Heading size='sm' className='text-gray-600'>
                      Pending Invitations
                    </Heading>
                  </HStack>

                  {invitationsLoading ? (
                    <Box className='p-4 items-center'>
                      <ActivityIndicator size='small' color='#3b82f6' />
                      <Text className='text-gray-500 mt-2'>
                        Loading invitations...
                      </Text>
                    </Box>
                  ) : (
                    <FlatList
                      data={invitations}
                      renderItem={renderInvitationCard}
                      keyExtractor={(item) =>
                        item._id || Math.random().toString()
                      }
                      scrollEnabled={false}
                    />
                  )}
                </Box>
              )}

              {/* Add padding at the bottom */}
              <Box className='h-20' />
            </>
          )}
        />
      )}

      {/* Invitation Action Dialog */}
      <AlertDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setSelectedInvitation(null);
        }}
      >
        <AlertDialogBackdrop />
        <AlertDialogContent className='m-4 bg-white rounded-xl'>
          <AlertDialogHeader>
            <Heading size='md'>Campaign Invitation</Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <VStack className='space-y-3'>
              <Text className='text-gray-700'>
                You've been invited to join:
              </Text>

              <Box className='p-3 bg-gray-50 rounded-lg'>
                <Heading size='sm' className='mb-1'>
                  {selectedInvitation?.campaign_id?.name || 'Unnamed Campaign'}
                </Heading>
                <Text className='text-sm text-gray-600'>
                  {selectedInvitation?.campaign_id?.description ||
                    'No description provided'}
                </Text>
              </Box>

              <HStack className='items-center'>
                <Icon
                  as={Feather}
                  name='dollar-sign'
                  size={14}
                  color='#4B5563'
                />
                <Text className='text-sm text-gray-600 ml-1'>
                  Target amount: $
                  {selectedInvitation?.campaign_id?.target_amount || 0}
                </Text>
              </HStack>

              <HStack className='items-center'>
                <Icon
                  as={Feather}
                  name='credit-card'
                  size={14}
                  color='#4B5563'
                />
                <Text className='text-sm text-gray-600 ml-1'>
                  Contribution per member: $
                  {selectedInvitation?.campaign_id?.contribution_amount || 0}
                </Text>
              </HStack>

              <Text className='text-sm text-gray-600'>
                You were invited by{' '}
                {selectedInvitation?.invited_by?.name || 'a campaign admin'}.
              </Text>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack className='space-x-2'>
              <Button
                variant='outline'
                action='secondary'
                onPress={() => handleInvitationAction('decline')}
                isDisabled={actionLoading}
                className='flex-1'
              >
                <ButtonText>Decline</ButtonText>
              </Button>
              <Button
                action='positive'
                onPress={() => handleInvitationAction('accept')}
                isDisabled={actionLoading}
                className='flex-1 bg-blue-600'
              >
                <ButtonText>
                  {actionLoading ? 'Processing...' : 'Accept & Join'}
                </ButtonText>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}
