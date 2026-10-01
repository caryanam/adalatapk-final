import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, CreditCard } from 'lucide-react-native';

const PaymentsScreen = () => {
  const navigation = useNavigation<any>();
  // Mock data for payments
  const payments = [
    { id: 'pay_1', amount: '₹99.00', purpose: 'Registration Fee', date: 'Oct 1, 2026', status: 'SUCCESS' },
    { id: 'pay_2', amount: '₹299.00', purpose: 'Consultation Unlock', date: 'Oct 14, 2026', status: 'SUCCESS' }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1C1C4A" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment History</Text>
      </View>

      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.left}>
              <View style={styles.iconBox}>
                <CreditCard size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.purpose}>{item.purpose}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{item.amount}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <CreditCard size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No payments found</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF' },
  backBtn: { marginRight: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1C1C4A' },
  list: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  left: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  purpose: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  date: { fontSize: 12, color: '#64748B', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  status: { fontSize: 11, color: '#10B981', fontWeight: 'bold', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, color: '#64748B' }
});

export default PaymentsScreen;
