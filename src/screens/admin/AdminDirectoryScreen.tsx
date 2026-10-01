import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/adminApi';
import { lawyerApi } from '../../api/lawyerApi';
import StatusBadge from '../../components/StatusBadge';
import { Users, ShieldCheck, Mail, Phone, MapPin, Award } from 'lucide-react-native';

const AdminDirectoryScreen = () => {
  const [activeTab, setActiveTab] = useState<'LAWYERS' | 'CUSTOMERS'>('LAWYERS');
  
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lawyersRes, customersRes] = await Promise.all([
        adminApi.getAllLawyers().catch(() => ({ data: [] })),
        adminApi.getCustomers().catch(() => ({ data: [] }))
      ]);
      setLawyers(Array.isArray(lawyersRes.data) ? lawyersRes.data : []);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
    } finally {
      setLoading(false);
    }
  };

  const renderLawyerItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1 }]}>
            <Text style={[styles.avatarText, { color: '#4F46E5' }]}>{item.fullName?.charAt(0) || 'L'}</Text>
          </View>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <MapPin size={12} color="#64748B" />
              <Text style={styles.subText} numberOfLines={1}> {item.location || 'India'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Mail size={12} color="#94A3B8" />
              <Text style={styles.contactText} numberOfLines={1}> {item.email}</Text>
            </View>
          </View>
          <StatusBadge status={item.verificationStatus || 'APPROVED'} />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBodyCompact}>
          <View style={styles.infoRowCompact}>
            <Text style={styles.infoLabelCompact}>Bar Reg No:</Text>
            <View style={styles.infoBadgeCompact}>
              <Text style={styles.infoValueCompact}>{item.barCouncilRegNumber || item.barCouncilNumber || item.barEnrollmentNumber || 'Not Provided'}</Text>
            </View>
          </View>
          <View style={styles.infoRowCompact}>
            <Text style={styles.infoLabelCompact}>Experience:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Award size={14} color="#D97706" />
              <Text style={[styles.infoValueCompact, { marginLeft: 4, fontWeight: 'bold' }]}>{item.yearsOfExperience ? `${item.yearsOfExperience} Years` : 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRowCompact}>
            <Text style={styles.infoLabelCompact}>Consultation Fee:</Text>
            <Text style={[styles.infoValueCompact, { color: '#059669', fontWeight: 'bold', fontSize: 14 }]}>₹{item.consultationFee || item.consultationRateAmount || 99}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCustomerItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1 }]}>
          <Text style={[styles.avatarText, { color: '#059669' }]}>{item.fullName?.charAt(0) || 'C'}</Text>
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Phone size={12} color="#64748B" />
            <Text style={styles.subText}> {item.mobileNumber}</Text>
          </View>
        </View>
        <StatusBadge status={item.accountStatus || 'ACTIVE'} />
      </View>
      
      <View style={styles.cardDivider} />

      <View style={[styles.cardBodyCompact, { gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Mail size={16} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabelCompact}>Email Address</Text>
            <Text style={[styles.infoValueCompact, { fontSize: 13, marginTop: 2 }]}>{item.email}</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <ShieldCheck size={16} color="#059669" />
            </View>
            <Text style={[styles.infoLabelCompact, { marginBottom: 0 }]}>Fee Status</Text>
          </View>
          <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' }}>
            <Text style={[styles.infoValueCompact, { color: '#059669', fontSize: 13, fontWeight: '700' }]}>₹99 ({item.paymentStatus || 'PAID'})</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroBanner}>
        <View style={styles.heroTitleRow}>
          <Text style={styles.heroTitle}>Global Directory</Text>
        </View>
        <Text style={styles.heroSubtitle}>Manage all registered advocates and customers across the Adalat platform.</Text>
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity 
            style={[styles.tabPill, activeTab === 'LAWYERS' && styles.activeTabPill]}
            onPress={() => setActiveTab('LAWYERS')}
          >
            <ShieldCheck size={16} color={activeTab === 'LAWYERS' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 6 }}/>
            <Text style={[styles.tabPillText, activeTab === 'LAWYERS' && styles.activeTabPillText]}>
              Advocates ({lawyers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabPill, activeTab === 'CUSTOMERS' && styles.activeTabPill]}
            onPress={() => setActiveTab('CUSTOMERS')}
          >
            <Users size={16} color={activeTab === 'CUSTOMERS' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 6 }}/>
            <Text style={[styles.tabPillText, activeTab === 'CUSTOMERS' && styles.activeTabPillText]}>
              Customers ({customers.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'LAWYERS' ? lawyers : customers}
          keyExtractor={(item, index) => (item.id || item.lawyerId || item.customerId || index).toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={activeTab === 'LAWYERS' ? renderLawyerItem : renderCustomerItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Users size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Users Found</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  heroBanner: { backgroundColor: '#111827', padding: 20, paddingBottom: 24 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  heroSubtitle: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },

  tabContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, zIndex: 10 },
  tabSwitcher: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
  tabPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  activeTabPill: { backgroundColor: '#4F46E5', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  tabPillText: { fontSize: 13, fontWeight: 'bold', color: '#64748B' },
  activeTabPillText: { color: '#FFFFFF' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  subText: { fontSize: 12, color: '#64748B' },
  contactText: { fontSize: 11, color: '#94A3B8' },
  
  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },

  cardBodyCompact: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', gap: 10 },
  infoRowCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabelCompact: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  infoValueCompact: { fontSize: 12, color: '#334155' },
  infoBadgeCompact: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginTop: 16 },
});

export default AdminDirectoryScreen;
