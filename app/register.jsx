import '../assets/global.css';
import {
  Box,
  Input,
  InputField,
  Button,
  ButtonText,
  Text,
  Heading,
  Link,
  LinkText,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  VStack,
  Icon,
  CloseIcon,
} from '@gluestack-ui/themed';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailError, setEmailError] = useState('');
  const router = useRouter();
  const { signUp, isLoading } = useAuth();

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate email on change
  const handleEmailChange = (text) => {
    setEmail(text);
    if (text && !validateEmail(text)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleRegister = async () => {
    // Clear previous error messages
    setErrorMsg('');

    // Check for required fields
    if (!name || !email || !phone || !password) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    // Validate password strength (optional)
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const userData = {
        email,
        password,
        name,
        phone,
      };

      const result = await signUp(userData);

      if (!result.success) {
        console.log('Registration error:', result.error);
        setErrorMsg(
          typeof result.error === 'string'
            ? result.error
            : 'Registration failed. Please try again.'
        );
      } else {
        // Show confirmation message
        alert(
          'Registration successful! Please check your email for confirmation.'
        );
        router.replace('/');
      }
    } catch (error) {
      setErrorMsg('An unexpected error occurred');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine if we should show loading state (local or global)
  const isButtonLoading = loading || isLoading;

  return (
    <Box className='h-full flex-1 justify-center p-5 bg-slate-50'>
      <Box className='w-full p-6 bg-white rounded-xl shadow-lg border border-gray-100'>
        <Heading size='xl' className='text-center mb-6 text-blue-600'>
          Create Account
        </Heading>

        {errorMsg ? (
          <Box className='bg-red-50 p-3 rounded-lg mb-5 flex-row items-center justify-between'>
            <Text className='text-red-600'>{errorMsg}</Text>
            <Icon as={CloseIcon} size='sm' onPress={() => setErrorMsg('')} />
          </Box>
        ) : null}

        <VStack space='md'>
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText className='font-medium mb-1'>
                Full Name
              </FormControlLabelText>
            </FormControlLabel>
            <Input className='bg-gray-50 border border-gray-200 rounded-md px-1'>
              <InputField
                placeholder='Enter your full name'
                value={name}
                onChangeText={setName}
                className='h-12'
              />
            </Input>
          </FormControl>

          <FormControl isInvalid={!!emailError}>
            <FormControlLabel>
              <FormControlLabelText className='font-medium mb-1'>
                Email
              </FormControlLabelText>
            </FormControlLabel>
            <Input
              className={`bg-gray-50 border ${
                emailError ? 'border-red-300' : 'border-gray-200'
              } rounded-md px-1`}
            >
              <InputField
                placeholder='Enter your email'
                value={email}
                onChangeText={handleEmailChange}
                keyboardType='email-address'
                autoCapitalize='none'
                className='h-12'
              />
            </Input>
            {emailError ? (
              <Text className='text-red-500 text-sm mt-1'>{emailError}</Text>
            ) : null}
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText className='font-medium mb-1'>
                Phone
              </FormControlLabelText>
            </FormControlLabel>
            <Input className='bg-gray-50 border border-gray-200 rounded-md px-1'>
              <InputField
                placeholder='Enter your phone number'
                value={phone}
                onChangeText={setPhone}
                keyboardType='phone-pad'
                className='h-12'
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText className='font-medium mb-1'>
                Password
              </FormControlLabelText>
            </FormControlLabel>
            <Input className='bg-gray-50 border border-gray-200 rounded-md px-1'>
              <InputField
                secureTextEntry
                placeholder='Create a password'
                value={password}
                onChangeText={setPassword}
                className='h-12'
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText className='font-medium mb-1'>
                Confirm Password
              </FormControlLabelText>
            </FormControlLabel>
            <Input className='bg-gray-50 border border-gray-200 rounded-md px-1'>
              <InputField
                secureTextEntry
                placeholder='Confirm your password'
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                className='h-12'
              />
            </Input>
          </FormControl>

          <Button
            onPress={handleRegister}
            disabled={isButtonLoading || !!emailError}
            className={`mt-4 h-12 rounded-md ${
              emailError ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } flex items-center justify-center`}
            variant='solid'
          >
            <ButtonText className='font-bold text-white'>
              {isButtonLoading ? 'Creating Account...' : 'Register'}
            </ButtonText>
          </Button>

          <Box className='flex-row justify-center mt-4'>
            <Text className='text-gray-600'>Already have an account? </Text>
            <Link onPress={() => router.push('/')}>
              <LinkText className='font-medium text-blue-600'>Login</LinkText>
            </Link>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
