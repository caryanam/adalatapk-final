import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { 
  ShieldCheck, Lock, EyeOff, FileText, Database, Mail, AlertCircle, Sparkles, ArrowLeft
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const PrivacyScreen = () => {
  const navigation = useNavigation();

  const sections = [
    {
      id: 'collection',
      icon: Database,
      title: '1. Information We Collect',
      content: (
        <View>
          <Text style={styles.paragraphText}>
            To provide transparent and secure legal consultation services, Adalat (operated by <Text style={styles.boldText}>Caryanamindia Pvt Ltd</Text>) collects the following categories of information:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}><View style={styles.bullet}/><Text style={styles.bulletText}><Text style={styles.boldText}>Personal Identity:</Text> Full name, verified mobile number, email address, and state/city of residence.</Text></View>
            <View style={styles.bulletItem}><View style={styles.bullet}/><Text style={styles.bulletText}><Text style={styles.boldText}>Advocate KYC Details:</Text> Bar Council registration number, enrollment certificate, academic degrees, and identity proofs.</Text></View>
            <View style={styles.bulletItem}><View style={styles.bullet}/><Text style={styles.bulletText}><Text style={styles.boldText}>Case & Consultation Context:</Text> Legal descriptions, case categories, questions submitted to AI triage, and shared documents.</Text></View>
            <View style={styles.bulletItem}><View style={styles.bullet}/><Text style={styles.bulletText}><Text style={styles.boldText}>Transactional Data:</Text> Payment order IDs, transaction timestamps, and invoice records (payment card/UPI details are handled exclusively by RBI-authorized payment gateways).</Text></View>
          </View>
        </View>
      )
    },
    {
      id: 'usage',
      icon: FileText,
      title: '2. How We Use Your Data',
      content: (
        <View>
          <Text style={styles.paragraphText}>We strictly utilize gathered data for operational purposes:</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}><View style={styles.bullet}/><Text style={styles.bulletText}>Facilitating scheduled chat, audio, and video consultations between clients and verified advocates.</Text></View>
            <View style={styles.bulletItem}><View style={styles.bullet}/><Text style={styles.bulletText}>Powering AI-driven legal category mapping and statutory reference retrieval.</Text></View>
            <View style={styles.bulletItem}><View style={styles.bullet}/><Text style={styles.bulletText}>Verifying the authentic professional status of practicing advocates.</Text></View>
            <View style={styles.bulletItem}><View style={styles.bullet}/><Text style={styles.bulletText}>Generating invoices and managing dispute resolutions.</Text></View>
            <View style={styles.bulletItem}><View style={styles.bullet}/><Text style={styles.bulletText}>We <Text style={styles.boldText}>never sell, lease, or monetize</Text> personal data to external marketing agencies or advertisers.</Text></View>
          </View>
        </View>
      )
    },
    {
      id: 'confidentiality',
      icon: Lock,
      title: '3. Advocate-Client Privilege & Security',
      content: (
        <View>
          <Text style={styles.paragraphText}>
            All direct communications between clients and advocates conducted on the Adalat platform are subject to <Text style={styles.boldText}>Advocate-Client Confidentiality</Text> under the Indian Evidence Act:
          </Text>
          <View style={styles.infoBox}>
            <View style={styles.infoBoxHeader}>
              <ShieldCheck size={16} color="#059669" />
              <Text style={styles.infoBoxTitle}>256-Bit SSL Transport Layer Security</Text>
            </View>
            <Text style={styles.infoBoxText}>
              Data in transit is encrypted using modern TLS protocols. Case documents uploaded to secure vaults remain accessible only to the active client and the assigned consulting advocate.
            </Text>
          </View>
        </View>
      )
    },
    {
      id: 'third-parties',
      icon: EyeOff,
      title: '4. Third-Party Integrations',
      content: (
        <Text style={styles.paragraphText}>
          We partner with leading infrastructure providers (cloud hosting, SMS OTP gateways, and RBI-regulated payment aggregators) under strict confidentiality agreements. These vendors are granted access solely to execute essential transaction infrastructure and cannot utilize your data for independent purposes.
        </Text>
      )
    },
    {
      id: 'user-rights',
      icon: ShieldCheck,
      title: '5. Your Rights & Data Erasure',
      content: (
        <Text style={styles.paragraphText}>
          Under applicable Indian data protection laws, you reserve the right to access your stored consultation records, correct inaccuracies, or request the closure of your account and purge of uploaded case files by submitting a verification request to our compliance team.
        </Text>
      )
    },
    {
      id: 'grievance',
      icon: Mail,
      title: '6. Grievance Redressal & Contact',
      content: (
        <View>
          <Text style={styles.paragraphText}>
            For privacy inquiries, data access requests, or grievance escalations, you may contact our designated Grievance Officer:
          </Text>
          <View style={styles.contactBox}>
            <Text style={styles.contactBoxTitle}>Grievance Officer — Caryanamindia Pvt Ltd</Text>
            <Text style={styles.contactText}>Email: <Text style={styles.contactLink}>support@adalat.legal</Text></Text>
            <Text style={styles.contactText}>Phone: <Text style={styles.contactLink}>+91 9898989898</Text></Text>
            <Text style={styles.contactText}>Location: Pune, Maharashtra, India</Text>
          </View>
        </View>
      )
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Privacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Sparkles size={14} color="#D97706" />
            <Text style={styles.badgeText}>DATA PRIVACY & CONFIDENTIALITY</Text>
          </View>
          <Text style={styles.pageTitle}>Privacy Policy</Text>
          <Text style={styles.pageSubtitle}>Effective Date: March 2026 • Operated by Caryanamindia Pvt Ltd, Pune, India</Text>
        </View>

        {/* Quick summary alert */}
        <View style={styles.alertBox}>
          <AlertCircle size={22} color="#4F46E5" style={{ marginTop: 2 }} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Your Privacy is Sacred:</Text>
            <Text style={styles.alertText}>
              Adalat is committed to safeguarding attorney-client privilege. We never sell your personal data or case documents to any external party.
            </Text>
          </View>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <View key={sec.id} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.iconBox}>
                    <Icon size={20} color="#B45309" />
                  </View>
                  <Text style={styles.sectionTitle}>{sec.title}</Text>
                </View>
                <View style={styles.sectionContent}>
                  {sec.content}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  
  scrollContent: { paddingBottom: 40 },
  
  heroSection: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FEF3C7', marginBottom: 16 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#92400E', marginLeft: 6, letterSpacing: 0.5 },
  pageTitle: { fontSize: 32, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  pageSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  alertBox: { flexDirection: 'row', margin: 20, padding: 16, backgroundColor: '#EEF2FF', borderRadius: 16, borderWidth: 1, borderColor: '#E0E7FF' },
  alertContent: { flex: 1, marginLeft: 12 },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#312E81', marginBottom: 4 },
  alertText: { fontSize: 13, color: '#4338CA', lineHeight: 20 },

  sectionsContainer: { paddingHorizontal: 20, gap: 16 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#FEF3C7' },
  sectionTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0F172A' },
  sectionContent: { paddingLeft: 4 },

  paragraphText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 12 },
  boldText: { fontWeight: '700', color: '#1E293B' },
  
  bulletList: { marginTop: 4, gap: 8 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#94A3B8', marginTop: 8, marginRight: 10 },
  bulletText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 22 },

  infoBox: { marginTop: 12, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  infoBoxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoBoxTitle: { fontSize: 13, fontWeight: '700', color: '#047857', marginLeft: 8 },
  infoBoxText: { fontSize: 13, color: '#475569', lineHeight: 20 },

  contactBox: { marginTop: 12, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  contactBoxTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  contactText: { fontSize: 13, color: '#475569' },
  contactLink: { color: '#4F46E5', fontWeight: '600' }
});

export default PrivacyScreen;
