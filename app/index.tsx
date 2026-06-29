import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Colors, Fonts, SplashGradient } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

const logo = require('@/assets/images/klare-logo.png');

export default function Splash() {
  const router = useRouter();
  const { session, initializing } = useAuth();
  const intro = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(tagline, {
      toValue: 1,
      duration: 500,
      delay: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => setMinElapsed(true), 1600);
    return () => clearTimeout(timer);
  }, [intro, tagline]);

  useEffect(() => {
    if (initializing || !minElapsed) {
      return;
    }
    if (!session) {
      router.replace('/login');
    } else if (session.mustChangePassword) {
      router.replace('/activate');
    } else {
      router.replace('/home');
    }
  }, [initializing, minElapsed, session, router]);

  return (
    <LinearGradient
      colors={SplashGradient.colors}
      locations={SplashGradient.locations}
      start={SplashGradient.start}
      end={SplashGradient.end}
      style={styles.fill}
    >
      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: intro,
            transform: [{ scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
          }}
        >
          <Image source={logo} style={styles.logo} contentFit="contain" />
        </Animated.View>
        <Animated.Text style={[styles.tagline, { opacity: tagline }]}>
          Your Money, Already Sorted
        </Animated.Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 210, height: (210 * 365) / 975 },
  tagline: {
    marginTop: 14,
    color: Colors.white,
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 19.55,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
