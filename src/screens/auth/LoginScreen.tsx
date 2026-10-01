import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';

const LoginScreen = ({ navigation }: any) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const { loginCustomer, loginLawyer, loginAdmin } = useAuth();

  const handleSubmit = async () => {
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    const trimmedIdentifier = identifier.trim();

    try {
      const customerData = await loginCustomer(trimmedIdentifier, password);
      if (customerData) return; // navigation is handled by AuthNavigator role change
    } catch (err: any) {
      if (err.status !== 401 && err.status !== 404) {
        setError(err.message || 'Customer login failed.');
        setLoading(false);
        return;
      }
    }

    try {
      const lawyerData = await loginLawyer(trimmedIdentifier, password);
      if (lawyerData) {
        return;
      }
    } catch (err: any) {
      if (err.status !== 401 && err.status !== 404) {
        setError(err.message || 'Lawyer login failed.');
        setLoading(false);
        return;
      }
    }

    try {
      const adminData = await loginAdmin(trimmedIdentifier, password);
      if (adminData) return; 
    } catch (err: any) {
      if (err.message && err.message !== 'Invalid Admin credentials.' && err.message !== 'User does not have admin privileges.') {
        setError(err.message);
        setLoading(false);
        return;
      }
    }

    setError('Invalid credentials. Please verify your details.');
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brandTitle}>ADALAT</Text>
            <Text style={styles.brandTagline}>Justice. Guidance. Connection.</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Enter your registered Email or Mobile Number and Password</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address or Mobile Number <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#5C5C99" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. user@gmail.com or 9876543210"
                  placeholderTextColor="#A3A3CC"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelContainer}>
                <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity onPress={() => setIsForgotModalOpen(true)}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#5C5C99" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#A3A3CC"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={18} color="#7A7AAB" /> : <Eye size={18} color="#7A7AAB" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Sign In</Text>
                  <ArrowRight size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <Text style={styles.footerText}>
                New Customer?{' '}
                <Text style={styles.linkText} onPress={() => navigation.navigate('CustomerRegister', { type: 'customer' })}>
                  Register Account (₹99)
                </Text>
              </Text>
              <Text style={styles.footerText}>
                Practicing Advocate?{' '}
                <Text style={styles.linkText} onPress={() => navigation.navigate('CustomerRegister', { type: 'lawyer' })}>
                  Free Lawyer Signup
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <ForgotPasswordModal
        visible={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={identifier.includes('@') ? identifier.trim() : ''}
        onPasswordResetSuccess={(resetEmail: string) => {
          setIdentifier(resetEmail);
          setPassword('');
          setError('');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DDE2FA',
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
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C4A',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 12,
    color: '#292966',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C4A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#5C5C99',
    marginBottom: 20,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C4A',
    marginBottom: 6,
  },
  passwordLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotPasswordText: {
    color: '#1C1C4A',
    fontSize: 12,
    fontWeight: '700',
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(92,92,153,0.25)',
    borderRadius: 10,
    height: 50,
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
  submitBtn: {
    backgroundColor: '#1C1C4A',
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerLinks: {
    marginTop: 24,
    gap: 12,
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

export default LoginScreen;
