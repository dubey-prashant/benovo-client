import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Icon, InfoIcon, ChatIcon, UsersIcon } from '@gluestack-ui/themed';
import { CampaignService } from '@/services/campaign-service';
import { useLocalSearchParams } from 'expo-router';

export default function CampaignTabLayout() {
  const { id } = useLocalSearchParams();
  const [campaign, setCampaign] = useState(null);

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
      }
    };

    fetchCampaign();
  }, [id]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb', // blue-600
        tabBarInactiveTintColor: '#64748b', // slate-500
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#e2e8f0', // slate-200
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerTitle: campaign?.name || 'Campaign Details',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Details',
          tabBarIcon: ({ color }) => (
            <Icon as={InfoIcon} size='sm' color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='chat'
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <Icon as={ChatIcon} size='sm' color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='members'
        options={{
          title: 'Members',
          tabBarIcon: ({ color }) => (
            <Icon as={UsersIcon} size='sm' color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
