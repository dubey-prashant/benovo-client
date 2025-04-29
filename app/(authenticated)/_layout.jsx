import { Tabs, usePathname, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function AuthenticatedLayout() {
  const pathname = usePathname();

  const tabBarVisible = !pathname.startsWith('/campaigns/');

  const tabBarStyle = tabBarVisible
    ? {
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      }
    : {
        display: 'none',
      };
  return (
    <Tabs
      screenOptions={{
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarShowLabel: true,
        headerShown: false, // This will hide all headers by default
      }}
    >
      <Tabs.Screen
        name='campaigns'
        options={{
          title: 'Campaigns',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='wallet-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='profile/index'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='person-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='settings/index'
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='settings-outline' size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
