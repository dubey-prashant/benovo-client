import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Box,
  Button,
  ButtonText,
  Text,
  Heading,
  VStack,
  HStack,
  Divider,
  Icon,
  ChatIcon,
  SendIcon,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  Pressable,
} from '@gluestack-ui/themed';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { CampaignService } from '@/services/campaign-service';
import { useAuth } from '../../../../context/AuthContext';
import { ChatService } from '../../../../services/chat-service';
import { SocketService } from '../../../../services/socket-service';

export default function CampaignChat() {
  const { id } = useLocalSearchParams();
  const pathname = usePathname();

  // Extract ID from pathname as fallback
  const campaignId = id || pathname.split('/')[2];

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const scrollViewRef = useRef(null);
  const socketRef = useRef(null);
  const { user } = useAuth();

  // Format date to a readable format
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return (
        date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        }) +
        ' at ' +
        date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const setupSocket = async () => {
      // Connect to socket
      const socket = await SocketService.connect();
      socketRef.current = socket;

      if (socket) {
        // Join campaign room
        SocketService.joinCampaignRoom(campaignId);

        // Subscribe to messages
        const unsubscribe = SocketService.subscribeToCampaignMessages(
          (message) => {
            setMessages((prevMessages) => {
              // Use _id for MongoDB documents or create a composite key
              const messageId =
                message._id || `${message.user_id}-${message.timestamp}`;

              // Check if message with this ID already exists
              if (
                prevMessages.some(
                  (m) =>
                    m._id === messageId ||
                    (m.user_id === message.user_id &&
                      m.timestamp === message.timestamp)
                )
              ) {
                return prevMessages;
              }

              // Add new message
              return [...prevMessages, message];
            });

            // Scroll to bottom
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        );

        return unsubscribe;
      }
    };

    const setup = setupSocket();

    // Clean up
    return () => {
      setup
        .then((unsubscribe) => {
          if (unsubscribe) unsubscribe();
        })
        .catch((err) => console.error('Error in socket cleanup:', err));

      SocketService.leaveCampaignRoom(campaignId);
    };
  }, [campaignId, user]);

  // Fetch campaign data and chat history
  useEffect(() => {
    const fetchCampaignAndMessages = async () => {
      if (!campaignId) return;
      try {
        // Fetch campaign data
        const campaignData = await CampaignService.getCampaign(campaignId);
        if (campaignData) {
          setCampaign(campaignData);
        }

        // Fetch chat messages
        const chatHistory = await ChatService.getChatMessages(campaignId);
        if (chatHistory && chatHistory.messages) {
          setMessages(chatHistory.messages);
          // Scroll to bottom after messages load
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }, 300);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignAndMessages();
  }, [campaignId]);

  // Send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || sendingMessage) return;

    setSendingMessage(true);
    try {
      const messageData = {
        campaign_id: campaignId,
        user_id: user._id,
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      // 1. Save message to database first to get a message ID
      const result = await ChatService.sendMessage(messageData);

      if (result.message) {
        // 2. Send through socket with the ID for real-time updates
        SocketService.sendCampaignMessage(campaignId, result.message);
      }

      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Check if a message is from the current user
  const isOwnMessage = (message) => {
    console.log('Message:', message, user);
    return message.user_id?._id === user?._id;
  };

  // Find user's name from campaign members
  const getUserName = (userId) => {
    console.log('Campaign:', campaign.members);
    if (!campaign || !campaign.members) return 'Unknown User';
    const member = campaign.members.find((m) => m.user_id?._id === userId);
    return member ? member.name : 'Unknown User';
  };

  // if (loading) {
  //   return (
  //     <Box className='h-full p-4 justify-center items-center'>
  //       <Text>Loading chat...</Text>
  //     </Box>
  //   );
  // }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className='flex-1'
    >
      <Box className='flex-1 bg-slate-50'>
        {messages.length === 0 ? (
          // Empty state
          <Box className='items-center justify-center h-4/5'>
            <Icon as={ChatIcon} size='xl' className='text-slate-300 mb-4' />
            <Text className='text-slate-500 text-center mb-2'>
              No messages yet
            </Text>
            <Text className='text-slate-400 text-center text-sm mb-6 max-w-xs'>
              Start the conversation with your campaign members to discuss
              contributions and updates
            </Text>
          </Box>
        ) : (
          // Chat messages
          <ScrollView
            ref={scrollViewRef}
            className='flex-1 pt-4 px-4'
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {messages.map((message, index) => (
              <Box
                key={message._id || index}
                className={`mb-4 max-w-[85%] ${
                  isOwnMessage(message) ? 'self-end ml-auto' : 'self-start'
                }`}
              >
                <HStack
                  className={`items-end mb-1 ${
                    isOwnMessage(message) ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isOwnMessage(message) && (
                    <Box className='w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2'>
                      <Text className='text-blue-600 font-semibold'>
                        {getInitials(getUserName(message.user_id))}
                      </Text>
                    </Box>
                  )}

                  <Box
                    className={`p-3 rounded-xl ${
                      isOwnMessage(message)
                        ? 'bg-blue-600 rounded-br-none'
                        : 'bg-white border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {!isOwnMessage(message) && (
                      <Text className='text-xs text-slate-600 font-medium mb-1'>
                        {getUserName(message.user_id)}
                      </Text>
                    )}
                    <Text
                      className={
                        isOwnMessage(message) ? 'text-white' : 'text-slate-800'
                      }
                    >
                      hi
                      {message.text}
                    </Text>
                  </Box>
                </HStack>

                <Text
                  className={`text-xs text-slate-500 ${
                    isOwnMessage(message) ? 'text-right mr-1' : 'ml-10'
                  }`}
                >
                  {formatMessageTime(message.timestamp)}
                </Text>
              </Box>
            ))}
          </ScrollView>
        )}

        {/* Message input */}
        <Box className='p-3 bg-white border-t border-slate-200'>
          <Input
            className='bg-slate-50 rounded-full border border-slate-200'
            size='md'
          >
            <InputField
              placeholder='Type a message...'
              value={newMessage}
              onChangeText={setNewMessage}
              onSubmitEditing={handleSendMessage}
              multiline={false}
              className='py-2 pr-12'
            />
            <InputSlot>
              <Pressable
                onPress={handleSendMessage}
                disabled={sendingMessage || !newMessage.trim()}
                className={`h-8 w-8 rounded-full items-center justify-center mr-1 ${
                  !newMessage.trim() ? 'bg-slate-200' : 'bg-blue-600'
                }`}
              >
                <InputIcon
                  as={SendIcon}
                  className={
                    !newMessage.trim() ? 'text-slate-400' : 'text-white'
                  }
                />
              </Pressable>
            </InputSlot>
          </Input>
        </Box>
      </Box>
    </KeyboardAvoidingView>
  );
}
