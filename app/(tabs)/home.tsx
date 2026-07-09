import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SalaryReceivedModal } from '@/components/SalaryReceivedModal';
import { Colors, Fonts } from '@/constants/theme';
import { ApiError, HomeBill, HomeData, PendingSalary, personalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { categoryIcon } from '@/lib/categories';
import { group, money } from '@/lib/format';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export default function HomeScreen() {
  const { session } = useAuth();
  const account = session?.account;
  const token = session?.accessToken ?? '';
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSalary, setPendingSalary] = useState<PendingSalary | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setError(null);
      const home = await personalApi.home(token);
      setData(home);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your home. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load();
      personalApi
        .pendingSalary(token)
        .then((pending) => {
          if (active) {
            setPendingSalary(pending);
          }
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [token, load]),
  );

  function dismissSalary() {
    setPendingSalary(null);
    load();
  }

  const fullName = account ? `${account.firstName} ${account.lastName}` : '';
  const initials = account ? `${account.firstName[0] ?? ''}${account.lastName[0] ?? ''}`.toUpperCase() : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>{fullName}</Text>
        </View>
        <View style={styles.topRight}>
          <Pressable hitSlop={8} style={styles.bell} onPress={() => router.navigate('/activity')}>
            <Ionicons name="notifications-outline" size={23} color={Colors.text} />
          </Pressable>
          <Pressable onPress={() => router.navigate('/profile')} hitSlop={8} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={Colors.brandGreen}
          />
        }
      >
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
        ) : data ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <Text style={styles.heroLabel}>Free spendable cash</Text>
                <MaterialCommunityIcons name="contactless-payment" size={40} color="rgba(255,255,255,0.85)" />
              </View>
              <Text style={styles.heroAmount}>
                {data.wallet.currency} {group(data.wallet.freeSpendable.toFixed(2).split('.')[0])}
                <Text style={styles.heroDecimals}>.{data.wallet.freeSpendable.toFixed(2).split('.')[1]}</Text>
              </Text>
              <View style={styles.heroPill}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                <Text style={styles.heroPillText}>Your bills are already sorted</Text>
              </View>
            </View>

            <View style={styles.lockedCard}>
              <View style={styles.lockedIcon}>
                <Ionicons name="wallet" size={28} color={Colors.brandGreen} />
              </View>
              <View style={styles.lockedBody}>
                <Text style={styles.lockedLabel}>Locked safe wallet · reserved for bills</Text>
                <Text style={styles.lockedAmount}>
                  {data.wallet.currency} {money(data.wallet.lockedSafe)}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <QuickAction
                icon="add-circle"
                tint="#DCF6EE"
                color={Colors.brandGreen}
                label="Add money"
                onPress={() => router.navigate('/add-money')}
              />
              <QuickAction
                icon="paper-plane"
                tint="#FEEBE6"
                color="#F05A47"
                label="Send money"
                onPress={() => router.navigate('/send')}
              />
              <QuickAction
                icon="receipt-outline"
                tint="#DCF6EE"
                color={Colors.brandGreen}
                label="Bills"
                onPress={() => router.navigate('/bills')}
              />
              <QuickAction
                icon="document-text-outline"
                tint="#FDEDD8"
                color="#E1932E"
                label="Statement"
                onPress={() => router.navigate('/activity')}
              />
            </View>

            {data.nextSalary ? (
              <View style={styles.salaryCard}>
                <View style={styles.salaryIcon}>
                  <MaterialCommunityIcons name="cash-clock" size={20} color={Colors.brandGreen} />
                </View>
                <View style={styles.salaryBody}>
                  <Text style={styles.salaryTitle}>Salary from {data.nextSalary.sourceName}</Text>
                  <Text style={styles.salarySub}>
                    Expected in {data.nextSalary.daysUntil} days · {data.wallet.currency}{' '}
                    {money(data.nextSalary.amount)}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.round(data.nextSalary.progress * 100)}%` }]} />
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your bills this month</Text>
              <Pressable hitSlop={8} style={styles.seeAll} onPress={() => router.navigate('/bills')}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.brandGreen} />
              </Pressable>
            </View>

            {data.bills.length === 0 ? (
              <View style={styles.emptyBills}>
                <Text style={styles.emptyText}>No bills yet. Add one and Klare will lock it every payday.</Text>
              </View>
            ) : (
              data.bills.map((bill) => <BillRow key={bill.id} bill={bill} currency={data.wallet.currency} />)
            )}
          </>
        ) : null}
      </ScrollView>

      {pendingSalary ? (
        <SalaryReceivedModal salary={pendingSalary} token={token} onClose={dismissSalary} />
      ) : null}
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  tint,
  color,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  color: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function BillRow({ bill, currency }: { bill: HomeBill; currency: string }) {
  const meta = categoryIcon(bill.category);
  return (
    <View style={styles.billRow}>
      <View style={[styles.billIcon, { backgroundColor: meta.tint }]}>
        <MaterialCommunityIcons name={meta.name} size={20} color={meta.color} />
      </View>
      <View style={styles.billBody}>
        <Text style={styles.billName}>{bill.name}</Text>
        <Text style={styles.billSub}>{bill.frequencyLabel}</Text>
      </View>
      <View style={styles.billRight}>
        <Text style={styles.billAmount}>
          {currency} {money(bill.amount)}
        </Text>
        {bill.locked ? <Text style={styles.lockedBadge}>Locked</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mist },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 10,
  },
  greeting: { fontFamily: Fonts.bodyMedium, fontSize: 14.5, color: '#71807A' },
  name: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.text, marginTop: 2 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bell: { padding: 2 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.white },
  content: { paddingHorizontal: 22, paddingBottom: 24 },
  loading: { paddingTop: 80, alignItems: 'center' },
  errorText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.muted, textAlign: 'center', paddingHorizontal: 20 },
  retry: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: Colors.brandGreen },
  retryText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.white },
  hero: {
    backgroundColor: Colors.brandGreen,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { fontFamily: Fonts.body, fontSize: 13, color: '#A8DCCC', marginTop: 4 },
  heroAmount: { fontFamily: Fonts.display, fontSize: 40, color: '#EAF5F0', marginTop: 6, letterSpacing: -0.8 },
  heroDecimals: { fontFamily: Fonts.display, fontSize: 22, color: '#BFE6DA' },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: '#12856D',
    borderRadius: 85,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  heroPillText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.white },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginTop: 16,
  },
  lockedIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#DCF6EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBody: { flex: 1, marginLeft: 14 },
  lockedLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.placeholder },
  lockedAmount: { fontFamily: Fonts.display, fontSize: 22, color: Colors.brandGreen, marginTop: 6, letterSpacing: -0.22 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  actionCard: {
    width: '23.5%',
    height: 96,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11.5, color: '#474747', marginTop: 9 },
  salaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginTop: 16,
  },
  salaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DCF6EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  salaryBody: { flex: 1, marginLeft: 14 },
  salaryTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13.5, color: Colors.text },
  salarySub: { fontFamily: Fonts.bodyMedium, fontSize: 12.5, color: Colors.placeholder, marginTop: 3 },
  progressTrack: { height: 4, borderRadius: 53, backgroundColor: '#E7ECE9', marginTop: 12, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 53, backgroundColor: Colors.brandGreen },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.text },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.brandGreen },
  emptyBills: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  emptyText: { fontFamily: Fonts.body, fontSize: 13.5, color: Colors.muted, lineHeight: 20 },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  billIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  billBody: { flex: 1, marginLeft: 14 },
  billName: { fontFamily: Fonts.bodyMedium, fontSize: 13.5, color: Colors.text },
  billSub: { fontFamily: Fonts.bodyMedium, fontSize: 12.5, color: Colors.placeholder, marginTop: 3 },
  billRight: { alignItems: 'flex-end' },
  billAmount: { fontFamily: Fonts.display, fontSize: 16, color: Colors.text, letterSpacing: -0.38 },
  lockedBadge: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: '#1D9E75', marginTop: 4 },
});
