import { Ionicons } from '@expo/vector-icons';
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
import { openWhatsAppSupport } from '@/lib/support';

const logo = require('@/assets/images/klare-logo-green.png');
const handshake = require('@/assets/images/help-handshake.png');
const whatsapp = require('@/assets/images/help-whatsapp.png');

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting;

  async function onContinue() {
    if (!canSubmit) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const session = await signIn(username.trim(), password, rememberMe);
      if (session.mustChangePassword) {
        router.replace('/activate');
      } else {
        router.replace('/home');
      }
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
            Your money, already sorted. Sign in with the details your employer emailed you.
          </Text>

          <TextField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Kwame123"
            returnKeyType="next"
            textContentType="username"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureToggle
            returnKeyType="go"
            textContentType="password"
            onSubmitEditing={onContinue}
          />

          <View style={styles.row}>
            <Pressable style={styles.remember} onPress={() => setRememberMe((v) => !v)} hitSlop={8}>
              <Ionicons
                name={rememberMe ? 'checkbox' : 'square-outline'}
                size={18}
                color={rememberMe ? Colors.brandGreen : Colors.muted}
              />
              <Text style={styles.rememberText}>Remember Me</Text>
            </Pressable>
            <Pressable hitSlop={8}>
              <Text style={styles.forgot}>Forgot Password?</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={onContinue}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>

          <Text style={styles.or}>or</Text>

          <Pressable onPress={() => router.push('/signup')} hitSlop={8}>
            <Text style={styles.signupText}>
              Don&apos;t have an account? <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </Pressable>

          <View style={styles.help}>
            <Text style={styles.helpText}>Need help?</Text>
            <View style={styles.helpIcons}>
              <Image source={handshake} style={styles.handshake} contentFit="contain" />
              <Pressable onPress={() => openWhatsAppSupport()} hitSlop={10}>
                <Image source={whatsapp} style={styles.whatsapp} contentFit="contain" />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mist },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 32, alignItems: 'center' },
  logo: { width: 160, height: (160 * 391) / 796, marginTop: 12 },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.text, marginTop: 18, letterSpacing: -0.25 },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 22.5,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 300,
  },
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  remember: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text, marginLeft: 8 },
  forgot: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text },
  error: { width: '100%', fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.danger, marginTop: 16 },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    shadowColor: '#0B5443',
    shadowOpacity: 0.3,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
  or: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text, marginTop: 18 },
  signupText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text, marginTop: 14, textAlign: 'center' },
  signupLink: { fontFamily: Fonts.bodyMedium, color: Colors.brandGreen, textDecorationLine: 'underline' },
  help: { alignItems: 'center', marginTop: 28 },
  helpText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text },
  helpIcons: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  handshake: { width: 34, height: 34 },
  whatsapp: { width: 32, height: 32 },
});
