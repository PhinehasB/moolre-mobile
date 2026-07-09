import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { ApiError, BillItem, BillPaymentResult, PendingSalary, personalApi } from '@/lib/api';
import { categoryIcon } from '@/lib/categories';
import { money } from '@/lib/format';

type Props = {
  salary: PendingSalary;
  token: string;
  onClose: () => void;
};

export function SalaryReceivedModal({ salary, token, onClose }: Props) {
  const pop = useRef(new Animated.Value(0)).current;
  const [bills, setBills] = useState<BillItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<BillPaymentResult | null>(null);
  const [acking, setAcking] = useState(false);

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, [pop]);

  useEffect(() => {
    let active = true;
    personalApi
      .bills(token)
      .then((data) => {
        if (active) {
          setBills(data.obligations);
        }
      })
      .catch((err) => {
        if (active) {
          setLoadError(err instanceof ApiError ? err.message : 'Could not load your bills.');
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function toggleActive(bill: BillItem) {
    if (savingId) {
      return;
    }
    const next = !bill.active;
    setSavingId(bill.id);
    setActionError(null);
    setBills((current) => current?.map((b) => (b.id === bill.id ? { ...b, active: next } : b)) ?? current);
    try {
      const updated = await personalApi.updateBill(bill.id, { active: next }, token);
      setBills((current) => current?.map((b) => (b.id === bill.id ? updated : b)) ?? current);
    } catch (err) {
      setBills((current) => current?.map((b) => (b.id === bill.id ? { ...b, active: bill.active } : b)) ?? current);
      setActionError(err instanceof ApiError ? err.message : 'Could not update that bill.');
    } finally {
      setSavingId(null);
    }
  }

  async function commitAmount(bill: BillItem) {
    const raw = drafts[bill.id];
    setDrafts((current) => {
      const next = { ...current };
      delete next[bill.id];
      return next;
    });
    if (raw == null) {
      return;
    }
    const amount = Number(raw.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(amount) || amount < 0.01 || amount === bill.amount) {
      return;
    }
    setSavingId(bill.id);
    setActionError(null);
    try {
      const updated = await personalApi.updateBill(bill.id, { amount }, token);
      setBills((current) => current?.map((b) => (b.id === bill.id ? updated : b)) ?? current);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not update that amount.');
    } finally {
      setSavingId(null);
    }
  }

  async function letKlarePay() {
    if (paying) {
      return;
    }
    setPaying(true);
    setActionError(null);
    try {
      const payment = await personalApi.payBills(token);
      await personalApi.acknowledgeSalary(salary.id, token).catch(() => undefined);
      setResult(payment);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'We could not pay your bills right now.');
    } finally {
      setPaying(false);
    }
  }

  async function reviewLater() {
    if (acking) {
      return;
    }
    setAcking(true);
    await personalApi.acknowledgeSalary(salary.id, token).catch(() => undefined);
    onClose();
  }

  const activeBills = bills?.filter((b) => b.active) ?? [];
  const activeTotal = activeBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={reviewLater} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {result ? (
            <View style={styles.doneWrap}>
              <Animated.View
                style={[
                  styles.illustration,
                  {
                    opacity: pop,
                    transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={56} color={Colors.brandGreen} />
              </Animated.View>
              <Text style={styles.title}>Bills sorted</Text>
              <Text style={styles.doneAmount}>
                {result.currency} {money(result.totalPaid)}
              </Text>
              <Text style={styles.subtitle}>
                Klare paid {result.paidCount} {result.paidCount === 1 ? 'bill' : 'bills'} for you
                {result.skippedCount > 0 ? ` · ${result.skippedCount} skipped` : ''}. You have {result.currency}{' '}
                {money(result.freeBalance)} free to spend.
              </Text>
              <Pressable style={styles.primary} onPress={onClose}>
                <Text style={styles.primaryText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Animated.View
                style={[
                  styles.illustration,
                  {
                    opacity: pop,
                    transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                  },
                ]}
              >
                <MaterialCommunityIcons name="wallet" size={48} color={Colors.brandGreen} />
              </Animated.View>

              <Text style={styles.title}>Salary received!</Text>
              <Text style={styles.amount}>
                {salary.currency} {money(salary.amount)}
              </Text>
              <Text style={styles.subtitle}>
                From {salary.sourceName}. Turn off any bill, tweak an amount, or let Klare pay them all from your safe
                wallet.
              </Text>

              {loadError ? (
                <Text style={styles.errorText}>{loadError}</Text>
              ) : bills == null ? (
                <View style={styles.listLoading}>
                  <ActivityIndicator color={Colors.brandGreen} />
                </View>
              ) : bills.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No bills set up yet. Your full salary stays spendable.</Text>
                </View>
              ) : (
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
                  {bills.map((bill) => {
                    const meta = categoryIcon(bill.category);
                    const draft = drafts[bill.id];
                    return (
                      <View key={bill.id} style={[styles.billRow, !bill.active && styles.billRowOff]}>
                        <View style={[styles.billIcon, { backgroundColor: meta.tint }]}>
                          <MaterialCommunityIcons name={meta.name} size={18} color={meta.color} />
                        </View>
                        <View style={styles.billBody}>
                          <Text style={styles.billName} numberOfLines={1}>
                            {bill.name}
                          </Text>
                          <View style={styles.amountField}>
                            <Text style={styles.currencyPrefix}>{salary.currency}</Text>
                            <TextInput
                              value={draft ?? money(bill.amount)}
                              editable={bill.active && savingId !== bill.id}
                              onChangeText={(text) => setDrafts((c) => ({ ...c, [bill.id]: text }))}
                              onBlur={() => commitAmount(bill)}
                              keyboardType="numeric"
                              style={[styles.amountInput, !bill.active && styles.amountInputOff]}
                            />
                          </View>
                        </View>
                        <Switch
                          value={bill.active}
                          onValueChange={() => toggleActive(bill)}
                          disabled={savingId === bill.id}
                          trackColor={{ false: '#D9DEDB', true: '#9FE0CC' }}
                          thumbColor={bill.active ? Colors.brandGreen : '#F4F5F4'}
                        />
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {bills && bills.length > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    {activeBills.length} active {activeBills.length === 1 ? 'bill' : 'bills'}
                  </Text>
                  <Text style={styles.totalValue}>
                    {salary.currency} {money(activeTotal)}
                  </Text>
                </View>
              ) : null}

              {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

              <Pressable
                style={[styles.primary, (paying || activeBills.length === 0) && styles.primaryDisabled]}
                onPress={letKlarePay}
                disabled={paying || activeBills.length === 0}
              >
                {paying ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryText}>Let Klare pay my bills</Text>
                )}
              </Pressable>
              <Pressable style={styles.secondary} onPress={reviewLater} disabled={acking}>
                <Text style={styles.secondaryText}>I&apos;ll handle it later</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,16,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    alignItems: 'center',
    maxHeight: '90%',
  },
  doneWrap: { alignItems: 'center', width: '100%' },
  illustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E4F2EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: Fonts.display, fontSize: 24, color: Colors.text, marginTop: 16, letterSpacing: -0.25 },
  amount: { fontFamily: Fonts.display, fontSize: 30, color: Colors.brandGreen, marginTop: 6, letterSpacing: -0.84 },
  doneAmount: { fontFamily: Fonts.display, fontSize: 30, color: Colors.brandGreen, marginTop: 6, letterSpacing: -0.84 },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 10,
  },
  listLoading: { paddingVertical: 30 },
  list: { width: '100%', marginTop: 16 },
  listContent: { gap: 10, paddingBottom: 2 },
  emptyCard: { width: '100%', backgroundColor: Colors.mist, borderRadius: 14, padding: 16, marginTop: 16 },
  emptyText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mist,
    borderRadius: 14,
    padding: 12,
  },
  billRowOff: { opacity: 0.6 },
  billIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  billBody: { flex: 1, marginLeft: 12 },
  billName: { fontFamily: Fonts.bodyMedium, fontSize: 13.5, color: Colors.text },
  amountField: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  currencyPrefix: { fontFamily: Fonts.bodyMedium, fontSize: 12.5, color: Colors.placeholder, marginRight: 4 },
  amountInput: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 2,
    minWidth: 70,
  },
  amountInputOff: { color: '#9DA0A5' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  totalLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: '#3F4D47' },
  totalValue: { fontFamily: Fonts.display, fontSize: 18, color: Colors.text, letterSpacing: -0.4 },
  errorText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: '#D7443E',
    textAlign: 'center',
    marginTop: 12,
  },
  primary: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryDisabled: { backgroundColor: '#A7CFC2' },
  primaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white },
  secondary: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#71807A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#3F4D47' },
});
