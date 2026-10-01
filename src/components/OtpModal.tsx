import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { X, ArrowRight, RefreshCw } from 'lucide-react-native';
import apiClient from '../api/apiClient';

interface OtpModalProps {
  isOpen: boolean;
  onClose?: () => void;
  email: string;
  role: string;
  onSuccess: () => void;
}

const OtpModal = ({ isOpen, onClose, email, role, onSuccess }: OtpModalProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(120);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (isOpen && email) {
      setOtp(['', '', '', '', '', '']);
      fetchOtpStatus();
    }
  }, [isOpen, email]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const fetchOtpStatus = async () => {
    try {
      const res = await apiClient.get(`/api/auth/email/otp-status?email=${encodeURIComponent(email)}&role=${role}`);
      if (res.success) {
        setTimeLeft(res.data.otpExpiresAfterSeconds);
        setResendCooldown(res.data.resendAvailableAfterSeconds);
      } else {
        setTimeLeft(300);
        setResendCooldown(120);
      }
    } catch (err) {
      setTimeLeft(300);
      setResendCooldown(120);
    }
  };

  const handleChange = (text: string, index: number) => {
    if (/^[0-9]$/.test(text) || text === '') {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text !== '' && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/email/verify-otp', {
        email,
        role,
        otp: enteredOtp
      });

      if (res.status === 'SUCCESS' || (res.data && res.data.success)) {
        onSuccess();
      } else {
        if (res.message?.includes('Maximum OTP attempts') || res.message?.includes('expired')) {
          setOtp(['', '', '', '', '', '']);
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Maximum OTP attempts') || err.message?.includes('expired')) {
        setOtp(['', '', '', '', '', '']);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    try {
      const res = await apiClient.post('/api/auth/email/resend-otp', {
        email,
        role
      });

      if (res.status === 'SUCCESS' || (res.data && res.data.success)) {
        setOtp(['', '', '', '', '', '']);
        if (res.data) {
          setTimeLeft(res.data.otpExpiresAfterSeconds || 300);
          setResendCooldown(res.data.resendAvailableAfterSeconds || 120);
        }
      } else {
        if (res.data?.retryAfterSeconds) {
          setResendCooldown(res.data.retryAfterSeconds);
        }
      }
    } catch (err: any) {
      if (err.data?.retryAfterSeconds) {
        setResendCooldown(err.data.retryAfterSeconds);
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          )}

          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{'\n'}
            <Text style={{ color: '#1E3A8A', fontWeight: 'bold' }}>{email}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                style={[
                  styles.otpInput,
                  digit !== '' && { borderColor: '#3B82F6' }
                ]}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
              />
            ))}
          </View>

          <View style={styles.timerContainer}>
            {timeLeft > 0 ? (
              <Text style={styles.timerText}>
                OTP expires in <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>{formatTime(timeLeft)}</Text>
              </Text>
            ) : (
              <Text style={[styles.timerText, { color: '#EF4444', fontWeight: 'bold' }]}>OTP has expired.</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading || otp.join('').length !== 6 || timeLeft <= 0}
            style={[
              styles.verifyButton,
              (loading || otp.join('').length !== 6 || timeLeft <= 0) && styles.disabledButton
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.verifyButtonText}>Verify Email</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {resendCooldown > 0 ? (
              <Text style={styles.resendText}>
                Resend OTP in <Text style={{ fontWeight: 'bold' }}>{formatTime(resendCooldown)}</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resendLoading} style={styles.resendButton}>
                <RefreshCw size={14} color="#3B82F6" />
                <Text style={styles.resendButtonText}>{resendLoading ? 'Sending...' : 'Resend OTP'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 19, 31, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#102A43',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    width: 44,
    height: 52,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    fontSize: 22,
    textAlign: 'center',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  timerContainer: {
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    color: '#64748B',
  },
  verifyButton: {
    backgroundColor: '#1E3A8A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#64748B',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default OtpModal;
