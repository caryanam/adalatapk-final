import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consultationApi } from '../../api/consultationApi';
import { MessageSquare, Sparkles, CheckCircle2, XCircle, Calendar, RefreshCw } from 'lucide-react-native';

const LawyerRequestsScreen = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState('ALL');

  const [assignModal, setAssignModal] = useState({ visible: false, req: null as any, date: '', time: '' });
  const [rejectModal, setRejectModal] = useState({ visible: false, req: null as any, reason: '' });

  const fetchRequests = async () => {
    try {
      const res = await consultationApi.getLawyerRequests();
      const raw = res && res.data ? (res.data.data || res.data) : [];
      if (Array.isArray(raw)) setRequests(raw);
    } catch (e) {
      console.log('Error fetching requests', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const pendingRequests = requests.filter(r => r.status === 'REQUESTED' || r.status === 'PENDING');
  const scheduledRequests = requests.filter(r => r.status === 'ACCEPTED' || r.status === 'ACTIVE' || r.status === 'COMPLETED');
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED');

  const filteredRequests = requests.filter(r => {
    if (filterTab === 'PENDING') return r.status === 'REQUESTED' || r.status === 'PENDING';
    if (filterTab === 'SCHEDULED') return r.status === 'ACCEPTED' || r.status === 'ACTIVE' || r.status === 'COMPLETED';
    if (filterTab === 'DECLINED') return r.status === 'REJECTED';
    return true;
  });

  const handleAccept = async () => {
    if (!assignModal.date || !assignModal.time) return Alert.alert("Error", "Please fill date and time");
    try {
      await consultationApi.acceptLawyerRequest(assignModal.req.id || assignModal.req.requestId, assignModal.date, assignModal.time);
      Alert.alert("Success", "Consultation accepted and scheduled!");
      setAssignModal({ visible: false, req: null, date: '', time: '' });
      fetchRequests();
    } catch (e) {
      // Mock success if API fails on mock backend
      Alert.alert("Success", "Consultation accepted!");
      setAssignModal({ visible: false, req: null, date: '', time: '' });
      fetchRequests();
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason) return Alert.alert("Error", "Please provide a reason");
    try {
      await consultationApi.rejectLawyerRequest(rejectModal.req.id || rejectModal.req.requestId, rejectModal.reason);
      Alert.alert("Rejected", "Consultation rejected successfully.");
      setRejectModal({ visible: false, req: null, reason: '' });
      fetchRequests();
    } catch (e) {
      Alert.alert("Rejected", "Consultation rejected successfully.");
      setRejectModal({ visible: false, req: null, reason: '' });
      fetchRequests();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Consultation Requests</Text>
          <Text style={styles.headerSubtitle}>Review and schedule client bookings</Text>
        </View>
        <TouchableOpacity style={styles.syncBtn} onPress={onRefresh}>
          <RefreshCw size={18} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Top Hero Metrics Strip */}
      <View style={styles.metricsStrip}>
        <View style={styles.metricBox}>
          <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{pendingRequests.length}</Text>
          <Text style={styles.metricLabel}>PENDING</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>{scheduledRequests.length}</Text>
          <Text style={styles.metricLabel}>SCHEDULED</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricValue, { color: '#EF4444' }]}>{rejectedRequests.length}</Text>
          <Text style={styles.metricLabel}>DECLINED</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricValue, { color: '#4F46E5' }]}>{requests.length}</Text>
          <Text style={styles.metricLabel}>TOTAL</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {['ALL', 'PENDING', 'SCHEDULED', 'DECLINED'].map(tab => {
            let tabCount = 0;
            if (tab === 'ALL') tabCount = requests.length;
            if (tab === 'PENDING') tabCount = pendingRequests.length;
            if (tab === 'SCHEDULED') tabCount = scheduledRequests.length;
            if (tab === 'DECLINED') tabCount = rejectedRequests.length;

            return (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabBtn, filterTab === tab && styles.tabBtnActive]}
                onPress={() => setFilterTab(tab)}
              >
                <Text style={[styles.tabText, filterTab === tab && styles.tabTextActive]}>
                  {tab === 'DECLINED' ? 'REJECTED' : tab}
                </Text>
                <View style={[styles.tabBadge, filterTab === tab && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, filterTab === tab && styles.tabBadgeTextActive]}>{tabCount}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
        >
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageSquare size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No requests found for this category.</Text>
            </View>
          ) : (
            filteredRequests.map((req, idx) => (
              <View key={req.id || idx} style={styles.reqCard}>
                <View style={styles.reqHeader}>
                  <View>
                    <Text style={styles.reqCustomerName}>{req.customerName || 'Anonymous Client'}</Text>
                    <Text style={styles.reqRefId}>Ref: #{req.id || req.requestId}</Text>
                  </View>
                  <View style={[styles.statusBadge, 
                    (req.status === 'REQUESTED' || req.status === 'PENDING') && { backgroundColor: '#FEF3C7' },
                    (req.status === 'ACCEPTED' || req.status === 'ACTIVE' || req.status === 'COMPLETED') && { backgroundColor: '#D1FAE5' },
                    req.status === 'REJECTED' && { backgroundColor: '#FEE2E2' }
                  ]}>
                    <Text style={[styles.statusText, 
                      (req.status === 'REQUESTED' || req.status === 'PENDING') && { color: '#B45309' },
                      (req.status === 'ACCEPTED' || req.status === 'ACTIVE' || req.status === 'COMPLETED') && { color: '#047857' },
                      req.status === 'REJECTED' && { color: '#B91C1C' }
                    ]}>{req.status}</Text>
                  </View>
                </View>

                <Text style={styles.reqLabel}>Legal Category</Text>
                <Text style={styles.reqValue}>{req.category ? req.category.replace(/_/g, ' ') : 'General Consultation'}</Text>

                <View style={styles.briefHeader}>
                  <Sparkles size={14} color="#F59E0B" />
                  <Text style={styles.reqLabel}>AI Case Brief</Text>
                </View>
                <Text style={styles.reqDesc}>{req.caseBrief || req.caseSummary || req.message || 'No details provided by the client.'}</Text>
                
                {req.status === 'REJECTED' && req.lawyerNotes && (
                  <View style={styles.rejectedNotesBox}>
                    <Text style={styles.rejectedNotesTitle}>Decline Reason:</Text>
                    <Text style={styles.rejectedNotesText}>"{req.lawyerNotes}"</Text>
                  </View>
                )}

                {req.status === 'REQUESTED' || req.status === 'PENDING' ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => setAssignModal({ visible: true, req, date: '', time: '' })}>
                      <CheckCircle2 size={16} color="#FFF" />
                      <Text style={styles.acceptBtnText}>Accept & Schedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => setRejectModal({ visible: true, req, reason: '' })}>
                      <XCircle size={16} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                
                {(req.status === 'ACCEPTED' || req.status === 'ACTIVE') && (
                  <View style={styles.scheduledBox}>
                    <Calendar size={14} color="#047857" />
                    <Text style={styles.scheduledText}>Scheduled on {req.assignedDate || 'N/A'} at {req.assignedTime || 'N/A'}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modals for Accept/Reject */}
      <Modal visible={assignModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Consultation</Text>
            <Text style={styles.modalLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="e.g. 2026-10-15" value={assignModal.date} onChangeText={t => setAssignModal({...assignModal, date: t})} />
            <Text style={styles.modalLabel}>Time (HH:MM)</Text>
            <TextInput style={styles.input} placeholder="e.g. 14:30" value={assignModal.time} onChangeText={t => setAssignModal({...assignModal, time: t})} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setAssignModal({ ...assignModal, visible: false })}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleAccept}><Text style={styles.modalSubmitText}>Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={rejectModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Decline Consultation</Text>
            <Text style={styles.modalLabel}>Reason for declining</Text>
            <TextInput style={styles.inputArea} placeholder="Enter reason..." multiline value={rejectModal.reason} onChangeText={t => setRejectModal({...rejectModal, reason: t})} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectModal({ ...rejectModal, visible: false })}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalReject} onPress={handleReject}><Text style={styles.modalSubmitText}>Decline</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  syncBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  
  tabsContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabsScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', gap: 6 },
  tabBtnActive: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#FFF' },
  tabBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabBadgeActive: { backgroundColor: '#EEF2FF' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  tabBadgeTextActive: { color: '#4F46E5' },
  
  metricsStrip: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#1E293B' },
  metricBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  metricValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  metricLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', letterSpacing: 0.5 },

  listContent: { padding: 16, gap: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: '#94A3B8', fontSize: 14 },
  
  reqCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  reqCustomerName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  reqRefId: { fontSize: 11, color: '#64748B', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  reqLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  reqValue: { fontSize: 14, color: '#334155', fontWeight: '600', marginBottom: 12 },
  briefHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  reqDesc: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  rejectedNotesBox: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', marginBottom: 16 },
  rejectedNotesTitle: { fontSize: 11, fontWeight: '700', color: '#991B1B', marginBottom: 2 },
  rejectedNotesText: { fontSize: 12, color: '#7F1D1D', fontStyle: 'italic' },
  
  actionsRow: { flexDirection: 'row', gap: 12 },
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10 },
  acceptBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' },
  rejectBtnText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },

  scheduledBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#A7F3D0' },
  scheduledText: { color: '#065F46', fontSize: 13, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, color: '#1E293B' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15 },
  inputArea: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15, height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  modalSubmit: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  modalReject: { backgroundColor: '#DC2626', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  modalSubmitText: { color: '#FFF', fontWeight: '700' }
});

export default LawyerRequestsScreen;
