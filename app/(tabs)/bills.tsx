import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { ApiError, BillItem, BillsData, BillPaymentResult, personalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { categoryIcon } from '@/lib/categories';
import { money } from '@/lib/format';

export default function BillsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const token = session?.accessToken ?? '';
  const [data, setData] = useState<BillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await personalApi.bills(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your bills.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function replaceBill(updated: BillItem) {
    setData((current) =>
      current ? { ...current, obligations: current.obligations.map((b) => (b.id === updated.id ? updated : b)) } : current,
    );
  }

  async function toggleActive(bill: BillItem) {
    if (savingId) {
      return;
    }
    setSavingId(bill.id);
    try {
      replaceBill({ ...bill, active: !bill.active });
      const updated = await personalApi.updateBill(bill.id, { active: !bill.active }, token);
      replaceBill(updated);
    } catch (err) {
      replaceBill(bill);
      Alert.alert('Klare', err instanceof ApiError ? err.message : 'Could not update that bill.');
    } finally {
      setSavingId(null);
    }
  }

  function editBill(bill: BillItem) {
    router.push({
      pathname: '/add-expense',
      params: {
        id: bill.id,
        name: bill.name,
        amount: String(bill.amount),
        category: bill.category,
        network: bill.network ?? 'MTN',
        recipient: bill.recipientNumber ?? '',
      },
    });
  }

  function confirmDelete(bill: BillItem) {
    Alert.alert('Remove expense', `Stop tracking "${bill.name}"? Klare will no longer lock or pay it.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await personalApi.deleteBill(bill.id, token);
            setData((current) =>
              current ? { ...current, obligations: current.obligations.filter((b) => b.id !== bill.id) } : current,
            );
          } catch (err) {
            Alert.alert('Klare', err instanceof ApiError ? err.message : 'Could not remove that expense.');
          }
        },
      },
    ]);
  }

  async function payNow() {
    if (paying) {
      return;
    }
    setPaying(true);
    try {
      const result: BillPaymentResult = await personalApi.payBills(token);
      await load();
      if (result.paidCount === 0) {
        Alert.alert('Nothing to pay', 'No active bills had enough locked funds to pay right now.');
      } else {
        Alert.alert(
          'Bills paid',
          `Klare paid ${result.paidCount} ${result.paidCount === 1 ? 'bill' : 'bills'} (${result.currency} ${money(
            result.totalPaid,
          )})${result.skippedCount > 0 ? `, ${result.skippedCount} skipped` : ''}.`,
        );
      }
    } catch (err) {
      Alert.alert('Klare', err instanceof ApiError ? err.message : 'We could not pay your bills right now.');
    } finally {
      setPaying(false);
    }
  }

  const income = data?.monthlyIncome ?? null;
  const spendable = data?.spendable ?? null;
  const spendablePct = income && income > 0 && spendable != null ? (spendable / income) * 100 : 70;
  const hasActive = (data?.obligations ?? []).some((b) => b.active);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Bills and expenses</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
            <View style={styles.splitCard}>
              <View style={styles.splitTop}>
                <View>
                  <Text style={styles.splitLabel}>{income != null ? 'Monthly income' : 'Locked for bills'}</Text>
                  <Text style={styles.splitValue}>
                    {data.currency} {money(income != null ? income : data.lockedForBills)}
                  </Text>
                </View>
                {income != null ? (
                  <View style={styles.splitRight}>
                    <Text style={styles.splitLabel}>Locked for bills</Text>
                    <Text style={[styles.splitValue, styles.splitValueLocked]}>
                      {data.currency} {money(data.lockedForBills)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.barTrack}>
                <View style={[styles.barSpendable, { flex: spendablePct }]} />
                <View style={[styles.barLocked, { flex: Math.max(0, 100 - spendablePct) }]} />
              </View>

              {income != null && data.sweepPercentage != null ? (
                <Text style={styles.splitCaption}>
                  {data.sweepPercentage}% of your salary is auto-swept to bills · {data.currency}{' '}
                  {money(spendable ?? 0)} stays spendable
                </Text>
              ) : (
                <Text style={styles.splitCaption}>
                  {data.currency} {money(data.lockedForBills)} is set aside and locked each payday.
                </Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Auto-swept each payday</Text>

            {data.obligations.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No expenses yet. Add one and Klare locks it every payday.</Text>
              </View>
            ) : (
              data.obligations.map((bill) => (
                <BillRow
                  key={bill.id}
                  bill={bill}
                  currency={data.currency}
                  saving={savingId === bill.id}
                  onToggle={() => toggleActive(bill)}
                  onEdit={() => editBill(bill)}
                  onDelete={() => confirmDelete(bill)}
                />
              ))
            )}

            {hasActive ? (
              <Pressable style={[styles.payButton, paying && styles.payButtonDisabled]} onPress={payNow} disabled={paying}>
                {paying ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.payText}>Pay bills now</Text>
                )}
              </Pressable>
            ) : null}

            <Pressable style={styles.addButton} onPress={() => router.push('/add-expense')}>
              <Text style={styles.addText}>Add expense</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function BillRow({
  bill,
  currency,
  saving,
  onToggle,
  onEdit,
  onDelete,
}: {
  bill: BillItem;
  currency: string;
  saving: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = categoryIcon(bill.category);
  const subtitle = bill.active ? bill.destination ?? 'Auto-swept each payday' : 'Paused this cycle';
  return (
    <View style={[styles.billRow, !bill.active && styles.billRowOff]}>
      <Pressable style={styles.billTap} onPress={onEdit}>
        <View style={[styles.billIcon, { backgroundColor: meta.tint }]}>
          <MaterialCommunityIcons name={meta.name} size={20} color={meta.color} />
        </View>
        <View style={styles.billBody}>
          <Text style={styles.billName}>{bill.name}</Text>
          <Text style={styles.billSub} numberOfLines={1}>
            {subtitle}
          </Text>
          <View style={styles.amountField}>
            <Text style={[styles.billAmount, !bill.active && styles.billAmountOff]}>
              {currency} {money(bill.amount)}
            </Text>
            {saving ? <ActivityIndicator size="small" color={Colors.brandGreen} style={styles.rowSpinner} /> : null}
          </View>
        </View>
      </Pressable>
      <View style={styles.billRight}>
        <Switch
          value={bill.active}
          onValueChange={onToggle}
          disabled={saving}
          trackColor={{ false: '#D9DEDB', true: '#9FE0CC' }}
          thumbColor={bill.active ? Colors.brandGreen : '#F4F5F4'}
        />
        <View style={styles.rowActions}>
          <Pressable hitSlop={8} onPress={onEdit} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={18} color={Colors.placeholder} />
          </Pressable>
          <Pressable hitSlop={8} onPress={onDelete} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={18} color="#C4544D" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mist },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.text },
  content: { paddingHorizontal: 24, paddingBottom: 28 },
  loading: { paddingTop: 80, alignItems: 'center' },
  errorText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.muted, textAlign: 'center' },
  retry: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: Colors.brandGreen },
  retryText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.white },
  splitCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 6,
    shadowColor: '#0B2A22',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  splitTop: { flexDirection: 'row', justifyContent: 'space-between' },
  splitRight: { alignItems: 'flex-end' },
  splitLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: '#767676' },
  splitValue: { fontFamily: Fonts.display, fontSize: 17, color: Colors.text, marginTop: 6 },
  splitValueLocked: { color: '#BA7517' },
  barTrack: { flexDirection: 'row', height: 12, borderRadius: 8, overflow: 'hidden', marginTop: 16 },
  barSpendable: { backgroundColor: '#1D9E75' },
  barLocked: { backgroundColor: '#BA7517' },
  splitCaption: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: '#767676', marginTop: 16, lineHeight: 18 },
  sectionTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.text, marginTop: 24, marginBottom: 14 },
  empty: {
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  billRowOff: { opacity: 0.65 },
  billTap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  billIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  billBody: { flex: 1, marginLeft: 14 },
  billName: { fontFamily: Fonts.bodyMedium, fontSize: 13.5, color: Colors.text },
  billSub: { fontFamily: Fonts.bodyMedium, fontSize: 12.5, color: Colors.placeholder, marginTop: 3 },
  amountField: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  billAmount: { fontFamily: Fonts.display, fontSize: 16, color: Colors.text, letterSpacing: -0.38 },
  billAmountOff: { color: '#9DA0A5' },
  rowSpinner: { marginLeft: 8 },
  billRight: { alignItems: 'center', gap: 8, marginLeft: 10 },
  rowActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 2 },
  payButton: {
    height: 53,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  payButtonDisabled: { backgroundColor: '#A7CFC2' },
  payText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
  addButton: {
    height: 53,
    borderRadius: 10,
    backgroundColor: '#DCF6EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  addText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.brandGreen },
});
