import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { personalApi } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth';
import { registerForPushToken } from '@/lib/push';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 400, fade: true });

function PushManager() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      return;
    }
    let active = true;
    registerForPushToken().then((pushToken) => {
      if (active && pushToken) {
        personalApi.registerDevice(pushToken, Platform.OS, session.accessToken).catch(() => undefined);
      }
    });
    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.navigate('/home');
    });
    return () => sub.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    'JetBrainsMono-Medium': require('@/assets/fonts/JetBrainsMono-Medium.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    SpaceGrotesk_500Medium,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <PushManager />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.brandGreen },
        }}
      />
    </AuthProvider>
  );
}
