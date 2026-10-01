import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { lawyerApi } from '../../api/lawyerApi';
import { ShieldCheck, Upload, FileText, AlertTriangle, Clock } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const LawyerDocumentsScreen = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('BAR_COUNCIL_CERTIFICATE');

  const DOC_TYPES = [
    { value: 'BAR_COUNCIL_CERTIFICATE', label: 'Bar Council Certificate' },
    { value: 'ENROLLMENT_CERTIFICATE', label: 'Enrollment Certificate' },
    { value: 'DEGREE_CERTIFICATE', label: 'LL.B Degree' },
    { value: 'ID_PROOF', label: 'Identity Proof' },
    { value: 'ADDRESS_PROOF', label: 'Address Proof' },
    { value: 'PROFESSIONAL_DOCUMENT', label: 'Professional ID' }
  ];

  const formatDocType = (type: string) => {
    if (!type) return 'Bar Council Certificate';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const fetchProfile = async () => {
    const lawyerId = user?.lawyerId || user?.id;
    if (!lawyerId) { setLoading(false); return; }
    try {
      const res = await lawyerApi.getLawyerById(lawyerId);
      if (res && res.data) setProfile(res.data.data || res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpload = async () => {
    const lawyerId = user?.lawyerId || user?.id;
    if (!lawyerId) return;

    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    if (result.didCancel || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    
    setUploading(true);
    try {
      await lawyerApi.uploadDocument(lawyerId, documentType, {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'document.jpg'
      });
      Alert.alert('Success', 'Document uploaded successfully');
      fetchProfile();
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const advocate = profile || user || {};
  const isApproved = advocate?.verificationStatus === 'APPROVED' || advocate?.accountStatus === 'ACTIVE';
  const isRejected = advocate?.verificationStatus === 'REJECTED';
  const docs = Array.isArray(advocate.documents) ? advocate.documents : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Verification Documents</Text>
          <Text style={styles.headerSubtitle}>Manage Bar Council credentials</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isApproved ? (
          <View style={[styles.statusCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <ShieldCheck size={24} color="#059669" />
            <View style={styles.statusTextCol}>
              <Text style={[styles.statusTitle, { color: '#064E3B' }]}>Credentials Verified</Text>
              <Text style={styles.statusDesc}>Your Bar Council documents have been verified.</Text>
            </View>
          </View>
        ) : isRejected ? (
          <View style={[styles.statusCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <AlertTriangle size={24} color="#DC2626" />
            <View style={styles.statusTextCol}>
              <Text style={[styles.statusTitle, { color: '#991B1B' }]}>Verification Rejected</Text>
              <Text style={styles.statusDesc}>Reason: {advocate.rejectionReason || 'Invalid document'}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.statusCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Clock size={24} color="#D97706" />
            <View style={styles.statusTextCol}>
              <Text style={[styles.statusTitle, { color: '#92400E' }]}>Verification In Progress</Text>
              <Text style={styles.statusDesc}>Documents are under manual review by admins.</Text>
            </View>
          </View>
        )}

        <View style={styles.uploadCard}>
          <View style={styles.uploadHeader}>
            <Upload size={20} color="#4F46E5" />
            <Text style={styles.uploadTitle}>Upload Document</Text>
          </View>

          <Text style={styles.inputLabel}>Document Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {DOC_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[styles.chip, documentType === type.value && styles.chipActive]}
                onPress={() => setDocumentType(type.value)}
              >
                <Text style={[styles.chipText, documentType === type.value && styles.chipTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.uploadBtnText}>Select & Upload Document</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Uploaded Documents ({docs.length})</Text>
        
        {loading ? (
          <ActivityIndicator size="small" color="#4F46E5" />
        ) : docs.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={32} color="#CBD5E1" />
            <Text style={styles.emptyText}>No documents uploaded yet.</Text>
          </View>
        ) : (
          docs.map((doc: any, idx: number) => (
            <View key={idx} style={styles.docCard}>
              <View style={styles.docHeaderRow}>
                <View style={styles.docTypeBadge}>
                  <Text style={styles.docTypeBadgeText}>{formatDocType(doc.documentType)}</Text>
                </View>
                <View style={[styles.docStatusBadge, advocate.verificationStatus === 'APPROVED' ? {backgroundColor: '#D1FAE5'} : {backgroundColor: '#FEF3C7'}]}>
                  <Text style={[styles.docStatusText, advocate.verificationStatus === 'APPROVED' ? {color: '#047857'} : {color: '#B45309'}]}>
                    {advocate.verificationStatus || 'PENDING'}
                  </Text>
                </View>
              </View>
              <View style={styles.docMainRow}>
                <View style={styles.docIcon}><FileText size={20} color="#4F46E5" /></View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doc.originalFileName || doc.fileName || 'Bar_Certificate.pdf'}</Text>
                  <Text style={styles.docDate}>Uploaded: {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'On Registration'}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  headerSubtitle: { fontSize: 13, color: '#64748B' },
  scroll: { padding: 16 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  statusTextCol: { flex: 1 },
  statusTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  statusDesc: { fontSize: 13, color: '#475569' },
  
  uploadCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  uploadHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  uploadTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  chipScroll: { marginBottom: 16, flexDirection: 'row' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#4F46E5' },
  uploadBtn: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 10, alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  uploadBtnText: { color: '#FFF', fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  emptyState: { alignItems: 'center', padding: 30, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#94A3B8', marginTop: 10 },

  docCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  docHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  docTypeBadge: { backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A' },
  docTypeBadgeText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  docStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  docStatusText: { fontSize: 9, fontWeight: '800' },
  docMainRow: { flexDirection: 'row', alignItems: 'center' },
  docIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  docDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500' }
});

export default LawyerDocumentsScreen;
