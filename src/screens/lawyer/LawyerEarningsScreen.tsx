import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { lawyerApi } from '../../api/lawyerApi';
import { ShieldCheck, IndianRupee, TrendingUp, CheckCircle, RefreshCw, CreditCard } from 'lucide-react-native';

const LawyerEarningsScreen = () => {
  const { user } = useAuth();
  const lawyerId = user?.lawyerId || user?.id || 1;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState({
    totalEarnings: '₹0.00',
    todayEarnings: '₹0.00',
    completedConsultations: 0,
    lawyerUpiId: user?.upiId || 'advocate@upi',
    lawyerName: user?.fullName || 'Advocate',
    transactions: [] as any[]
  });

  const fetchEarnings = async () => {
    try {
      const res = await lawyerApi.getEarnings(lawyerId);
      const data = res && res.data ? (res.data.data || res.data) : null;
      if (data) {
        setEarnings({
          totalEarnings: data.totalEarningsNum ? `₹${Number(data.totalEarningsNum).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : data.totalEarnings || '₹0.00',
          todayEarnings: data.todayEarningsNum ? `₹${Number(data.todayEarningsNum).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : data.todayEarnings || '₹0.00',
          completedConsultations: data.completedConsultations || 0,
          lawyerUpiId: data.lawyerUpiId || user?.upiId || 'advocate@upi',
          lawyerName: data.lawyerName || user?.fullName || 'Advocate',
          transactions: Array.isArray(data.transactions) ? data.transactions : []
        });
      }
    } catch (err) {
      console.log('Failed to load earnings', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [lawyerId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Earnings & Payouts</Text>
          <Text style={styles.headerSubtitle}>Direct customer consultation payments</Text>
        </View>
        <TouchableOpacity style={styles.syncBtn} onPress={onRefresh}>
          <RefreshCw size={18} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        {/* UPI Info Banner */}
        <View style={styles.upiBanner}>
          <View style={styles.upiIconBox}>
            <ShieldCheck size={24} color="#FFF" />
          </View>
          <View style={styles.upiTextContent}>
            <Text style={styles.upiTitle}>Direct UPI Settlement Account</Text>
            <Text style={styles.upiDesc}>Fees are settled directly to <Text style={{fontWeight: '700'}}>{earnings.lawyerUpiId}</Text> ({earnings.lawyerName})</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { borderColor: '#A7F3D0' }]}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Total Earnings</Text>
                  <View style={[styles.metricIconWrap, { backgroundColor: '#F0FDF4' }]}><IndianRupee size={16} color="#059669" /></View>
                </View>
                <Text style={[styles.metricValue, { color: '#047857' }]}>{earnings.totalEarnings}</Text>
              </View>
              
              <View style={[styles.metricCard, { borderColor: '#FDE68A' }]}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Today's Earnings</Text>
                  <View style={[styles.metricIconWrap, { backgroundColor: '#FFFBEB' }]}><TrendingUp size={16} color="#D97706" /></View>
                </View>
                <Text style={[styles.metricValue, { color: '#B45309' }]}>{earnings.todayEarnings}</Text>
              </View>

              <View style={[styles.metricCard, { borderColor: '#C7D2FE', width: '100%' }]}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Completed Consultations</Text>
                  <View style={[styles.metricIconWrap, { backgroundColor: '#EEF2FF' }]}><CheckCircle size={16} color="#4F46E5" /></View>
                </View>
                <Text style={[styles.metricValue, { color: '#3730A3' }]}>{earnings.completedConsultations}</Text>
              </View>
            </View>

            {/* Transactions History */}
            <View style={styles.txSection}>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              {earnings.transactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <CreditCard size={40} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No payments received yet.</Text>
                </View>
              ) : (
                earnings.transactions.map((tx, idx) => (
                  <View key={tx.id || idx} style={styles.txCard}>
                    <View style={styles.txLeft}>
                      <View style={styles.txRefHeader}>
                        <Text style={styles.txRefId}>Ref: #{tx.id}</Text>
                      </View>
                      <Text style={styles.txCustomer}>{tx.customerName || 'Registered Client'}</Text>
                      {tx.customerEmail && (
                        <Text style={styles.txEmail}>{tx.customerEmail}</Text>
                      )}
                      <Text style={styles.txCategory}>{tx.category ? tx.category.replace(/_/g, ' ') : 'Legal Consultation'} • {tx.date}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={styles.txAmount}>{tx.amountNum ? `₹${tx.amountNum}` : tx.amount}</Text>
                      <View style={styles.txBadge}><Text style={styles.txBadgeText}>{tx.status || 'PAID'}</Text></View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  syncBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  
  scrollContent: { padding: 16 },
  
  upiBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 20 },
  upiIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  upiTextContent: { flex: 1 },
  upiTitle: { fontSize: 15, fontWeight: '700', color: '#064E3B', marginBottom: 4 },
  upiDesc: { fontSize: 13, color: '#065F46', lineHeight: 18 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  metricCard: { width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  metricLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', flex: 1, paddingRight: 8 },
  metricIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 24, fontWeight: '800' },

  txSection: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emptyText: { marginTop: 12, fontSize: 14, color: '#94A3B8' },
  
  txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  txLeft: { flex: 1, marginRight: 12 },
  txRefHeader: { marginBottom: 4 },
  txRefId: { fontSize: 10, color: '#64748B', fontFamily: 'monospace', backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  txCustomer: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  txEmail: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
  txCategory: { fontSize: 12, color: '#64748B' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: '800', color: '#059669', marginBottom: 4 },
  txBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#A7F3D0' },
  txBadgeText: { fontSize: 10, fontWeight: '800', color: '#059669' }
});

export default LawyerEarningsScreen;
