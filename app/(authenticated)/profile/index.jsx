import '../../../assets/global.css';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  ButtonText,
  Text,
  Heading,
  VStack,
  Input,
  InputField,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@gluestack-ui/themed';
import { useAuth } from '../../../context/AuthContext';
import { AuthService } from '../../../services/auth-service';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const { user: authUser } = useAuth(); // Get current authenticated user

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // If we have a user in auth context, start with that
        if (authUser) {
          setUser(authUser);
          setName(authUser.name || '');
          setEmail(authUser.email || '');
          setPhone(authUser.phone || '');
        }

        // Then fetch full profile details
        const userData = await AuthService.getCurrentUser();
        if (userData) {
          setUser(userData);
          setName(userData.name || '');
          setEmail(userData.email || '');
          setPhone(userData.phone || '');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [authUser]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const updatedUser = await AuthService.updateProfile({
        name,
        phone,
      });
      setUser(updatedUser);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <Box className='h-full p-4 justify-center items-center'>
        <Text>Loading profile...</Text>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box className='h-full p-4 justify-center items-center'>
        <Text>Failed to load profile</Text>
      </Box>
    );
  }
  console.log('User profile:', user);
  return (
    <Box className='h-full p-4'>
      <VStack space='md' className='w-full'>
        <Heading size='xl'>My Profile</Heading>

        <Box className='bg-white rounded-lg shadow-sm p-4 mt-4'>
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Full Name</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                value={name}
                onChangeText={setName}
                editable={editing}
              />
            </Input>
          </FormControl>

          <FormControl className='mt-4'>
            <FormControlLabel>
              <FormControlLabelText>Email</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                value={email}
                onChangeText={setEmail}
                editable={false}
                keyboardType='email-address'
              />
            </Input>
          </FormControl>

          <FormControl className='mt-4'>
            <FormControlLabel>
              <FormControlLabelText>Phone</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                value={phone}
                onChangeText={setPhone}
                editable={editing}
                keyboardType='phone-pad'
              />
            </Input>
          </FormControl>

          <Box className='mt-6'>
            {editing ? (
              <Box className='flex-row gap-4'>
                <Button
                  onPress={handleSave}
                  disabled={loading}
                  className='flex-1'
                >
                  <ButtonText>{loading ? 'Saving...' : 'Save'}</ButtonText>
                </Button>
                <Button
                  onPress={() => setEditing(false)}
                  variant='outline'
                  className='flex-1'
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
              </Box>
            ) : (
              <Button onPress={() => setEditing(true)}>
                <ButtonText>Edit Profile</ButtonText>
              </Button>
            )}
          </Box>
        </Box>

        <Box className='bg-white rounded-lg shadow-sm p-4 mt-4'>
          <Heading size='sm'>Account Information</Heading>
          <Box className='flex-row justify-between mt-4'>
            <Text className='text-gray-500'>Member Since</Text>
            <Text>{new Date(user.createdAt).toLocaleDateString()}</Text>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
}
