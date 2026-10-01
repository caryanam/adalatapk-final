import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { X, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react-native';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  amount?: string;
  lawyerName?: string;
  lawyerUpiId?: string;
  onPaymentSuccess?: (paymentRef: any) => void;
}

const PaymentModal = ({
  isOpen,
  onClose,
  title = "Adalat Customer Activation Fee",
  amount = "99.00",
  lawyerName = "Adalat Platform Activation",
  lawyerUpiId = "adalat@upi",
  onPaymentSuccess
}: PaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'QR' | 'SUCCESS'>('QR');

  const baseNum = parseFloat(amount) || 99.00;
  const gstNum = Math.round((baseNum * 0.18) * 100) / 100;
  const totalNum = Math.round((baseNum + gstNum) * 100) / 100;

  useEffect(() => {
    if (isOpen) {
      setStep('QR');
      setLoading(false);
    }
  }, [isOpen, lawyerUpiId, amount]);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    setLoading(true);
    const paymentRef = {
      gatewayPaymentId: 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      amount: totalNum.toFixed(2),
      baseAmount: baseNum.toFixed(2),
      gstAmount: gstNum.toFixed(2),
      lawyerName: lawyerName
    };

    if (onPaymentSuccess) {
      try {
        await onPaymentSuccess(paymentRef);
      } catch (e) {
        console.error('Payment confirmation error:', e);
      }
    }

    setLoading(false);
    setStep('SUCCESS');
  };

  const handleFinishSuccess = () => {
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>

          {step === 'QR' ? (
            <View style={styles.contentContainer}>
              <View style={styles.header}>
                <Text style={styles.brandTitle}>ADALAT</Text>
              </View>

              <Text style={styles.title}>{title}</Text>

              <View style={styles.amountCard}>
                <View style={styles.row}>
                  <Text style={styles.amountLabel}>Base Fee:</Text>
                  <Text style={styles.amountValue}>₹{baseNum.toFixed(2)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.amountLabel}>18% GST:</Text>
                  <Text style={[styles.amountValue, { color: '#D97706' }]}>+ ₹{gstNum.toFixed(2)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalValue}>₹{totalNum.toFixed(2)}</Text>
                </View>
                <Text style={styles.payoutText}>
                  Direct settlement to:{'\n'}
                  <Text style={{ fontWeight: 'bold' }}>{lawyerName}</Text>{'\n'}
                  <Text style={styles.upiHandle}>(UPI: {lawyerUpiId})</Text>
                </Text>
              </View>

              <View style={styles.qrPlaceholder}>
                <Text style={{ color: '#5C5C99', textAlign: 'center' }}>[ QR Code Placeholder for App ]</Text>
                <Text style={{ color: '#5C5C99', textAlign: 'center', fontSize: 12, marginTop: 4 }}>Scan via Google Pay, PhonePe, Paytm</Text>
              </View>

              <TouchableOpacity
                onPress={handleSimulatePayment}
                style={[styles.payButton, loading && styles.disabledButton]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.payButtonText}>I Have Paid — Continue</Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.secureTextContainer}>
                <ShieldCheck size={14} color="#64748B" />
                <Text style={styles.secureText}> 256-Bit SSL Secured Direct UPI Settlement</Text>
              </View>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <CheckCircle2 size={68} color="#10B981" />
              <Text style={styles.successTitle}>Payment Confirmed!</Text>
              <Text style={styles.successSub}>Your consultation with</Text>
              <Text style={styles.successTarget}>{lawyerName}</Text>
              <Text style={styles.successSub}>has been successfully unlocked.</Text>

              <TouchableOpacity onPress={handleFinishSuccess} style={styles.dashboardButton}>
                <Text style={styles.dashboardButtonText}>Continue</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
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
    maxWidth: 400,
    overflow: 'hidden',
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
  contentContainer: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C4A',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C4A',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C4A',
  },
  divider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C4A',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  payoutText: {
    marginTop: 12,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  upiHandle: {
    color: '#5C5C99',
  },
  qrPlaceholder: {
    backgroundColor: '#EEF2FF',
    height: 150,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#CCCCFF',
    borderStyle: 'dashed',
  },
  payButton: {
    backgroundColor: '#1C1C4A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secureTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secureText: {
    fontSize: 12,
    color: '#64748B',
  },
  successContainer: {
    padding: 32,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C4A',
    marginTop: 16,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  successTarget: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C4A',
    marginBottom: 4,
  },
  dashboardButton: {
    backgroundColor: '#1C1C4A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  dashboardButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default PaymentModal;
