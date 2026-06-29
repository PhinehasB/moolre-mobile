import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { TextField } from '@/components/TextField';
import { Colors, Fonts } from '@/constants/theme';
import { ApiError, FundingResult, personalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { money, moneyWhole } from '@/lib/format';

type Stage = 'form' | 'otp' | 'pending' | 'done' | 'failed';

export default function AddMoneyScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const token = session?.accessToken ?? '';
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState(session?.account?.phone ?? '');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const externalRef = useRef<string | null>(null);

  const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
  const hasAmount = !Number.isNaN(parsedAmount) && parsedAmount >= 1;
  const canStart = hasAmount && payer.trim().length >= 8 && !busy;

  const apply = useCallback((result: FundingResult) => {
    externalRef.current = result.externalRef;
    setMessage(result.message);
    if (result.status === 'AWAITING_OTP') {
      setStage('otp');
    } else if (result.status === 'AWAITING_APPROVAL') {
      setStage('pending');
    } else if (result.status === 'SUCCESS') {
      setStage('done');
    } else {
      setStage('failed');
    }
  }, []);

  async function startFunding() {
    if (!canStart) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await personalApi.fundWallet({ amount: parsedAmount, payer: payer.trim() }, token);
      apply(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start the top-up. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    if (busy || otp.trim().length < 4 || !externalRef.current) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await personalApi.submitFundingOtp(externalRef.current, otp.trim(), token);
      apply(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify that code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (stage !== 'pending' || !externalRef.current) {
      return;
    }
    let active = true;
    let attempts = 0;
    const ref = externalRef.current;
    const tick = async () => {
      attempts += 1;
      try {
        const result = await personalApi.fundingStatus(ref, token);
        if (!active) {
          return;
        }
        setMessage(result.message);
        if (result.status === 'SUCCESS') {
          setStage('done');
          return;
        }
        if (result.status === 'FAILED') {
          setStage('failed');
          return;
        }
      } catch {
        // keep polling
      }
      if (active && attempts < 40) {
        timer = setTimeout(tick, 4000);
      } else if (active) {
        setStage('failed');
        setMessage('We did not get a confirmation in time. Check your wallet shortly.');
      }
    };
    let timer = setTimeout(tick, 4000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [stage, token]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Add money</Text>
          <View style={styles.back} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {stage === 'done' ? (
            <View style={styles.statusWrap}>
              <View style={styles.statusIcon}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.brandGreen} />
              </View>
              <Text style={styles.statusTitle}>Wallet topped up</Text>
              <Text style={styles.statusBody}>
                GHS {moneyWhole(parsedAmount)} has been added to your free spendable cash.
              </Text>
              <Pressable style={styles.button} onPress={() => router.back()}>
                <Text style={styles.buttonText}>Done</Text>
              </Pressable>
            </View>
          ) : stage === 'failed' ? (
            <View style={styles.statusWrap}>
              <View style={[styles.statusIcon, styles.statusIconFail]}>
                <Ionicons name="close-circle" size={64} color={Colors.danger} />
              </View>
              <Text style={styles.statusTitle}>Top-up not completed</Text>
              <Text style={styles.statusBody}>{message ?? 'The payment did not go through. No money was taken.'}</Text>
              <Pressable
                style={styles.button}
                onPress={() => {
                  externalRef.current = null;
                  setOtp('');
                  setMessage(null);
                  setError(null);
                  setStage('form');
                }}
              >
                <Text style={styles.buttonText}>Try again</Text>
              </Pressable>
            </View>
          ) : stage === 'pending' ? (
            <View style={styles.statusWrap}>
              <ActivityIndicator color={Colors.brandGreen} size="large" />
              <Text style={styles.statusTitle}>Approve on your phone</Text>
              <Text style={styles.statusBody}>
                {message ?? `We sent a prompt to ${payer.trim()}. Enter your mobile money PIN to approve GHS ${moneyWhole(
                  parsedAmount,
                )}.`}
              </Text>
            </View>
          ) : stage === 'otp' ? (
            <>
              <Text style={styles.lead}>Enter the OTP sent to {payer.trim()} to authorise the debit.</Text>
              <TextField
                label="OTP code"
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter the 6-digit code"
                keyboardType="numeric"
              />
              {message ? <Text style={styles.hint}>{message}</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={[styles.button, (busy || otp.trim().length < 4) && styles.buttonDisabled]}
                onPress={submitOtp}
                disabled={busy || otp.trim().length < 4}
              >
                {busy ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Verify and pay</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.lead}>Top up your Klare wallet from mobile money. You&apos;ll approve the debit on your phone.</Text>
              <TextField
                label="Amount"
                value={amount}
                onChangeText={setAmount}
                placeholder="GHS 100"
                keyboardType="numeric"
              />
              <TextField
                label="Mobile money number"
                value={payer}
                onChangeText={setPayer}
                placeholder="Enter the number to charge"
                keyboardType="phone-pad"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable style={[styles.button, !canStart && styles.buttonDisabled]} onPress={startFunding} disabled={!canStart}>
                {busy ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Add GHS {hasAmount ? money(parsedAmount) : '0.00'}</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.text },
  content: { paddingHorizontal: 26, paddingBottom: 28 },
  lead: { fontFamily: Fonts.bodyMedium, fontSize: 13.5, color: Colors.text, lineHeight: 20, marginTop: 8 },
  hint: { fontFamily: Fonts.bodyMedium, fontSize: 12.5, color: '#767676', marginTop: 12 },
  error: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.danger, marginTop: 16 },
  button: {
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    width: '100%',
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
  statusWrap: { alignItems: 'center', paddingTop: 48 },
  statusIcon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E4F2EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconFail: { backgroundColor: '#FBE9E7' },
  statusTitle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.text, marginTop: 22 },
  statusBody: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
  },
});
