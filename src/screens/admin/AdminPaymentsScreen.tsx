import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/adminApi';
import StatusBadge from '../../components/StatusBadge';
import { CreditCard, DollarSign } from 'lucide-react-native';

const AdminPaymentsScreen = () => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'REGISTRATION' | 'CONSULTATION'>('ALL');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPayments();
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'REGISTRATION') return tx.type === 'CUSTOMER_REGISTRATION';
    if (activeFilter === 'CONSULTATION') return tx.type === 'LAWYER_CONSULTATION';
    return true;
  });

  const totalVolume = transactions.reduce((sum, tx) => sum + (tx.amountNum || 0), 0);
  const regRevenue = transactions
    .filter(tx => tx.type === 'CUSTOMER_REGISTRATION')
    .reduce((sum, tx) => sum + (tx.amountNum || 99), 0);

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.txId}>Txn: {item.id}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>

      <View style={styles.partyRow}>
        <View style={styles.partyCol}>
          <Text style={styles.partyLabel}>Customer</Text>
          <Text style={styles.partyName}>{item.customer}</Text>
        </View>
        <View style={styles.partyCol}>
          <Text style={styles.partyLabel}>{item.type === 'CUSTOMER_REGISTRATION' ? 'Service' : 'Payout To'}</Text>
          <Text style={styles.partyName}>{item.lawyer}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.typeBadge, item.type === 'CUSTOMER_REGISTRATION' ? styles.typeReg : styles.typeCons]}>
          <Text style={[styles.typeText, item.type === 'CUSTOMER_REGISTRATION' ? styles.typeTextReg : styles.typeTextCons]}>
            {item.typeLabel || (item.type === 'CUSTOMER_REGISTRATION' ? 'Customer Reg' : 'Consultation')}
          </Text>
        </View>
        <StatusBadge status={item.status || 'COMPLETED'} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Audit Log</Text>
      </View>

      {/* Summary Box */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <DollarSign size={20} color="#059669" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.summaryLabel}>Total Platform Volume</Text>
            <Text style={styles.summaryValue}>₹{totalVolume.toFixed(2)}</Text>
          </View>
        </View>
        <View style={[styles.summaryBox, { marginTop: 10, backgroundColor: '#F8FAFC' }]}>
          <CreditCard size={16} color="#4F46E5" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.summaryLabel}>Registration Fees Collected</Text>
            <Text style={[styles.summaryValue, { fontSize: 16, color: '#4F46E5' }]}>₹{regRevenue.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterScroll}>
        <TouchableOpacity 
          style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
          onPress={() => setActiveFilter('ALL')}
        >
          <Text style={[styles.filterText, activeFilter === 'ALL' && styles.filterTextActive]}>All ({transactions.length})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, activeFilter === 'REGISTRATION' && styles.filterChipActive]}
          onPress={() => setActiveFilter('REGISTRATION')}
        >
          <Text style={[styles.filterText, activeFilter === 'REGISTRATION' && styles.filterTextActive]}>Registration</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterChip, activeFilter === 'CONSULTATION' && styles.filterChipActive]}
          onPress={() => setActiveFilter('CONSULTATION')}
        >
          <Text style={[styles.filterText, activeFilter === 'CONSULTATION' && styles.filterTextActive]}>Payouts</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={renderTransaction}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <CreditCard size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Transactions</Text>
              <Text style={styles.emptySub}>No financial records match the current filter.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#FFFFFF' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1C1C4A' },
  summaryContainer: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  summaryBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 12 },
  summaryLabel: { fontSize: 12, color: '#64748B' },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#059669' },
  filterScroll: { flexDirection: 'row', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 10 },
  filterChipActive: { backgroundColor: '#1C1C4A' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF' },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  txId: { fontSize: 13, fontWeight: '600', color: '#475569', fontFamily: 'monospace' },
  date: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  partyRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 12 },
  partyCol: { flex: 1 },
  partyLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  partyName: { fontSize: 13, fontWeight: '600', color: '#1C1C4A' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeReg: { backgroundColor: '#E0E7FF' },
  typeCons: { backgroundColor: '#FEF3C7' },
  typeText: { fontSize: 11, fontWeight: '700' },
  typeTextReg: { color: '#3730A3' },
  typeTextCons: { color: '#92400E' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748B', marginTop: 8 }
});

export default AdminPaymentsScreen;
