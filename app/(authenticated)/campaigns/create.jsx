import '../../../assets/global.css';
import React, { useState } from 'react';
import {
  Box,
  VStack,
  Input,
  InputField,
  Button,
  ButtonText,
  Text,
  Heading,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
  Card,
  Icon,
  AlertCircleIcon,
  Divider,
} from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { CampaignService } from '../../../services/campaign-service';
import { useAuth } from '../../../context/AuthContext';

export default function CreateCampaign() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [membersCount, setMembersCount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { user } = useAuth();

  const handleCreateCampaign = async () => {
    if (!name || !description || !targetAmount || !membersCount) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    if (!user || !user.id) {
      setErrorMsg('You must be logged in to create a campaign');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const target = parseFloat(targetAmount);
      const max_members = parseInt(membersCount);

      // Add validation
      if (isNaN(target) || target <= 0) {
        setErrorMsg('Please enter a valid target amount greater than zero');
        setLoading(false);
        return;
      }

      if (isNaN(max_members) || max_members < 2) {
        setErrorMsg('Please enter at least 2 members');
        setLoading(false);
        return;
      }

      const contributionPerMember = target / max_members;

      // Calculate end date based on frequency and member count
      let endDate = new Date();
      if (frequency === 'daily') {
        endDate.setDate(endDate.getDate() + max_members);
      } else if (frequency === 'weekly') {
        endDate.setDate(endDate.getDate() + max_members * 7);
      } else {
        endDate.setMonth(endDate.getMonth() + max_members);
      }

      const newCampaign = {
        name,
        description,
        target_amount: target,
        contribution_amount: parseFloat(contributionPerMember.toFixed(2)),
        frequency,
        start_date: new Date().toISOString(), // Changed from startDate to start_date
        end_date: endDate.toISOString(), // Changed from endDate to end_date
        status: 'active',
        max_members: max_members,
        user_id: user.id, // For createCampaign which expects user_id
      };

      const campaign = await CampaignService.createCampaign(newCampaign);

      // Update the router path to include the authenticated group
      router.push(`/campaigns/${campaign._id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      if (error.code === '23505') {
        setErrorMsg('You are already a member of this campaign');
      } else {
        setErrorMsg('Failed to create campaign. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className='min-h-screen bg-slate-100 p-4 md:p-6 flex items-center justify-center'>
      <Card className='w-full max-w-2xl bg-white rounded-xl shadow-md p-8'>
        <VStack space='lg' className='w-full'>
          <Box className='mb-2'>
            <Heading size='xl' className='text-blue-700 mb-3'>
              Create New Campaign
            </Heading>
            <Text className='text-slate-600'>
              Set up your self-help benevolent campaign
            </Text>
            <Divider className='my-4 bg-slate-200' />
          </Box>

          {errorMsg ? (
            <Box className='bg-red-50 border border-red-200 rounded-lg p-4 flex flex-row items-center gap-2'>
              <Icon as={AlertCircleIcon} className='text-red-600' />
              <Text className='text-red-600 flex-1'>{errorMsg}</Text>
            </Box>
          ) : null}

          <FormControl className='mb-4'>
            <FormControlLabel>
              <FormControlLabelText className='font-semibold text-slate-700 mb-1'>
                Campaign Name
              </FormControlLabelText>
            </FormControlLabel>
            <Input className='bg-slate-50 border border-slate-200 rounded-lg'>
              <InputField
                placeholder='Enter campaign name'
                value={name}
                onChangeText={setName}
                className='p-3.5'
              />
            </Input>
          </FormControl>

          <FormControl className='mb-4'>
            <FormControlLabel>
              <FormControlLabelText className='font-semibold text-slate-700 mb-1'>
                Description
              </FormControlLabelText>
            </FormControlLabel>
            <Input className='bg-slate-50 border border-slate-200 rounded-lg'>
              <InputField
                placeholder='Enter campaign description'
                value={description}
                onChangeText={setDescription}
                className='p-3.5'
              />
            </Input>
          </FormControl>

          <FormControl className='mb-4'>
            <FormControlLabel>
              <FormControlLabelText className='font-semibold text-slate-700 mb-1'>
                Target Amount
              </FormControlLabelText>
            </FormControlLabel>
            <Input className='bg-slate-50 border border-slate-200 rounded-lg'>
              <InputField
                placeholder='Total target amount'
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType='numeric'
                className='p-3.5'
              />
            </Input>
          </FormControl>

          <FormControl className='mb-4'>
            <FormControlLabel>
              <FormControlLabelText className='font-semibold text-slate-700 mb-1'>
                Number of Members
              </FormControlLabelText>
            </FormControlLabel>
            <Input className='bg-slate-50 border border-slate-200 rounded-lg'>
              <InputField
                placeholder='Number of participants'
                value={membersCount}
                onChangeText={setMembersCount}
                keyboardType='numeric'
                className='p-3.5'
              />
            </Input>
          </FormControl>

          <Divider className='my-4 bg-slate-200' />

          <Button
            onPress={handleCreateCampaign}
            disabled={loading}
            className=' '
            size='lg'
          >
            <ButtonText className='font-semibold text-white'>
              {loading ? 'Creating...' : 'Create Campaign'}
            </ButtonText>
          </Button>
        </VStack>
      </Card>
    </Box>
  );
}
