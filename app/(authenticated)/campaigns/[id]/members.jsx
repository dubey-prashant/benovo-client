import '../../../../assets/global.css';
import React, { useState, useEffect } from 'react';
import { FlatList, ActivityIndicator, Alert } from 'react-native';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  InputField,
  Button,
  ButtonText,
  Divider,
  Icon,
  FormControl,
  Badge,
  BadgeText,
  Pressable,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AlertIcon,
  CloseIcon,
} from '@gluestack-ui/themed';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { CampaignService } from '@/services/campaign-service';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../../context/AuthContext';

export default function CampaignMembers() {
  const { id } = useLocalSearchParams();
  const pathname = usePathname();

  // Extract ID from pathname as fallback
  const campaignId = id || pathname.split('/')[2];

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      const data = await CampaignService.getCampaign(campaignId);
      if (data) {
        setCampaign(data);
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setErrorMsg('Please enter an email address');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setInviting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Check if we've reached member limit
      if (
        campaign.max_members &&
        campaign.members.length >= campaign.max_members
      ) {
        setErrorMsg('This campaign has reached its maximum member capacity');
        setInviting(false);
        return;
      }

      // Send invitation
      await CampaignService.inviteMemberByEmail(campaignId, inviteEmail);

      // Reset form and show success message
      setInviteEmail('');
      setSuccessMsg(`Invitation sent to ${inviteEmail}`);
      setShowModal(false);

      // Refresh campaign data to show pending invitations
      fetchCampaign();
    } catch (error) {
      console.error('Error inviting member:', error);

      // Parse error message
      const errorMessage =
        error?.response?.data?.message ||
        'Failed to send invitation. Please try again.';

      // Set appropriate error message
      if (errorMessage.includes('not found')) {
        setErrorMsg('No user with this email exists in our system');
      } else if (errorMessage.includes('already a member')) {
        setErrorMsg('This user is already a member of this campaign');
      } else if (errorMessage.includes('already invited')) {
        setErrorMsg('This user has already been invited to this campaign');
      } else {
        setErrorMsg(errorMessage);
      }
    } finally {
      setInviting(false);
    }
  };

  const isAdmin = () => {
    if (!campaign || !user) return false;
    const currentMember = campaign.members.find(
      (member) => member.user_id === user.id
    );
    return currentMember?.is_admin || false;
  };

  const renderMemberItem = ({ item }) => (
    <Box className='p-4 border-b border-gray-100'>
      <HStack className='justify-between items-center'>
        <HStack className='items-center gap-3'>
          <Box className='w-10 h-10 rounded-full bg-blue-100 items-center justify-center'>
            <Text className='text-blue-600 font-bold'>
              {item.user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </Box>
          <VStack>
            <Text className='font-medium text-gray-800'>
              {item.user?.name || 'Unknown User'}
            </Text>
            <Text className='text-gray-500 text-sm'>
              {item.user?.email || ''}
            </Text>
          </VStack>
        </HStack>

        <HStack space='2' alignItems='center'>
          {item.is_admin && (
            <Badge className='bg-blue-50 border border-blue-100'>
              <BadgeText className='text-blue-600 text-xs font-medium'>
                Admin
              </BadgeText>
            </Badge>
          )}

          {isAdmin() && !item.is_admin && user.id !== item.user_id && (
            <Pressable
              onPress={() => handleRemoveMember(item._id, item.user?.name)}
              className='p-2'
            >
              <Icon as={Feather} name='trash-2' size='sm' color='#EF4444' />
            </Pressable>
          )}
        </HStack>
      </HStack>
    </Box>
  );

  const renderPendingInvitation = ({ item }) => (
    <Box className='p-4 border-b border-gray-100'>
      <HStack className='justify-between items-center'>
        <HStack className='items-center gap-3'>
          <Box className='w-10 h-10 rounded-full bg-yellow-100 items-center justify-center'>
            <Icon as={Feather} name='mail' size='md' color='#D97706' />
          </Box>
          <VStack>
            <HStack className='items-center gap-2'>
              <Text className='font-medium text-gray-800'>{item.email}</Text>
              <Badge className='bg-yellow-50 border border-yellow-100'>
                <BadgeText className='text-yellow-700 text-xs'>
                  Pending
                </BadgeText>
              </Badge>
            </HStack>
            <Text className='text-gray-500 text-sm'>
              Invited {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </VStack>
        </HStack>

        {isAdmin() && (
          <Pressable
            onPress={() => handleCancelInvitation(item.id)}
            className='p-2'
          >
            <Icon as={Feather} name='x' size='sm' color='#6B7280' />
          </Pressable>
        )}
      </HStack>
    </Box>
  );

  const handleCancelInvitation = async (invitationId) => {
    try {
      await CampaignService.cancelInvitation(campaignId, invitationId);
      // Refresh campaign data
      fetchCampaign();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      Alert.alert('Error', 'Failed to cancel invitation');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    // Show confirmation dialog
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${
        memberName || 'this member'
      } from the campaign?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await CampaignService.removeMember(campaignId, memberId);
              setSuccessMsg(`Member removed successfully`);
              // Refresh campaign data
              await fetchCampaign();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Box className='flex-1 justify-center items-center'>
        <ActivityIndicator size='large' color='#3B82F6' />
        <Text className='mt-4 text-gray-500'>Loading members...</Text>
      </Box>
    );
  }

  const memberCount = campaign?.members?.length || 0;
  const maxMembers = campaign?.max_members || 0;
  const pendingInvitations =
    campaign?.invitations?.filter((inv) => inv.status === 'pending') || [];
  const canInvite =
    !maxMembers || memberCount + pendingInvitations.length < maxMembers;

  return (
    <Box className='flex-1 bg-slate-50'>
      {/* Header */}
      <Box className='bg-white p-4 border-b border-gray-200'>
        <Heading size='lg' className='text-gray-800'>
          Campaign Members
        </Heading>
        <HStack className='justify-between items-center mt-2'>
          <HStack className='items-center gap-2'>
            <Text className='text-gray-600 font-medium'>Members</Text>
            <Badge className='bg-blue-50'>
              <BadgeText className='text-blue-700'>
                {memberCount}/{maxMembers || '∞'}
              </BadgeText>
            </Badge>
          </HStack>

          {isAdmin() && canInvite && (
            <Button
              onPress={() => setShowModal(true)}
              className='bg-blue-600'
              size='sm'
            >
              <HStack className='items-center gap-1'>
                <Icon as={Feather} name='user-plus' size='xs' color='white' />
                <ButtonText>Invite</ButtonText>
              </HStack>
            </Button>
          )}
        </HStack>
      </Box>

      {/* Success message */}
      {successMsg ? (
        <Box className='m-4 p-3 bg-green-50 border border-green-100 rounded-md flex-row justify-between items-center'>
          <Text className='text-green-700'>{successMsg}</Text>
          <Pressable onPress={() => setSuccessMsg('')}>
            <Icon as={CloseIcon} size='xs' color='#047857' />
          </Pressable>
        </Box>
      ) : null}
      {console.log(pendingInvitations)}
      {/* Members List */}
      <FlatList
        data={campaign?.members || []}
        renderItem={renderMemberItem}
        keyExtractor={(item) =>
          item.user_id || item.id || Math.random().toString()
        }
        ListHeaderComponent={() => (
          <Box className='pt-4 px-4 pb-2'>
            <Text className='text-sm font-semibold text-gray-500 uppercase'>
              Members
            </Text>
          </Box>
        )}
        ListEmptyComponent={() => (
          <Box className='py-8 items-center justify-center'>
            <Text className='text-gray-500'>No members yet</Text>
          </Box>
        )}
        ListFooterComponent={() => (
          <>
            {pendingInvitations.length > 0 && (
              <>
                <Box className='pt-6 px-4 pb-2'>
                  <Text className='text-sm font-semibold text-gray-500 uppercase'>
                    Pending Invitations
                  </Text>
                </Box>
                <FlatList
                  data={pendingInvitations}
                  renderItem={renderPendingInvitation}
                  keyExtractor={(item) => item.id || Math.random().toString()}
                  scrollEnabled={false}
                />
              </>
            )}
            <Box className='h-20' />
          </>
        )}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      {/* Invite Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalBackdrop />
        <ModalContent className='mx-4 bg-white rounded-xl'>
          <ModalHeader>
            <Heading size='md'>Invite Member</Heading>
          </ModalHeader>
          <ModalBody>
            <Text className='text-gray-600 mb-4'>
              Enter the email of the person you want to invite to this campaign.
              The user must already have an account in our system.
            </Text>

            {errorMsg ? (
              <Box className='mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex-row items-center'>
                <AlertIcon className='text-red-500 mr-2' />
                <Text className='text-red-700 flex-1'>{errorMsg}</Text>
              </Box>
            ) : null}

            <FormControl className='mb-4'>
              <Input className='bg-gray-50 border border-gray-200 rounded-md'>
                <InputField
                  placeholder='Enter email address'
                  value={inviteEmail}
                  onChangeText={(text) => {
                    setInviteEmail(text);
                    setErrorMsg('');
                  }}
                  keyboardType='email-address'
                  autoCapitalize='none'
                />
              </Input>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <HStack className='gap-2'>
              <Button
                variant='outline'
                action='secondary'
                onPress={() => setShowModal(false)}
                className='flex-1'
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                onPress={handleInvite}
                disabled={inviting}
                className='flex-1 bg-blue-600'
              >
                <ButtonText>{inviting ? 'Sending...' : 'Invite'}</ButtonText>
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
