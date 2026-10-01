import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getChatMessages, sendChatMessage } from '../../utils/chatStore';
import ConsultationTimer from '../../components/ConsultationTimer';
import { consultationApi } from '../../api/consultationApi';
import { Send, X, Paperclip, Bell, FileText, MessageSquare, Check, XCircle, Lock, CheckSquare, CheckCheck } from 'lucide-react-native';

const LawyerConsultationChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { requestId, consultation: initialConsultation } = route.params || {};

  const [consultation, setConsultation] = useState<any>(initialConsultation || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');

  const [attachedFile, setAttachedFile] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);

  const fetchDetails = async () => {
    try {
      const res = await consultationApi.getConsultationDetail(requestId);
      if (res.data) setConsultation(res.data);
    } catch (e) { }
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

  const handleSend = async () => {
    if (!inputValue.trim() && !attachedFile) return;

    const text = inputValue.trim();
    const file = attachedFile;
    setInputValue('');
    setAttachedFile(null);

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
      sender: 'LAWYER',
      text: text,
      status: 'SENT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...attachmentObj
    };
    setMessages(prev => [...prev, newMsg]);

    const updated = await sendChatMessage(requestId, 'LAWYER', text, file);
    setMessages(updated);
  };

  const handleEndSession = () => {
    Alert.alert('End Session', 'Are you sure you want to end this consultation session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session', style: 'destructive', onPress: async () => {
          try {
            await consultationApi.completeConsultationLawyer(requestId);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Failed to end session');
          }
        }
      }
    ]);
  };

  const handleNotifyClient = () => {
    Alert.alert('Client Notified', 'The client has been notified that you are waiting in the room.');
  };

  const handleAttach = () => {
    Alert.alert('Attach File', 'Select file type:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Image', onPress: pickImage },
      { text: 'Document/PDF', onPress: () => { } }
    ]);
  };

  const pickImage = () => {
    setAttachedFile({
      uri: 'mock_uri',
      name: 'evidence.jpg',
      isImage: true,
      isPdf: false,
      size: '2 MB'
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'C';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isLawyer = item.sender === 'LAWYER';
    const attachment = item.url ? { url: item.url, name: item.name, isImage: item.isImage, isPdf: item.isPdf, size: item.size } : null;

    return (
      <View style={[styles.messageRow, isLawyer ? styles.messageRowRight : styles.messageRowLeft]}>
        {!isLawyer && (
          <View style={styles.clientAvatarMini}>
            <Text style={styles.clientAvatarMiniText}>{getInitials(consultation?.customerName || consultation?.clientName)}</Text>
          </View>
        )}
        <View style={[styles.bubble, isLawyer ? styles.bubbleLawyer : styles.bubbleClient]}>
          <Text style={[styles.senderName, isLawyer ? styles.senderNameLawyer : styles.senderNameClient]}>
            {isLawyer ? 'YOU (ADVOCATE)' : (consultation?.customerName || consultation?.clientName || 'CLIENT').toUpperCase()}
          </Text>

          {item.text ? (
            <Text style={[styles.messageText, isLawyer ? styles.textLawyer : styles.textClient]}>
              {item.text}
            </Text>
          ) : null}

          {attachment && (
            <View style={styles.attachmentWrapper}>
              {attachment.isImage ? (
                <View style={styles.imageAttachmentBox}>
                  <Image source={{ uri: attachment.url }} style={styles.imageAttachment} />
                  <View style={styles.imageAttachmentOverlay}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Paperclip size={10} color="#E0E7FF" />
                      <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={[styles.docAttachmentBox, isLawyer ? styles.docAttachmentBoxLawyer : styles.docAttachmentBoxClient]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={styles.docIconWrapper}>
                      <FileText size={16} color={isLawyer ? "#FFFFFF" : "#4F46E5"} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.docName, isLawyer ? { color: '#FFFFFF' } : { color: '#0F172A' }]} numberOfLines={1}>{attachment.name}</Text>
                      <Text style={styles.docSize}>{attachment.isPdf ? 'PDF Document' : 'Document'} • {attachment.size}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={styles.timeRow}>
            <Text style={[styles.timeText, isLawyer ? styles.timeLawyer : styles.timeClient]}>
              {item.timestamp || new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isLawyer && (
              <CheckCheck size={12} color="#94A3B8" style={{ marginLeft: 4 }} />
            )}
          </View>
        </View>
      </View>
    );
  };

  const clientName = consultation?.customerName || consultation?.clientName || 'Client';

  return (
    <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
      <View style={styles.modalContainer}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>{getInitials(clientName)}</Text>
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
                <Text style={styles.categoryText} numberOfLines={1}>Category: {consultation?.categoryDisplayName || consultation?.category || 'General Consultation'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.timerBadge}>
              <Lock size={12} color="#BE123C" />
              <Text style={styles.timerText}>Expired</Text>
            </View>
            <TouchableOpacity style={styles.endBtn} onPress={handleEndSession}>
              <CheckSquare size={14} color="#FDA4AF" />
              <Text style={styles.endBtnText}>End Session</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sub Header */}
        <View style={styles.subHeader}>
          <View style={styles.briefHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FileText size={14} color="#92400E" style={{ marginRight: 6 }} />
              <Text style={styles.briefLabel}>Case Brief</Text>
            </View>
            <TouchableOpacity style={styles.notifyBtn} onPress={handleNotifyClient}>
              <Bell size={12} color="#000000" />
              <Text style={styles.notifyBtnText}>Notify Client</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.briefValue} numberOfLines={3}>
            {consultation?.briefDescription || consultation?.legalIssue || 'Consultation requested from advocate directory'}
          </Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBox}>
                  <MessageSquare size={48} color="#CBD5E1" />
                </View>
                <Text style={styles.emptyTitle}>Real-time Consultation Room</Text>
                <Text style={styles.emptySub}>Send a greeting message or review case documents with your client.</Text>
              </View>
            )}
          />

          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachBtn} onPress={handleAttach}>
              <Paperclip size={20} color="#64748B" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type your legal advice..."
              placeholderTextColor="#94A3B8"
              value={inputValue}
              onChangeText={setInputValue}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputValue.trim() && !attachedFile) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputValue.trim() && !attachedFile}
            >
              <Send size={16} color={(!inputValue.trim() && !attachedFile) ? "#94A3B8" : "#0F172A"} />
              <Text style={[styles.sendBtnText, (!inputValue.trim() && !attachedFile) && { color: "#94A3B8" }]}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', height: '80%', backgroundColor: '#F8FAFC', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#1A1B4B', paddingHorizontal: 16, paddingVertical: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  clientAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  clientName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  categoryText: { color: '#E2E8F0', fontSize: 11 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  timerText: { color: '#BE123C', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  endBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#831843', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  endBtnText: { color: '#FDA4AF', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  closeBtn: { padding: 4, marginLeft: 8 },

  subHeader: { backgroundColor: '#FFFBEB', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#FEF3C7' },
  briefHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  briefLabel: { color: '#92400E', fontSize: 13, fontWeight: '700' },
  briefValue: { color: '#78350F', fontSize: 13, lineHeight: 18 },
  notifyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBBF24', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  notifyBtnText: { color: '#000000', fontSize: 11, fontWeight: '700', marginLeft: 4 },

  chatContent: { padding: 16, flexGrow: 1, paddingBottom: 24 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIconBox: { marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', paddingHorizontal: 40 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  attachBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  textInput: { flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#0F172A', borderWidth: 1, borderColor: '#F1F5F9' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 16, height: 44, borderRadius: 22, marginLeft: 8 },
  sendBtnDisabled: { opacity: 0.7 },
  sendBtnText: { color: '#0F172A', fontWeight: 'bold', marginLeft: 6, fontSize: 14 },

  messageRow: { marginBottom: 16, flexDirection: 'row', alignItems: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  clientAvatarMini: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 4 },
  clientAvatarMiniText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },

  bubble: { maxWidth: '75%', padding: 12 },
  bubbleClient: { backgroundColor: '#FFFFFF', borderRadius: 16, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  bubbleLawyer: { backgroundColor: '#1A1B4B', borderRadius: 16, borderTopRightRadius: 4 },

  senderName: { fontSize: 10, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' },
  senderNameClient: { color: '#64748B' },
  senderNameLawyer: { color: '#A5B4FC' },

  messageText: { fontSize: 14, lineHeight: 20 },
  textClient: { color: '#1E293B' },
  textLawyer: { color: '#FFFFFF' },

  timeRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  timeText: { fontSize: 10 },
  timeClient: { color: '#94A3B8' },
  timeLawyer: { color: '#94A3B8' },

  attachmentWrapper: { marginTop: 8, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)' },
  imageAttachmentBox: { width: 200, height: 140, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imageAttachment: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageAttachmentOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', padding: 8, alignItems: 'center' },
  attachmentName: { color: '#FFFFFF', fontSize: 11, marginLeft: 4 },

  docAttachmentBox: { padding: 12, borderRadius: 12, borderWidth: 1, minWidth: 200 },
  docAttachmentBoxLawyer: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' },
  docAttachmentBoxClient: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  docIconWrapper: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 13, fontWeight: '600' },
  docSize: { fontSize: 11, color: '#94A3B8', marginTop: 2 }
});

export default LawyerConsultationChatScreen;
