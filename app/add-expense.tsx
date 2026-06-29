import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { SelectField, SelectOption } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { Colors, Fonts } from '@/constants/theme';
import { ApiError, personalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { NETWORK_OPTIONS } from '@/lib/networks';

const CATEGORIES: SelectOption[] = [
  { value: 'UTILITY', label: 'Utilities' },
  { value: 'RENT', label: 'Rent' },
  { value: 'TITHE', label: 'Tithe / offering' },
  { value: 'FAMILY', label: 'Family support' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'OTHER', label: 'Other' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    amount?: string;
    category?: string;
    network?: string;
    recipient?: string;
  }>();
  const isEdit = typeof params.id === 'string' && params.id.length > 0;
  const { session } = useAuth();
  const token = session?.accessToken ?? '';
  const [name, setName] = useState(params.name ?? '');
  const [amount, setAmount] = useState(params.amount ?? '');
  const [category, setCategory] = useState<string | null>(params.category ?? null);
  const [network, setNetwork] = useState<string>(params.network ?? 'MTN');
  const [recipient, setRecipient] = useState(params.recipient ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
  const canSave =
    name.trim().length > 0 &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    category != null &&
    recipient.trim().length > 0 &&
    !saving;

  async function onSave() {
    if (!canSave || category == null) {
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (isEdit && params.id) {
        await personalApi.updateBill(
          params.id,
          { name: name.trim(), amount: parsedAmount, category, network, recipientNumber: recipient.trim() },
          token,
        );
      } else {
        await personalApi.createBill(
          { name: name.trim(), amount: parsedAmount, category, network, recipientNumber: recipient.trim() },
          token,
        );
      }
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this expense. Please try again.');
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
          <Text style={styles.title}>{isEdit ? 'Edit expense' : 'New expense'}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextField
            label="What's it for?"
            muted
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rent, ECG, School fees"
            autoCapitalize="sentences"
          />
          <TextField
            label="Amount to set aside"
            muted
            value={amount}
            onChangeText={setAmount}
            placeholder="GHS 500"
            keyboardType="numeric"
          />
          <SelectField
            label="Category"
            muted
            placeholder="Select a category"
            value={category}
            options={CATEGORIES}
            onChange={setCategory}
          />
          <SelectField
            label="Where should it go?"
            placeholder="Select network"
            value={network}
            options={NETWORK_OPTIONS}
            onChange={setNetwork}
          />
          <TextField
            label="Recipient number"
            muted
            value={recipient}
            onChangeText={setRecipient}
            placeholder="+233 24 000 0000"
            keyboardType="phone-pad"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.button, !canSave && styles.buttonDisabled]} onPress={onSave} disabled={!canSave}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>{isEdit ? 'Save changes' : 'Save'}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 6 },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.text },
  content: { paddingHorizontal: 27, paddingTop: 8, paddingBottom: 32 },
  error: { width: '100%', fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.danger, marginTop: 16 },
  button: {
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    shadowColor: '#0B5443',
    shadowOpacity: 0.3,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
});
