import { Stack } from 'expo-router';
import '@/assets/global.css';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { useSegments, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { config } from '@gluestack-ui/config';

// Navigation wrapper that handles protected routes
function NavigationGuard({ children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Check if the current route is in the authenticated group
  const isAuthGroup = segments[0] === '(authenticated)';

  // Handle navigation based on auth state
  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    if (user && !isAuthGroup) {
      // Redirect to the authenticated flow if user is authenticated but not in auth group
      router.replace('/(authenticated)/campaigns');
    } else if (!user && isAuthGroup) {
      // Redirect to the login if the user is not authenticated
      router.replace('/');
    }
  }, [user, segments, navigationState?.key, isLoading]);

  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={config}>
        <StatusBar />
        <AuthProvider>
          <NavigationGuard>
            <Stack>
              {/* Non-authenticated routes */}
              <Stack.Screen name='index' options={{ headerShown: false }} />
              <Stack.Screen name='register' options={{ headerShown: false }} />

              {/* Group for authenticated routes with tabs */}
              <Stack.Screen
                name='(authenticated)'
                options={{ headerShown: false }}
              />
            </Stack>
          </NavigationGuard>
        </AuthProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
