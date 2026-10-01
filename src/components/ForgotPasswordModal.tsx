import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { X, Mail, Lock, KeyRound, ShieldCheck, ArrowRight, RefreshCw, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react-native';
import apiClient from '../api/apiClient';

const ForgotPasswordModal = ({ visible, onClose, initialEmail = '', onPasswordResetSuccess }: any) => {
  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS'
  const [email, setEmail] = useState(initialEmail);
  const [detectedRole, setDetectedRole] = useState('LAWYER');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(120);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

  useEffect(() => {
    if (visible) {
      setStep('EMAIL');
      setEmail(initialEmail || '');
      setDetectedRole('LAWYER');
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setTimeLeft(300);
      setResendCooldown(120);
    }
  }, [visible, initialEmail]);

  useEffect(() => {
    if (step !== 'OTP' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    if (step !== 'OTP' || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      let activeRole = 'LAWYER';
      let res;
      try {
        res = await apiClient.post('/api/auth/email/resend-otp', {
          email: cleanEmail,
          role: 'LAWYER',
        });
      } catch (lawyerErr) {
        activeRole = 'CUSTOMER';
        res = await apiClient.post('/api/auth/email/resend-otp', {
          email: cleanEmail,
          role: 'CUSTOMER',
        });
      }

      if (res.status === 'SUCCESS' || res.success || res.data) {
        setDetectedRole(activeRole);
        setStep('OTP');
        setTimeLeft(res.data?.otpExpiresAfterSeconds || 300);
        setResendCooldown(res.data?.resendAvailableAfterSeconds || 120);
      } else {
        setErrorMsg(res.message || 'Failed to dispatch verification email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to send OTP. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/api/auth/email/resend-otp', {
        email: email.trim().toLowerCase(),
        role: detectedRole,
      });

      if (res.status === 'SUCCESS' || res.success || res.data) {
        setOtp(['', '', '', '', '', '']);
        setTimeLeft(res.data?.otpExpiresAfterSeconds || 300);
        setResendCooldown(res.data?.resendAvailableAfterSeconds || 120);
      } else {
        setErrorMsg(res.message || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    if (/^[0-9]$/.test(val) || val === '') {
      const nextOtp = [...otp];
      nextOtp[index] = val;
      setOtp(nextOtp);

      if (val !== '' && index < 5) {
        inputRefs[index + 1].current?.focus();
      }
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      let res;
      try {
        res = await apiClient.post('/api/auth/email/verify-otp', {
          email: email.trim().toLowerCase(),
          role: detectedRole,
          otp: enteredOtp,
        });
      } catch (err) {
        const altRole = detectedRole === 'LAWYER' ? 'CUSTOMER' : 'LAWYER';
        res = await apiClient.post('/api/auth/email/verify-otp', {
          email: email.trim().toLowerCase(),
          role: altRole,
          otp: enteredOtp,
        });
        setDetectedRole(altRole);
      }

      if (res.status === 'SUCCESS' || res.success || res.data?.emailVerified) {
        setStep('NEW_PASSWORD');
      } else {
        setErrorMsg(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await apiClient.post('/api/auth/forgot-password/reset', {
        email: cleanEmail,
        newPassword,
        confirmPassword,
      });

      if (res?.status === 'SUCCESS' || res?.success || res?.message) {
        setStep('SUCCESS');
      } else {
        setErrorMsg(res?.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onPasswordResetSuccess) {
      onPasswordResetSuccess(email.trim().toLowerCase());
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.card}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <X size={20} color="#5C5C99" />
                </TouchableOpacity>

                <View style={styles.iconBadge}>
                  {step === 'EMAIL' && <KeyRound size={24} color="#1C1C4A" />}
                  {step === 'OTP' && <ShieldCheck size={24} color="#1C1C4A" />}
                  {step === 'NEW_PASSWORD' && <Lock size={24} color="#1C1C4A" />}
                  {step === 'SUCCESS' && <CheckCircle2 size={24} color="#1C1C4A" />}
                </View>

                <Text style={styles.title}>
                  {step === 'EMAIL' && 'Reset Password'}
                  {step === 'OTP' && 'Verify Email OTP'}
                  {step === 'NEW_PASSWORD' && 'Create New Password'}
                  {step === 'SUCCESS' && 'Password Changed!'}
                </Text>

                <Text style={styles.subtitle}>
                  {step === 'EMAIL' && 'Enter your registered email address to receive a secure 6-digit verification code.'}
                  {step === 'OTP' && `We've sent a 6-digit verification code to ${email}`}
                  {step === 'NEW_PASSWORD' && 'Set a strong new password for your Adalat account.'}
                  {step === 'SUCCESS' && 'Your password has been successfully updated.'}
                </Text>
              </View>

              {step !== 'SUCCESS' && (
                <View style={styles.stepper}>
                  <View style={[styles.stepItem, step === 'EMAIL' ? styles.stepActive : styles.stepCompleted]}>
                    <Text style={[styles.stepNum, step === 'EMAIL' || step === 'OTP' || step === 'NEW_PASSWORD' ? styles.stepNumActive : {}]}>1</Text>
                  </View>
                  <View style={[styles.stepLine, step !== 'EMAIL' ? styles.stepLineCompleted : {}]} />
                  <View style={[styles.stepItem, step === 'OTP' ? styles.stepActive : step === 'NEW_PASSWORD' ? styles.stepCompleted : {}]}>
                    <Text style={[styles.stepNum, step === 'OTP' || step === 'NEW_PASSWORD' ? styles.stepNumActive : {}]}>2</Text>
                  </View>
                  <View style={[styles.stepLine, step === 'NEW_PASSWORD' ? styles.stepLineCompleted : {}]} />
                  <View style={[styles.stepItem, step === 'NEW_PASSWORD' ? styles.stepActive : {}]}>
                    <Text style={[styles.stepNum, step === 'NEW_PASSWORD' ? styles.stepNumActive : {}]}>3</Text>
                  </View>
                </View>
              )}

              <View style={styles.body}>
                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                {step === 'EMAIL' && (
                  <View>
                    <Text style={styles.label}>Registered Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Mail size={18} color="#5C5C99" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. user@example.com"
                        placeholderTextColor="#A3A3CC"
                        value={email}
                        onChangeText={(val) => { setEmail(val); setErrorMsg(''); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    <TouchableOpacity style={[styles.submitBtn, loading && styles.disabledBtn]} onPress={handleSendOtp} disabled={loading || !email.trim()}>
                      {loading ? (
                        <>
                          <ActivityIndicator color="#FFF" size="small" />
                          <Text style={styles.submitBtnText}>Sending Code...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.submitBtnText}>Send Verification Code</Text>
                          <ArrowRight size={18} color="#FFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {step === 'OTP' && (
                  <View>
                    <View style={styles.otpBoxes}>
                      {otp.map((digit, idx) => (
                        <TextInput
                          key={idx}
                          ref={inputRefs[idx]}
                          style={styles.otpDigit}
                          keyboardType="numeric"
                          maxLength={1}
                          value={digit}
                          onChangeText={(val) => handleOtpChange(val, idx)}
                          onKeyPress={({ nativeEvent }) => {
                            if (nativeEvent.key === 'Backspace' && otp[idx] === '' && idx > 0) {
                              inputRefs[idx - 1].current?.focus();
                            }
                          }}
                        />
                      ))}
                    </View>

                    <View style={styles.timerRow}>
                      <Text style={styles.timerText}>
                        {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'OTP Expired'}
                      </Text>
                      {resendCooldown > 0 ? (
                        <Text style={styles.timerText}>Resend in {formatTime(resendCooldown)}</Text>
                      ) : (
                        <TouchableOpacity onPress={handleResendOtp} disabled={resendLoading} style={styles.resendBtn}>
                          {resendLoading && <ActivityIndicator color="#1C1C4A" size="small" />}
                          <Text style={styles.resendBtnText}>{resendLoading ? 'Sending...' : 'Resend Code'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity style={[styles.submitBtn, (loading || otp.join('').length !== 6 || timeLeft <= 0) && styles.disabledBtn]} onPress={handleVerifyOtp} disabled={loading || otp.join('').length !== 6 || timeLeft <= 0}>
                      {loading ? (
                        <>
                          <ActivityIndicator color="#FFF" size="small" />
                          <Text style={styles.submitBtnText}>Verifying Code...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.submitBtnText}>Verify Code & Continue</Text>
                          <ArrowRight size={18} color="#FFF" />
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('EMAIL')}>
                      <ArrowLeft size={16} color="#5C5C99" />
                      <Text style={styles.secondaryBtnText}>Change Email Address</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {step === 'NEW_PASSWORD' && (
                  <View>
                    <Text style={styles.label}>New Password (min. 6 characters)</Text>
                    <View style={styles.inputWrapper}>
                      <Lock size={18} color="#5C5C99" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter new password"
                        placeholderTextColor="#A3A3CC"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                      />
                      <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                        {showNewPassword ? <EyeOff size={18} color="#7A7AAB" /> : <Eye size={18} color="#7A7AAB" />}
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.inputWrapper}>
                      <Lock size={18} color="#5C5C99" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm new password"
                        placeholderTextColor="#A3A3CC"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                        {showConfirmPassword ? <EyeOff size={18} color="#7A7AAB" /> : <Eye size={18} color="#7A7AAB" />}
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.submitBtn, (loading || !newPassword || !confirmPassword || newPassword.length < 6) && styles.disabledBtn]} onPress={handleResetPassword} disabled={loading || !newPassword || !confirmPassword || newPassword.length < 6}>
                      {loading ? (
                        <>
                          <ActivityIndicator color="#FFF" size="small" />
                          <Text style={styles.submitBtnText}>Updating Password...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.submitBtnText}>Reset Password</Text>
                          <ArrowRight size={18} color="#FFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {step === 'SUCCESS' && (
                  <View style={styles.successContainer}>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleFinish}>
                      <Text style={styles.submitBtnText}>Back to Sign In</Text>
                      <ArrowRight size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C4A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#5C5C99',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepItem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8EAF6',
    backgroundColor: '#FFF',
  },
  stepActive: {
    borderColor: '#1C1C4A',
    backgroundColor: '#FFF',
  },
  stepCompleted: {
    borderColor: '#1C1C4A',
    backgroundColor: '#1C1C4A',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A3A3CC',
  },
  stepNumActive: {
    color: '#1C1C4A',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E8EAF6',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#1C1C4A',
  },
  body: {},
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C4A',
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: 'rgba(92,92,153,0.25)',
    borderRadius: 10,
    height: 50,
    marginBottom: 16,
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
  eyeBtn: {
    padding: 12,
  },
  submitBtn: {
    backgroundColor: '#1C1C4A',
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  otpBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpDigit: {
    width: 45,
    height: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(92,92,153,0.25)',
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C4A',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 13,
    color: '#5C5C99',
    fontWeight: '600',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resendBtnText: {
    fontSize: 13,
    color: '#1C1C4A',
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    color: '#5C5C99',
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});

export default ForgotPasswordModal;
