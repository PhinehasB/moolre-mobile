import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const account = session?.account;
  const [signingOut, setSigningOut] = useState(false);

  const isEmployee = account?.accountType === 'EMPLOYEE';
  const linked = account?.linkedToCompany ?? false;
  const initials = account
    ? `${account.firstName[0] ?? ''}${account.lastName[0] ?? ''}`.toUpperCase()
    : '';
  const fullName = account ? `${account.firstName} ${account.lastName}` : '';

  function confirmSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out of Klare?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <View style={styles.chip}>
            <Ionicons
              name={linked ? 'briefcase-outline' : 'person-outline'}
              size={13}
              color={Colors.brandGreen}
            />
            <Text style={styles.chipText}>
              {linked ? `Employee · ${account?.companyName ?? ''}` : 'Personal account'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>Account details</Text>
          <Pressable hitSlop={8} onPress={() => router.push('/edit-profile')} style={styles.editBtn}>
            <Ionicons name="create-outline" size={16} color={Colors.brandGreen} />
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          {isEmployee ? <Row label="Username" value={account?.username ?? '—'} /> : null}
          <Row label="Email" value={account?.email ?? '—'} />
          <Row label="Phone" value={account?.phone ?? '—'} />
          {linked ? <Row label="Role" value={account?.role ?? '—'} /> : null}
          <Row label="Status" value={linked ? prettyStatus(account?.status) : 'Personal'} last />
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          <LinkRow icon="help-circle-outline" label="Help & support" />
          <LinkRow icon="shield-checkmark-outline" label="Privacy & security" last />
        </View>

        <Pressable style={styles.signOut} onPress={confirmSignOut} disabled={signingOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
        </Pressable>

        <Text style={styles.tagline}>Klare · Your money, already sorted</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function prettyStatus(status?: string) {
  if (!status) {
    return '—';
  }
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.linkRow, last && styles.rowLast]}>
      <Ionicons name={icon} size={20} color={Colors.muted} />
      <Text style={styles.linkLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.placeholder} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mist },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.text },
  headerSpacer: { width: 24 },
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  identity: { alignItems: 'center', marginTop: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.bodySemiBold, fontSize: 28, color: Colors.white },
  name: { fontFamily: Fonts.display, fontSize: 22, color: Colors.text, marginTop: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E4F2EC',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: 12.5, color: Colors.brandGreen },
  sectionTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.muted, marginTop: 26, marginBottom: 10 },
  sectionTitleInline: { marginTop: 0, marginBottom: 0 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 10,
  },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.brandGreen },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF1F4',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted },
  rowValue: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.text, maxWidth: '60%' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF1F4',
  },
  linkLabel: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 14.5, color: Colors.text },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2D6D3',
    backgroundColor: '#FDF3F2',
    marginTop: 28,
  },
  signOutText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.danger },
  tagline: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.placeholder, textAlign: 'center', marginTop: 24 },
});
