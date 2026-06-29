import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { TextField } from '@/components/TextField';
import { Colors, Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const logo = require('@/assets/images/klare-logo-green.png');

function Rule({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.rule}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={19}
        color={met ? Colors.brandGreen : Colors.placeholder}
      />
      <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{label}</Text>
    </View>
  );
}

export default function ActivateScreen() {
  const router = useRouter();
  const { session, activate, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const firstName = session?.account.firstName ?? 'there';

  const rules = useMemo(() => {
    const longEnough = newPassword.length >= 8;
    const hasUpperLower = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    return { longEnough, hasUpperLower, hasNumber };
  }, [newPassword]);

  const matches = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = rules.longEnough && rules.hasUpperLower && rules.hasNumber && matches && !submitting;

  async function onActivate() {
    if (!canSubmit) {
      if (!matches && confirmPassword.length > 0) {
        setError('Passwords do not match');
      }
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await activate(newPassword, confirmPassword);
      router.replace('/home');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onBack() {
    await signOut();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.back} onPress={onBack} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Image source={logo} style={styles.logo} contentFit="contain" />
          <Text style={styles.title}>Secure your account</Text>
          <Text style={styles.subtitle}>
            Welcome, <Text style={styles.name}>{firstName}!</Text> Set your own password to activate your wallet.
          </Text>

          <TextField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Create a password"
            secureToggle
          />

          <View style={styles.rules}>
            <Rule met={rules.longEnough} label="At least 8 characters" />
            <Rule met={rules.hasUpperLower} label="Upper & lowercase letter" />
            <Rule met={rules.hasNumber} label="At least one number" />
          </View>

          <TextField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            secureToggle
            returnKeyType="go"
            onSubmitEditing={onActivate}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={onActivate}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Activate my wallet</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mist },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 8, paddingBottom: 32 },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.muted, marginLeft: 6 },
  logo: { width: 150, height: (150 * 391) / 796, alignSelf: 'center', marginTop: 8 },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 18,
    letterSpacing: -0.22,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 22.5,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 10,
    alignSelf: 'center',
    maxWidth: 290,
  },
  rules: { width: '100%', marginTop: 14, gap: 8 },
  rule: { flexDirection: 'row', alignItems: 'center' },
  ruleText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.placeholder, marginLeft: 8 },
  ruleTextMet: { color: Colors.brandGreen },
  name: { fontFamily: Fonts.bodySemiBold, color: Colors.brandGreen },
  error: { width: '100%', fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.danger, marginTop: 16 },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    shadowColor: '#0B5443',
    shadowOpacity: 0.3,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
});
