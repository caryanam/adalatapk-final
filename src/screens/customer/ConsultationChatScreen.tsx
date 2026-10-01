import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getChatMessages, sendChatMessage, resetConsultationTimer } from '../../utils/chatStore';
import ConsultationTimer from '../../components/ConsultationTimer';
import { consultationApi } from '../../api/consultationApi';
import { saveLawyerRating } from '../../utils/ratingUtils';
import { Send, ArrowLeft, Paperclip, CheckCircle2, ShieldCheck, Star, FileText, XCircle, Clock, Calendar, Lock, Sparkles, ArrowRight, CheckSquare, X, Download, AlertCircle, Check } from 'lucide-react-native';

const ConsultationChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { requestId, lawyerId, consultation: initialConsultation } = route.params || {};

  const [consultation, setConsultation] = useState<any>(initialConsultation || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');

  const [timeUp, setTimeUp] = useState(false);
  const [isPaidActive, setIsPaidActive] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [showFactsModal, setShowFactsModal] = useState(false);

  // File Attachment State (Mock for now, but UI matches)
  const [attachedFile, setAttachedFile] = useState<any>(null);
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);

  const fetchDetails = async () => {
    try {
      const res = await consultationApi.getConsultationDetail(requestId);
      if (res.data) setConsultation(res.data);
    } catch (e) {
      console.error('Failed to fetch details', e);
    }
  };

  useEffect(() => {
    fetchDetails();
    const loadMessages = async () => {
      const msgs = await getChatMessages(requestId);
      setMessages(msgs);
    };
    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
      fetchDetails();
    }, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

  const isChatLocked = () => {
    if (!consultation) return true;
    const status = (consultation.status || '').toUpperCase();
    if (status === 'REQUESTED' || status === 'PENDING' || status === 'REJECTED' || status === 'COMPLETED' || status === 'CANCELLED') {
      return true;
    }
    if (status === 'ACCEPTED' || status === 'ACTIVE' || status === 'SCHEDULED' || status === 'PAYMENT_COMPLETED' || status === 'PAID') {
      if (consultation.assignedDate && consultation.assignedTime) {
        try {
          const [hour, minute] = consultation.assignedTime.split(':').map(Number);
          const [year, month, day] = consultation.assignedDate.split('-').map(Number);
          const scheduledDateTime = new Date(year, month - 1, day, hour, minute, 0);
          if (new Date() < scheduledDateTime) return true;
        } catch (e) { }
      }
    }
    return false;
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !attachedFile) || isChatLocked()) return;
    if (timeUp && !isPaidActive) {
      setShowPaymentModal(true);
      return;
    }

    const text = inputValue.trim();
    const file = attachedFile;
    setInputValue('');
    setAttachedFile(null);

    // Mock local representation for attachment
    let attachmentObj = null;
    if (file) {
      attachmentObj = {
        url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
        name: file.name || 'document.pdf',
        isImage: !!file.isImage,
        isPdf: !file.isImage,
        size: '1.2 MB'
      };
    }

    const newMsg = {
      id: Date.now(),
      sender: 'CUSTOMER',
      text: text,
      status: 'SENT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...attachmentObj
    };
    setMessages(prev => [...prev, newMsg]);

    const updated = await sendChatMessage(requestId, 'CUSTOMER', text, file);
    setMessages(updated);
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    if (!isPaidActive) setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      await consultationApi.unlockPaidConsultation(requestId, 'mock_payment_id', '299');
      setIsPaidActive(true);
      setTimeUp(false);
      setShowPaymentModal(false);
      resetConsultationTimer(requestId); // Reset or give infinite time
      Alert.alert('Success', 'Payment verified. Chat unlocked!');
    } catch (e) {
      // Assume success anyway for UX mock
      setIsPaidActive(true);
      setTimeUp(false);
      setShowPaymentModal(false);
      Alert.alert('Success', 'Chat unlocked!');
    }
  };

  const handleEndConsultation = () => {
    Alert.alert('End Consultation', 'Are you sure you want to conclude this consultation? It will move to your Appointments history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive', onPress: async () => {
          try {
            await consultationApi.completeConsultationCustomer(requestId);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Failed to end consultation.');
          }
        }
      }
    ]);
  };

  const handleSubmitRating = async () => {
    try {
      await saveLawyerRating(lawyerId, userRating, ratingComment, 'Customer', requestId);
      setShowRatingModal(false);
      setConsultation({ ...consultation, rating: userRating });
    } catch (e) {
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const handleAttachReal = () => {
    if (isChatLocked()) return;
    if (timeUp && !isPaidActive) {
      setShowPaymentModal(true);
      return;
    }
    Alert.alert('Attach File', 'Select file type:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Image', onPress: pickImage },
      { text: 'Document/PDF', onPress: pickDocument }
    ]);
  };

  const pickImage = async () => {
    try {
      const { launchImageLibrary } = await import('react-native-image-picker');
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (result.didCancel || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      setAttachedFile({
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        type: asset.type || 'image/jpeg',
        size: asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size',
        isImage: true,
        isPdf: false
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const pickDocument = async () => {
    try {
      const DocumentPicker = (await import('react-native-document-picker')).default;
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.doc, DocumentPicker.types.docx],
      });
      setAttachedFile({
        uri: result.uri,
        name: result.name || 'document.pdf',
        type: result.type || 'application/pdf',
        size: result.size ? `${(result.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size',
        isImage: false,
        isPdf: (result.type === 'application/pdf' || result.name?.endsWith('.pdf')),
      });
    } catch (err: any) {
      const DocumentPicker = (await import('react-native-document-picker')).default;
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        Alert.alert('Error', 'Failed to pick document.');
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const parts = name.replace(/adv\.|advocate/i, '').trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'A';
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

  const renderMessage = ({ item }: { item: any }) => {
    const isCustomer = item.sender === 'CUSTOMER';
    const attachment = item.url ? { url: item.url, name: item.name, isImage: item.isImage, isPdf: item.isPdf, size: item.size } : null;

    return (
      <View style={[styles.messageRow, isCustomer ? styles.messageRowRight : styles.messageRowLeft]}>
        {!isCustomer && (
          <View style={styles.lawyerAvatarMini}>
            <Text style={styles.lawyerAvatarMiniText}>{getInitials(consultation?.lawyerName)}</Text>
          </View>
        )}
        <View style={[styles.bubble, isCustomer ? styles.bubbleCustomer : styles.bubbleLawyer]}>
          <Text style={[styles.senderName, isCustomer ? styles.senderNameCustomer : styles.senderNameLawyer]}>
            {isCustomer ? 'YOU' : consultation?.lawyerName?.toUpperCase()}
          </Text>

          {item.text ? (
            <Text style={[styles.messageText, isCustomer ? styles.textCustomer : styles.textLawyer]}>
              {item.text}
            </Text>
          ) : null}

          {/* Attachment Rendering inside Chat */}
          {attachment && (
            <TouchableOpacity
              style={styles.attachmentWrapper}
              onPress={() => setPreviewAttachment(attachment)}
            >
              {attachment.isImage ? (
                <View style={styles.imageAttachmentBox}>
                  <Image source={{ uri: attachment.url }} style={styles.imageAttachment} />
                  <View style={styles.imageAttachmentOverlay}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Paperclip size={10} color="#C7D2FE" />
                      <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
                    </View>
                    <View style={styles.viewBadge}><Text style={styles.viewBadgeText}>View</Text></View>
                  </View>
                </View>
              ) : (
                <View style={[styles.docAttachmentBox, isCustomer ? styles.docAttachmentBoxCustomer : styles.docAttachmentBoxLawyer]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.docIconWrapper, isCustomer ? styles.docIconCustomer : styles.docIconLawyer]}>
                      <FileText size={16} color={isCustomer ? "#FFFFFF" : "#E11D48"} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.docName, isCustomer ? { color: '#FFFFFF' } : { color: '#0F172A' }]} numberOfLines={1}>{attachment.name}</Text>
                      <Text style={styles.docSize}>{attachment.isPdf ? 'PDF Document' : 'Document'} • {attachment.size}</Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.timeRow}>
            <Text style={[styles.timeText, isCustomer ? styles.timeCustomer : styles.timeLawyer]}>
              {item.timestamp || new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isCustomer && (
              <Check size={12} color="#C7D2FE" style={{ marginLeft: 4 }} />
            )}
          </View>
        </View>
      </View>
    );
  };

  const quickPrompts = [
    "Can you review the key legal facts of my dispute?",
    "What are my immediate remedies under Indian law?",
    "What evidence documents should I prepare for court?"
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Rich Header exactly matching web */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1C1C4A" />
        </TouchableOpacity>

        <View style={styles.headerAvatarContainer}>
          {consultation?.lawyerProfileImageUrl ? (
            <Image source={{ uri: consultation.lawyerProfileImageUrl }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarText}>{getInitials(consultation?.lawyerName)}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.lawyerName} numberOfLines={1}>{consultation?.lawyerName || 'Advocate'}</Text>
            <CheckCircle2 size={14} color="#10B981" style={{ marginLeft: 4 }} />
          </View>
          <View style={styles.headerSubRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.category} numberOfLines={1}>{consultation?.category || 'Legal Consultation'}</Text>
            <Text style={styles.headerDotSeparator}>•</Text>
            <View style={styles.ratingBadgeHeader}>
              <Star size={8} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingBadgeHeaderText}>{consultation?.rating || '5.0'}</Text>
            </View>
            <Text style={styles.headerDotSeparator}>•</Text>
            <View style={styles.rateBadgeHeader}>
              <Text style={styles.rateBadgeHeaderText}>{formatRateShort(consultation?.lawyerRate)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Toolbar / Actions matching web */}
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <ConsultationTimer
            consultationId={requestId}
            onTimeUp={handleTimeUp}
            isPaused={isChatLocked()}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {consultation?.caseSummary ? (
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowFactsModal(true)}>
              <FileText size={14} color="#4F46E5" />
              <Text style={styles.toolbarBtnText}>Facts</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowRatingModal(true)}>
            <Star size={14} color="#F59E0B" fill={consultation?.rating ? "#F59E0B" : "transparent"} />
            <Text style={styles.toolbarBtnText}>{consultation?.rating ? `Rated (${consultation.rating}★)` : 'Rate'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toolbarBtn, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]} onPress={handleEndConsultation}>
            <CheckSquare size={14} color="#E11D48" />
            <Text style={[styles.toolbarBtnText, { color: '#E11D48' }]}>End</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Status Banners exactly like web */}
      {consultation?.status === 'REJECTED' && (
        <View style={styles.bannerRejected}>
          <XCircle size={18} color="#E11D48" style={{ marginTop: 2 }} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.bannerTitleRejected}>Consultation Request Declined:</Text>
            <Text style={styles.bannerTextRejected}>{consultation.lawyerNotes || 'The advocate was unavailable to accept this request.'}</Text>
          </View>
        </View>
      )}

      {isChatLocked() && consultation?.status === 'ACCEPTED' && (
        <View style={styles.bannerScheduled}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Calendar size={16} color="#059669" />
            <Text style={styles.bannerTextScheduled}>
              <Text style={{ fontWeight: 'bold' }}>Appointment Scheduled: </Text>
              {consultation.assignedDate} at {consultation.assignedTime}.
            </Text>
          </View>
          <View style={styles.unlocksBadge}>
            <Lock size={10} color="#047857" />
            <Text style={styles.unlocksBadgeText}>Unlocks at session time</Text>
          </View>
        </View>
      )}

      {(consultation?.status === 'REQUESTED' || consultation?.status === 'PENDING') && (
        <View style={styles.bannerPending}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Clock size={16} color="#D97706" />
            <Text style={styles.bannerTextPending}>
              <Text style={{ fontWeight: 'bold' }}>Consultation Request Pending: </Text>
              Advocate will assign your session time shortly.
            </Text>
          </View>
          <View style={styles.awaitingBadge}>
            <Text style={styles.awaitingBadgeText}>Awaiting Time</Text>
          </View>
        </View>
      )}

      {/* Free Time Ended Alert / Payment Prompt */}
      {timeUp && !isPaidActive && !isChatLocked() && (
        <View style={styles.bannerPay}>
          <AlertCircle size={16} color="#E11D48" />
          <Text style={styles.bannerTextPay}>
            <Text style={{ fontWeight: 'bold' }}>Session Ended: </Text>
            Complete payment to continue chatting.
          </Text>
          <TouchableOpacity style={styles.unlockBtn} onPress={() => setShowPaymentModal(true)}>
            <Text style={styles.unlockBtnText}>Unlock</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <View style={styles.sparkleIcon}>
              <Sparkles size={24} color="#4F46E5" />
            </View>
            <Text style={styles.emptyTitle}>Consultation Room with {consultation?.lawyerName || 'Advocate'}</Text>
            <Text style={styles.emptySub}>Your secure legal consultation room is ready. Ask your legal questions or choose a suggested starter below.</Text>

            {!isChatLocked() && (
              <View style={styles.promptsContainer}>
                <Text style={styles.promptsLabel}>SUGGESTED QUESTIONS:</Text>
                {quickPrompts.map((p, idx) => (
                  <TouchableOpacity key={idx} style={styles.promptBtn} onPress={() => setInputValue(p)}>
                    <Text style={styles.promptText}>{p}</Text>
                    <ArrowRight size={14} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      />

      {/* Attached File Preview Bar before sending */}
      {attachedFile && (
        <View style={styles.attachedPreviewBar}>
          <Paperclip size={14} color="#D97706" />
          <Text style={styles.attachedPreviewText}>
            Attached File: <Text style={{ fontWeight: 'bold' }}>{attachedFile.name}</Text> ({attachedFile.size})
          </Text>
          <TouchableOpacity onPress={() => setAttachedFile(null)}>
            <X size={16} color="#92400E" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 10}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={[styles.attachBtn, (isChatLocked() || (timeUp && !isPaidActive)) && { opacity: 0.5 }]}
              onPress={handleAttachReal}
            >
              <Paperclip size={18} color="#64748B" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={
                consultation?.status === 'REJECTED'
                  ? "Chat disabled."
                  : isChatLocked()
                    ? "Chat locked until scheduled time..."
                    : (timeUp && !isPaidActive)
                      ? "Consultation paused. Unlock to continue..."
                      : "Type your legal query..."
              }
              placeholderTextColor="#94A3B8"
              value={inputValue}
              onChangeText={setInputValue}
              multiline
              editable={!isChatLocked() && !(timeUp && !isPaidActive)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, ((!inputValue.trim() && !attachedFile) || isChatLocked()) && !(timeUp && !isPaidActive) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={((!inputValue.trim() && !attachedFile) || isChatLocked()) && !(timeUp && !isPaidActive)}
            >
              {(isChatLocked() || (timeUp && !isPaidActive)) ? <Lock size={16} color="#FFFFFF" /> : <Send size={16} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Preview Modal (Fullscreen) */}
      <Modal visible={!!previewAttachment} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <View style={styles.previewHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.previewIconBox}>
                {previewAttachment?.isImage ? <Paperclip size={16} color="#818CF8" /> : <FileText size={16} color="#818CF8" />}
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.previewTitle} numberOfLines={1}>{previewAttachment?.name}</Text>
                <Text style={styles.previewSubtitle}>
                  {previewAttachment?.isImage ? 'Image Attachment' : 'PDF Document'} • {previewAttachment?.size} • Encrypted File
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setPreviewAttachment(null)} style={styles.previewCloseBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <View style={styles.previewBody}>
            {previewAttachment?.isImage ? (
              <Image source={{ uri: previewAttachment?.url }} style={styles.previewImageFullscreen} resizeMode="contain" />
            ) : (
              <View style={styles.previewDocFallback}>
                <FileText size={64} color="#E11D48" style={{ marginBottom: 16 }} />
                <Text style={styles.previewDocTitle}>{previewAttachment?.name}</Text>
                <Text style={styles.previewDocSub}>Click below to open and view this legal document.</Text>
                <TouchableOpacity style={styles.previewOpenLink} onPress={() => Linking.openURL('https://google.com')}>
                  <Text style={styles.previewOpenLinkText}>Open PDF in Browser</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.previewFooter}>
            <Text style={styles.previewFooterText}>🔒 Protected under Advocate-Client Legal Privilege</Text>
            <TouchableOpacity style={styles.previewDownloadBtn}>
              <Download size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.previewDownloadText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Continue Consultation</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.paymentSub}>Your 10-minute free consultation session has ended. To continue chatting with {consultation?.lawyerName}, please complete the payment.</Text>

            <View style={styles.paymentBox}>
              <Text style={styles.paymentBoxLabel}>Consultation Fee</Text>
              <Text style={styles.paymentBoxAmount}>₹299.00</Text>
            </View>

            <TouchableOpacity style={styles.payBtnReal} onPress={handlePaymentSuccess}>
              <Text style={styles.payBtnRealText}>Pay ₹299 to Unlock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Facts Modal */}
      <Modal visible={showFactsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FileText size={20} color="#4F46E5" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Case Facts</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFactsModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.factsBody}>
              <Text style={styles.factsText}>{consultation?.caseSummary}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowFactsModal(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Star size={20} color="#F59E0B" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Rate Advocate</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.ratingSub}>How was your consultation with {consultation?.lawyerName}?</Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setUserRating(s)}>
                  <Star size={36} color={userRating >= s ? "#F59E0B" : "#E2E8F0"} fill={userRating >= s ? "#F59E0B" : "transparent"} style={{ marginHorizontal: 4 }} />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.ratingInput}
              placeholder="Leave a review..."
              multiline
              value={ratingComment}
              onChangeText={setRatingComment}
            />

            <TouchableOpacity style={styles.submitRatingBtn} onPress={handleSubmitRating}>
              <Text style={styles.submitRatingText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  backBtn: { padding: 4, marginRight: 8 },
  headerAvatarContainer: { marginRight: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  headerAvatarFallback: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  lawyerName: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 },
  category: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  headerDotSeparator: { color: '#CBD5E1', marginHorizontal: 6, fontSize: 10 },
  ratingBadgeHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  ratingBadgeHeaderText: { fontSize: 9, fontWeight: 'bold', color: '#B45309', marginLeft: 2 },
  rateBadgeHeader: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  rateBadgeHeaderText: { fontSize: 9, fontWeight: 'bold', color: '#047857' },
  toolbar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center' },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  toolbarBtnText: { fontSize: 12, fontWeight: '600', color: '#475569', marginLeft: 4 },
  bannerRejected: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF1F2', padding: 12, marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FECDD3' },
  bannerTitleRejected: { fontSize: 12, fontWeight: 'bold', color: '#9F1239' },
  bannerTextRejected: { fontSize: 12, color: '#BE123C', marginTop: 2 },
  bannerScheduled: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 10, marginHorizontal: 16, marginTop: 12, borderRadius: 10, borderWidth: 1, borderColor: '#A7F3D0' },
  bannerTextScheduled: { fontSize: 11, color: '#064E3B', marginLeft: 8, flex: 1 },
  unlocksBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#A7F3D0' },
  unlocksBadgeText: { fontSize: 9, fontWeight: '600', color: '#047857', marginLeft: 2 },
  bannerPending: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 10, marginHorizontal: 16, marginTop: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A' },
  bannerTextPending: { fontSize: 11, color: '#78350F', marginLeft: 8, flex: 1 },
  awaitingBadge: { backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FDE68A' },
  awaitingBadgeText: { fontSize: 9, fontWeight: '600', color: '#B45309' },
  bannerPay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1F2', padding: 10, marginHorizontal: 16, marginTop: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FECDD3' },
  bannerTextPay: { fontSize: 11, color: '#9F1239', marginLeft: 8, flex: 1 },
  unlockBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  unlockBtnText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' },
  chatContainer: { padding: 16, paddingBottom: 32 },
  messageRow: { flexDirection: 'row', marginBottom: 14 },
  messageRowRight: { justifyContent: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start' },
  lawyerAvatarMini: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 8, alignSelf: 'flex-end', marginBottom: 2 },
  lawyerAvatarMiniText: { fontSize: 9, fontWeight: 'bold', color: '#4338CA' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  bubbleCustomer: { backgroundColor: '#4F46E5', borderBottomRightRadius: 4 },
  bubbleLawyer: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  senderName: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
  senderNameCustomer: { color: '#C7D2FE' },
  senderNameLawyer: { color: '#4F46E5' },
  messageText: { fontSize: 14, lineHeight: 20 },
  textCustomer: { color: '#FFFFFF' },
  textLawyer: { color: '#1E293B' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 },
  timeText: { fontSize: 9 },
  timeCustomer: { color: '#C7D2FE' },
  timeLawyer: { color: '#94A3B8' },
  attachmentWrapper: { marginTop: 6 },
  imageAttachmentBox: { width: 220, height: 140, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0F172A' },
  imageAttachment: { width: '100%', height: '100%' },
  imageAttachmentOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,23,42,0.85)', flexDirection: 'row', alignItems: 'center', padding: 8 },
  attachmentName: { fontSize: 11, fontWeight: '500', color: '#FFFFFF', marginLeft: 4 },
  viewBadge: { backgroundColor: '#4F46E5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  viewBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#FFFFFF' },
  docAttachmentBox: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1 },
  docAttachmentBoxCustomer: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' },
  docAttachmentBoxLawyer: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  docIconWrapper: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  docIconCustomer: { backgroundColor: 'rgba(255,255,255,0.2)' },
  docIconLawyer: { backgroundColor: '#FFE4E6', borderWidth: 1, borderColor: '#FECDD3' },
  docName: { fontSize: 11, fontWeight: 'bold' },
  docSize: { fontSize: 9, color: '#94A3B8', marginTop: 2 },
  emptyState: { padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  sparkleIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  promptsContainer: { width: '100%', marginTop: 8 },
  promptsLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 },
  promptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  promptText: { fontSize: 13, color: '#334155', flex: 1 },
  attachedPreviewBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#FDE68A' },
  attachedPreviewText: { fontSize: 11, color: '#92400E', flex: 1, marginLeft: 6 },
  inputContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#F8FAFC', borderRadius: 24, paddingLeft: 8, paddingRight: 8, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  attachBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 2, marginRight: 4, backgroundColor: '#F1F5F9' },
  input: { flex: 1, minHeight: 36, maxHeight: 120, fontSize: 15, color: '#1F2937', paddingTop: 8, paddingBottom: 8, paddingHorizontal: 8 },
  sendBtn: { width: 36, height: 36, backgroundColor: '#4F46E5', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 4, marginBottom: 2 },
  sendBtnDisabled: { backgroundColor: '#F1F5F9' },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.95)' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B', paddingTop: Platform.OS === 'ios' ? 50 : 16 },
  previewIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(79, 70, 229, 0.2)', borderWidth: 1, borderColor: 'rgba(79, 70, 229, 0.3)', alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  previewSubtitle: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  previewCloseBtn: { padding: 8, backgroundColor: '#1E293B', borderRadius: 10 },
  previewBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  previewImageFullscreen: { width: '100%', height: '100%' },
  previewDocFallback: { backgroundColor: '#FFFFFF', padding: 32, borderRadius: 24, alignItems: 'center', width: '100%', maxWidth: 320 },
  previewDocTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  previewDocSub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  previewOpenLink: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  previewOpenLinkText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  previewFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFFFFF', paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  previewFooterText: { fontSize: 11, color: '#64748B' },
  previewDownloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  previewDownloadText: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  paymentSub: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 20 },
  paymentBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  paymentBoxLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  paymentBoxAmount: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  payBtnReal: { backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  payBtnRealText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  factsBody: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', maxHeight: 300 },
  factsText: { fontSize: 14, color: '#334155', lineHeight: 22 },
  closeBtn: { marginTop: 16, paddingVertical: 12, backgroundColor: '#F1F5F9', borderRadius: 12, alignItems: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  ratingSub: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  ratingInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', marginBottom: 16 },
  submitRatingBtn: { backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitRatingText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }
});

export default ConsultationChatScreen;
