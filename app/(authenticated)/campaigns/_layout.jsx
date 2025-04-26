import React from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';

export default function CampaignsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='[id]' options={{ title: 'Campaign Details' }} />
    </Stack>
  );
}
