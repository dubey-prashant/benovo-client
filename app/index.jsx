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
  Icon,
  CloseIcon,
} from '@gluestack-ui/themed';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const { signIn, isLoading } = useAuth(); // Get isLoading from context

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter email and password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setErrorMsg(result.error || 'Login failed');
      }
      // No need to navigate as NavigationGuard will handle this
    } catch (error) {
      setErrorMsg('An unexpected error occurred');
      console.error('Login error:', error);
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
          Welcome Back
        </Heading>

        {errorMsg ? (
          <Box className='bg-red-50 p-3 rounded-lg mb-5 flex-row items-center justify-between'>
            <Text className='text-red-600'>{errorMsg}</Text>
            <Icon as={CloseIcon} size='sm' onPress={() => setErrorMsg('')} />
          </Box>
        ) : null}

        <FormControl className='mb-4'>
          <FormControlLabel>
            <FormControlLabelText className='font-medium mb-1'>
              Email
            </FormControlLabelText>
          </FormControlLabel>
          <Input className='bg-gray-50 border border-gray-200 rounded-md px-1'>
            <InputField
              placeholder='Enter your email'
              value={email}
              onChangeText={setEmail}
              keyboardType='email-address'
              autoCapitalize='none'
              className='h-12'
            />
          </Input>
        </FormControl>

        <FormControl className='mb-6'>
          <FormControlLabel>
            <FormControlLabelText className='font-medium mb-1'>
              Password
            </FormControlLabelText>
          </FormControlLabel>
          <Input className='bg-gray-50 border border-gray-200 rounded-md px-1'>
            <InputField
              secureTextEntry
              placeholder='Enter your password'
              value={password}
              onChangeText={setPassword}
              className='h-12'
            />
          </Input>
        </FormControl>

        <Button
          onPress={handleLogin}
          disabled={isButtonLoading}
          className='h-12 rounded-md bg-blue-600 hover:bg-blue-700 flex items-center justify-center'
          variant='solid'
        >
          <ButtonText className='font-bold text-white'>
            {isButtonLoading ? 'Logging in...' : 'Login'}
          </ButtonText>
        </Button>

        <Box className='flex-row justify-center mt-4'>
          <Text className='text-gray-600'>Don't have an account? </Text>
          <Link onPress={() => router.push('/register')}>
            <LinkText className='font-medium text-blue-600'>Register</LinkText>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
