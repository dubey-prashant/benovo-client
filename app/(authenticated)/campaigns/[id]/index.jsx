import '../../../../assets/global.css';
import React, { useState, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import {
  Box,
  Button,
  ButtonText,
  Text,
  Heading,
  VStack,
  HStack,
  Divider,
  Badge,
  BadgeText,
  Pressable,
  Icon,
  CalendarDaysIcon,
  UsersIcon,
  DollarIcon,
} from '@gluestack-ui/themed';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { CampaignService } from '../../../../services/campaign-service';
import { useAuth } from '../../../../context/AuthContext';
import { Feather } from '@expo/vector-icons';

const PaymentSchedulePreview = ({ campaign, router }) => {
  if (!campaign || !campaign.members) return null;
  // console.log(campaign.members);
  // Get members with allocations
  const allocatedMembers = campaign.members
    .filter((m) => m.allocated_month)
    .sort((a, b) => new Date(a.allocated_month) - new Date(b.allocated_month));
  // console.log(allocatedMembers);
  if (allocatedMembers.length === 0) return null;

  return (
    <Box className='bg-white rounded-xl p-5 shadow-sm mb-6'>
      <Box className='flex-row justify-between items-center mb-3'>
        <HStack space='2' alignItems='center'>
          <Icon as={Feather} name='calendar' size='sm' color='$slate700' />
          <Heading size='sm' className='text-slate-800'>
            <Text>Payment Schedule</Text>
          </Heading>
        </HStack>
        <Pressable
          onPress={() => router.push(`/campaigns/${campaign._id}/payments`)}
        >
          <Text className='text-blue-600 text-sm'>View All</Text>
        </Pressable>
      </Box>

      {/* Preview first 3 allocations */}
      {allocatedMembers.slice(0, 3).map((member, index) => (
        <Box key={index} className='py-2 border-b border-gray-100'>
          <HStack className='justify-between items-center'>
            <HStack className='items-center space-x-2'>
              <Box className='h-8 w-8 rounded-full bg-blue-100 items-center justify-center'>
                <Text className='font-bold text-blue-600'>
                  {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </Box>
              <Text className='font-medium'>
                {member.user?.name || 'Unknown User'}
              </Text>
            </HStack>
            <Text className='text-gray-600'>
              {new Date(member.allocated_month).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
              })}
            </Text>
          </HStack>
        </Box>
      ))}

      {allocatedMembers.length > 3 && (
        <Text className='text-center text-gray-500 text-sm mt-2'>
          +{allocatedMembers.length - 3} more
        </Text>
      )}
    </Box>
  );
};

export default function CampaignDetails() {
  const { id } = useLocalSearchParams();
  const pathname = usePathname();

  // Extract ID from pathname as fallback
  const campaignId = id || pathname.split('/')[2];

  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return;

      try {
        const data = await CampaignService.getCampaign(campaignId);
        if (data) {
          setCampaign(data);
        } else {
          // Campaign not found, redirect to campaigns list
          router.replace('/campaigns');
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate campaign progress
  const getProgress = () => {
    if (!campaign) return 0;

    const totalContributions = campaign.contributions
      ? campaign.contributions.reduce((sum, c) => sum + c.amount, 0)
      : 0;

    const target = campaign.target_amount || 1; // Avoid division by zero
    const progress = (totalContributions / target) * 100;
    return Math.min(Math.max(progress, 0), 100); // Ensure between 0 and 100
  };

  // Add this function to check if the current user is an admin
  const isAdmin = () => {
    if (!campaign || !user) return false;
    const currentMember = campaign.members.find(
      (member) => member.user_id === user.id || member.user?.id === user.id
    );
    return currentMember?.is_admin || false;
  };

  // Add this function to handle campaign deletion
  const handleDeleteCampaign = () => {
    // Show confirmation dialog
    Alert.alert(
      'Delete Campaign',
      'Are you sure you want to delete this campaign? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await CampaignService.deleteCampaign(campaignId);
              // Navigate back to campaigns list
              router.replace('/campaigns');
            } catch (error) {
              console.error('Error deleting campaign:', error);
              Alert.alert(
                'Error',
                'Failed to delete campaign. Please try again.'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Box className='h-full p-4 justify-center items-center'>
        <Text>Loading campaign details...</Text>
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box className='h-full p-4 justify-center items-center'>
        <Text>Campaign not found</Text>
        <Button onPress={() => router.replace('/campaigns')} className='mt-4'>
          <ButtonText>Go Back to Campaigns</ButtonText>
        </Button>
      </Box>
    );
  }

  return (
    <ScrollView className='bg-slate-50'>
      <Box className='p-5'>
        {/* Header with status badge */}
        <Box className='mb-6'>
          <Box className='flex-row justify-between items-center mb-2'>
            <Heading size='xl' className='text-slate-800 font-bold flex-1 mr-2'>
              {campaign.name}
            </Heading>
            <Badge
              className={
                campaign.status === 'active'
                  ? 'bg-green-100 border border-green-200'
                  : campaign.status === 'completed'
                  ? 'bg-blue-100 border border-blue-200'
                  : 'bg-red-100 border border-red-200'
              }
              borderRadius='$lg'
            >
              <BadgeText
                className={
                  campaign.status === 'active'
                    ? 'text-green-800 font-medium'
                    : campaign.status === 'completed'
                    ? 'text-blue-800 font-medium'
                    : 'text-red-800 font-medium'
                }
              >
                {campaign.status.charAt(0).toUpperCase() +
                  campaign.status.slice(1)}
              </BadgeText>
            </Badge>
          </Box>

          <Text className='text-slate-600 mb-4 leading-6'>
            {campaign.description}
          </Text>
        </Box>

        {/* Campaign Details Card */}
        <Box className='bg-white rounded-xl p-5 shadow-sm mb-6'>
          <Heading size='sm' className='mb-3 text-slate-800'>
            <HStack space='2' alignItems='center'>
              <Icon
                as={CalendarDaysIcon}
                size='sm'
                className='text-slate-700'
              />
              <Text>Campaign Timeline</Text>
            </HStack>
          </Heading>
          <Divider className='bg-slate-100 mb-4' />

          <VStack space='sm'>
            <Box className='flex-row justify-between'>
              <Text className='text-slate-500'>Start Date</Text>
              <Text className='text-slate-800 font-medium'>
                {formatDate(campaign.startDate || campaign.start_date)}
              </Text>
            </Box>

            <Box className='flex-row justify-between'>
              <Text className='text-slate-500'>End Date</Text>
              <Text className='text-slate-800 font-medium'>
                {formatDate(campaign.endDate || campaign.end_date)}
              </Text>
            </Box>

            <Box className='flex-row justify-between'>
              <Text className='text-slate-500'>Duration</Text>
              <Text className='text-slate-800 font-medium'>
                {Math.ceil(
                  (new Date(campaign.endDate || campaign.end_date) -
                    new Date(campaign.startDate || campaign.start_date)) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                days
              </Text>
            </Box>

            <Box className='flex-row justify-between'>
              <Text className='text-slate-500'>Target Amount</Text>
              <Text className='text-slate-800 font-bold'>
                {formatCurrency(campaign.target_amount)}
              </Text>
            </Box>

            <Box className='flex-row justify-between'>
              <Text className='text-slate-500'>Maximum Members</Text>
              <Text className='text-slate-800 font-medium'>
                {campaign.max_members || '∞'}
              </Text>
            </Box>
          </VStack>
        </Box>

        {/* Members List */}
        <Box className='bg-white rounded-xl p-5 shadow-sm mb-6'>
          <Box className='flex-row justify-between items-center mb-3'>
            <Heading size='sm' className='text-slate-800'>
              <HStack space='2' alignItems='center'>
                <Icon as={UsersIcon} size='sm' className='text-slate-700' />
                <Text>Members</Text>
              </HStack>
            </Heading>
            <Badge borderRadius='$full' className='bg-blue-50 px-2'>
              <BadgeText className='text-blue-600 font-medium'>
                {campaign.members?.length || 0}/{campaign.max_members || '∞'}
              </BadgeText>
            </Badge>
          </Box>
          <Divider className='bg-slate-100 mb-4' />

          {campaign.members?.length > 0 ? (
            <VStack space='xs' divider={<Divider className='bg-slate-100' />}>
              {campaign.members?.map((member, index) => (
                <Box
                  key={member.id || index}
                  className='flex-row justify-between items-center py-3'
                >
                  <Box className='flex-row items-center'>
                    <Box className='w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3'>
                      <Text className='text-blue-600 font-semibold'>
                        {(member.user.name || 'User').charAt(0).toUpperCase()}
                      </Text>
                    </Box>
                    <Text className='text-slate-700 font-medium'>
                      {member.user.name || `Member ${index + 1}`}
                    </Text>
                  </Box>
                  {member.is_admin && (
                    <Badge className='bg-blue-50 border border-blue-100'>
                      <BadgeText className='text-blue-600 text-xs'>
                        Admin
                      </BadgeText>
                    </Badge>
                  )}
                </Box>
              ))}
            </VStack>
          ) : (
            <Box className='py-4 items-center'>
              <Text className='text-slate-500'>No members yet</Text>
            </Box>
          )}

          {campaign.members?.length > 5 && (
            <Pressable
              className='mt-3 items-center py-2 bg-slate-50 rounded-lg'
              onPress={() => router.push(`/campaigns/${campaignId}/members`)}
            >
              <Text className='text-blue-600 font-medium'>
                View All Members
              </Text>
            </Pressable>
          )}
        </Box>

        {/* Action Buttons */}
        <HStack space='3' className='mt-2'>
          <Button
            className='flex-1'
            variant='outline'
            onPress={() => router.push(`/campaigns/${campaignId}/payments`)}
          >
            <HStack space='2' alignItems='center'>
              <Icon as={Feather} name='dollar-sign' size='sm' />
              <ButtonText>Payment Schedule</ButtonText>
            </HStack>
          </Button>
        </HStack>

        <PaymentSchedulePreview campaign={campaign} router={router} />

        {/* DELETE CAMPAIGN  */}
        {isAdmin() && (
          <Button
            className='text-red-500 mt-4'
            variant='outline'
            borderColor='$red500'
            isDisabled={deleting}
            onPress={handleDeleteCampaign}
          >
            <HStack space='2' alignItems='center'>
              <Icon as={Feather} name='trash-2' size='sm' color='white' />
              <ButtonText color='red'>
                {deleting ? 'Deleting...' : 'Delete'}
              </ButtonText>
            </HStack>
          </Button>
        )}
      </Box>
    </ScrollView>
  );
}
