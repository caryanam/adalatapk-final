import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { lawyerApi } from '../../api/lawyerApi';
import apiClient from '../../api/apiClient';
import LawyerCard from '../../components/LawyerCard';
import { Search, Filter, ArrowLeft, Users } from 'lucide-react-native';

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'CRIMINAL_LAW', label: 'Criminal Law' },
  { id: 'FAMILY_LAW', label: 'Family Law' },
  { id: 'PROPERTY_LAW', label: 'Property Law' },
  { id: 'CIVIL_DISPUTES', label: 'Civil Disputes' },
  { id: 'CONSUMER_LAW', label: 'Consumer Law' },
  { id: 'CORPORATE_LAW', label: 'Corporate Law' },
  { id: 'CYBERCRIME', label: 'Cybercrime' },
  { id: 'EMPLOYMENT_LAW', label: 'Employment Law' }
];

const FindLawyersScreen = () => {
  const navigation = useNavigation<any>();
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [bookingLawyerId, setBookingLawyerId] = useState<number | null>(null);

  useEffect(() => {
    fetchLawyers();
  }, []);

  const fetchLawyers = async () => {
    try {
      const res = await lawyerApi.getApprovedLawyers();
      const data = res.data?.data || res.data || [];
      setLawyers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch lawyers', e);
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLawyers();
    setRefreshing(false);
  };

  const handleConsult = async (lawyer: any) => {
    const lawyerId = lawyer.lawyerId || lawyer.id;
    if (!lawyerId) return;

    try {
      setBookingLawyerId(lawyerId);
      await apiClient.post('/api/customer/consultations', {
        lawyerId: lawyerId,
        caseSummary: 'Consultation requested from lawyer directory'
      });
      navigation.navigate('Consultations');
    } catch (err: any) {
      console.error('Failed to create consultation request:', err);
      Alert.alert('Booking Error', 'Failed to book consultation. Please try again later.');
    } finally {
      setBookingLawyerId(null);
    }
  };

  const filteredLawyers = lawyers.filter(l => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
                          l.fullName?.toLowerCase().includes(searchLower) || 
                          l.education?.toLowerCase().includes(searchLower) ||
                          l.location?.toLowerCase().includes(searchLower) ||
                          (Array.isArray(l.practiceAreas) && l.practiceAreas.some((p: string) => p.toLowerCase().includes(searchLower)));
    
    const matchesCategory = activeCategory === 'ALL' || 
                            (Array.isArray(l.practiceAreas) && l.practiceAreas.includes(activeCategory));
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1C1C4A" />
        </TouchableOpacity>
        <Text style={styles.title}>Find Advocates</Text>
      </View>

      <View style={styles.headerContext}>
        <Text style={styles.headerSub}>Search and connect with verified legal professionals across India.</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, specialization, court..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={20} color="#1C1C4A" />
        </TouchableOpacity>
      </View>

      <View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.categoryBadge, activeCategory === item.id && styles.categoryBadgeActive]}
              onPress={() => setActiveCategory(item.id)}
            >
              <Text style={[styles.categoryText, activeCategory === item.id && styles.categoryTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 12, color: '#64748B' }}>Finding the best lawyers for you...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLawyers}
          keyExtractor={(item, index) => item.lawyerId?.toString() || item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <LawyerCard 
              lawyer={item} 
              onPress={() => handleConsult(item)} 
              isLoading={bookingLawyerId === (item.lawyerId || item.id)}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Users size={48} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Lawyers Found</Text>
              <Text style={styles.emptySub}>We couldn't find any lawyers matching your current criteria. Please try adjusting your search or category filter.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: '#F8FAFC' },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E1E2F' },
  headerContext: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#F8FAFC' },
  headerSub: { fontSize: 14, color: '#64748B' },
  searchContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#F8FAFC' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#334155' },
  filterBtn: { width: 48, height: 48, backgroundColor: '#FFFFFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  categoriesContainer: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#F8FAFC' },
  categoryBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  categoryBadgeActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  categoryText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  categoryTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyIconBg: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1E2F', marginBottom: 12 },
  emptySub: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 }
});

export default FindLawyersScreen;
