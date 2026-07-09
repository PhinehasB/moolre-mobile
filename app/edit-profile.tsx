import { Ionicons } from '@expo/vector-icons';
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
import { ApiError, UpdateProfilePayload } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function EditProfileScreen() {
  const router = useRouter();
  const { session, updateProfile } = useAuth();
  const account = session?.account;

  const linked = account?.linkedToCompany ?? false;
  const isEmployee = account?.accountType === 'EMPLOYEE';

  const [firstName, setFirstName] = useState(account?.firstName ?? '');
  const [lastName, setLastName] = useState(account?.lastName ?? '');
  const [email, setEmail] = useState(account?.email ?? '');
  const [phone, setPhone] = useState(account?.phone ?? '');
  const [username, setUsername] = useState(account?.username ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (saving) {
      return;
    }
    setError(null);
    const payload: UpdateProfilePayload = {};
    if (isEmployee) {
      payload.username = username.trim();
    }
    if (!linked) {
      payload.firstName = firstName.trim();
      payload.lastName = lastName.trim();
      payload.email = email.trim();
      payload.phone = phone.trim();
    }
    setSaving(true);
    try {
      await updateProfile(payload);
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Edit profile</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isEmployee ? (
            <TextField
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Your username"
              autoCapitalize="none"
            />
          ) : null}

          {linked ? (
            <Text style={styles.note}>
              Your name, email and phone are managed by {account?.companyName ?? 'your employer'}. You can change your
              username here.
            </Text>
          ) : (
            <>
              <TextField
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                autoCapitalize="words"
              />
              <TextField
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                autoCapitalize="words"
              />
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
              />
              <TextField
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="0XX XXX XXXX"
                keyboardType="phone-pad"
              />
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={onSave} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Save changes</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mist },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  title: { flex: 1, textAlign: 'center', fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.text },
  spacer: { width: 24 },
  content: { paddingHorizontal: 26, paddingBottom: 32 },
  note: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, color: Colors.muted, marginTop: 18 },
  error: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.danger, marginTop: 16 },
  button: {
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
});
