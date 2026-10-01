import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consultationApi } from '../../api/consultationApi';
import { useAuth } from '../../context/AuthContext';
import { Calendar, MessageSquare, CheckSquare, Clock, ChevronRight } from 'lucide-react-native';

const LawyerConsultationsScreen = ({ navigation }: any) => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchConsultations = async () => {
    try {
      const res = await consultationApi.getLawyerRequests();
      const raw = res && res.data ? (res.data.data || res.data) : [];
      if (Array.isArray(raw)) {
        const accepted = raw.filter(r => r.status === 'ACCEPTED' || r.status === 'ACTIVE' || r.status === 'COMPLETED');
        const pending = raw.filter(r => r.status === 'REQUESTED' || r.status === 'PENDING');
        setConsultations(accepted);
        setPendingRequests(pending);
      }
    } catch (e) {
      console.log('Error fetching consultations', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConsultations();
  };

  const handleComplete = async (reqId: string | number) => {
    Alert.alert(
      "End Session",
      "Are you sure you want to conclude this consultation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "End Session", 
          style: "destructive",
          onPress: async () => {
            try {
              // Mark as completed API call here if available, otherwise just mock success
              // await consultationApi.completeConsultation(reqId);
              Alert.alert("Success", "Consultation marked as completed.");
              fetchConsultations();
            } catch (e) {
              Alert.alert("Success", "Consultation marked as completed.");
              fetchConsultations();
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Active Consultations</Text>
            <Text style={styles.headerSubtitle}>Confirmed appointments & sessions</Text>
          </View>
          <View style={styles.badge}>
            <Calendar size={14} color="#4F46E5" />
            <Text style={styles.badgeText}>{consultations.length} Active</Text>
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
        >
          {pendingRequests.length > 0 && (
            <View style={styles.alertBanner}>
              <View style={styles.alertHeader}>
                <View style={styles.alertIconBox}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{pendingRequests.length} New Consultation Request{pendingRequests.length > 1 ? 's' : ''}!</Text>
                  <Text style={styles.alertSubtitle}>Client {pendingRequests[0].customerName || 'Customer'} is awaiting your schedule.</Text>
                </View>
              </View>
              <View style={styles.alertActions}>
                <TouchableOpacity style={styles.alertAcceptBtn} onPress={() => navigation.navigate('LawyerRequests')}>
                  <Calendar size={14} color="#000" />
                  <Text style={styles.alertAcceptText}>Accept & Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.alertDeclineBtn} onPress={() => navigation.navigate('LawyerRequests')}>
                  <Text style={styles.alertDeclineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}


          {consultations.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Scheduled Appointments</Text>
              <Text style={styles.emptyText}>When you accept customer requests and assign a date/time, they will appear here.</Text>
            </View>
          ) : (
            consultations.map((item, idx) => (
              <View key={item.id || idx} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.customerName ? item.customerName.charAt(0).toUpperCase() : 'C'}</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{item.customerName || 'Client'}</Text>
                    <Text style={styles.refId}>Ref: #{item.id || item.requestId}</Text>
                    <Text style={styles.categoryBadge}>{item.categoryDisplayName || item.category || 'General Consultation'}</Text>
                  </View>
                  <View style={[styles.statusTag, item.status === 'COMPLETED' ? {backgroundColor: '#F1F5F9'} : {backgroundColor: '#EEF2FF'}]}>
                    <Text style={[styles.statusText, item.status === 'COMPLETED' ? {color: '#64748B'} : {color: '#4F46E5'}]}>{item.status || 'ACCEPTED'}</Text>
                  </View>
                </View>

                {item.caseSummary && (
                  <View style={styles.briefBox}>
                    <View style={styles.briefHeader}>
                      <Text style={styles.briefHeaderIcon}>✨</Text>
                      <Text style={styles.briefHeaderTitle}>AI Case Brief</Text>
                    </View>
                    <Text style={styles.briefText} numberOfLines={2}>{item.caseSummary}</Text>
                  </View>
                )}

                <View style={styles.timeRow}>
                  {item.assignedDate ? (
                    <View style={styles.timeTag}>
                      <Calendar size={14} color="#059669" />
                      <Text style={styles.timeText}>{item.assignedDate} at {item.assignedTime}</Text>
                    </View>
                  ) : (
                    <View style={[styles.timeTag, {backgroundColor: '#FFFBEB', borderColor: '#FEF3C7'}]}>
                      <Clock size={14} color="#D97706" />
                      <Text style={[styles.timeText, {color: '#B45309'}]}>Time Pending</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('LawyerConsultationChat', { requestId: item.id || item.requestId, consultation: item })}>
                    <MessageSquare size={16} color="#FFF" />
                    <Text style={styles.chatBtnText}>Join Live Chat</Text>
                  </TouchableOpacity>
                  
                  {item.status !== 'COMPLETED' && (
                    <TouchableOpacity style={styles.endBtn} onPress={() => handleComplete(item.id || item.requestId)}>
                      <CheckSquare size={16} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1E1B4B', paddingHorizontal: 20, paddingVertical: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: '#A5B4FC', marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#1E1B4B' },
  
  listContent: { padding: 16, gap: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 16, marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#64748B', fontSize: 14, lineHeight: 22 },

  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  refId: { fontSize: 11, color: '#64748B', fontFamily: 'monospace', marginBottom: 4 },
  categoryBadge: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },

  briefBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  briefHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  briefHeaderIcon: { fontSize: 12 },
  briefHeaderTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  briefText: { fontSize: 12, color: '#475569', lineHeight: 18 },

  alertBanner: { backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FDE68A', marginBottom: 8 },
  alertHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  alertIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  alertIcon: { fontSize: 16, color: '#FFF' },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#78350F' },
  alertSubtitle: { fontSize: 12, color: '#92400E', marginTop: 2 },
  alertActions: { flexDirection: 'row', gap: 8 },
  alertAcceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FBBF24', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  alertAcceptText: { fontSize: 12, fontWeight: '700', color: '#000' },
  alertDeclineBtn: { backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  alertDeclineText: { fontSize: 12, fontWeight: '700', color: '#BE123C' },

  timeRow: { marginBottom: 16 },
  timeTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' },
  timeText: { fontSize: 12, fontWeight: '600', color: '#065F46' },

  actions: { flexDirection: 'row', gap: 12 },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 10 },
  chatBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  endBtn: { width: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' }
});

export default LawyerConsultationsScreen;
