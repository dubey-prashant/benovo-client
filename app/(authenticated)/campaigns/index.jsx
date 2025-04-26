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
} from '@gluestack-ui/themed';
import { useRouter, useFocusEffect } from 'expo-router';
import { CampaignService } from '@/services/campaign-service';
import { useAuth } from '../../../context/AuthContext';
import { Feather } from '@expo/vector-icons';

export default function CampaignsList() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      const fetchCampaigns = async () => {
        if (!user || !user.id) {
          console.error('No authenticated user found');
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const data = await CampaignService.getUserCampaigns(user.id);
          console.log('Fetched campaigns:', data);
          setCampaigns(data);
        } catch (error) {
          console.error('Error fetching user campaigns:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchCampaigns();
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

  return (
    <Box className='flex-1 bg-slate-50'>
      <StatusBar barStyle='dark-content' />

      {/* Improved header with better spacing and alignment */}
      <Box className='bg-white border-b border-gray-200 pt-2 pb-2 px-4 shadow-sm flex-row  justify-between items-center'>
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
      ) : campaigns.length === 0 ? (
        <Box className='flex-1 items-center justify-center px-6'>
          <Box className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 items-center max-w-md w-full'>
            <Box className='w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4'>
              <Icon as={Feather} name='flag' size={30} color='#3b82f6' />
            </Box>
            <Heading size='md' className='text-center mb-2'>
              No Campaigns Yet
            </Heading>
            <Text className='text-gray-500 text-center mb-6'>
              Start your first fundraising campaign to track contributions and
              reach your goals together.
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
      ) : (
        <FlatList
          data={campaigns}
          renderItem={renderCampaignCard}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Box>
  );
}
