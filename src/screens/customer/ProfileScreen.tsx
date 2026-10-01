import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Modal, TextInput, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { customerApi } from '../../api/customerApi';
import { 
  User, Mail, Phone, Calendar, Lock, CreditCard, LogOut, Bell, Edit3, 
  CheckCircle2, Shield, MapPin, Camera, FileText, ArrowRight, ChevronRight, BadgeCheck, X, Save, Image as ImageIcon
} from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Details');

  // Edit Profile States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<any>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const handleChoosePhoto = async () => {
    setShowPhotoModal(false);
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setProfilePhoto(result.assets[0]);
      }
    } catch (error) {
      console.log('Gallery error', error);
      Alert.alert('Error', 'Could not open gallery. Make sure the app is rebuilt.');
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await customerApi.getProfile(user?.id || 1);
      setProfile(res.data?.data || res.data);
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchProfile();
    else setLoading(false);
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const userName = profile?.fullName || user?.fullName || 'Customer';
  const userEmail = profile?.email || user?.email || 'customer@example.com';
  const userMobile = profile?.mobileNumber || user?.mobileNumber || '+91 Not provided';
  const initial = userName.charAt(0).toUpperCase();

  const openEditModal = () => {
    setEditName(userName);
    setEditEmail(userEmail);
    setEditMobile(userMobile);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim() || !editMobile.trim()) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }
    
    setIsSaving(true);
    try {
      await customerApi.updateProfile({ 
        id: profile?.id || user?.id,
        fullName: editName,
        email: editEmail,
        mobileNumber: editMobile
      });
      // Update local state instantly
      setProfile({
        ...profile, 
        fullName: editName, 
        email: editEmail, 
        mobileNumber: editMobile
      });
      setIsEditModalVisible(false);
    } catch (error) {
      console.error("Failed to update profile", error);
      Alert.alert("Update Failed", "Could not save profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reusable 2x2 grid stat card
  const renderStatCard = (title: string, value: string, icon: any, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
        {React.cloneElement(icon, { color, size: 20 })}
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  // List Item for Details
  const renderDetailRow = (icon: any, label: string, value: string, showDivider: boolean = true) => (
    <View style={styles.detailRowWrapper}>
      <View style={styles.detailRow}>
        <View style={styles.detailIconBox}>
          {React.cloneElement(icon, { size: 18, color: '#6366F1' })}
        </View>
        <View style={styles.detailTextContent}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Sleek App Header */}
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.appHeaderTitle}>My Profile</Text>
          <View style={styles.activeClientRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.activeClientText}>Active Client</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Bell size={22} color="#1E293B" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 80 }} />
        ) : (
          <>
            {/* HERO CARD - Center aligned, deep premium blue */}
            <View style={styles.heroCard}>
              <View style={styles.heroContent}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    {profilePhoto ? (
                      <Image source={{ uri: profilePhoto.uri }} style={{ width: 84, height: 84, borderRadius: 28 }} />
                    ) : (
                      <Text style={styles.avatarText}>{initial}</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.cameraBtn} onPress={handleChoosePhoto}>
                    <Camera size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.heroTitles}>
                  <View style={styles.nameRow}>
                    <Text style={styles.heroName} numberOfLines={1}>{userName}</Text>
                    <BadgeCheck size={18} color="#10B981" />
                  </View>
                  <Text style={styles.heroEmail}>{userEmail}</Text>
                </View>

                <View style={styles.badgesContainer}>
                  <View style={styles.heroBadge}>
                    <Shield size={12} color="#818CF8" />
                    <Text style={styles.heroBadgeText}>Lifetime Access</Text>
                  </View>
                  <View style={styles.heroBadge}>
                    <Calendar size={12} color="#818CF8" />
                    <Text style={styles.heroBadgeText}>Joined 2026</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal}>
                  <Edit3 size={14} color="#1E1B4B" />
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2x2 STATS GRID */}
            <View style={styles.statsGrid}>
              {renderStatCard('Account Tier', 'Verified', <Shield />, '#10B981')}
              {renderStatCard('Security', '2FA Active', <Lock />, '#6366F1')}
              {renderStatCard('Payments', '₹116.82', <CreditCard />, '#10B981')}
              {renderStatCard('Region', 'All-India', <MapPin />, '#6366F1')}
            </View>

            {/* PILL TABS */}
            <View style={styles.tabsContainer}>
              {['Details', 'Security', 'Payments'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity 
                    key={tab} 
                    style={[styles.tabPill, isActive && styles.activeTabPill]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.tabPillText, isActive && styles.activeTabPillText]}>{tab}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* TAB CONTENT */}
            {activeTab === 'Details' && (
              <View style={styles.cardSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Identity & Contact</Text>
                  <TouchableOpacity onPress={openEditModal}>
                    <Text style={styles.sectionActionText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.listCard}>
                  {renderDetailRow(<User />, 'Full Name', userName)}
                  {renderDetailRow(<Mail />, 'Email Address', userEmail)}
                  {renderDetailRow(<Phone />, 'Mobile Number', userMobile)}
                  {renderDetailRow(<Shield />, 'Account Role', 'Client Portal')}
                  {renderDetailRow(<Calendar />, 'Registration Date', 'Sept 17, 2026', false)}
                </View>
              </View>
            )}

            {activeTab === 'Security' && (
              <View style={styles.cardSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Security Settings</Text>
                </View>
                <View style={styles.listCard}>
                  {renderDetailRow(<Lock />, 'Password', '••••••••', true)}
                  {renderDetailRow(<Shield />, 'Encryption', '256-Bit Secured', true)}
                  
                  {/* Privacy Policy Link */}
                  <TouchableOpacity 
                    style={styles.actionRow} 
                    onPress={() => navigation.navigate('Privacy')}
                  >
                    <View style={styles.actionRowLeft}>
                      <View style={styles.detailIconBox}>
                        <FileText size={18} color="#6366F1" />
                      </View>
                      <View style={styles.detailTextContent}>
                        <Text style={styles.detailLabel}>Policies</Text>
                        <Text style={styles.detailValue}>Privacy & Security</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeTab === 'Payments' && (
              <View style={styles.cardSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Invoices</Text>
                  <TouchableOpacity>
                    <Text style={styles.sectionActionText}>View All</Text>
                  </TouchableOpacity>
                </View>

                {/* Elegant Payment Card */}
                <View style={styles.paymentCard}>
                  <View style={styles.paymentCardTop}>
                    <View style={styles.paymentIconWrapper}>
                      <CreditCard size={20} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentTitle}>Adalat Activation</Text>
                      <Text style={styles.paymentDate}>24 Sept 2026 • UPI Direct</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.paymentAmount}>₹116.82</Text>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusText}>PAID</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.paymentDivider} />
                  
                  <View style={styles.paymentCardBottom}>
                    <Text style={styles.paymentRef}>REF: PAY-AAF85DCA</Text>
                    <TouchableOpacity style={styles.receiptBtn}>
                      <FileText size={14} color="#6366F1" />
                      <Text style={styles.receiptBtnText}>Receipt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Adalat App v1.0.0</Text>
          </>
        )}
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconBox}>
                  <Edit3 size={20} color="#5A4FCF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Update Profile Details</Text>
                  <Text style={styles.modalSub}>Update your contact details and account identity.</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>FULL LEGAL NAME <Text style={styles.asterisk}>*</Text></Text>
              <View style={styles.inputContainer}>
                <User size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Shubham Kumar"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS <Text style={styles.asterisk}>*</Text></Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="shubham.taware108@gmail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>MOBILE NUMBER <Text style={styles.asterisk}>*</Text></Text>
              <View style={styles.inputContainer}>
                <Phone size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={editMobile}
                  onChangeText={setEditMobile}
                  placeholder="7030682123"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Save size={16} color="#FFF" />
                    <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Picker Modal */}
      <Modal visible={showPhotoModal} transparent={true} animationType="fade" onRequestClose={() => setShowPhotoModal(false)}>
        <View style={styles.photoModalOverlay}>
          <View style={styles.photoModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile Picture</Text>
              <TouchableOpacity onPress={() => setShowPhotoModal(false)} style={styles.closeBtn}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalOptionBtn} onPress={handleChoosePhoto}>
              <View style={[styles.modalOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                <ImageIcon size={24} color="#10B981" />
              </View>
              <View>
                <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.modalOptionSub}>Select an existing image</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },

  // Header
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  appHeaderTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  activeClientRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  activeClientText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  notificationDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 1, borderColor: '#FFF' },

  // Hero Card
  heroCard: { backgroundColor: '#1E1B4B', borderRadius: 28, padding: 24, marginBottom: 20, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  heroContent: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 84, height: 84, borderRadius: 28, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#312E81' },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  cameraBtn: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#10B981', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1E1B4B' },
  
  heroTitles: { alignItems: 'center', marginBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginRight: 8 },
  heroEmail: { fontSize: 14, color: '#A5B4FC', fontWeight: '500' },
  
  badgesContainer: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  heroBadgeText: { color: '#E0E7FF', fontSize: 12, fontWeight: '600', marginLeft: 6 },

  editProfileBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', width: '100%', justifyContent: 'center', paddingVertical: 14, borderRadius: 16 },
  editProfileText: { color: '#1E1B4B', fontSize: 15, fontWeight: '700', marginLeft: 8 },

  // Stats Grid 2x2
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: '47.5%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  statTitle: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  // Pill Tabs
  tabsContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 4, marginBottom: 24 },
  tabPill: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTabPill: { backgroundColor: '#FFFFFF', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabPillText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeTabPillText: { color: '#0F172A', fontWeight: '800' },

  // Generic Card Section
  cardSection: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sectionActionText: { fontSize: 14, fontWeight: '700', color: '#6366F1' },

  // List Card (Identity details)
  listCard: { backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 20, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  detailRowWrapper: { width: '100%' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  detailIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  detailTextContent: { flex: 1 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 56 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 },
  actionRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  // Payment Card
  paymentCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F8FAFC' },
  paymentCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  paymentIconWrapper: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  paymentTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  paymentDate: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  paymentAmount: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 6 },
  statusPill: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#059669' },
  
  paymentDivider: { height: 1, backgroundColor: '#F1F5F9', borderStyle: 'dashed', marginBottom: 16 },
  
  paymentCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentRef: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  receiptBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  receiptBtnText: { fontSize: 13, fontWeight: '700', color: '#6366F1', marginLeft: 6 },

  // Logout & Version
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingVertical: 18, borderRadius: 20, marginTop: 10 },
  logoutText: { fontSize: 16, fontWeight: '800', color: '#EF4444', marginLeft: 10 },
  versionText: { textAlign: 'center', fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 24, marginBottom: 10 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalHeaderLeft: { flexDirection: 'row', gap: 14, flex: 1, paddingRight: 20 },
  modalIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  closeBtn: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 20 },
  
  formGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#1E293B', marginBottom: 8, letterSpacing: 0.5 },
  asterisk: { color: '#EF4444' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#F1F5F9', borderRadius: 16, backgroundColor: '#FFFFFF', paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0F172A', height: '100%' },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#334155' },
  saveBtn: { flex: 1.5, flexDirection: 'row', backgroundColor: '#5A4FCF', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  photoModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 20 },
  photoModalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
  modalOptionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#F8FAFC', marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  modalOptionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  modalOptionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  modalOptionSub: { fontSize: 13, color: '#64748B' },
});

export default ProfileScreen;
