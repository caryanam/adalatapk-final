import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert, Platform, StatusBar, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { lawyerApi } from '../../api/lawyerApi';
import { ArrowRight, ArrowLeft, CheckCircle2, Upload, Briefcase, FileText, IndianRupee, CreditCard, Star, Check, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const STEPS = [
  { id: 2, num: '1', title: 'Profile', icon: Briefcase },
  { id: 3, num: '2', title: 'Docs', icon: FileText },
  { id: 4, num: '3', title: 'Pricing', icon: IndianRupee },
  { id: 5, num: '4', title: 'Payout', icon: CreditCard },
  { id: 6, num: '5', title: 'Submit', icon: Star }
];

const PRACTICE_AREAS = [
  'Criminal Law', 'Family Law & Divorce', 'Property & Real Estate',
  'Civil Disputes & Recovery', 'Consumer Disputes', 'Employment & Labor',
  'Cyber Crime & IT', 'Banking & Finance', 'Corporate Law', 'Matrimonial Matters'
];

const LANGUAGES = [
  'English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada'
];

const LawyerRegisterWizardScreen = ({ navigation, route }: any) => {
  const { user, updateUser } = useAuth();
  const initialLawyerId = route.params?.lawyerId || user?.lawyerId || user?.id || '';
  
  const [currentStep, setCurrentStep] = useState(2);
  const [loading, setLoading] = useState(false);
  const [lawyerId, setLawyerId] = useState(initialLawyerId);

  // Form State
  const [profData, setProfData] = useState({
    barCouncilNumber: '',
    experienceYears: '',
    education: '',
    location: '',
    practiceAreas: [] as string[],
    languages: [] as string[],
    bio: ''
  });
  const [pricing, setPricing] = useState('99');
  const [upiId, setUpiId] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<any>(null);
  const [barCert, setBarCert] = useState<any>(null);
  const [idProof, setIdProof] = useState<any>(null);

  // Fetch initial progress if lawyerId exists
  useEffect(() => {
    if (lawyerId) {
      const fetchProgress = async () => {
        try {
          const res = await lawyerApi.getLawyerById(lawyerId);
          if (res.status === 'SUCCESS' && res.data) {
            const data = res.data;
            if (data.barCouncilRegNumber) {
              setProfData(prev => ({
                ...prev,
                barCouncilNumber: data.barCouncilRegNumber,
                experienceYears: data.experienceYears?.toString() || '',
                languages: data.languages || [],
                practiceAreas: data.practiceAreas || []
              }));
            }
            if (data.consultationFee) setPricing(data.consultationFee.toString());
            if (data.upiId) setUpiId(data.upiId);
            
            // Auto-advance logic (simplified)
            if (data.upiId) setCurrentStep(6);
            else if (data.consultationFee) setCurrentStep(5);
          }
        } catch (e) {
          console.error('Failed to load progress', e);
        }
      };
      fetchProgress();
    }
  }, [lawyerId]);

  const toggleSelection = (item: string, field: 'practiceAreas' | 'languages') => {
    setProfData(prev => {
      const currentList = prev[field];
      if (currentList.includes(item)) {
        return { ...prev, [field]: currentList.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...currentList, item] };
      }
    });
  };

  const handleChoosePhoto = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });
      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setProfilePhoto(result.assets[0]);
      }
    } catch (error) {
      console.log('Gallery error', error);
      Alert.alert('Error', 'Could not open gallery');
    }
  };

  const pickBarCert = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setBarCert(result.assets[0]);
      }
    } catch (e) {
      console.log('Error', e);
    }
  };

  const pickIdProof = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setIdProof(result.assets[0]);
      }
    } catch (e) {
      console.log('Error', e);
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      if (currentStep === 2) {
        if (!profData.barCouncilNumber) throw new Error("Bar Council Number is required");
        if (!profData.experienceYears) throw new Error("Years of Experience is required");
        if (profData.practiceAreas.length === 0) throw new Error("Select at least one Practice Area");
        if (profData.languages.length === 0) throw new Error("Select at least one Language");
        if (!profilePhoto && !lawyerId) throw new Error("Advocate Profile Photo is required");
        
        const practiceAreaMap: any = {
          'Criminal Law': 'CRIMINAL_LAW',
          'Family Law & Divorce': 'FAMILY_LAW',
          'Property & Real Estate': 'PROPERTY_LAW',
          'Civil Disputes & Recovery': 'CIVIL_DISPUTES',
          'Consumer Disputes': 'CONSUMER_LAW',
          'Employment & Labor': 'EMPLOYMENT_LAW',
          'Cyber Crime & IT': 'CYBERCRIME',
          'Banking & Finance': 'BANKING_AND_FINANCE',
          'Corporate Law': 'CORPORATE_LAW',
          'Matrimonial Matters': 'MATRIMONIAL_MATTERS'
        };

        const languageMap: any = {
          'English': 'ENGLISH', 'Hindi': 'HINDI', 'Marathi': 'MARATHI', 
          'Tamil': 'TAMIL', 'Telugu': 'TELUGU', 'Bengali': 'BENGALI', 
          'Gujarati': 'GUJARATI', 'Kannada': 'KANNADA'
        };

        const mappedPracticeAreas = profData.practiceAreas.map(pa => practiceAreaMap[pa] || pa.toUpperCase().replace(/ /g, '_'));
        const mappedLanguages = profData.languages.map(l => languageMap[l] || l.toUpperCase());

        await lawyerApi.updateStep2(lawyerId, {
          barEnrollmentNumber: profData.barCouncilNumber,
          yearsOfExperience: parseInt(profData.experienceYears || '0'),
          education: profData.education,
          location: profData.location,
          languages: mappedLanguages,
          practiceAreas: mappedPracticeAreas,
          bio: profData.bio
        });

        if (profilePhoto && profilePhoto.uri && !profilePhoto.uri.startsWith('http')) {
          await lawyerApi.uploadDocument(lawyerId, 'PHOTO', profilePhoto);
        }
      } else if (currentStep === 3) {
        if (!barCert && !lawyerId) throw new Error("Bar Council ID is mandatory");
        if (barCert && barCert.uri && !barCert.uri.startsWith('http')) {
          await lawyerApi.uploadDocument(lawyerId, 'BAR_COUNCIL_CERTIFICATE', barCert);
        }
        if (idProof && idProof.uri && !idProof.uri.startsWith('http')) {
          await lawyerApi.uploadDocument(lawyerId, 'ID_PROOF', idProof);
        }
      } else if (currentStep === 4) {
        await lawyerApi.updateStep4(lawyerId, pricing);
      } else if (currentStep === 5) {
        if (!upiId) throw new Error("UPI ID is required");
        await lawyerApi.updateStep5(lawyerId, upiId);
      } else if (currentStep === 6) {
        await lawyerApi.submitApplication(lawyerId);
        if (updateUser) {
          updateUser({ registrationStatus: 'SUBMITTED' });
        }
        Alert.alert(
          "Application Submitted",
          "Your profile is now under review by our team. We will notify you once approved.",
          [{ text: "OK", onPress: () => navigation.replace('LawyerDashboard') }]
        );
        return;
      }
      setCurrentStep(prev => Math.min(prev + 1, 6));
    } catch (e: any) {
      const backendError = e?.response?.data?.message || e?.response?.data || e.message;
      const errorMsg = typeof backendError === 'string' ? backendError : JSON.stringify(backendError);
      Alert.alert("Validation Error", errorMsg || "Something went wrong. Please try again later.");
      console.log('Wizard Error Details:', e?.response?.data || e);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepperContainer}>
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        return (
          <React.Fragment key={step.id}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isCompleted && styles.stepCircleCompleted
              ]}>
                {isActive && (
                  <Text style={styles.stepNumberActive}>
                    {step.num}
                  </Text>
                )}
                {!isActive && !isCompleted && (
                  <Text style={styles.stepNumber}>
                    {step.num}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                isActive && styles.stepLabelActive
              ]} numberOfLines={1}>
                {step.title}
              </Text>
            </View>
            {index < STEPS.length - 1 && (
              <View style={[styles.stepLine, isCompleted && styles.stepLineCompleted]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logoText}>ADVOCATE ONBOARDING PORTAL</Text>
          <Text style={styles.logoSubtext}>Step-by-Step Onboarding Flow</Text>
        </View>
      </View>
      
      <ScrollView style={styles.contentContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        <View style={styles.mainCard}>
          {/* Step Header */}
          <View style={styles.stepHeaderBox}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP {STEPS.find(s => s.id === currentStep)?.num} OF 5</Text>
            </View>
            <Text style={styles.stepMainTitle}>{STEPS.find(s => s.id === currentStep)?.title.toUpperCase()} DETAILS</Text>
            {currentStep === 2 && <Text style={styles.stepSubDesc}>Provide your professional and practice information</Text>}
          </View>

          {renderStepIndicator()}
          
          <View style={styles.divider} />

          {currentStep === 2 && (
            <View style={styles.formSection}>
              
              <Text style={styles.label}>Bar Council Enrollment Number <Text style={styles.asterisk}>*</Text></Text>
              <TextInput 
                style={styles.input} 
                value={profData.barCouncilNumber} 
                onChangeText={t => setProfData({...profData, barCouncilNumber: t})} 
                placeholder="e.g. D/2491/2012" 
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Years of Experience <Text style={styles.asterisk}>*</Text></Text>
              <TextInput 
                style={styles.input} 
                value={profData.experienceYears} 
                onChangeText={t => setProfData({...profData, experienceYears: t})} 
                placeholder="5" 
                keyboardType="numeric" 
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Education / Qualifications <Text style={styles.asterisk}>*</Text></Text>
              <TextInput 
                style={styles.input} 
                value={profData.education} 
                onChangeText={t => setProfData({...profData, education: t})} 
                placeholder="LL.B, Delhi University" 
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Location / Court City <Text style={styles.asterisk}>*</Text></Text>
              <TextInput 
                style={styles.input} 
                value={profData.location} 
                onChangeText={t => setProfData({...profData, location: t})} 
                placeholder="New Delhi" 
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.labelGroup}>Practice Areas <Text style={styles.asterisk}>* (Select at least one)</Text></Text>
              <View style={styles.checkboxGrid}>
                {PRACTICE_AREAS.map(area => {
                  const isSelected = profData.practiceAreas.includes(area);
                  return (
                    <TouchableOpacity 
                      key={area} 
                      style={[styles.checkboxContainer, isSelected && styles.checkboxContainerSelected]}
                      onPress={() => toggleSelection(area, 'practiceAreas')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Check size={12} color="#FFF" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.checkboxText, isSelected && styles.checkboxTextSelected]}>{area}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.labelGroup}>Languages Spoken <Text style={styles.asterisk}>* (Select at least one)</Text></Text>
              <View style={styles.checkboxGrid}>
                {LANGUAGES.map(lang => {
                  const isSelected = profData.languages.includes(lang);
                  return (
                    <TouchableOpacity 
                      key={lang} 
                      style={[styles.checkboxContainer, isSelected && styles.checkboxContainerSelected]}
                      onPress={() => toggleSelection(lang, 'languages')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Check size={12} color="#FFF" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.checkboxText, isSelected && styles.checkboxTextSelected]}>{lang}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.labelGroup}>Advocate Profile Photo <Text style={styles.asterisk}>*</Text></Text>
              
              {profilePhoto ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: profilePhoto.uri }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setProfilePhoto(null)}>
                    <Text style={styles.photoRemoveText}>Remove Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadBox} onPress={handleChoosePhoto}>
                  <View style={styles.uploadIconWrap}>
                    <Upload size={20} color="#4F46E5" />
                  </View>
                  <View>
                    <Text style={styles.uploadBtnText}>Click to Upload Photo</Text>
                    <Text style={styles.uploadSubText}>JPG, PNG, WEBP, GIF</Text>
                  </View>
                </TouchableOpacity>
              )}

              <Text style={styles.labelGroup}>Professional Bio & Practice Summary <Text style={styles.asterisk}>*</Text></Text>
              <TextInput 
                style={styles.textArea} 
                value={profData.bio} 
                onChangeText={t => setProfData({...profData, bio: t})} 
                placeholder="Practicing advocate with extensive courtroom experience." 
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
              />

            </View>
          )}

          {/* Other steps logic */}
          {currentStep === 3 && (
            <View style={styles.formSection}>
              <Text style={styles.subtitle}>Upload your credentials for verification. (Images only)</Text>
              
              <TouchableOpacity style={[styles.uploadBoxSecondary, barCert && { borderColor: '#10B981', backgroundColor: '#F0FDF4' }]} onPress={pickBarCert}>
                {barCert ? <CheckCircle2 size={32} color="#10B981" /> : <Upload size={32} color="#4F46E5" />}
                <Text style={[styles.uploadTextDark, barCert && { color: '#065F46' }]}>
                  {barCert ? 'Bar Council ID Selected' : 'Upload Bar Council ID *'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.uploadBoxSecondary, idProof && { borderColor: '#10B981', backgroundColor: '#F0FDF4' }]} onPress={pickIdProof}>
                {idProof ? <CheckCircle2 size={32} color="#10B981" /> : <Upload size={32} color="#4F46E5" />}
                <Text style={[styles.uploadTextDark, idProof && { color: '#065F46' }]}>
                  {idProof ? 'Aadhaar / PAN Selected' : 'Upload Aadhaar / PAN'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {currentStep === 4 && (
            <View style={styles.formSection}>
              <Text style={styles.subtitle}>Set your consultation fee for a 30-minute session.</Text>
              <Text style={styles.label}>Consultation Fee (₹)</Text>
              <TextInput style={styles.input} value={pricing} onChangeText={setPricing} keyboardType="numeric" placeholder="e.g. 99" />
              <Text style={styles.hint}>Adalat charges a 10% platform fee on this amount.</Text>
            </View>
          )}

          {currentStep === 5 && (
            <View style={styles.formSection}>
              <Text style={styles.subtitle}>Where should we send your earnings?</Text>
              <Text style={styles.label}>UPI ID *</Text>
              <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder="e.g. 9876543210@ybl" autoCapitalize="none" />
              <View style={styles.infoBanner}>
                <CheckCircle2 size={16} color="#10B981" />
                <Text style={styles.infoText}>Earnings are settled instantly to this UPI ID after every successful consultation.</Text>
              </View>
            </View>
          )}

          {currentStep === 6 && (
            <View style={styles.reviewContainer}>
              <CheckCircle2 size={56} color="#10B981" />
              <Text style={styles.reviewTitle}>Ready to Submit</Text>
              <Text style={styles.reviewText}>
                By submitting, you agree to our terms of service. Our team will verify your credentials within 24-48 hours.
              </Text>
            </View>
          )}

        </View>
      </ScrollView>

      <SafeAreaView style={styles.footer} edges={['bottom']}>
        {currentStep > 2 && (
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => setCurrentStep(prev => prev - 1)}
            disabled={loading}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>{currentStep === 6 ? 'Submit Verification' : 'Save & Continue'}</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerTop: { flexDirection: 'column' },
  logoText: { fontSize: 18, fontWeight: '800', color: '#1E1B4B', letterSpacing: 0.5, fontVariant: ['small-caps'] },
  logoSubtext: { fontSize: 12, color: '#3B82F6', fontWeight: '600', marginTop: 2 },
  
  contentContainer: { flex: 1, paddingHorizontal: 16 },
  mainCard: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 24, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  
  stepHeaderBox: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 24 },
  stepBadge: { backgroundColor: '#1E1B4B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 12, marginBottom: 8 },
  stepBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  stepMainTitle: { fontSize: 17, fontWeight: '800', color: '#1E1B4B', letterSpacing: 0.5, marginRight: 12, marginBottom: 8 },
  stepSubDesc: { fontSize: 13, color: '#64748B', width: '100%', marginTop: 2 },

  stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 28 },
  stepItem: { alignItems: 'center', flex: 1, zIndex: 2 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepCircleActive: { backgroundColor: '#1E1B4B', borderColor: '#1E1B4B' },
  stepCircleCompleted: { backgroundColor: '#FFFFFF', borderColor: '#4F46E5' },
  stepNumber: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  stepNumberActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textAlign: 'center', width: '120%' },
  stepLabelActive: { color: '#1E1B4B' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', position: 'relative', top: -12, zIndex: 1, marginHorizontal: -10 },
  stepLineCompleted: { backgroundColor: '#4F46E5' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 24, marginHorizontal: 20 },

  formSection: { paddingHorizontal: 20 },
  
  labelGroup: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12, marginTop: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 8, marginTop: 4 },
  asterisk: { color: '#EF4444', fontWeight: '600' },
  
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, height: 52, paddingHorizontal: 16, fontSize: 15, color: '#0F172A', fontWeight: '500', marginBottom: 20 },
  
  checkboxGrid: { flexDirection: 'column', gap: 10, marginBottom: 24 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#F8FAFC' },
  checkboxContainerSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#CBD5E1', marginRight: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  checkboxSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkboxText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  checkboxTextSelected: { color: '#1E1B4B' },

  uploadBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, backgroundColor: '#F8FAFC', marginBottom: 24 },
  uploadIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  uploadBtnText: { fontSize: 15, fontWeight: '600', color: '#1E1B4B', marginBottom: 2 },
  uploadSubText: { fontSize: 12, color: '#64748B' },

  textArea: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, height: 120, paddingHorizontal: 16, paddingTop: 16, fontSize: 15, color: '#0F172A', fontWeight: '500', marginBottom: 20 },

  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 22 },
  hint: { fontSize: 13, color: '#64748B', marginTop: 8 },
  uploadBoxSecondary: { borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, backgroundColor: '#F8FAFC' },
  uploadTextDark: { fontSize: 16, fontWeight: '600', color: '#1E1B4B', marginTop: 12 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 12, marginTop: 16, gap: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  infoText: { color: '#065F46', fontSize: 14, flex: 1, lineHeight: 20, fontWeight: '500' },
  reviewContainer: { alignItems: 'center', paddingVertical: 32 },
  reviewTitle: { fontSize: 26, fontWeight: '800', color: '#1E1B4B', marginTop: 20, marginBottom: 12 },
  reviewText: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },

  footer: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  backBtn: { backgroundColor: '#FFFFFF', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 24 },
  backBtnText: { color: '#475569', fontSize: 15, fontWeight: '700' },
  saveBtn: { flex: 1, backgroundColor: '#4F46E5', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  modalCloseBtn: { padding: 4 },
  
  photoPreviewContainer: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, backgroundColor: '#F8FAFC', marginBottom: 24, alignItems: 'center' },
  photoPreview: { width: 120, height: 120, borderRadius: 60, marginBottom: 16, backgroundColor: '#E2E8F0' },
  photoRemoveBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  photoRemoveText: { color: '#475569', fontSize: 13, fontWeight: '600' },
});

export default LawyerRegisterWizardScreen;
