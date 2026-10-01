import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/adminApi';
import { lawyerApi } from '../../api/lawyerApi';
import StatusBadge from '../../components/StatusBadge';
import { Users, ShieldCheck, UserCheck, CreditCard, LogOut, ChevronRight, Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const AdminDashboardScreen = () => {
  const { logout } = useAuth();
  const navigation = useNavigation<any>();
  const [pendingLawyers, setPendingLawyers] = useState<any[]>([]);
  const [approvedLawyers, setApprovedLawyers] = useState<any[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes, paymentsRes] = await Promise.all([
        adminApi.getPendingLawyers(),
        lawyerApi.getApprovedLawyers(),
        adminApi.getPayments()
      ]);

      setPendingLawyers(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setApprovedLawyers(Array.isArray(approvedRes.data) ? approvedRes.data : []);
      
      const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      const sum = payments.reduce((acc: number, p: any) => acc + (p.amountNum || 0), 0);
      setTotalVolume(sum);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeText}>ADALAT PLATFORM ADMINISTRATION</Text>
            </View>
            <Text style={styles.title}>ADMIN COMMAND DASHBOARD</Text>
            <Text style={styles.headerSub}>Complete platform overview, advocate verification queue, transaction audit, and category reporting.</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
            <Bell size={24} color="#1C1C4A" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1C1C4A" />
          </View>
        ) : (
          <>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCardCentered}>
                <View style={styles.iconBoxDark}>
                  <Users size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.metricValueLarge}>{approvedLawyers.length + pendingLawyers.length}</Text>
                <Text style={styles.metricLabelCentered}>Total Registered Advocates</Text>
              </View>

              <View style={styles.metricCardCentered}>
                <View style={styles.iconBoxDark}>
                  <ShieldCheck size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.metricValueLarge}>{approvedLawyers.length}</Text>
                <Text style={styles.metricLabelCentered}>Approved Lawyers</Text>
              </View>

              <View style={styles.metricCardCentered}>
                <View style={styles.iconBoxDark}>
                  <UserCheck size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.metricValueLarge}>{pendingLawyers.length} PENDING</Text>
                <Text style={styles.metricLabelCentered}>Lawyer Approvals</Text>
              </View>

              <View style={styles.metricCardCentered}>
                <View style={styles.iconBoxDark}>
                  <CreditCard size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.metricValueLarge}>₹{totalVolume.toFixed(2)}</Text>
                <Text style={styles.metricLabelCentered}>Total Platform Financial Volume</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pending Verification Queue</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Lawyer Approvals')}>
                  <Text style={styles.viewAllBtn}>Manage All</Text>
                </TouchableOpacity>
              </View>

              {pendingLawyers.length === 0 ? (
                <View style={styles.emptyCard}>
                  <ShieldCheck size={32} color="#CBD5E1" />
                  <Text style={styles.emptyText}>Queue is Empty</Text>
                </View>
              ) : (
                pendingLawyers.slice(0, 3).map((lawyer) => (
                  <View key={lawyer.lawyerId} style={styles.queueCard}>
                    <View style={styles.queueCardHeader}>
                      <View>
                        <Text style={styles.lawyerName}>{lawyer.fullName}</Text>
                        <Text style={styles.lawyerSub}>{lawyer.email}</Text>
                      </View>
                      <StatusBadge status={lawyer.verificationStatus || 'PENDING'} />
                    </View>

                    <View style={styles.queueStats}>
                      <View style={styles.queueStatItem}>
                        <Text style={styles.queueStatLabel}>Bar Reg No</Text>
                        <Text style={styles.queueStatValue}>{lawyer.barEnrollmentNumber || 'N/A'}</Text>
                      </View>
                      <View style={styles.queueStatItem}>
                        <Text style={styles.queueStatLabel}>Experience</Text>
                        <Text style={styles.queueStatValue}>{lawyer.yearsOfExperience !== null && lawyer.yearsOfExperience !== undefined ? `${lawyer.yearsOfExperience} Yrs` : 'N/A'}</Text>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.reviewBtn}
                      onPress={() => navigation.navigate('Lawyer Approvals')}
                    >
                      <Text style={styles.reviewBtnText}>Review & Approve</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity style={styles.largeLogoutBtn} onPress={logout}>
              <LogOut size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.largeLogoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  bellBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, position: 'relative' },
  bellBadge: { position: 'absolute', top: 8, right: 10, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 1, borderColor: '#FFFFFF' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { color: '#B45309', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1C1C4A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 6, lineHeight: 18 },
  centerContainer: { paddingVertical: 60, alignItems: 'center' },
  largeLogoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginTop: 24, borderWidth: 1, borderColor: '#FECACA' },
  largeLogoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  metricCardCentered: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  iconBoxDark: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#312E81', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  metricValueLarge: { fontSize: 22, fontWeight: 'bold', color: '#1C1C4A', textAlign: 'center', fontFamily: 'serif' },
  metricLabelCentered: { fontSize: 12, color: '#64748B', marginTop: 8, textAlign: 'center' },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  viewAllBtn: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  emptyText: { color: '#64748B', marginTop: 12, fontWeight: '500' },
  queueCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  queueCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  lawyerName: { fontSize: 16, fontWeight: 'bold', color: '#1C1C4A' },
  lawyerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  queueStats: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 12 },
  queueStatItem: { flex: 1 },
  queueStatLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  queueStatValue: { fontSize: 13, fontWeight: '600', color: '#334155' },
  reviewBtn: { backgroundColor: '#D4AF37', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  reviewBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }
});

export default AdminDashboardScreen;
