import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Button,
  ButtonText,
  Text,
  Heading,
  VStack,
  Divider,
  Badge,
  BadgeText,
  Icon,
  UsersIcon,
} from '@gluestack-ui/themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CampaignService } from '@/services/campaign-service';
import { useAuth } from '../../../../context/AuthContext';

export default function CampaignMembers() {
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
          setCampaign(data);
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const isAdmin = () => {
    if (!campaign || !user) return false;
    const member = campaign?.members?.find((m) => m.user_id === user._id);
    return member?.isAdmin || false;
  };

  if (loading) {
    return (
      <Box className='h-full p-4 justify-center items-center'>
        <Text>Loading members...</Text>
      </Box>
    );
  }

  return (
    <ScrollView className='bg-slate-50'>
      <Box className='p-5'>
        <Box className='bg-white rounded-xl p-5 shadow-sm mb-6'>
          <Box className='flex-row justify-between items-center mb-3'>
            <Heading size='sm' className='text-slate-800'>
              Campaign Members
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
                    <Box className='w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3'>
                      <Text className='text-blue-600 font-semibold'>
                        {(member.name || 'User').charAt(0).toUpperCase()}
                      </Text>
                    </Box>
                    <Box>
                      <Text className='text-slate-700 font-medium'>
                        {member.name || `Member ${index + 1}`}
                      </Text>
                      <Text className='text-xs text-slate-500'>
                        {member.email || member.phone || 'No contact info'}
                      </Text>
                    </Box>
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
            <Box className='py-8 items-center'>
              <Text className='text-slate-500 text-center'>No members yet</Text>
              {isAdmin() && (
                <Button
                  className='mt-4 bg-blue-600 rounded-lg'
                  size='sm'
                  onPress={() => router.push(`/campaigns/${id}/members/add`)}
                >
                  <ButtonText>Invite Members</ButtonText>
                </Button>
              )}
            </Box>
          )}

          {isAdmin() && campaign.members?.length > 0 && (
            <Button
              className='mt-4 bg-blue-600 rounded-lg'
              onPress={() => router.push(`/campaigns/${id}/members/add`)}
            >
              <ButtonText>Invite More Members</ButtonText>
            </Button>
          )}
        </Box>
      </Box>
    </ScrollView>
  );
}
