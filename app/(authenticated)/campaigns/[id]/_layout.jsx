import React, { useState, useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CampaignService } from '@/services/campaign-service';
import { useLocalSearchParams } from 'expo-router';

export default function CampaignTabLayout() {
  const { id } = useLocalSearchParams();
  const pathname = usePathname();

  // Extract ID from pathname as fallback
  const campaignId = id || pathname.split('/')[2];

  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return;
      try {
        const data = await CampaignService.getCampaign(campaignId);
        if (data) {
          setCampaign(data);
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      }
    };

    fetchCampaign();
  }, [campaignId]);

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
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Details',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name='information-circle-outline'
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='chat'
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name='chatbubble-outline'
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='members'
        options={{
          title: 'Members',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='people-outline' size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='payments'
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='wallet-outline' size={size || 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
