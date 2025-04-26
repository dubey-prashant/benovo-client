import '../../../../assets/global.css';
import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
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
  Progress,
  ProgressFilledTrack,
  CalendarDaysIcon,
  UsersIcon,
  DollarIcon,
  ClockIcon,
} from '@gluestack-ui/themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CampaignService } from '@/services/campaign-service';
import { useAuth } from '../../../../context/AuthContext';

export default function CampaignDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;

      try {
        const data = await CampaignService.getCampaign(id);
        if (data) {
          console.log('Campaign data:', data);
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
  }, [id]);

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

  // Check if user is admin
  const isAdmin = () => {
    if (!campaign || !user) return false;
    const member = campaign?.members?.find((m) => m.user_id === user._id);
    return member?.isAdmin || false;
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

          {/* Progress Bar */}
          <Box className='mb-4'>
            <Box className='flex-row justify-between items-center mb-2'>
              <Text className='text-slate-700 font-medium'>
                Campaign Progress
              </Text>
              <Text className='text-blue-600 font-semibold'>
                {Math.round(getProgress())}%
              </Text>
            </Box>
            <Progress
              value={getProgress()}
              className='h-2 bg-slate-200 rounded-full'
            >
              <ProgressFilledTrack className='bg-blue-600 rounded-full' />
            </Progress>
            <Box className='flex-row justify-between mt-1'>
              <Text className='text-slate-500 text-xs'>
                {formatCurrency(
                  campaign.contributions?.reduce(
                    (sum, c) => sum + c.amount,
                    0
                  ) || 0
                )}{' '}
                raised
              </Text>
              <Text className='text-slate-500 text-xs'>
                Goal: {formatCurrency(campaign.target_amount)}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Box className='flex-row mb-6 justify-between'>
          <Box className='flex-1 bg-white rounded-xl shadow-sm p-3 mr-2 items-center justify-center'>
            <Icon as={UsersIcon} size='md' className='text-blue-600 mb-1' />
            <Text className='text-lg font-bold text-slate-800'>
              {campaign.members?.length || 0}
            </Text>
            <Text className='text-xs text-slate-500'>Members</Text>
          </Box>
          <Box className='flex-1 bg-white rounded-xl shadow-sm p-3 mr-2 items-center justify-center'>
            <Icon as={DollarIcon} size='md' className='text-green-600 mb-1' />
            <Text className='text-lg font-bold text-slate-800'>
              {formatCurrency(campaign.contribution_amount)}
            </Text>
            <Text className='text-xs text-slate-500'>Per Member</Text>
          </Box>
          <Box className='flex-1 bg-white rounded-xl shadow-sm p-3 items-center justify-center'>
            <Icon as={ClockIcon} size='md' className='text-purple-600 mb-1' />
            <Text className='text-lg font-bold text-slate-800 capitalize'>
              {campaign.frequency}
            </Text>
            <Text className='text-xs text-slate-500'>Frequency</Text>
          </Box>
        </Box>

        {/* Action Buttons */}
        {isAdmin() && (
          <Box className='mb-6'>
            <HStack space='md'>
              <Button
                className='flex-1 bg-blue-600 rounded-lg'
                onPress={() => router.push(`/campaigns/${id}/members/add`)}
              >
                <ButtonText className='font-medium'>Invite Members</ButtonText>
              </Button>

              <Button
                className='flex-1 border border-blue-300 rounded-lg bg-transparent'
                onPress={() => router.push(`/campaigns/${id}/manage`)}
              >
                <ButtonText className='text-blue-600 font-medium'>
                  Manage
                </ButtonText>
              </Button>
            </HStack>
          </Box>
        )}

        {/* Campaign Details Card */}
        <Box className='bg-white rounded-xl p-5 shadow-sm mb-6'>
          <Heading
            size='sm'
            className='mb-3 text-slate-800 flex-row items-center'
          >
            <Icon
              as={CalendarDaysIcon}
              size='sm'
              className='text-slate-700 mr-2'
            />
            <Text>Campaign Timeline</Text>
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
            <Heading size='sm' className='text-slate-800 flex-row items-center'>
              <Icon as={UsersIcon} size='sm' className='text-slate-700 mr-2' />
              <Text>Members</Text>
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
                        {(member.name || 'User').charAt(0).toUpperCase()}
                      </Text>
                    </Box>
                    <Text className='text-slate-700 font-medium'>
                      {member.name || `Member ${index + 1}`}
                    </Text>
                  </Box>
                  {member.isAdmin && (
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
              onPress={() => router.push(`/campaigns/${id}/members`)}
            >
              <Text className='text-blue-600 font-medium'>
                View All Members
              </Text>
            </Pressable>
          )}
        </Box>

        {/* Recent Contributions */}
        <Box className='bg-white rounded-xl p-5 shadow-sm mb-6'>
          <Heading
            size='sm'
            className='mb-3 text-slate-800 flex-row items-center'
          >
            <Icon as={DollarIcon} size='sm' className='text-slate-700 mr-2' />
            <Text>Recent Contributions</Text>
          </Heading>
          <Divider className='bg-slate-100 mb-4' />

          {campaign.contributions?.length > 0 ? (
            <VStack space='xs' divider={<Divider className='bg-slate-100' />}>
              {campaign.contributions.slice(0, 5).map((contribution, index) => (
                <Box
                  key={contribution.id || index}
                  className='flex-row justify-between py-3 items-center'
                >
                  <Box className='flex-row items-center'>
                    <Box className='w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3'>
                      <Text className='text-green-600 font-semibold'>
                        {(contribution.member?.name || 'User')
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </Box>
                    <Box>
                      <Text className='text-slate-700 font-medium'>
                        {contribution.member?.name || 'Unknown'}
                      </Text>
                      <Text className='text-xs text-slate-500'>
                        {new Date(contribution.date).toLocaleDateString()}
                      </Text>
                    </Box>
                  </Box>
                  <Text className='font-semibold text-green-600'>
                    {formatCurrency(contribution.amount)}
                  </Text>
                </Box>
              ))}
            </VStack>
          ) : (
            <Box className='py-8 items-center'>
              <Text className='text-slate-500 text-center'>
                No contributions yet
              </Text>
              {isAdmin() && (
                <Button
                  className='mt-4 bg-green-600 rounded-lg'
                  size='sm'
                  onPress={() => router.push(`/campaigns/${id}/contribute`)}
                >
                  <ButtonText>Add First Contribution</ButtonText>
                </Button>
              )}
            </Box>
          )}

          {campaign.contributions?.length > 5 && (
            <Pressable
              className='mt-3 items-center py-2 bg-slate-50 rounded-lg'
              onPress={() => router.push(`/campaigns/${id}/contributions`)}
            >
              <Text className='text-blue-600 font-medium'>
                View All Contributions
              </Text>
            </Pressable>
          )}
        </Box>
      </Box>
    </ScrollView>
  );
}
