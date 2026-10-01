import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { lawyerApi } from '../../api/lawyerApi';
import { 
  ShieldCheck, Clock, XCircle, Award, MessageSquare, Briefcase, IndianRupee, Settings, ChevronRight, RefreshCw, AlertTriangle, Star, Calendar, FileText, Bell
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { consultationApi } from '../../api/consultationApi';
import { getLawyerRatingData } from '../../utils/ratingUtils';

const LawyerDashboardScreen = () => {
  const { user, updateUser } = useAuth();
  const navigation = useNavigation<any>();
  
  useEffect(() => {
    if (user && user.registrationStatus !== 'SUBMITTED' && user.registrationStatus !== 'APPROVED' && user.registrationStatus !== 'VERIFIED') {
      navigation.navigate('LawyerRegisterWizard');
    }
  }, [user, navigation]);

  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState('₹0.00');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [ratingInfo, setRatingInfo] = useState(() => {
    const local = getLawyerRatingData(user?.lawyerId || user?.id || 1);
    return {
      average: local.count > 0 ? local.average.toFixed(1) : (user?.rating && Number(user.rating) > 0 ? Number(user.rating).toFixed(1) : '0'),
      count: local.count || user?.ratingCount || 0,
      reviews: local.reviews || []
    };
  });

  const fetchLiveProfile = useCallback(async () => {
    try {
      const lawyerId = user?.lawyerId || user?.id || 1;
      const res = await lawyerApi.getLawyerById(lawyerId);
      if (res && res.data) {
        const data = res.data.data || res.data;
        setProfile(data);
        if (updateUser) updateUser(data);
      }
    } catch (e) {
      console.log('Error fetching lawyer profile', e);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const lawyerId = user?.lawyerId || user?.id || 1;
      
      const reqRes = await consultationApi.getLawyerRequests();
      const rawReq = reqRes && reqRes.data ? (reqRes.data.data || reqRes.data) : [];
      if (Array.isArray(rawReq)) {
        setRequests(rawReq);
        const accepted = rawReq.filter(r => r.status === 'ACCEPTED' || r.status === 'ACTIVE' || r.status === 'COMPLETED');
        setScheduledCount(accepted.length);
      }

      const earnRes = await lawyerApi.getEarnings(lawyerId);
      const earnData = earnRes && earnRes.data ? (earnRes.data.data || earnRes.data) : null;
      if (earnData) {
        if (earnData.totalEarningsNum !== undefined && earnData.totalEarningsNum !== null) {
          setTotalEarnings(`₹${Number(earnData.totalEarningsNum).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        } else if (earnData.totalEarnings) {
          setTotalEarnings(earnData.totalEarnings);
        }
      }
      
      const rateData = await lawyerApi.getRatings(lawyerId).catch(() => null);
      if (rateData) {
        const avg = rateData.averageRating !== undefined && rateData.averageRating !== null && !isNaN(Number(rateData.averageRating)) && Number(rateData.averageRating) > 0 
          ? Number(rateData.averageRating).toFixed(1) 
          : '0';
        const reviewsList = Array.isArray(rateData.reviews) ? rateData.reviews.map((r: any) => ({
          id: r.id,
          name: r.customerName || 'Verified Client',
          rating: r.rating,
          comment: r.comment,
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'
        })) : [];
        setRatingInfo({
          average: avg,
          count: rateData.ratingCount !== undefined ? rateData.ratingCount : reviewsList.length,
          reviews: reviewsList
        });
      }
    } catch (e) {
      console.log('Dashboard data error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLiveProfile();
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveProfile();
    fetchDashboardData();
  };

  const advocate = profile || user || {};
  const currentStatus = (advocate?.verificationStatus || 'PENDING').toUpperCase();
  const isApproved = currentStatus === 'APPROVED' || advocate?.accountStatus === 'ACTIVE';
  const isRejected = currentStatus === 'REJECTED';
  const isPending = !isApproved && !isRejected;

  const getStatusConfig = () => {
    if (isApproved) return { color: '#10B981', bg: '#F0FDF4', text: 'Bar Verified & Active', icon: ShieldCheck };
    if (isRejected) return { color: '#EF4444', bg: '#FEF2F2', text: 'Verification Rejected', icon: XCircle };
    return { color: '#F59E0B', bg: '#FFFBEB', text: 'Under Admin Review', icon: Clock };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Advocate Workspace</Text>
          <Text style={styles.headerSubtitle}>Overview of your requests & earnings.</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Bell size={20} color="#1C1C4A" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.syncBtn} onPress={onRefresh}>
            <RefreshCw size={18} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        {/* Welcome Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.color + '40' }]}>
              <StatusIcon size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.text}</Text>
            </View>
            <View style={styles.barBadge}>
              <Award size={14} color="#FBBF24" />
              <Text style={styles.barBadgeText}>Reg: {advocate?.barEnrollmentNumber || 'N/A'}</Text>
            </View>
          </View>
          <Text style={styles.welcomeTitle}>
            Welcome, {advocate?.fullName ? (advocate.fullName.startsWith('Adv.') ? advocate.fullName : `Adv. ${advocate.fullName}`) : 'Advocate'}
          </Text>
          <Text style={styles.welcomeSubtitle}>Track client briefs, confirm consultations, and verify UPI payouts.</Text>
        </View>

        {/* Verification Alert Banner */}
        {isApproved ? (
          <View style={[styles.alertBanner, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', alignItems: 'flex-start' }]}>
            <View style={[styles.alertIconBox, { backgroundColor: '#D1FAE5', height: 'auto', paddingVertical: 12 }]}>
              <ShieldCheck size={24} color="#059669" />
            </View>
            <View style={styles.alertTextContent}>
              <Text style={[styles.alertTitle, { color: '#064E3B' }]}>Verification Status: Approved & Active</Text>
              <Text style={[styles.alertDesc, { color: '#065F46', lineHeight: 18 }]}>Your profile is officially verified and listed for client consultation requests across India.</Text>
            </View>
          </View>
        ) : isRejected ? (
          <View style={[styles.alertBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', flexDirection: 'column', alignItems: 'flex-start' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
              <View style={[styles.alertIconBox, { backgroundColor: '#FEE2E2', height: 'auto', paddingVertical: 12 }]}>
                <AlertTriangle size={24} color="#DC2626" />
              </View>
              <View style={styles.alertTextContent}>
                <Text style={[styles.alertTitle, { color: '#7F1D1D' }]}>Advocate Verification Rejected</Text>
                <Text style={[styles.alertDesc, { color: '#991B1B', lineHeight: 18 }]}>Your application was reviewed and could not be approved. Please check the feedback below and re-submit.</Text>
              </View>
            </View>
            
            <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: 12, borderRadius: 8, marginTop: 12, width: '100%', borderWidth: 1, borderColor: '#FECACA' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626', textTransform: 'uppercase', marginBottom: 4 }}>Admin Feedback / Rejection Reason:</Text>
                <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600' }}>"{advocate?.rejectionReason || 'Uploaded Bar Council certificate or registration credentials did not pass verification. Please upload a clear document.'}"</Text>
            </View>
            
            <TouchableOpacity style={[styles.fixBtn, { marginTop: 12, marginLeft: 0, width: '100%', alignItems: 'center', paddingVertical: 12 }]} onPress={() => navigation.navigate('LawyerRegisterWizard')}>
              <Text style={[styles.fixBtnText, { fontSize: 14 }]}>Update Documents & Fix Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.alertBanner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', alignItems: 'flex-start' }]}>
            <View style={[styles.alertIconBox, { backgroundColor: '#FEF3C7', height: 'auto', paddingVertical: 12 }]}>
              <Clock size={24} color="#D97706" />
            </View>
            <View style={styles.alertTextContent}>
              <Text style={[styles.alertTitle, { color: '#78350F' }]}>Verification Status: Under Admin Review</Text>
              <Text style={[styles.alertDesc, { color: '#92400E', lineHeight: 18 }]}>Your Bar credentials and identity documents are currently under manual review. Your profile will become visible to customers immediately after admin approval.</Text>
            </View>
          </View>
        )}

        {/* Dashboard Stats (4 KPIs) */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Requests')}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <MessageSquare size={22} color="#4F46E5" />
            </View>
            <Text style={styles.statValue}>{requests.length}</Text>
            <Text style={styles.statLabel}>Client Requests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Appts')}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Calendar size={22} color="#9333EA" />
            </View>
            <Text style={styles.statValue}>{scheduledCount}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Earnings')}>
            <View style={[styles.statIconWrap, { backgroundColor: '#CCFBF1' }]}>
              <IndianRupee size={22} color="#0D9488" />
            </View>
            <Text style={styles.statValue}>{totalEarnings}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </TouchableOpacity>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Star size={22} color="#D97706" fill="#D97706" />
            </View>
            <Text style={styles.statValue}>{ratingInfo.average}</Text>
            <Text style={styles.statLabel}>{ratingInfo.count} Reviews</Text>
          </View>
        </View>

        {/* Pending Consultations */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: '#EEF2FF' }]}>
                <MessageSquare size={16} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Active Requests</Text>
                <Text style={styles.sectionSub}>Review client queries</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {requests.length === 0 ? (
            <View style={styles.emptyBox}>
              <MessageSquare size={28} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyText}>Client requests will appear here</Text>
            </View>
          ) : (
            requests.slice(0, 3).map((req, idx) => (
              <TouchableOpacity 
                key={req.id || idx} 
                style={styles.requestItem}
                onPress={() => navigation.navigate('Requests')}
              >
                <View style={styles.reqTop}>
                  <Text style={styles.reqName}>{req.customerName || req.clientName || 'Client'}</Text>
                  <View style={[styles.reqStatus, { backgroundColor: req.status === 'PENDING' ? '#FFFBEB' : '#EEF2FF' }]}>
                    <Text style={[styles.reqStatusText, { color: req.status === 'PENDING' ? '#D97706' : '#4F46E5' }]}>{req.status || 'PENDING'}</Text>
                  </View>
                </View>
                <Text style={styles.reqBrief} numberOfLines={1}>{req.briefDescription || req.legalIssue || 'Case Consultation'}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Client Reviews */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Star size={16} color="#D97706" fill="#D97706" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Client Reviews</Text>
                <Text style={styles.sectionSub}>Feedback from past cases</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#B45309" fill="#B45309" />
              <Text style={styles.ratingBadgeText}>{ratingInfo.average} / 5.0</Text>
            </View>
          </View>
          
          {ratingInfo.reviews.length === 0 ? (
            <View style={styles.emptyBox}>
              <Star size={28} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptyText}>Reviews appear after sessions</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewsScroll}>
              {ratingInfo.reviews.slice(0, 5).map((rev: any, idx: number) => (
                <View key={rev.id || idx} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{rev.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.reviewName}>{rev.name}</Text>
                      <View style={styles.starsRow}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} color={i < rev.rating ? "#F59E0B" : "#E2E8F0"} fill={i < rev.rating ? "#F59E0B" : "#E2E8F0"} />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewComment} numberOfLines={3}>"{rev.comment}"</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', fontVariant: ['small-caps'] },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellBadge: { position: 'absolute', top: 8, right: 10, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 1, borderColor: '#FFFFFF' },
  syncBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  
  scrollContent: { padding: 16 },
  
  heroCard: { backgroundColor: '#1E1B4B', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },
  barBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  barBadgeText: { fontSize: 12, fontWeight: '600', color: '#E2E8F0' },
  welcomeTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },

  alertBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  alertIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  alertTextContent: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  alertDesc: { fontSize: 12 },
  fixBtn: { marginLeft: 12, backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  fixBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  statIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  sectionContainer: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', backgroundColor: '#F8FAFC' },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  sectionSub: { fontSize: 11, color: '#64748B' },
  seeAllText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingBadgeText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  
  emptyBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#475569', marginTop: 12, marginBottom: 4 },
  emptyText: { fontSize: 13, color: '#94A3B8' },

  requestItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  reqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reqName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  reqStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  reqStatusText: { fontSize: 10, fontWeight: '700' },
  reqBrief: { fontSize: 13, color: '#64748B' },

  reviewsScroll: { padding: 16, gap: 12 },
  reviewCard: { width: 260, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', marginRight: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  reviewName: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 12, color: '#64748B', fontStyle: 'italic', lineHeight: 18 }
});

export default LawyerDashboardScreen;
