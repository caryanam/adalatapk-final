import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { User, Mail, Phone, Lock, ArrowRight, Building2, UserCircle2, CheckCircle2, Eye, EyeOff } from 'lucide-react-native';
import { customerApi } from '../../api/customerApi';
import { lawyerApi } from '../../api/lawyerApi';
import apiClient from '../../api/apiClient';
import OtpModal from '../../components/OtpModal';
import PaymentModal from '../../components/PaymentModal';

const CustomerRegisterScreen = ({ navigation, route }: any) => {
  const defaultType = route.params?.type === 'lawyer' ? 'lawyer' : 'customer';
  const [userType, setUserType] = useState(defaultType);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email Verification
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  
  // Modals
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'email') {
      setIsEmailVerified(false);
    }
  };

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '#CBD5E1' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: '#F59E0B' };
    return { score: 4, label: 'Strong', color: '#10B981' };
  };

  const pwdStrength = calculatePasswordStrength(formData.password);

  const handleSendOtpInline = async () => {
    if (!formData.email) {
      setError("Please enter an email address first.");
      return;
    }
    setError('');
    setOtpSending(true);
    try {
      const res = await apiClient.post('/api/auth/email/resend-otp', {
        email: formData.email,
        role: userType === 'lawyer' ? 'LAWYER' : 'CUSTOMER'
      });
      if (res.success || res.status === 'SUCCESS') {
        setShowOtpModal(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpSuccess = () => {
    setShowOtpModal(false);
    setIsEmailVerified(true);
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.fullName || !formData.email || !formData.mobile || !formData.password) {
      setError("Please fill all the fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    if (!/[0-9]/.test(formData.password) || !/[a-zA-Z]/.test(formData.password)) {
      setError("Password must contain both letters and numbers.");
      return;
    }

    if (!isEmailVerified) {
      setError("Please verify your email address before proceeding.");
      return;
    }

    setLoading(true);

    try {
      if (userType === 'customer') {
        const res = await customerApi.register({
          fullName: formData.fullName,
          email: formData.email,
          mobileNumber: formData.mobile, // backend might expect mobileNumber
          password: formData.password,
          confirmPassword: formData.password,
          termsAccepted: true,
          privacyPolicyAccepted: true
        });
        
        if (res.status === 'SUCCESS' || (res.data && res.data.success)) {
          setShowPaymentModal(true);
        } else {
          setError(res.message || "Registration failed.");
        }
      } else {
        const res = await lawyerApi.registerStep1({
          fullName: formData.fullName,
          email: formData.email,
          mobileNumber: formData.mobile, // map for backend
          password: formData.password,
          confirmPassword: formData.password,
          termsAccepted: true,
          privacyPolicyAccepted: true
        });

        if (res.status === 'SUCCESS' || (res.data && res.data.success)) {
          Alert.alert(
            "Account Created",
            "Your advocate account has been created. Please sign in to continue onboarding.",
            [{ text: "Sign In", onPress: () => navigation.replace('Login') }]
          );
        } else {
          setError(res.message || "Advocate registration failed.");
        }
      }
    } catch (err: any) {
      setError(err.message || 'Server request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentRef: any) => {
    try {
      const verifyRes = await customerApi.verifyPayment({
        email: formData.email,
        paymentRefId: paymentRef.gatewayPaymentId,
        amount: paymentRef.amount
      });
      
      if (verifyRes.status === 'SUCCESS' || verifyRes.success) {
        setShowPaymentModal(false);
        Alert.alert(
          "Activation Successful",
          "Your account is now active. Please sign in.",
          [{ text: "Sign In", onPress: () => navigation.replace('Login') }]
        );
      }
    } catch (err) {
      console.error('Failed to verify payment', err);
      setShowPaymentModal(false);
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Text style={styles.brandTitle}>ADALAT</Text>
            <Text style={styles.title}>{userType === 'customer' ? 'Customer Account Registration' : 'Lawyer / Advocate Registration'}</Text>
            <Text style={styles.subtitle}>
              {userType === 'customer' ? 'One-Time ₹99 Platform Account Activation Fee Required' : 'Join India\'s Premier Legal Consultation Platform'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, userType === 'customer' && styles.toggleBtnActive]}
                onPress={() => setUserType('customer')}
              >
                <UserCircle2 size={16} color={userType === 'customer' ? '#FFF' : '#5C5C99'} />
                <Text style={[styles.toggleText, userType === 'customer' && styles.toggleTextActive]}>
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, userType === 'lawyer' && styles.toggleBtnActive]}
                onPress={() => setUserType('lawyer')}
              >
                <Building2 size={16} color={userType === 'lawyer' ? '#FFF' : '#5C5C99'} />
                <Text style={[styles.toggleText, userType === 'lawyer' && styles.toggleTextActive]}>
                  Lawyer
                </Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <User size={18} color="#5C5C99" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={userType === 'lawyer' ? "e.g. Adv. Rajesh Verma" : "e.g. Ramesh Kumar"}
                  placeholderTextColor="#A3A3CC"
                  value={formData.fullName}
                  onChangeText={(val) => handleInputChange('fullName', val)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
              <View style={styles.emailRow}>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Mail size={18} color="#5C5C99" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. name@example.com"
                    placeholderTextColor="#A3A3CC"
                    value={formData.email}
                    onChangeText={(val) => handleInputChange('email', val)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isEmailVerified}
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.verifyBtn, (isEmailVerified || otpSending || !formData.email) && styles.verifyBtnDisabled, isEmailVerified && styles.verifyBtnSuccess]}
                  onPress={handleSendOtpInline}
                  disabled={isEmailVerified || otpSending || !formData.email}
                >
                  <Text style={styles.verifyBtnText}>
                    {otpSending ? 'Sending' : isEmailVerified ? 'Verified' : 'Verify'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color="#5C5C99" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#A3A3CC"
                  value={formData.mobile}
                  onChangeText={(val) => handleInputChange('mobile', val)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#5C5C99" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min 6 chars with letters & numbers"
                  placeholderTextColor="#A3A3CC"
                  value={formData.password}
                  onChangeText={(val) => handleInputChange('password', val)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={18} color="#7A7AAB" /> : <Eye size={18} color="#7A7AAB" />}
                </TouchableOpacity>
              </View>
              {formData.password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View style={[styles.passwordStrengthFill, { width: `${(pwdStrength.score / 4) * 100}%`, backgroundColor: pwdStrength.color }]} />
                  </View>
                  <Text style={[styles.passwordStrengthText, { color: pwdStrength.color }]}>{pwdStrength.label}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, (loading || !isEmailVerified) && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={loading || !isEmailVerified}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {userType === 'customer' ? 'Proceed to ₹99 Account Activation' : 'Proceed to Advocate Onboarding'}
                  </Text>
                  <ArrowRight size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.linkText} onPress={() => navigation.navigate('Login')}>
                  Sign In Here
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OtpModal 
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={formData.email}
        role={userType.toUpperCase()}
        onSuccess={handleOtpSuccess}
      />

      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F2FB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C4A',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C4A',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#5C5C99',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F2FB',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#1C1C4A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C5C99',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C4A',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 48,
  },
  emailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  verifyBtn: {
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    height: 48,
  },
  verifyBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  verifyBtnSuccess: {
    backgroundColor: '#10B981',
  },
  verifyBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#1C1C4A',
    fontSize: 14,
  },
  eyeIcon: {
    padding: 12,
  },
  passwordStrengthContainer: {
    marginTop: 6,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
  },
  passwordStrengthText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footerLinks: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#5C5C99',
  },
  linkText: {
    color: '#1C1C4A',
    fontWeight: '700',
  },
});

export default CustomerRegisterScreen;
