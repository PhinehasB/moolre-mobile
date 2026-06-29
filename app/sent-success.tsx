import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { moneyWhole } from '@/lib/format';

export default function SentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; recipient?: string; network?: string }>();
  const amount = Number(params.amount ?? 0);
  const recipient = params.recipient ?? 'the recipient';
  const network = params.network ?? 'mobile money';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={42} color={Colors.brandGreen} />
        </View>
        <Text style={styles.title}>Sent successfully</Text>
        <Text style={styles.message}>
          GHS {moneyWhole(amount)} is on its way to {recipient} on {network}. We&apos;ve texted you a receipt.
        </Text>

        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={() => router.replace('/home')}>
            <Text style={styles.primaryText}>Back home</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.replace('/activity')}>
            <Text style={styles.secondaryText}>View receipt</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mist },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 43 },
  badge: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: '#DCF6EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: Fonts.display, fontSize: 24, color: Colors.text, marginTop: 28, letterSpacing: -0.22 },
  message: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14.5,
    lineHeight: 22.5,
    color: '#767676',
    textAlign: 'center',
    marginTop: 14,
  },
  actions: { position: 'absolute', left: 43, right: 43, bottom: 60 },
  primary: {
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
  secondary: {
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  secondaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.text },
});
