import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
const googleLogo = require('@/assets/images/google-logo.png');

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    acceptedTerms &&
    !submitting;

  async function onSignUp() {
    if (!canSubmit) {
      if (!acceptedTerms) {
        setError('Please accept the terms and conditions to continue');
      }
      return;
    }
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) {
      setError('Please enter your first and last name');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp({
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
        email: email.trim(),
        password,
        confirmPassword,
        acceptedTerms,
      });
      router.replace('/home');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image source={logo} style={styles.logo} contentFit="contain" />
          <Text style={styles.title}>Welcome to Klare</Text>
          <Text style={styles.subtitle}>
            Provide your full name, email, and password to create your account and get started.
          </Text>

          <TextField
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            autoCapitalize="words"
            textContentType="name"
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureToggle
            textContentType="newPassword"
          />
          <TextField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            secureToggle
            returnKeyType="go"
            onSubmitEditing={onSignUp}
          />

          <Pressable style={styles.terms} onPress={() => setAcceptedTerms((v) => !v)} hitSlop={8}>
            <Ionicons
              name={acceptedTerms ? 'checkbox' : 'square-outline'}
              size={18}
              color={acceptedTerms ? Colors.brandGreen : Colors.muted}
            />
            <Text style={styles.termsText}>I agree with the Terms and Conditions</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={onSignUp}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.orWith}>Or with</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.social}>
            <Pressable
              style={styles.socialButton}
              onPress={() => setNotice('Social sign-up is coming soon — use your email for now.')}
            >
              <FontAwesome name="facebook" size={18} color="#1877F2" />
              <Text style={styles.socialText}>Facebook</Text>
            </Pressable>
            <Pressable
              style={styles.socialButton}
              onPress={() => setNotice('Social sign-up is coming soon — use your email for now.')}
            >
              <Image source={googleLogo} style={styles.googleIcon} contentFit="contain" />
              <Text style={styles.socialText}>Google</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => router.replace('/login')} hitSlop={8} style={styles.signin}>
            <Text style={styles.signinText}>
              Already have an account? <Text style={styles.signinLink}>Sign In</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mist },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 32, alignItems: 'center' },
  logo: { width: 150, height: (150 * 391) / 796, marginTop: 8 },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.text, marginTop: 14, letterSpacing: -0.25 },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20.5,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 290,
  },
  terms: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 18 },
  termsText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text, marginLeft: 8 },
  error: { width: '100%', fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.danger, marginTop: 14 },
  notice: { width: '100%', fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.muted, marginTop: 14 },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#0B5443',
    shadowOpacity: 0.3,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 22 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#C7CDD6' },
  orWith: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.text, marginHorizontal: 12 },
  social: { flexDirection: 'row', gap: 14, width: '100%', marginTop: 20 },
  socialButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text },
  googleIcon: { width: 20, height: 20 },
  signin: { marginTop: 24 },
  signinText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text, textAlign: 'center' },
  signinLink: { fontFamily: Fonts.bodyMedium, color: Colors.brandGreen, textDecorationLine: 'underline' },
});
