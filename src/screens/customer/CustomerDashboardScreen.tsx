import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Calendar, CreditCard, Scale, ShieldCheck, ArrowRight, Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { consultationApi } from '../../api/consultationApi';

const CustomerDashboardScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [consultations, setConsultations] = useState<any[]>([]);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const res = await consultationApi.getRequestsForCustomer();
        const data = res.data?.data || res.data || [];
        setConsultations(data.filter((c: any) => c.status !== 'COMPLETED'));
      } catch (e) {
        console.error('Failed to load dashboard consultations', e);
      }
    };
    fetchConsultations();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <View style={styles.badge}>
              <ShieldCheck size={14} color="#059669" />
              <Text style={styles.badgeText}>Account Active (₹99 Paid)</Text>
            </View>
            <Text style={styles.welcomeText}>Welcome, {user?.fullName || 'Customer'}</Text>
            <Text style={styles.subtitleText}>Manage your active legal consultations, booked appointments, and payment history.</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
            <Bell size={24} color="#1C1C4A" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: '#1C1C4A' }]}>
              <MessageSquare size={20} color="#D97706" />
            </View>
            <View style={styles.metricInfo}>
              <Text style={styles.metricValue}>{consultations.length} Active</Text>
              <Text style={styles.metricLabel}>Consultations</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: '#D97706' }]}>
              <Calendar size={20} color="#1C1C4A" />
            </View>
            <View style={styles.metricInfo}>
              <Text style={styles.metricValue}>0 Upcoming</Text>
              <Text style={styles.metricLabel}>Appointments</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: '#0D9488' }]}>
              <CreditCard size={20} color="#FFFFFF" />
            </View>
            <View style={styles.metricInfo}>
              <Text style={styles.metricValue}>₹99.00</Text>
              <Text style={styles.metricLabel}>Registration</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: '#1C1C4A' }]}>
              <Scale size={20} color="#D97706" />
            </View>
            <View style={styles.metricInfo}>
              <Text style={styles.metricValue}>Verified</Text>
              <Text style={styles.metricLabel}>Top Advocates</Text>
            </View>
          </View>
        </View>

        {/* AI Prompt Banner */}
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerHeader}>
            <Scale size={28} color="#D97706" />
            <View style={styles.aiBannerTextContainer}>
              <Text style={styles.aiBannerTitle}>Need Legal Advice Right Now?</Text>
              <Text style={styles.aiBannerSubtitle}>Connect with top verified advocates across India for court litigation, legal advisory, and consultation.</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.findBtn}
            onPress={() => navigation.navigate('FindLawyers')}
          >
            <Text style={styles.findBtnText}>Find Advocates</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Recent Consultations */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Consultations</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Consultations')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {consultations.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageSquare size={32} color="#94A3B8" />
              <Text style={styles.emptyStateTitle}>No Active Consultations</Text>
              <Text style={styles.emptyStateSub}>Visit the Find Advocates tab to book your direct consultation.</Text>
            </View>
          ) : (
            consultations.slice(0, 3).map((c: any) => (
              <TouchableOpacity 
                key={c.id || c.requestId} 
                style={styles.consultationCard}
                onPress={() => navigation.navigate('Consultations', { screen: 'ConsultationChat', params: { lawyerId: c.lawyerId } })}
              >
                <View style={styles.consultationHeader}>
                  <Text style={styles.lawyerName}>{c.lawyerName || 'Advocate'}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{c.status || 'ACTIVE'}</Text>
                  </View>
                </View>
                <Text style={styles.categoryText}>{c.categoryDisplayName || c.category || 'Legal Consultation'}</Text>
                
                <View style={styles.chatAction}>
                  <MessageSquare size={14} color="#D97706" />
                  <Text style={styles.chatActionText}>Chat (10m Free)</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2FB' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bellBtn: { padding: 8, backgroundColor: 'rgba(28, 28, 74, 0.05)', borderRadius: 20, position: 'relative' },
  bellBadge: { position: 'absolute', top: 8, right: 10, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 1, borderColor: '#F0F2FB' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start', marginBottom: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  badgeText: { color: '#059669', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#1C1C4A', marginBottom: 6 },
  subtitleText: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  metricCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  metricInfo: { flex: 1 },
  metricValue: { fontSize: 14, fontWeight: 'bold', color: '#1C1C4A' },
  metricLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  aiBanner: { backgroundColor: '#1C1C4A', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#D97706', marginBottom: 24 },
  aiBannerHeader: { flexDirection: 'row', marginBottom: 16 },
  aiBannerTextContainer: { flex: 1, marginLeft: 12 },
  aiBannerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  aiBannerSubtitle: { color: '#94A3B8', fontSize: 12, lineHeight: 18 },
  findBtn: { backgroundColor: '#D97706', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  findBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14, marginRight: 8 },
  recentSection: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C4A' },
  viewAllText: { fontSize: 13, fontWeight: '600', color: '#D97706' },
  emptyState: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center' },
  emptyStateTitle: { fontSize: 15, fontWeight: 'bold', color: '#1C1C4A', marginTop: 12, marginBottom: 4 },
  emptyStateSub: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  consultationCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  consultationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  lawyerName: { fontSize: 15, fontWeight: 'bold', color: '#1C1C4A' },
  statusBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  statusText: { fontSize: 10, fontWeight: '700', color: '#4B5563' },
  categoryText: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  chatAction: { flexDirection: 'row', alignItems: 'center' },
  chatActionText: { fontSize: 13, fontWeight: '600', color: '#D97706', marginLeft: 6 }
});

export default CustomerDashboardScreen;
