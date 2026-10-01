import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/adminApi';
import { lawyerApi } from '../../api/lawyerApi';
import { ShieldCheck, Eye, X, CheckCircle, XCircle, FileText, MapPin, Briefcase, Award, Search, Users, ShieldAlert, CheckCircle2, RefreshCw, UserCheck, Sparkles, DollarSign, Globe, BookOpen } from 'lucide-react-native';

const AdminVerificationsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingLawyers, setPendingLawyers] = useState<any[]>([]);
  const [approvedLawyers, setApprovedLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        adminApi.getPendingLawyers().catch(() => ({ data: [] })),
        lawyerApi.getApprovedLawyers().catch(() => ({ data: [] }))
      ]);
      setPendingLawyers(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setApprovedLawyers(Array.isArray(approvedRes.data) ? approvedRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (lawyer: any) => {
    setSelectedLawyer(lawyer);
    setShowDetailsModal(true);
  };

  const handleApprove = async () => {
    if (!selectedLawyer) return;
    setActionLoading(true);
    try {
      await adminApi.approveLawyer(selectedLawyer.lawyerId || selectedLawyer.id);
      Alert.alert('Success', `Advocate ${selectedLawyer.fullName} has been approved.`);
      setShowDetailsModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLawyer || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await adminApi.rejectLawyer(selectedLawyer.lawyerId || selectedLawyer.id, rejectionReason);
      Alert.alert('Rejected', `Application for ${selectedLawyer.fullName} rejected.`);
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleApproveInline = async (lawyerToApprove: any) => {
    try {
      setActionLoading(true);
      const lawyerId = lawyerToApprove.lawyerId || lawyerToApprove.id;
      const res = await adminApi.approveLawyer(lawyerId);
      
      if (res.status === 200) {
        Alert.alert('Success', 'Advocate approved successfully!');
        fetchData();
      } else {
        throw new Error('Failed to approve');
      }
    } catch (error) {
      console.error('Error approving:', error);
      Alert.alert('Error', 'Could not approve. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDocument = (doc: any) => {
    const url = doc.fileUrl || doc.file_url || doc.dataUrl || (doc.filePath ? `http://10.0.2.2:8082/uploads/lawyers/${doc.filePath}` : null);
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open document link.'));
    } else {
      Alert.alert('Error', 'No valid document URL found.');
    }
  };

  // Filter lists based on search
  const filteredLawyers = pendingLawyers.filter(l => {
    if (!searchQuery.trim()) return true;
    const lower = searchQuery.toLowerCase();
    return (
      (l.fullName && l.fullName.toLowerCase().includes(lower)) ||
      (l.barEnrollmentNumber && l.barEnrollmentNumber.toLowerCase().includes(lower)) ||
      (l.location && l.location.toLowerCase().includes(lower))
    );
  });

  const getStatusColor = (status: string) => {
    if (status === 'APPROVED' || status === 'ACTIVE') return { bg: '#ECFDF5', text: '#059669', dot: '#10B981' };
    if (status === 'PENDING') return { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' };
    if (status === 'REJECTED') return { bg: '#FEF2F2', text: '#E11D48', dot: '#EF4444' };
    return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusObj = getStatusColor(item.verificationStatus || 'APPROVED');

    return (
      <View style={[styles.card, { borderColor: statusObj.bg === '#FFFBEB' ? '#FDE68A' : '#E2E8F0' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: '#312E81', borderColor: '#4338CA', borderWidth: 1 }]}>
            <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>{item.fullName?.charAt(0) || 'A'}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.lawyerName} numberOfLines={1}>{item.fullName}</Text>
            <View style={styles.locationRow}>
              <MapPin size={11} color="#94A3B8" />
              <Text style={styles.lawyerSub} numberOfLines={1}>{item.location || 'India'}</Text>
            </View>
            <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusObj.bg, borderColor: statusObj.dot, borderWidth: 1 }]}>
            <View style={[styles.statusDot, { backgroundColor: statusObj.dot }]} />
            <Text style={[styles.statusText, { color: statusObj.text }]}>{item.verificationStatus || 'APPROVED'}</Text>
          </View>
        </View>

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
              <Award size={12} color="#F59E0B" />
              <Text style={[styles.infoValueCompact, { marginLeft: 4, fontWeight: 'bold' }]}>{item.yearsOfExperience ? `${item.yearsOfExperience} Years` : 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRowCompact}>
            <Text style={styles.infoLabelCompact}>Consultation Fee:</Text>
            <Text style={[styles.infoValueCompact, { color: '#059669', fontWeight: 'bold', fontSize: 13 }]}>₹{item.consultationFee || item.consultationRateAmount || 99}</Text>
          </View>
        </View>

        <View style={styles.cardFooterStacked}>
          <TouchableOpacity 
            style={styles.reviewBtn} 
            onPress={() => handleOpenDetails(item)}
          >
            <Eye size={14} color="#FFFFFF" />
            <Text style={styles.reviewBtnText}>Review Details & Documents</Text>
          </TouchableOpacity>

          <View style={styles.footerActionRow}>
            <TouchableOpacity 
              style={styles.approveBtn} 
              onPress={() => handleApproveInline(item)}
              disabled={actionLoading}
            >
              <CheckCircle2 size={14} color="#FFFFFF" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.rejectBtn} 
              onPress={() => { setSelectedLawyer(item); setShowRejectModal(true); }}
              disabled={actionLoading}
            >
              <XCircle size={14} color="#BE123C" />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroBanner}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <UserCheck size={12} color="#FBBF24" />
            <Text style={styles.heroBadgeText}>Bar Council Gateway</Text>
          </View>
          <View style={styles.heroBadgeSecondary}>
            <Sparkles size={12} color="#FDE68A" />
            <Text style={styles.heroBadgeTextSecondary}>1-Click Auth</Text>
          </View>
        </View>
        
        <View style={styles.heroTitleRow}>
          <Text style={styles.heroTitle}>Pending Verifications ({pendingLawyers.length})</Text>
          <TouchableOpacity style={styles.refreshBtnHero} onPress={fetchData}>
            <RefreshCw size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        <Text style={styles.heroSubtitle}>Audit enrollment number, certificates, experience, and fee structure before approving their live listing.</Text>
      </View>


        <View style={styles.statsSearchContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statsIconBox}>
              <UserCheck size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statsTitle}>Applications Awaiting Review</Text>
              <Text style={styles.statsSub}>{filteredLawyers.length} advocate{filteredLawyers.length === 1 ? '' : 's'} matching current filter</Text>
            </View>
          </View>
          
          <View style={styles.searchBarInner}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInputInner}
              placeholder="Search by name, Bar No, location..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={filteredLawyers}
          keyExtractor={(item) => (item.lawyerId || item.id).toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <ShieldCheck size={32} color="#1E293B" />
              </View>
              <Text style={styles.emptyTitle}>No Pending Applications</Text>
              <Text style={styles.emptySub}>
                {searchQuery 
                  ? `No applications matched "${searchQuery}". Clear your search query.` 
                  : "All advocate verification requests have been audited and resolved."}
              </Text>
            </View>
          )}
        />
      )}

      {/* Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowDetailsModal(false)}>
        {selectedLawyer && (
          <SafeAreaView style={styles.modalContainer}>
            {/* Modal Top Header (Dark Theme) */}
            <View style={styles.modalHeroHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 16 }}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarTextLarge}>{selectedLawyer.fullName?.charAt(0) || 'A'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalProfileName} numberOfLines={1}>{selectedLawyer.fullName}</Text>
                  <Text style={styles.modalProfileSub} numberOfLines={1}>
                    Bar Reg: <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{selectedLawyer.barEnrollmentNumber || 'Not Provided'}</Text> • {selectedLawyer.location || 'India'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              
              {/* 4-Stat Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricCell}>
                  <View style={styles.metricLabelRow}>
                    <Briefcase size={12} color="#6366F1" />
                    <Text style={styles.metricLabel}>Experience</Text>
                  </View>
                  <Text style={styles.metricValue}>{selectedLawyer.yearsOfExperience || 'N/A'} Years</Text>
                </View>
                
                <View style={styles.metricCell}>
                  <View style={styles.metricLabelRow}>
                    <DollarSign size={12} color="#10B981" />
                    <Text style={styles.metricLabel}>Fee Rate</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: '#059669' }]}>₹{selectedLawyer.consultationFee || selectedLawyer.consultationRateAmount || 99}</Text>
                </View>

                <View style={styles.metricCell}>
                  <View style={styles.metricLabelRow}>
                    <Award size={12} color="#F59E0B" />
                    <Text style={styles.metricLabel}>Education</Text>
                  </View>
                  <Text style={styles.metricValue} numberOfLines={1}>{selectedLawyer.education || 'LL.B, Law Degree'}</Text>
                </View>

                <View style={styles.metricCell}>
                  <View style={styles.metricLabelRow}>
                    <Globe size={12} color="#A855F7" />
                    <Text style={styles.metricLabel}>UPI Payout</Text>
                  </View>
                  <Text style={styles.metricValue} numberOfLines={1}>{selectedLawyer.upiId || 'advocate@upi'}</Text>
                </View>
              </View>

              {/* Professional Bio */}
              <View style={styles.sectionBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <BookOpen size={14} color="#4F46E5" />
                  <Text style={[styles.sectionHeading, { marginLeft: 6, marginBottom: 0 }]}>Professional Bio & Summary</Text>
                </View>
                <Text style={styles.bioText}>{selectedLawyer.bio || 'Advocate practicing in high courts and district courts with verified credentials.'}</Text>
              </View>

              {/* Practice Areas */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>Practice Areas</Text>
                <View style={styles.tagContainer}>
                  {selectedLawyer.practiceAreas && selectedLawyer.practiceAreas.length > 0 ? (
                    selectedLawyer.practiceAreas.map((p: string, i: number) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{p.replace(/_/g, ' ')}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.bioText, { fontStyle: 'italic' }]}>Civil Law, Criminal Law</Text>
                  )}
                </View>
              </View>

              {/* Documents */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>Verification Documents</Text>
                {selectedLawyer.documents && selectedLawyer.documents.length > 0 ? (
                  selectedLawyer.documents.map((doc: any, i: number) => (
                    <TouchableOpacity key={i} style={styles.docItem} onPress={() => openDocument(doc)}>
                      <FileText size={20} color="#4F46E5" />
                      <Text style={styles.docName}>{doc.documentType || doc.name || `Document ${i+1}`}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.bioText}>No documents attached.</Text>
                )}
              </View>
            </ScrollView>

            {(selectedLawyer.verificationStatus === 'PENDING' || !selectedLawyer.verificationStatus) && (
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.footerBtn, { backgroundColor: '#FEF2F2' }]}
                  onPress={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                >
                  <XCircle size={18} color="#EF4444" />
                  <Text style={[styles.footerBtnText, { color: '#EF4444' }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.footerBtn, { backgroundColor: '#059669', flex: 1.5 }]}
                  onPress={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <CheckCircle size={18} color="#FFFFFF" />}
                  <Text style={[styles.footerBtnText, { color: '#FFFFFF' }]}>Approve Application</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Reject Application</Text>
            <Text style={styles.dialogSub}>Please provide a reason for rejecting {selectedLawyer?.fullName}'s application.</Text>
            
            <TextInput
              style={styles.dialogInput}
              placeholder="E.g. Invalid Bar Certificate"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
            />
            
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogBtn} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.dialogBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dialogBtn, { backgroundColor: '#EF4444' }]} 
                onPress={handleReject}
                disabled={actionLoading}
              >
                <Text style={[styles.dialogBtnText, { color: '#FFFFFF' }]}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  heroBanner: { backgroundColor: '#111827', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  heroBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#FCD34D', marginLeft: 4 },
  heroBadgeSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  heroBadgeTextSecondary: { fontSize: 11, fontWeight: '600', color: '#E2E8F0', marginLeft: 4 },
  heroTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  refreshBtnHero: { padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
  heroSubtitle: { fontSize: 12, color: '#94A3B8', lineHeight: 18 },

  statsSearchContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 16, marginBottom: 16, marginTop: -20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statsIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statsTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  statsSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  searchBarInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchInputInner: { flex: 1, marginLeft: 8, fontSize: 13, color: '#334155' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#4F46E5', fontSize: 18, fontWeight: 'bold' },
  cardInfo: { flex: 1, paddingRight: 8 },
  lawyerName: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  contactText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  lawyerSub: { fontSize: 11, color: '#64748B', marginLeft: 4, flex: 1 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  cardBodyCompact: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16, gap: 6 },
  infoRowCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabelCompact: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  infoValueCompact: { fontSize: 11, color: '#334155' },
  infoBadgeCompact: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  cardFooter: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  actionBtnText: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginLeft: 6 },

  


  cardFooterStacked: { gap: 12, marginTop: 4 },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 12, gap: 8 },
  reviewBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  footerActionRow: { flexDirection: 'row', gap: 12 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 12, gap: 8 },
  approveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#FECACA' },
  rejectBtnText: { color: '#BE123C', fontSize: 13, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748B', marginTop: 8 },
  
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  avatarLarge: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarTextLarge: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  modalProfileName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  modalProfileSub: { fontSize: 12, color: '#A5B4FC' },
  
  modalScroll: { padding: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  metricCell: { width: '48%', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metricLabel: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8', marginLeft: 6 },
  metricValue: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },

  sectionBlock: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  sectionHeading: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  bioText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E0E7FF' },
  tagText: { fontSize: 11, fontWeight: 'bold', color: '#4338CA' },
  docItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#C7D2FE' },
  docName: { marginLeft: 12, fontSize: 14, fontWeight: '600', color: '#3730A3' },
  modalFooter: { flexDirection: 'row', padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 12 },
  footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  footerBtnText: { fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  
  // Dialog
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%' },
  dialogTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C4A', marginBottom: 8 },
  dialogSub: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  dialogInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  dialogBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8, backgroundColor: '#F1F5F9' },
  dialogBtnText: { fontWeight: 'bold', color: '#475569' }
});

export default AdminVerificationsScreen;
