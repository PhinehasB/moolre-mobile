import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { ActivityItem, ApiError, personalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { money } from '@/lib/format';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function bucketLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - day.getTime()) / 86400000);
  if (diffDays <= 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return 'This week';
  }
  const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  if (monthsDiff === 0) {
    return 'This month';
  }
  if (monthsDiff === 1) {
    return 'Last month';
  }
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

const meta: Record<ActivityItem['type'], { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string; rotate: string }> = {
  TRANSFER: { icon: 'arrow-up', bg: 'rgba(216,90,48,0.18)', color: '#D85A30', rotate: '45deg' },
  SALARY: { icon: 'arrow-down', bg: 'rgba(15,110,86,0.18)', color: Colors.brandGreen, rotate: '-45deg' },
  SWEEP: { icon: 'lock-closed', bg: 'rgba(137,194,255,0.25)', color: '#4E86C7', rotate: '0deg' },
  FUND: { icon: 'add', bg: 'rgba(15,110,86,0.18)', color: Colors.brandGreen, rotate: '0deg' },
};

export default function ActivityScreen() {
  const { session } = useAuth();
  const token = session?.accessToken ?? '';
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await personalApi.transactions(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your activity.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const groups = useMemo(() => {
    if (!items) {
      return [];
    }
    const out: { label: string; items: ActivityItem[] }[] = [];
    for (const item of items) {
      const label = bucketLabel(item.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) {
        last.items.push(item);
      } else {
        out.push({ label, items: [item] });
      }
    }
    return out;
  }, [items]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.brandGreen} />
          </View>
        ) : error ? (
          <View style={styles.loading}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={load} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No activity yet. Your sends, salary and sweeps will show up here.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.label}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.items.map((item) => (
                <Row key={item.id} item={item} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ item }: { item: ActivityItem }) {
  const m = meta[item.type];
  const sign = item.type === 'TRANSFER' ? '-' : '';
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: m.bg }]}>
        <Ionicons name={m.icon} size={20} color={m.color} style={{ transform: [{ rotate: m.rotate }] }} />
      </View>
      <View style={styles.body}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        {item.subtitle ? <Text style={styles.rowSub}>{item.subtitle}</Text> : null}
      </View>
      <Text style={styles.amount}>
        {sign}GHS {money(item.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: { paddingHorizontal: 26, paddingTop: 8, paddingBottom: 6 },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.text },
  content: { paddingHorizontal: 26, paddingBottom: 28 },
  loading: { paddingTop: 80, alignItems: 'center' },
  errorText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.muted, textAlign: 'center' },
  retry: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: Colors.brandGreen },
  retryText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.white },
  empty: {
    marginTop: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  emptyText: { fontFamily: Fonts.body, fontSize: 13.5, color: Colors.muted, lineHeight: 20 },
  groupLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.text, marginTop: 20, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginLeft: 14 },
  rowTitle: { fontFamily: Fonts.bodyMedium, fontSize: 13.5, color: Colors.text },
  rowSub: { fontFamily: Fonts.bodyMedium, fontSize: 12.5, color: Colors.placeholder, marginTop: 3 },
  amount: { fontFamily: Fonts.display, fontSize: 16, color: Colors.text, letterSpacing: -0.38 },
});
