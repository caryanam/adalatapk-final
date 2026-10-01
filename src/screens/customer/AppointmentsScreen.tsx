import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Calendar, MessageSquare, CheckCircle, Scale, Clock, Search, Plus, Sparkles } from 'lucide-react-native';
import { consultationApi } from '../../api/consultationApi';

const AppointmentsScreen = () => {
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await consultationApi.getRequestsForCustomer();
      const data = res.data?.data || res.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch appointments', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const appointments = useMemo(() => {
    return requests.map(r => ({
      id: r.id || r.requestId || Math.random().toString(),
      lawyerId: r.lawyerId || 1,
      lawyerName: r.lawyerName || 'Advocate',
      category: r.categoryDisplayName || r.category || 'Legal Consultation',
      scheduledTime: r.assignedDate ? `${r.assignedDate} at ${r.assignedTime || 'Scheduled Time'}` : (r.scheduledAt || 'Scheduled'),
      status: r.status || 'ACCEPTED'
    }));
  }, [requests]);

  // Derived stats
  const totalBookings = appointments.length;
  const upcomingActive = appointments.filter(a => a.status !== 'COMPLETED').length;
  const completedSessions = appointments.filter(a => a.status === 'COMPLETED').length;
  const uniqueAdvocates = new Set(appointments.map(a => a.lawyerId)).size;

  // Filtering
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchesSearch = app.lawyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            app.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeTab === 'Active & Upcoming') return app.status !== 'COMPLETED';
      if (activeTab === 'Completed') return app.status === 'COMPLETED';
      return true;
    });
  }, [appointments, searchQuery, activeTab]);

  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'COMPLETED';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.lawyerName}>{item.lawyerName}</Text>
          <View style={[styles.badge, isCompleted ? styles.badgeSuccess : styles.badgeGold]}>
            <Text style={[styles.badgeText, isCompleted ? styles.badgeTextSuccess : styles.badgeTextGold]}>
              {isCompleted ? 'Closed / Completed' : item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Scale size={16} color="#64748B" />
            <Text style={styles.infoText}>{item.category}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <Calendar size={16} color="#64748B" />
            <Text style={styles.infoText}>{item.scheduledTime}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {isCompleted ? (
            <View style={styles.completedStatus}>
              <CheckCircle size={16} color="#059669" />
              <Text style={styles.completedText}>Consultation Closed</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Consultations', { screen: 'ConsultationsList', params: { lawyerId: item.lawyerId } })}
            >
              <MessageSquare size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Open Session</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL BOOKINGS</Text>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{totalBookings}</Text>
            <View style={[styles.statIconBg, { backgroundColor: '#EEF2FF' }]}>
              <Calendar size={20} color="#4F46E5" />
            </View>
          </View>
          <Text style={styles.statSub}>Recorded sessions</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>UPCOMING & ACTIVE</Text>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{upcomingActive}</Text>
            <View style={[styles.statIconBg, { backgroundColor: '#ECFDF5' }]}>
              <Clock size={20} color="#059669" />
            </View>
          </View>
          <Text style={[styles.statSub, { color: '#059669' }]}>• Ready to join</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>COMPLETED SESSIONS</Text>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{completedSessions}</Text>
            <View style={[styles.statIconBg, { backgroundColor: '#FFFBEB' }]}>
              <CheckCircle size={20} color="#D97706" />
            </View>
          </View>
          <Text style={styles.statSub}>Concluded consultations</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>ADVOCATES NETWORK</Text>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{uniqueAdvocates}</Text>
            <View style={[styles.statIconBg, { backgroundColor: '#FAF5FF' }]}>
              <Scale size={20} color="#9333EA" />
            </View>
          </View>
          <Text style={styles.statSub}>Verified advocates</Text>
        </View>
      </View>

      {/* Filters and Search */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {['All Bookings', 'Active & Upcoming', 'Completed'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === (tab === 'All Bookings' ? 'All' : tab) && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab === 'All Bookings' ? 'All' : tab)}
            >
              <Text style={[styles.tabText, activeTab === (tab === 'All Bookings' ? 'All' : tab) && styles.tabTextActive]}>
                {tab}
              </Text>
              <View style={[styles.tabCountBg, activeTab === (tab === 'All Bookings' ? 'All' : tab) && styles.tabCountBgActive]}>
                <Text style={[styles.tabCountText, activeTab === (tab === 'All Bookings' ? 'All' : tab) && styles.tabCountTextActive]}>
                  {tab === 'All Bookings' ? totalBookings : (tab === 'Active & Upcoming' ? upcomingActive : completedSessions)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by advocate, category..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#1C1C4A" />
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Appointments</Text>
            <View style={styles.hubBadge}>
              <Sparkles size={12} color="#4F46E5" />
              <Text style={styles.hubBadgeText}>Consultation Hub</Text>
            </View>
          </View>
        </View>
        <Text style={styles.headerSub}>Track, manage, and join your scheduled advocate consultation sessions.</Text>
        <TouchableOpacity 
          style={styles.bookNewBtn}
          onPress={() => navigation.navigate('Find Advocates')}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.bookNewText}>Book New Advocate</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 12, color: '#64748B' }}>Loading your appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={renderHeader}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <View style={styles.emptyIconBg}>
                <Calendar size={48} color="#1C1C4A" />
              </View>
              <Text style={styles.emptyTitle}>No Appointments Found</Text>
              <Text style={styles.emptySub}>You do not have any scheduled or completed advocate consultations yet. Book a session with a verified advocate to get started.</Text>
              <TouchableOpacity 
                style={styles.emptyActionBtn}
                onPress={() => navigation.navigate('Find Advocates')}
              >
                <Scale size={16} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>Find & Book an Advocate</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backBtn: { padding: 4, marginRight: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  title: { fontSize: 24, fontWeight: '800', color: '#1E1E2F', marginRight: 8 },
  hubBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#C7D2FE' },
  hubBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#4F46E5', marginLeft: 4 },
  headerSub: { fontSize: 14, color: '#64748B', marginBottom: 16, lineHeight: 20 },
  bookNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 8 },
  bookNewText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 40 },
  listHeaderContainer: { padding: 16 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1E1E2F' },
  statIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statSub: { fontSize: 12, color: '#94A3B8' },
  
  filterSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16 },
  tabsScroll: { flexDirection: 'row', marginBottom: 12 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#F8FAFC' },
  tabBtnActive: { backgroundColor: '#EEF2FF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#4F46E5' },
  tabCountBg: { backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  tabCountBgActive: { backgroundColor: '#C7D2FE' },
  tabCountText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  tabCountTextActive: { color: '#4F46E5' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1E1E2F', padding: 0 },
  
  card: { marginHorizontal: 16, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  lawyerName: { fontSize: 16, fontWeight: 'bold', color: '#1E1E2F', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeGold: { backgroundColor: '#FEF9C3' },
  badgeSuccess: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  badgeTextGold: { color: '#854D0E' },
  badgeTextSuccess: { color: '#065F46' },
  
  cardBody: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 8, color: '#475569', fontSize: 14, fontWeight: '500' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  completedStatus: { flexDirection: 'row', alignItems: 'center' },
  completedText: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#059669' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, marginLeft: 6 },
  
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyIconBg: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1E2F', marginBottom: 12 },
  emptySub: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  emptyActionBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, marginLeft: 8 }
});

export default AppointmentsScreen;
