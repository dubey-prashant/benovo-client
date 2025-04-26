import '../../../assets/global.css';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Box,
  Button,
  ButtonText,
  Text,
  Heading,
  VStack,
  Switch,
} from '@gluestack-ui/themed';
import { useAuth } from '../../../context/AuthContext';

export default function Settings() {
  const router = useRouter();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className='h-full p-4'>
      <VStack space='md' className='w-full'>
        <Heading size='xl'>Settings</Heading>

        <Box className='bg-white rounded-lg shadow-sm p-4 mt-4'>
          <Heading size='sm' className='mb-4'>
            Notifications
          </Heading>

          <Box className='flex-row justify-between items-center mb-4'>
            <Text>Push Notifications</Text>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
          </Box>

          <Box className='flex-row justify-between items-center'>
            <Text>Email Notifications</Text>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />
          </Box>
        </Box>

        <Box className='bg-white rounded-lg shadow-sm p-4 mt-4'>
          <Heading size='sm' className='mb-4'>
            Appearance
          </Heading>

          <Box className='flex-row justify-between items-center'>
            <Text>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </Box>
        </Box>

        <Box className='bg-white rounded-lg shadow-sm p-4 mt-4'>
          <Heading size='sm' className='mb-4'>
            Account
          </Heading>

          <Button
            variant='outline'
            action='negative'
            className='mt-2'
            onPress={handleLogout}
            disabled={loading}
          >
            <ButtonText>{loading ? 'Logging out...' : 'Logout'}</ButtonText>
          </Button>
        </Box>

        <Box className='items-center mt-8'>
          <Text className='text-gray-500'>App Version 1.0.0</Text>
        </Box>
      </VStack>
    </Box>
  );
}
