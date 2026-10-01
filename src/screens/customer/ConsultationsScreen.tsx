import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consultationApi } from '../../api/consultationApi';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Clock, MessageSquare, AlertCircle, CheckCircle2, Search, X, XCircle, CheckCircle, Plus } from 'lucide-react-native';

const ConsultationsScreen = () => {
  const [listFilterTab, setListFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [listSearch, setListSearch] = useState('');
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchConsultations();
    }
  }, [isFocused]);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const res = await consultationApi.getRequestsForCustomer();
      const data = res.data?.data || res.data || [];
      // Format rate and strings just like the web app
      const formatted = data.map((r: any) => ({
        ...r,
        lawyerName: r.lawyerName || 'Advocate',
        category: r.categoryDisplayName || r.category || 'Legal Consultation',
        status: (r.status || 'REQUESTED').toUpperCase(),
        id: r.id || r.requestId
      }));
      setConsultations(formatted);
    } catch (e) {
      console.error('Failed to load consultations', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultations = useMemo(() => {
    return consultations.filter(item => {
      if (listFilterTab === 'ACTIVE' && (item.status === 'COMPLETED' || item.status === 'CANCELLED')) {
        return false;
      }
      if (listFilterTab === 'COMPLETED' && item.status !== 'COMPLETED') {
        return false;
      }
      if (!listSearch.trim()) return true;
      const q = listSearch.trim().toLowerCase();
      return (
        item.lawyerName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.assignedDate && item.assignedDate.toLowerCase().includes(q))
      );
    });
  }, [consultations, listFilterTab, listSearch]);

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const cleaned = name.replace(/^(adv(\.|\s+)|advocate\s+|dr(\.|\s+)|mr(\.|\s+)|ms(\.|\s+)|mrs(\.|\s+))/i, '').trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return name.charAt(0).toUpperCase();
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatRateShort = (rate: any) => {
    if (!rate && rate !== 0) return '₹99';
    if (typeof rate === 'number') return `₹${rate}`;
    if (typeof rate === 'object') return `₹${rate?.amount || 99}`;
    const str = String(rate).replace('RATE_', '');
    const firstPart = str.split('/')[0].trim();
    return firstPart.startsWith('₹') ? firstPart : `₹${firstPart}`;
  };

  const handlePressCard = (item: any) => {
    navigation.navigate('ConsultationChat', { 
      requestId: item.id,
      lawyerId: item.lawyerId,
      consultation: item
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'COMPLETED';
    const isRejected = item.status === 'REJECTED';
    const isRequested = item.status === 'REQUESTED' || item.status === 'PENDING';

    return (
      <TouchableOpacity style={styles.card} onPress={() => handlePressCard(item)}>
        <View style={styles.avatarContainer}>
          {item.lawyerProfileImageUrl ? (
            <Image source={{ uri: item.lawyerProfileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{getInitials(item.lawyerName)}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.headerRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.lawyerName} numberOfLines={1}>{item.lawyerName}</Text>
              <CheckCircle2 size={14} color="#10B981" />
            </View>
            <Text style={styles.idText}>#{item.id}</Text>
          </View>
          
          <Text style={styles.category} numberOfLines={1}>{item.category}</Text>

          <View style={styles.footerRow}>
            {isCompleted ? (
              <View style={[styles.badge, styles.badgeCompleted]}>
                <CheckCircle size={10} color="#059669" />
                <Text style={styles.badgeTextCompleted}>Completed</Text>
              </View>
            ) : isRejected ? (
              <View style={[styles.badge, styles.badgeRejected]}>
                <XCircle size={10} color="#E11D48" />
                <Text style={styles.badgeTextRejected}>Declined</Text>
              </View>
            ) : isRequested ? (
              <View style={[styles.badge, styles.badgePending]}>
                <Clock size={10} color="#D97706" />
                <Text style={styles.badgeTextPending}>Awaiting Schedule</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeActive]}>
                <View style={styles.pulseDot} />
                <Text style={styles.badgeTextActive}>
                  {item.assignedDate ? `${item.assignedDate}${item.assignedTime ? ` (${item.assignedTime})` : ''}` : 'Confirmed'}
                </Text>
              </View>
            )}

            <Text style={styles.rateText}>{formatRateShort(item.lawyerRate)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.iconContainer}>
            <MessageSquare size={16} color="#4F46E5" />
          </View>
          <Text style={styles.title}>Consultations</Text>
          {consultations.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{consultations.length}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Search size={14} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by advocate or matter..."
            value={listSearch}
            onChangeText={setListSearch}
          />
          {listSearch.length > 0 && (
            <TouchableOpacity onPress={() => setListSearch('')} style={styles.clearSearch}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabsContainer}>
          {['ALL', 'ACTIVE', 'COMPLETED'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, listFilterTab === tab && styles.activeTab]}
              onPress={() => setListFilterTab(tab as any)}
            >
              <Text style={[styles.tabText, listFilterTab === tab && styles.activeTabText]}>
                {tab === 'ALL' ? `All (${consultations.length})` : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading your consultations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConsultations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <MessageSquare size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>{listSearch ? "No Results Found" : "No Consultations"}</Text>
              <Text style={styles.emptySub}>{listSearch ? "Try adjusting your search query." : "Book an advocate to start your consultation."}</Text>
              
              {!listSearch && (
                <TouchableOpacity 
                  style={styles.findBtn}
                  onPress={() => navigation.navigate('FindLawyers')}
                >
                  <Plus size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.findBtnText}>Find Advocates</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 },
  countBadge: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  countText: { fontSize: 11, fontWeight: 'bold', color: '#4338CA' },
  toolbar: { backgroundColor: '#FFFFFF', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, height: 36 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', height: '100%' },
  clearSearch: { padding: 4 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#4338CA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 13, color: '#94A3B8', marginTop: 12 },
  listContainer: { padding: 12, paddingBottom: 32 },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  avatarFallback: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontSize: 14, fontWeight: 'bold', color: '#4338CA' },
  cardBody: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  nameContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  lawyerName: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginRight: 4, flexShrink: 1 },
  idText: { fontSize: 11, color: '#94A3B8', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  category: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeCompleted: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  badgeTextCompleted: { fontSize: 11, fontWeight: '600', color: '#475569', marginLeft: 4 },
  badgeRejected: { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' },
  badgeTextRejected: { fontSize: 11, fontWeight: '600', color: '#BE123C', marginLeft: 4 },
  badgePending: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  badgeTextPending: { fontSize: 11, fontWeight: '600', color: '#92400E', marginLeft: 4 },
  badgeActive: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  badgeTextActive: { fontSize: 11, fontWeight: '600', color: '#047857', marginLeft: 4 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 },
  rateText: { fontSize: 11, fontWeight: 'bold', color: '#047857' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, paddingHorizontal: 32 },
  findBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  findBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 }
});

export default ConsultationsScreen;
