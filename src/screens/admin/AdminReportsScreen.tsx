import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp } from 'lucide-react-native';

const AdminReportsScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics & Reports</Text>
      </View>

      <View style={styles.centerContainer}>
        <TrendingUp size={64} color="#4F46E5" style={{ marginBottom: 24 }} />
        <Text style={styles.emptyTitle}>Data Processing...</Text>
        <Text style={styles.emptySub}>
          Historical growth charts and practice area analytics will generate automatically as consultation sessions increase.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1C1C4A' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C4A', textAlign: 'center' },
  emptySub: { fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 22 }
});

export default AdminReportsScreen;
