import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ShieldCheck, MapPin, Award, Languages, Star, ArrowRight, CheckCircle2 } from 'lucide-react-native';

interface LawyerCardProps {
  lawyer: any;
  onPress: () => void;
  isLoading?: boolean;
}

const LawyerCard: React.FC<LawyerCardProps> = ({ lawyer, onPress, isLoading = false }) => {
  // Same logic as web ratingUtils for now
  const lawyerId = lawyer.lawyerId || lawyer.id || 1;
  const ratingCount = lawyerId === 2 ? 84 : lawyerId === 3 ? 12 : lawyerId === 4 ? 41 : 124;
  const ratingAvg = lawyer.rating || 4.8;

  const practiceAreasStr = Array.isArray(lawyer.practiceAreas)
    ? lawyer.practiceAreas.map((p: any) => typeof p === 'string' ? p.replace(/_/g, ' ') : p).join(' • ')
    : 'General Practice';

  const languagesStr = Array.isArray(lawyer.languages)
    ? lawyer.languages.join(', ')
    : 'English, Hindi';

  const rateAmount = lawyer.consultationRateAmount || 
                     (typeof lawyer.consultationRate === 'object' ? lawyer.consultationRate?.amount : null) || 
                     (typeof lawyer.consultationRate === 'string' ? lawyer.consultationRate.replace('RATE_', '') : lawyer.consultationFee || '99');

  const primaryCategoryLabel = Array.isArray(lawyer.practiceAreas) && lawyer.practiceAreas.length > 0
    ? String(lawyer.practiceAreas[0]).replace(/_/g, ' ')
    : 'LEGAL SPECIALIST';

  const bioText = lawyer.bio 
    ? (lawyer.bio.length > 110 ? `${lawyer.bio.substring(0, 110)}...` : lawyer.bio) 
    : 'Senior legal advocate specializing in court litigation, advisory & fast-track dispute resolution.';

  return (
    <View style={styles.card}>
      <View style={styles.topGoldBar} />
      
      <View style={styles.innerPadding}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{lawyer.fullName ? lawyer.fullName.charAt(0).toUpperCase() : 'A'}</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
          
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{lawyer.fullName || 'Advocate'}</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color="#059669" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.ratingBadge}>
                <Star size={12} color="#5C5C99" fill={ratingCount > 0 ? "#5C5C99" : "none"} />
                <Text style={styles.ratingText}>{ratingAvg.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({ratingCount} reviews)</Text>
              </View>
              <Text style={styles.barNumber}>Bar: {lawyer.barEnrollmentNumber || 'D/2491/2012'}</Text>
            </View>

            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>🏷️ Category: {primaryCategoryLabel}</Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.chipsGrid}>
          <View style={styles.metaChip}>
            <Award size={13} color="#4F46E5" />
            <Text style={styles.metaChipText}>{lawyer.yearsOfExperience || lawyer.experienceYears || lawyer.experience || 5}+ Yrs Exp</Text>
          </View>
          <View style={styles.metaChip}>
            <MapPin size={13} color="#4F46E5" />
            <Text style={styles.metaChipText} numberOfLines={1}>{lawyer.location || 'High Court'}</Text>
          </View>
          <View style={styles.metaChip}>
            <Languages size={13} color="#4F46E5" />
            <Text style={styles.metaChipText} numberOfLines={1}>{languagesStr}</Text>
          </View>
        </View>

        <Text style={styles.bioText}>{bioText}</Text>
        
        <Text style={styles.practiceText} numberOfLines={1}>
          <Text style={{ fontWeight: 'bold' }}>Practice:</Text> {practiceAreasStr}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceValue}>₹{rateAmount} <Text style={styles.priceSub}>/ 10 min</Text></Text>
            <View style={styles.freeTrialTag}>
              <CheckCircle2 size={12} color="#059669" />
              <Text style={styles.freeTrialText}>10m Free Chat Included</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.consultBtn, isLoading && { opacity: 0.8 }]} 
            onPress={onPress}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <>
                <Text style={styles.consultBtnText}>Consult Now</Text>
                <ArrowRight size={14} color="#0F172A" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, overflow: 'hidden' },
  topGoldBar: { height: 6, backgroundColor: '#D4AF37', width: '100%' },
  innerPadding: { padding: 16 },
  
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E1E2F', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#D4AF37', fontSize: 24, fontWeight: '700' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFFFFF' },
  headerInfo: { flex: 1 },
  
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  name: { fontSize: 17, fontWeight: 'bold', color: '#1E1E2F', flexShrink: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  verifiedText: { fontSize: 10, fontWeight: '600', color: '#059669', marginLeft: 2 },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#5C5C99', marginLeft: 4 },
  ratingCount: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
  barNumber: { fontSize: 11, color: '#6B7280' },
  
  categoryPill: { alignSelf: 'flex-start', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  categoryPillText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  metaChipText: { fontSize: 12, color: '#4F46E5', fontWeight: '500', marginLeft: 6, maxWidth: 100 },
  
  bioText: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 8 },
  practiceText: { fontSize: 12, color: '#334155', marginBottom: 16 },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#1E1E2F' },
  priceSub: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  freeTrialTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  freeTrialText: { fontSize: 11, fontWeight: '500', color: '#059669', marginLeft: 4 },
  
  consultBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4AF37', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  consultBtnText: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginRight: 6 }
});

export default LawyerCard;
