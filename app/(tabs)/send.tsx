import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { money, transferFees } from '@/lib/format';
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
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState('GHS');
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [reference, setReference] = useState('');
  const [phoneLast4, setPhoneLast4] = useState<string | null>(null);
  const [code, setCode] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      personalApi
        .home(token)
        .then((home) => {
          if (active) {
            setBalance(home.wallet.freeSpendable);
            setCurrency(home.wallet.currency);
          }
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [token]),
  );

  const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
  const hasAmount = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const fees = useMemo(() => transferFees(hasAmount ? parsedAmount : 0), [hasAmount, parsedAmount]);
  const overBalance = hasAmount && balance != null && fees.total > balance;
  const canSend = phone.trim().length >= 8 && hasAmount && !overBalance && !sending;

  async function onInitiate() {
    if (!canSend) {
      return;
    }
    setError(null);
    setSending(true);
    try {
      const init = await personalApi.initiateTransfer({ network, phone: phone.trim(), amount: parsedAmount }, token);
      setReference(init.reference);
      setPhoneLast4(init.phoneLast4);
      setCode('');
      setStage('otp');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start this transfer. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function onConfirm() {
    if (code.trim().length < 4 || sending) {
      return;
    }
    setError(null);
    setSending(true);
    try {
      const result = await personalApi.confirmTransfer(reference, code.trim(), token);
      router.push({
        pathname: '/sent-success',
        params: {
          amount: String(parsedAmount),
          recipient: result.recipientName || result.recipient || phone.trim(),
          network,
        },
      });
      setStage('form');
      setPhone('');
      setAmount('');
      setCode('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not confirm this transfer. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function cancelOtp() {
    setStage('form');
    setCode('');
    setError(null);
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
          {stage === 'form' ? (
            <>
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

              {overBalance ? (
                <View style={styles.balanceRow}>
                  <Ionicons name="alert-circle" size={15} color={Colors.danger} />
                  <Text style={styles.balanceWarn}>
                    That&apos;s more than your {currency} {money(balance ?? 0)} available.
                  </Text>
                </View>
              ) : balance != null ? (
                <Text style={styles.balanceHint}>
                  Available to spend: {currency} {money(balance)}
                </Text>
              ) : null}

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

              <Pressable style={[styles.button, !canSend && styles.buttonDisabled]} onPress={onInitiate} disabled={!canSend}>
                {sending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <View style={styles.buttonInner}>
                    <Ionicons name="arrow-up" size={18} color={Colors.white} style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Send {currency} {hasAmount ? money(parsedAmount) : '0.00'}</Text>
                  </View>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.otpIcon}>
                <Ionicons name="shield-checkmark" size={30} color={Colors.brandGreen} />
              </View>
              <Text style={styles.otpTitle}>Confirm it&apos;s you</Text>
              <Text style={styles.otpSubtitle}>
                Enter the 4-digit code we texted{phoneLast4 ? ` to the number ending ${phoneLast4}` : ''} to send{' '}
                {currency} {money(parsedAmount)} to {phone.trim()}.
              </Text>

              <TextField
                label="Authorization code"
                value={code}
                onChangeText={setCode}
                placeholder="4-digit code"
                keyboardType="numeric"
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.button, (code.trim().length < 4 || sending) && styles.buttonDisabled]}
                onPress={onConfirm}
                disabled={code.trim().length < 4 || sending}
              >
                {sending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Confirm & send</Text>
                )}
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={cancelOtp} disabled={sending}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </>
          )}
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
  balanceHint: { fontFamily: Fonts.bodyMedium, fontSize: 12.5, color: '#767676', marginTop: 10 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  balanceWarn: { fontFamily: Fonts.bodyMedium, fontSize: 12.5, color: Colors.danger, flexShrink: 1 },
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
  otpIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E4F2EC',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  otpTitle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.text, textAlign: 'center', marginTop: 16 },
  otpSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 10,
  },
  cancelBtn: { height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  cancelText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#3F4D47' },
});
