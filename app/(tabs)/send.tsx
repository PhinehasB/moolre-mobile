import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { Colors, Fonts } from '@/constants/theme';
import { ApiError, personalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { money, moneyWhole, transferFees } from '@/lib/format';
import { NETWORK_OPTIONS } from '@/lib/networks';

export default function SendScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const token = session?.accessToken ?? '';
  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
  const hasAmount = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const fees = useMemo(() => transferFees(hasAmount ? parsedAmount : 0), [hasAmount, parsedAmount]);
  const canSend = phone.trim().length >= 8 && hasAmount && !sending;

  async function onSend() {
    if (!canSend) {
      return;
    }
    setError(null);
    setSending(true);
    try {
      const result = await personalApi.transfer({ network, phone: phone.trim(), amount: parsedAmount }, token);
      router.push({
        pathname: '/sent-success',
        params: {
          amount: String(parsedAmount),
          recipient: result.recipientName || result.recipient || phone.trim(),
          network,
        },
      });
      setPhone('');
      setAmount('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send this transfer. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Send MoMo</Text>
          <Text style={styles.subtitle}>Quickly send money to friends or family</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SelectField
            label="Select the Network"
            placeholder="Select network"
            value={network}
            options={NETWORK_OPTIONS}
            onChange={setNetwork}
          />
          <TextField
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter Phone Number"
            keyboardType="phone-pad"
          />
          <TextField
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            placeholder="GHS 500"
            keyboardType="numeric"
          />

          {hasAmount ? (
            <View style={styles.receipt}>
              <ReceiptRow label="Amount" value={`GHS ${money(parsedAmount)}`} />
              <View style={styles.divider} />
              <ReceiptRow label="Klare fee" value={`GHS ${money(fees.klareFee)}`} />
              <View style={styles.divider} />
              <ReceiptRow label="Total" value={`GHS ${money(fees.total)}`} bold />
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.button, !canSend && styles.buttonDisabled]} onPress={onSend} disabled={!canSend}>
            {sending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="arrow-up" size={18} color={Colors.white} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Send GHS {hasAmount ? moneyWhole(parsedAmount) : '0'}</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReceiptRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, bold && styles.receiptLabelBold]}>{label}</Text>
      <Text style={styles.receiptValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  header: { paddingHorizontal: 26, paddingTop: 8, paddingBottom: 4 },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.text },
  subtitle: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text, marginTop: 8 },
  content: { paddingHorizontal: 26, paddingBottom: 28 },
  receipt: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: 24,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  receiptLabel: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: '#767676' },
  receiptLabelBold: { fontFamily: Fonts.bodySemiBold, color: Colors.text },
  receiptValue: { fontFamily: Fonts.display, fontSize: 14, color: 'rgba(0,0,0,0.7)', letterSpacing: -0.22 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E6EAEE' },
  error: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.danger, marginTop: 16 },
  button: {
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#0B5443',
    shadowOpacity: 0.3,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonInner: { flexDirection: 'row', alignItems: 'center' },
  buttonIcon: { transform: [{ rotate: '35deg' }], marginRight: 8 },
  buttonText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.white },
});
