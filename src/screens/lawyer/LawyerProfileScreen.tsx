import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, Award, Scale, MapPin, Edit3, ShieldCheck, IndianRupee, CreditCard, Lock, FileText, ChevronRight, Camera, Mail, Phone, GraduationCap } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const LawyerProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const advocate = user || {};
  const practiceAreasList = Array.isArray(advocate.practiceAreas) ? advocate.practiceAreas : [];
  const primaryArea = practiceAreasList.length > 0 ? practiceAreasList[0].replace('_', ' ') : 'General Law';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Advocate Profile</Text>
          <View style={styles.headerBadge}>
            <View style={styles.greenDot} />
            <ShieldCheck size={12} color="#059669" />
            <Text style={styles.headerBadgeText}>Bar Verified</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>Manage your credentials, Bar enrollment, consultation fee, and practice domains.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Cover & Avatar */}
        <View style={styles.profileCard}>
          <View style={styles.coverBg}>
            <View style={styles.coverTopRow}>
              <View style={styles.badgesRow}>
                <View style={styles.verifiedBadge}>
                  <View style={styles.greenDot} />
                  <ShieldCheck size={12} color="#34D399" />
                  <Text style={styles.verifiedText}>Bar Council Verified</Text>
                </View>
                <View style={styles.enrolledBadge}>
                  <Scale size={12} color="#FBBF24" />
                  <Text style={styles.enrolledText}>Enrolled Advocate</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('LawyerRegisterWizard')}>
                <Edit3 size={12} color="#FFF" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.profileContent}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  {advocate.profilePhotoUrl ? (
                    <Image source={{ uri: advocate.profilePhotoUrl }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarText}>{advocate.fullName ? advocate.fullName.charAt(0) : 'A'}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.cameraBtn} onPress={() => navigation.navigate('LawyerRegisterWizard')}>
                  <Camera size={14} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statPill}>
                  <Award size={16} color="#D97706" />
                  <View>
                    <Text style={styles.statLabel}>EXPERIENCE</Text>
                    <Text style={styles.statValue}>{advocate.yearsOfExperience || 6} Years</Text>
                  </View>
                </View>
                <View style={styles.statPill}>
                  <Scale size={16} color="#4F46E5" />
                  <View>
                    <Text style={styles.statLabel}>BAR REG NO.</Text>
                    <Text style={styles.statValue}>{advocate.barEnrollmentNumber || '96'}</Text>
                  </View>
                </View>
                <View style={styles.statPill}>
                  <MapPin size={16} color="#059669" />
                  <View>
                    <Text style={styles.statLabel}>JURISDICTION</Text>
                    <Text style={styles.statValue}>{advocate.location || 'Phh'}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.nameRow}>
              <Text style={styles.name}>{advocate.fullName || 'Adv. ghfgfh'}</Text>
              <View style={styles.nameVerifiedBadge}>
                <ShieldCheck size={14} color="#059669" />
                <Text style={styles.nameVerifiedText}>Verified</Text>
              </View>
            </View>

            <Text style={styles.subTitle}>
              Advocate • {primaryArea} • Bar Registration: {advocate.barEnrollmentNumber || 'N/A'}
            </Text>

            <View style={styles.contactRow}>
              <View style={styles.contactPill}>
                <Mail size={14} color="#4F46E5" />
                <Text style={styles.contactText}>{advocate.email || 'N/A'}</Text>
              </View>
              <View style={styles.contactPill}>
                <Phone size={14} color="#059669" />
                <Text style={styles.contactText}>{advocate.mobileNumber || advocate.phone || 'N/A'}</Text>
              </View>
              <View style={styles.contactPill}>
                <MapPin size={14} color="#DC2626" />
                <Text style={styles.contactText}>{advocate.location || 'N/A'}</Text>
              </View>
              <View style={styles.contactPill}>
                <GraduationCap size={14} color="#D97706" />
                <Text style={styles.contactText}>{advocate.education || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Items updated to match visual cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity style={styles.domainCard} onPress={() => navigation.navigate('LawyerRegisterWizard')}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconWrapperBlue}>
                <Scale size={20} color="#4F46E5" />
              </View>
              <View style={styles.cardTitleCol}>
                <Text style={styles.cardTitle}>Legal Categories & Practice Domains</Text>
                <Text style={styles.cardSubTitle}>{practiceAreasList.length} active legal specialization{practiceAreasList.length !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.cardEditBtn}>
                <Edit3 size={12} color="#475569" />
                <Text style={styles.cardEditText}>Edit Domains</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rateCard} onPress={() => navigation.navigate('LawyerRegisterWizard')}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconWrapperYellow}>
                <IndianRupee size={20} color="#D97706" />
              </View>
              <View style={styles.cardTitleCol}>
                <Text style={styles.cardTitle}>Consultation Rate</Text>
                <Text style={styles.cardSubTitleYellow}>₹{advocate.consultationFee || advocate.consultationRateAmount || 99} per Session</Text>
              </View>
              <View style={styles.cardEditBtnYellow}>
                <Edit3 size={12} color="#92400E" />
                <Text style={styles.cardEditTextYellow}>Edit</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0' },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  headerSub: { fontSize: 13, color: '#64748B' },
  scroll: { padding: 16 },
  
  profileCard: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4 },
  coverBg: { minHeight: 140, backgroundColor: '#1E1B4B', padding: 16 },
  coverTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(5, 150, 105, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#059669' },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  verifiedText: { fontSize: 11, fontWeight: '700', color: '#34D399' },
  enrolledBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  enrolledText: { fontSize: 11, fontWeight: '600', color: '#E2E8F0' },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginLeft: 8 },
  editProfileText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  
  profileContent: { padding: 16, backgroundColor: '#FFF' },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 16, zIndex: 10 },
  avatarContainer: { marginTop: -50, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#F8FAFC', borderWidth: 4, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#4F46E5' },
  cameraBtn: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#1E293B', padding: 8, borderRadius: 16, borderWidth: 2, borderColor: '#FFF' },
  
  statsContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  name: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  nameVerifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  nameVerifiedText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  
  subTitle: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 16 },
  
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  contactPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  contactText: { fontSize: 13, color: '#334155', fontWeight: '500' },

  cardsContainer: { gap: 16, marginBottom: 24 },
  domainCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  rateCard: { backgroundColor: '#FEF3C7', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  cardIconWrapperBlue: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardIconWrapperYellow: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitleCol: { flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  cardSubTitle: { fontSize: 13, color: '#64748B' },
  cardSubTitleYellow: { fontSize: 13, color: '#92400E' },
  cardEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  cardEditText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  cardEditBtnYellow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FDE68A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  cardEditTextYellow: { fontSize: 12, fontWeight: '700', color: '#92400E' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 16 }
});

export default LawyerProfileScreen;
