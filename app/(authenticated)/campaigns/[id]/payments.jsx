import '../../../../assets/global.css';
import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, ActivityIndicator } from 'react-native';
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
  Input,
  InputField,
  FormControl,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AlertIcon,
  CloseIcon,
} from '@gluestack-ui/themed';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { CampaignService } from '../../../../services/campaign-service';
import { useAuth } from '../../../../context/AuthContext';
import { Feather } from '@expo/vector-icons';

export default function PaymentSchedule() {
  const { id } = useLocalSearchParams();
  const pathname = usePathname();
  const campaignId = id || pathname.split('/')[2];
  const router = useRouter();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [makingPayment, setMakingPayment] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      const data = await CampaignService.getCampaign(campaignId);
      if (data) {
        setCampaign(data);
        // Set default payment amount
        setPaymentAmount(data.contribution_amount?.toString() || '');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      setErrorMsg('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    if (!campaign || !user) return false;
    const currentMember = campaign.members.find(
      (member) => member.user_id === user.id || member.user?.id === user.id
    );
    return currentMember?.is_admin || false;
  };

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
      month: 'long',
    });
  };

  const isPastDue = (month) => {
    const now = new Date();
    const monthDate = new Date(month);
    // Set both dates to the beginning of the month for comparison
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return monthDate < now;
  };

  const handlePayment = (memberId) => {
    setSelectedMemberId(memberId);
    setPaymentAmount(campaign.contribution_amount?.toString() || '');
    setPaymentNote('');
    setShowPayModal(true);
  };

  const handleMakePayment = async () => {
    if (
      !paymentAmount ||
      isNaN(parseFloat(paymentAmount)) ||
      parseFloat(paymentAmount) <= 0
    ) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }

    // Confirm with the user before proceeding
    Alert.alert(
      'Confirm Payment',
      `Are you sure you want to make a payment of ${formatCurrency(
        parseFloat(paymentAmount)
      )}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Pay',
          onPress: async () => {
            setMakingPayment(true);
            setErrorMsg('');

            try {
              // Get the recipient user to display in success message
              const recipient = campaign.members.find(
                (m) => m._id === selectedMemberId
              );
              const recipientName = recipient?.user?.name || 'the recipient';

              const contribution = {
                amount: parseFloat(paymentAmount),
                contributor_id: user.id,
                recipient_id: selectedMemberId,
                notes: paymentNote || 'Monthly contribution',
              };

              await CampaignService.recordContribution(
                campaignId,
                contribution
              );
              setSuccessMsg(
                `Payment of ${formatCurrency(
                  parseFloat(paymentAmount)
                )} to ${recipientName} recorded successfully`
              );
              setShowPayModal(false);
              await fetchCampaign();
            } catch (error) {
              console.error('Error making payment:', error);
              setErrorMsg(
                error.response?.data?.message ||
                  'Failed to record payment. Please try again.'
              );
            } finally {
              setMakingPayment(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = async (memberId, month) => {
    const memberToMark = campaign.members.find((m) => m._id === memberId);
    const memberName = memberToMark?.user?.name || 'this member';

    Alert.alert(
      'Mark as Paid',
      `Are you sure you want to mark ${memberName}'s payment as received?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              setLoading(true);
              await CampaignService.updateMemberAllocation(
                campaignId,
                memberId,
                null, // Don't change the month
                true // Mark as paid
              );
              setSuccessMsg(`Payment for ${memberName} marked as received`);
              await fetchCampaign();
            } catch (error) {
              console.error('Error updating payment status:', error);
              setErrorMsg(
                error.response?.data?.message ||
                  'Failed to update payment status'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getCurrentMonthRecipient = () => {
    if (!campaign || !campaign.members) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return campaign.members.find((member) => {
      if (!member.allocated_month) return false;
      const allocation = new Date(member.allocated_month);
      return (
        allocation.getFullYear() === currentYear &&
        allocation.getMonth() === currentMonth
      );
    });
  };

  if (loading) {
    return (
      <Box className='h-full p-4 justify-center items-center'>
        <Text>Loading payment schedule...</Text>
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

  // Sort members by allocated month
  const allocatedMembers = campaign.members
    .filter((m) => m.allocated_month)
    .sort((a, b) => new Date(a.allocated_month) - new Date(b.allocated_month));

  const unallocatedMembers = campaign.members.filter((m) => !m.allocated_month);

  // Get current user's payment obligations
  const currentUserMember = campaign.members.find(
    (member) => member.user_id === user.id || member.user?.id === user.id
  );

  // Determine if user has already contributed this month
  const hasContributedThisMonth = () => {
    if (!campaign.contributions || !currentUserMember) return false;

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return campaign.contributions.some((contribution) => {
      const contributionDate = new Date(contribution.created_at);
      return (
        contribution.contributor_id === currentUserMember.user_id &&
        contributionDate >= currentMonthStart
      );
    });
  };

  return (
    <ScrollView className='bg-slate-50'>
      <Box className='p-5'>
        {/* Header */}
        <Box className='mb-6'>
          <HStack className='justify-between items-center mb-2'>
            <Heading size='xl' className='text-slate-800 font-bold flex-1 mr-2'>
              Payment Schedule
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
          </HStack>

          <Text className='text-slate-600 mb-2'>{campaign.name}</Text>

          <HStack className='space-x-2 items-center mb-4'>
            <Badge className='bg-blue-50 border border-blue-100'>
              <BadgeText className='text-blue-700 text-xs'>
                {formatCurrency(campaign.contribution_amount)} / member
              </BadgeText>
            </Badge>

            <Badge className='bg-purple-50 border border-purple-100'>
              <BadgeText className='text-purple-700 text-xs'>
                {formatCurrency(campaign.target_amount)} total
              </BadgeText>
            </Badge>
          </HStack>

          {errorMsg ? (
            <Box className='mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex-row items-center justify-between'>
              <Text className='text-red-700'>{errorMsg}</Text>
              <Pressable onPress={() => setErrorMsg('')}>
                <Icon as={CloseIcon} size='xs' color='#B91C1C' />
              </Pressable>
            </Box>
          ) : null}

          {successMsg ? (
            <Box className='mb-4 p-3 bg-green-50 border border-green-100 rounded-md flex-row items-center justify-between'>
              <Text className='text-green-700'>{successMsg}</Text>
              <Pressable onPress={() => setSuccessMsg('')}>
                <Icon as={CloseIcon} size='xs' color='#047857' />
              </Pressable>
            </Box>
          ) : null}
        </Box>

        {/* Payment Summary Card */}
        <Box className='bg-white rounded-xl p-5 shadow-sm mb-6'>
          <Heading size='sm' className='mb-3 text-slate-800'>
            <HStack space='2' alignItems='center'>
              <Icon
                as={Feather}
                name='dollar-sign'
                size='sm'
                className='text-slate-700'
              />
              <Text>Payment Summary</Text>
            </HStack>
          </Heading>
          <Divider className='bg-slate-100 mb-4' />

          <VStack space='sm'>
            <Box className='flex-row justify-between'>
              <Text className='text-slate-500'>Contribution per Member</Text>
              <Text className='text-slate-800 font-bold'>
                {formatCurrency(campaign.contribution_amount || 0)}
              </Text>
            </Box>

            <Box className='flex-row justify-between'>
              <Text className='text-slate-500'>Total Contributed</Text>
              <Text className='text-slate-800 font-medium'>
                {formatCurrency(
                  campaign.contributions?.reduce(
                    (sum, c) => sum + c.amount,
                    0
                  ) || 0
                )}
              </Text>
            </Box>

            <Box className='flex-row justify-between'>
              <Text className='text-slate-500'>Your Contribution Status</Text>
              {hasContributedThisMonth() ? (
                <Badge className='bg-green-50 border border-green-100'>
                  <BadgeText className='text-green-700 text-xs'>
                    Paid for this month
                  </BadgeText>
                </Badge>
              ) : (
                <Badge className='bg-yellow-50 border border-yellow-100'>
                  <BadgeText className='text-yellow-700 text-xs'>
                    Payment Due
                  </BadgeText>
                </Badge>
              )}
            </Box>
          </VStack>

          {!hasContributedThisMonth() && (
            <Button
              className='mt-4 bg-blue-600'
              onPress={() => {
                const currentRecipient = getCurrentMonthRecipient();
                if (currentRecipient) {
                  handlePayment(currentRecipient._id);
                } else {
                  Alert.alert(
                    'No Recipient Found',
                    'There is no member allocated to receive payment this month.',
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <HStack space='2' alignItems='center'>
                <Icon as={Feather} name='credit-card' size='sm' color='white' />
                <ButtonText>Make This Month's Payment</ButtonText>
              </HStack>
            </Button>
          )}
        </Box>

        {/* Payment Schedule */}
        <Box className='bg-white rounded-xl p-5 shadow-sm mb-6'>
          <Heading size='sm' className='mb-3 text-slate-800'>
            <HStack space='2' alignItems='center'>
              <Icon
                as={Feather}
                name='calendar'
                size='sm'
                className='text-slate-700'
              />
              <Text>Payment Schedule</Text>
            </HStack>
          </Heading>
          <Divider className='bg-slate-100 mb-4' />

          {allocatedMembers.length > 0 ? (
            allocatedMembers.map((member, index) => {
              const isCurrentMonth = () => {
                const now = new Date();
                const allocationMonth = new Date(member.allocated_month);
                return (
                  allocationMonth.getMonth() === now.getMonth() &&
                  allocationMonth.getFullYear() === now.getFullYear()
                );
              };

              return (
                <Box key={member._id} className='py-3 border-b border-gray-100'>
                  <HStack className='justify-between items-center'>
                    <HStack className='items-center space-x-3'>
                      <Box
                        className={`w-10 h-10 rounded-full ${
                          isCurrentMonth() ? 'bg-blue-500' : 'bg-blue-100'
                        } items-center justify-center`}
                      >
                        <Text
                          className={`${
                            isCurrentMonth() ? 'text-white' : 'text-blue-600'
                          } font-semibold`}
                        >
                          {index + 1}
                        </Text>
                      </Box>
                      <VStack>
                        <Text className='font-medium text-gray-800'>
                          {member.user?.name || 'Unknown User'}
                        </Text>
                        <HStack space='2' alignItems='center'>
                          <Text className='text-gray-500 text-sm'>
                            {formatDate(member.allocated_month)}
                          </Text>
                          {isPastDue(member.allocated_month) &&
                            !member.has_received_payout && (
                              <Badge
                                backgroundColor='$red50'
                                borderColor='$red100'
                                className='bg-red-50 border border-red-100'
                              >
                                <BadgeText
                                  color='$red700'
                                  className='text-red-700 text-xs'
                                >
                                  Past Due
                                </BadgeText>
                              </Badge>
                            )}
                          {member.has_received_payout && (
                            <Badge
                              backgroundColor='$green50'
                              borderColor='$green100'
                              className='bg-green-50 border border-green-100'
                            >
                              <BadgeText
                                color='$green700'
                                className='text-green-700 text-xs'
                              >
                                Paid
                              </BadgeText>
                            </Badge>
                          )}
                          {isCurrentMonth() && (
                            <Badge className='bg-blue-50 border border-blue-100'>
                              <BadgeText className='text-blue-700 text-xs'>
                                Current Month
                              </BadgeText>
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>

                    <HStack space='2'>
                      {isAdmin() && !member.has_received_payout && (
                        <Button
                          size='sm'
                          variant='outline'
                          onPress={() =>
                            handleMarkAsPaid(member._id, member.allocated_month)
                          }
                          className='border-green-500'
                        >
                          <HStack space='1' alignItems='center'>
                            <Icon
                              as={Feather}
                              name='check'
                              size='xs'
                              color='#10B981'
                            />
                            <ButtonText className='text-green-500'>
                              Mark Paid
                            </ButtonText>
                          </HStack>
                        </Button>
                      )}

                      {member.user_id !== user.id &&
                        !hasContributedThisMonth() &&
                        isCurrentMonth() && (
                          <Button
                            size='sm'
                            className='bg-blue-600'
                            onPress={() => handlePayment(member._id)}
                          >
                            <HStack space='1' alignItems='center'>
                              <Icon
                                as={Feather}
                                name='credit-card'
                                size='xs'
                                color='white'
                              />
                              <ButtonText>Pay</ButtonText>
                            </HStack>
                          </Button>
                        )}
                    </HStack>
                  </HStack>
                </Box>
              );
            })
          ) : (
            <Box className='py-4 items-center'>
              <Text className='text-slate-500'>
                No allocated payment months yet
              </Text>
            </Box>
          )}

          {unallocatedMembers.length > 0 && (
            <>
              <Heading size='xs' className='mt-6 mb-2 text-slate-500'>
                Members Without Allocated Month
              </Heading>

              {unallocatedMembers.map((member) => (
                <Box key={member._id} className='py-3 border-b border-gray-100'>
                  <HStack className='justify-between items-center'>
                    <HStack className='items-center space-x-3'>
                      <Box className='w-10 h-10 rounded-full bg-gray-100 items-center justify-center'>
                        <Text className='text-gray-600 font-semibold'>
                          {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </Box>
                      <VStack>
                        <Text className='font-medium text-gray-800'>
                          {member.user?.name || 'Unknown User'}
                        </Text>
                        <Text className='text-gray-500 text-sm'>
                          No month allocated
                        </Text>
                      </VStack>
                    </HStack>

                    {isAdmin() && (
                      <Button
                        size='sm'
                        variant='outline'
                        onPress={() =>
                          router.push(`/campaigns/${campaignId}/members`)
                        }
                      >
                        <ButtonText>Allocate Month</ButtonText>
                      </Button>
                    )}
                  </HStack>
                </Box>
              ))}
            </>
          )}
        </Box>

        {/* Recent Payment Activity */}
        <Box className='bg-white rounded-xl p-5 shadow-sm mb-6'>
          <Heading size='sm' className='mb-3 text-slate-800'>
            <HStack space='2' alignItems='center'>
              <Icon
                as={Feather}
                name='activity'
                size='sm'
                className='text-slate-700'
              />
              <Text>Recent Payment Activity</Text>
            </HStack>
          </Heading>
          <Divider className='bg-slate-100 mb-4' />

          {campaign.contributions && campaign.contributions.length > 0 ? (
            campaign.contributions
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 10)
              .map((contribution) => {
                const contributor = campaign.members.find(
                  (m) =>
                    m.user_id === contribution.contributor_id ||
                    m.user?.id === contribution.contributor_id
                );
                const recipient = campaign.members.find(
                  (m) =>
                    m.user_id === contribution.recipient_id ||
                    m.user?.id === contribution.recipient_id
                );

                return (
                  <Box
                    key={contribution._id}
                    className='py-3 border-b border-gray-100'
                  >
                    <HStack className='justify-between items-start'>
                      <VStack>
                        <HStack space='1'>
                          <Text className='font-medium text-gray-800'>
                            {contributor?.user?.name || 'Unknown User'}
                          </Text>
                          <Text className='text-gray-500'>paid</Text>
                          <Text className='font-medium text-gray-800'>
                            {recipient?.user?.name || 'Unknown User'}
                          </Text>
                        </HStack>
                        <Text className='text-gray-500 text-sm'>
                          {new Date(contribution.created_at).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </Text>
                        {contribution.notes && (
                          <Text className='text-gray-500 text-sm mt-1 italic'>
                            "{contribution.notes}"
                          </Text>
                        )}
                      </VStack>
                      <Text className='font-bold text-blue-600'>
                        {formatCurrency(contribution.amount)}
                      </Text>
                    </HStack>
                  </Box>
                );
              })
          ) : (
            <Box className='py-4 items-center'>
              <Text className='text-slate-500'>No payment activity yet</Text>
            </Box>
          )}
        </Box>

        {/* Navigation buttons */}
        <HStack space='3' className='mt-2'>
          <Button
            className='flex-1'
            variant='outline'
            onPress={() => router.push(`/campaigns/${campaignId}`)}
          >
            <HStack space='2' alignItems='center'>
              <Icon as={Feather} name='chevron-left' size='sm' />
              <ButtonText>Back to Campaign</ButtonText>
            </HStack>
          </Button>

          <Button
            className='flex-1'
            variant='outline'
            onPress={() => router.push(`/campaigns/${campaignId}/members`)}
          >
            <HStack space='2' alignItems='center'>
              <Icon as={Feather} name='users' size='sm' />
              <ButtonText>Members</ButtonText>
            </HStack>
          </Button>
        </HStack>
      </Box>

      {/* Make Payment Modal */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)}>
        <ModalBackdrop />
        <ModalContent className='mx-4 bg-white rounded-xl'>
          <ModalHeader>
            <Heading size='md'>Make Payment</Heading>
          </ModalHeader>
          <ModalBody>
            <Text className='text-gray-600 mb-4'>
              Make your contribution for this month.
            </Text>

            {errorMsg ? (
              <Box className='mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex-row items-center'>
                <AlertIcon className='text-red-500 mr-2' />
                <Text className='text-red-700 flex-1'>{errorMsg}</Text>
              </Box>
            ) : null}

            <FormControl className='mb-4'>
              <Text className='text-gray-700 font-medium mb-2'>
                Payment Amount:
              </Text>
              <Input className='bg-gray-50 border border-gray-200 rounded-md'>
                <InputField
                  placeholder='Enter amount'
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType='numeric'
                />
              </Input>
            </FormControl>

            <FormControl className='mb-4'>
              <Text className='text-gray-700 font-medium mb-2'>
                Note (optional):
              </Text>
              <Input className='bg-gray-50 border border-gray-200 rounded-md'>
                <InputField
                  placeholder='Add a note'
                  value={paymentNote}
                  onChangeText={setPaymentNote}
                />
              </Input>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <HStack className='gap-2'>
              <Button
                variant='outline'
                action='secondary'
                onPress={() => setShowPayModal(false)}
                className='flex-1'
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                onPress={handleMakePayment}
                disabled={makingPayment}
                className='flex-1 bg-blue-600'
              >
                <HStack space='2' alignItems='center'>
                  {makingPayment && (
                    <ActivityIndicator size='small' color='white' />
                  )}
                  <ButtonText>
                    {makingPayment ? 'Processing...' : 'Pay Now'}
                  </ButtonText>
                </HStack>
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ScrollView>
  );
}
