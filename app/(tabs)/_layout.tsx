import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function TabsLayout() {
  const router = useRouter();
  const { session, initializing } = useAuth();

  useEffect(() => {
    if (!initializing && !session) {
      router.replace('/login');
    }
  }, [initializing, session, router]);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brandGreen,
        tabBarInactiveTintColor: '#9AA3A0',
        tabBarStyle: {
          backgroundColor: Colors.white,
          height: 88,
          paddingTop: 10,
          paddingBottom: 28,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#E6EAEE',
        },
        tabBarLabelStyle: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Bills',
          tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: 'Send',
          tabBarIcon: ({ color }) => <Ionicons name="paper-plane-outline" size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart-outline" size={23} color={color} />,
        }}
      />
    </Tabs>
  );
}
