import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, ScrollView, Image, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { legalAssistantApi } from '../../api/legalAssistantApi';
import apiClient from '../../api/apiClient';
import {
  Bot, Send, MessageSquare, UserCheck, FileText, Users, Calendar,
  RefreshCcw, Bell, Trash2, X, ChevronDown, Edit, Clock, Plus, Menu, ArrowLeft
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const LegalAssistantScreen = () => {
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    initializePage();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessionsList();
    if (session?.sessionId) {
      await loadSession(session.sessionId);
    }
    setRefreshing(false);
  };

  const initializePage = async () => {
    await fetchSessionsList();
    try {
      const res = await legalAssistantApi.createSession(false);
      const data = res.data;
      setSession(data);
      if (data.messageHistory && data.messageHistory.length > 0) {
        setMessages(data.messageHistory);
      } else if (data.assistantMessage) {
        setMessages([{
          id: 'init-' + Date.now(),
          senderType: 'AI',
          message: data.assistantMessage,
          createdAt: new Date().toISOString()
        }]);
      }
      fetchSessionsList();
    } catch (err) {
      console.warn('Failed to auto-initialize session', err);
    }
  };

  const fetchSessionsList = async (autoLoadId: string | null = null) => {
    try {
      setSessionsLoading(true);
      const res = await legalAssistantApi.getSessions();
      setSessionsList(res.data || []);

      if (res.data && res.data.length > 0 && autoLoadId) {
        loadSession(autoLoadId);
      }
    } catch (err) {
      console.error('Failed to load session history', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await legalAssistantApi.getSessionDetail(sessionId);
      const data = res.data;
      setSession(data);
      if (data.messageHistory && data.messageHistory.length > 0) {
        setMessages(data.messageHistory);
      } else if (data.assistantMessage) {
        setMessages([{
          id: 'init-' + Date.now(),
          senderType: 'AI',
          message: data.assistantMessage,
          createdAt: new Date().toISOString()
        }]);
      }
    } catch (err: any) {
      setError('Failed to load the specific session.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = async () => {
    try {
      setLoading(true);
      setError(null);
      setInputValue('');
      setSession(null);
      setMessages([]);

      const res = await legalAssistantApi.createSession(true);
      const data = res.data;
      setSession(data);
      if (data.messageHistory && data.messageHistory.length > 0) {
        setMessages(data.messageHistory);
      } else if (data.assistantMessage) {
        setMessages([{
          id: 'init-' + Date.now(),
          senderType: 'AI',
          message: data.assistantMessage,
          createdAt: new Date().toISOString()
        }]);
      }
      await fetchSessionsList();
    } catch (err) {
      setError('Failed to start a new consultation.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this chat session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            await legalAssistantApi.deleteSession(sessionId);
            if (session?.sessionId === sessionId) {
              setSession(null);
              setMessages([]);
            }
            await fetchSessionsList();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete chat session.');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    let activeSessionId = session?.sessionId;
    let currentSession = session;

    if (!currentSession) {
      try {
        setLoading(true);
        const res = await legalAssistantApi.createSession(true);
        currentSession = res.data;
        setSession(currentSession);
        activeSessionId = currentSession.sessionId;
        await fetchSessionsList();
        setLoading(false);
      } catch (err) {
        setError('Failed to initialize session.');
        setLoading(false);
        return;
      }
    }

    const text = inputValue.trim();
    const clientMsgId = 'msg-' + Date.now();

    setMessages(prev => [...prev, {
      id: clientMsgId,
      senderType: 'CUSTOMER',
      message: text,
      createdAt: new Date().toISOString()
    }]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    try {
      const res = await legalAssistantApi.sendMessage(activeSessionId, text, clientMsgId);
      const data = res.data;
      setSession(data);

      if (data.messageHistory && data.messageHistory.length > 0) {
        setMessages(data.messageHistory);
      } else if (data.assistantMessage) {
        setMessages(prev => [...prev, {
          id: 'ai-' + Date.now(),
          senderType: 'AI',
          message: data.assistantMessage,
          createdAt: new Date().toISOString()
        }]);
      }
      fetchSessionsList();
    } catch (err) {
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        senderType: 'AI',
        message: "The Legal Assistant is temporarily unavailable. Your message has been saved. Please try again.",
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmSummary = async () => {
    if (!session?.sessionId || actionLoading) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await legalAssistantApi.confirmSummary(session.sessionId);
      setSession(res.data);
      if (res.data.messageHistory && res.data.messageHistory.length > 0) {
        setMessages(res.data.messageHistory);
      }
      fetchSessionsList();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm summary.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextStep = async (action: string) => {
    if (!session?.sessionId || actionLoading) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await legalAssistantApi.nextStep(session.sessionId, action);
      setSession(res.data);
      if (res.data.messageHistory && res.data.messageHistory.length > 0) {
        setMessages(res.data.messageHistory);
      }
      fetchSessionsList();
    } catch (err: any) {
      setError(err.message || 'Failed to process next action.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConsultLawyer = async (lawyer: any) => {
    try {
      await apiClient.post('/api/customer/consultations', {
        lawyerId: lawyer.lawyerId || lawyer.id,
        caseSummary: 'Consultation requested from AI Legal Assistant'
      });
      setSelectedLawyer(null);
      navigation.navigate('Consultations');
    } catch (err) {
      console.warn('Failed to create consultation directly', err);
      setSelectedLawyer(null);
      navigation.navigate('Consultations');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    if (!status) return { bg: '#F3F4F6', text: '#4B5563' };
    const s = status.toUpperCase();
    if (s === 'ACTIVE') return { bg: '#EEF2FF', text: '#4F46E5' };
    if (s === 'SUMMARY_READY' || s === 'AWAITING_NEXT_STEP') return { bg: '#FEF3C7', text: '#D97706' };
    if (s === 'ASSIGNED' || s === 'AI_ONLY_COMPLETED' || s === 'CLOSED') return { bg: '#ECFDF5', text: '#10B981' };
    return { bg: '#F3F4F6', text: '#4B5563' };
  };

  const isSummaryMode = session?.status === 'SUMMARY_READY' || (session?.canConfirm && !session?.summaryConfirmed);
  const isReadOnly = session && ['ASSIGNED', 'AI_ONLY_COMPLETED', 'CLOSED'].includes(session.status);

  const renderMessage = ({ item }: { item: any }) => {
    const isAI = item.senderType === 'AI';
    if (isSummaryMode && isAI && item.message && (item.message.startsWith('Case Category:') || item.message.includes('Based on your description, here are the key facts'))) {
      return null; // hide raw summary in chat, we render it as a card
    }

    return (
      <View style={[styles.messageRow, isAI ? styles.messageRowAI : styles.messageRowCustomer]}>
        <View style={[styles.messageBubble, isAI ? styles.bubbleAI : styles.bubbleCustomer]}>
          <Text style={[styles.messageText, isAI ? styles.textAI : styles.textCustomer]}>
            {item.message}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER - WELCOME & ACTIONS */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Welcome to Legal Assistant</Text>
          <Text style={styles.headerSub} numberOfLines={1}>Your AI legal companion is here to help.</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={[styles.headerIconBtn, { marginRight: 8 }]} onPress={() => setShowHistoryModal(true)}>
            <Clock size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleStartNew}>
            <Plus size={22} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ERROR BANNER */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* CHAT / EMPTY STATE */}
      <View style={{ flex: 1 }}>
        {(!session && messages.length === 0) ? (
          <ScrollView
            contentContainerStyle={styles.emptyStateContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View style={styles.botIconWrapper}>
              <Bot size={50} color="#4F46E5" />
            </View>
            <Text style={styles.emptyTitle}>Adalat Legal Assistant</Text>
            <Text style={styles.emptySub}>Ask your legal questions, get step-by-step guidance, or connect with verified advocates.</Text>

            <View style={styles.quickActionsGrid}>
              {[
                { icon: MessageSquare, label: 'I have a legal question' },
                { icon: FileText, label: 'Guide me step by step' },
                { icon: Users, label: 'Connect with a lawyer' },
                { icon: Calendar, label: 'Book a consultation' }
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.quickActionBtn} onPress={() => setInputValue(item.label)}>
                  <View style={styles.quickActionIconBg}>
                    <item.icon size={18} color="#4F46E5" />
                  </View>
                  <Text style={styles.quickActionText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyExtractor={item => item.id?.toString() || Math.random().toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={() => (
              <View>
                {isTyping && (
                  <View style={[styles.messageRow, styles.messageRowAI]}>
                    <View style={[styles.messageBubble, styles.bubbleAI]}>
                      <Text style={[styles.messageText, styles.textAI]}>Typing...</Text>
                    </View>
                  </View>
                )}

                {session?.summary && isSummaryMode && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardTitle}>Case Summary Ready</Text>
                    <Text style={styles.summaryCardBody}>{session.summary}</Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmSummary} disabled={actionLoading}>
                      {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryBtnText}>Confirm & Proceed</Text>}
                    </TouchableOpacity>
                  </View>
                )}

                {session?.nextActionRequired && session?.availableActions && (
                  <View style={styles.nextStepCard}>
                    <Text style={styles.nextStepCardTitle}>Next Step Choice</Text>
                    <Text style={styles.nextStepCardBody}>Would you like to connect with a verified advocate or use AI guidance only?</Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => handleNextStep('CONNECT_LAWYER')} disabled={actionLoading}>
                      <UserCheck size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryBtnText}>Connect with Advocate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleNextStep('AI_ONLY')} disabled={actionLoading}>
                      <Bot size={16} color="#4F46E5" style={{ marginRight: 8 }} />
                      <Text style={styles.secondaryBtnText}>AI Guidance Only</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {session?.suggestedLawyers?.length > 0 && !session?.matchedLawyer && (
                  <View style={styles.lawyersCard}>
                    <Text style={styles.lawyersCardTitle}>🏛️ Advocates Matching Your Case</Text>
                    {session.suggestedLawyers.map((lawyer: any, idx: number) => {
                      const practiceStr = Array.isArray(lawyer.practiceAreas)
                        ? lawyer.practiceAreas.map((p: any) => typeof p === 'string' ? p.replace(/_/g, ' ') : p).join(', ')
                        : 'General Practice';
                      const langStr = Array.isArray(lawyer.languages)
                        ? lawyer.languages.join(', ')
                        : 'English, Hindi';

                      return (
                        <View key={lawyer.lawyerId || idx} style={styles.lawyerItem}>
                          <View style={styles.lawyerHeaderRow}>
                            <View style={styles.lawyerAvatar}>
                              <Text style={styles.lawyerAvatarText}>{lawyer.fullName ? lawyer.fullName.charAt(0).toUpperCase() : 'A'}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.lawyerName}>{lawyer.fullName}</Text>
                                <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>
                              </View>
                              <Text style={styles.lawyerStats}>⭐ {lawyer.rating ? lawyer.rating.toFixed(1) : '4.8'} • {lawyer.yearsOfExperience || 5}+ yrs exp</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.lawyerFee}>₹{lawyer.consultationFee || 99}</Text>
                              <Text style={styles.lawyerFeeSub}>per consult</Text>
                            </View>
                          </View>

                          <View style={styles.lawyerChipsRow}>
                            <Text style={styles.chip}>📍 {lawyer.location || 'India'}</Text>
                            <Text style={styles.chip}>🗣️ {langStr}</Text>
                          </View>
                          <Text style={styles.lawyerPractice} numberOfLines={1}><Text style={{ fontWeight: '600' }}>Practice:</Text> {practiceStr}</Text>

                          <View style={styles.lawyerActionsRow}>
                            <TouchableOpacity style={styles.lawyerOutlineBtn} onPress={() => setSelectedLawyer(lawyer)}>
                              <Text style={styles.lawyerOutlineBtnText}>View Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.lawyerSolidBtn} onPress={() => handleConsultLawyer(lawyer)}>
                              <Text style={styles.lawyerSolidBtnText}>Consult Now</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 10}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={isReadOnly ? "This consultation is completed." : "Message Adalat Legal AI..."}
              placeholderTextColor="#94A3B8"
              value={inputValue}
              onChangeText={setInputValue}
              multiline
              maxLength={1000}
              editable={!isTyping && !actionLoading && !isReadOnly}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputValue.trim() || isTyping || actionLoading || isReadOnly) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputValue.trim() || isTyping || actionLoading || isReadOnly}
            >
              {isTyping ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={16} color={(!inputValue.trim() || isTyping || actionLoading || isReadOnly) ? '#94A3B8' : '#FFFFFF'} style={inputValue.trim() ? { marginLeft: 2 } : undefined} />}
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimerText}>Adalat Legal Assistant can make mistakes. Verify important info.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* LAWYER PROFILE MODAL */}
      <Modal visible={!!selectedLawyer} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedLawyer(null)}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>

            {selectedLawyer && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <View style={[styles.lawyerAvatar, { width: 60, height: 60, borderRadius: 30 }]}>
                    <Text style={[styles.lawyerAvatarText, { fontSize: 24 }]}>{selectedLawyer.fullName ? selectedLawyer.fullName.charAt(0).toUpperCase() : 'A'}</Text>
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E3A8A' }}>{selectedLawyer.fullName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>
                      {selectedLawyer.available && <View style={[styles.verifiedBadge, { backgroundColor: '#DBEAFE', marginLeft: 8 }]}><Text style={[styles.verifiedText, { color: '#2563EB' }]}>🟢 Available</Text></View>}
                    </View>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>⭐ {selectedLawyer.rating ? selectedLawyer.rating.toFixed(1) : '4.8'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{selectedLawyer.yearsOfExperience || 5}+</Text>
                    <Text style={styles.statLabel}>Years Exp</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{selectedLawyer.totalConsultations || 0}</Text>
                    <Text style={styles.statLabel}>Consultations</Text>
                  </View>
                </View>

                <View style={styles.detailsList}>
                  <Text style={styles.detailText}><Text style={{ fontWeight: '600', color: '#374151' }}>📍 Location:</Text> {selectedLawyer.location || 'India'}</Text>
                  <Text style={styles.detailText}><Text style={{ fontWeight: '600', color: '#374151' }}>🎓 Education:</Text> {selectedLawyer.education || 'LLB'}</Text>
                  <Text style={styles.detailText}><Text style={{ fontWeight: '600', color: '#374151' }}>🗣️ Languages:</Text> {Array.isArray(selectedLawyer.languages) ? selectedLawyer.languages.join(', ') : 'English, Hindi'}</Text>
                  {selectedLawyer.barEnrollmentNumber && <Text style={styles.detailText}><Text style={{ fontWeight: '600', color: '#374151' }}>📋 Bar Number:</Text> {selectedLawyer.barEnrollmentNumber}</Text>}
                  <Text style={styles.detailText}><Text style={{ fontWeight: '600', color: '#374151' }}>💼 Practice:</Text> {Array.isArray(selectedLawyer.practiceAreas) ? selectedLawyer.practiceAreas.map((p: any) => typeof p === 'string' ? p.replace(/_/g, ' ') : p).join(', ') : 'General'}</Text>
                  <Text style={styles.detailText}><Text style={{ fontWeight: '600', color: '#374151' }}>💰 Fee:</Text> <Text style={{ color: '#059669', fontWeight: '700' }}>₹{selectedLawyer.consultationFee || 99} per consultation</Text></Text>
                </View>

                {selectedLawyer.bio && (
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>About</Text>
                    <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22 }}>{selectedLawyer.bio}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.lawyerSolidBtn, { padding: 16 }]}
                  onPress={() => {
                    const l = selectedLawyer;
                    setSelectedLawyer(null);
                    handleConsultLawyer(l);
                  }}
                >
                  <Text style={[styles.lawyerSolidBtnText, { fontSize: 16 }]}>Consult This Advocate</Text>
                </TouchableOpacity>
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* FULL SCREEN HISTORY PAGE (MODAL) */}
      <Modal visible={showHistoryModal} animationType="slide" transparent={false} onRequestClose={() => setShowHistoryModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

          <View style={styles.historyPageHeader}>
            <TouchableOpacity style={styles.historyBackBtn} onPress={() => setShowHistoryModal(false)}>
              <ArrowLeft size={24} color="#1E3A8A" />
            </TouchableOpacity>
            <Text style={styles.historyPageTitle}>Chat History</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.historyPageContent}>
            {sessionsLoading && sessionsList.length === 0 ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
            ) : sessionsList.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <MessageSquare size={40} color="#CBD5E1" />
                <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 16 }}>No previous chats found.</Text>
              </View>
            ) : (
              <FlatList
                data={sessionsList}
                showsVerticalScrollIndicator={false}
                keyExtractor={item => item.sessionId?.toString()}
                renderItem={({ item }) => {
                  const isSelected = session?.sessionId === item.sessionId;
                  const badgeColor = getStatusBadgeColor(item.status);

                  return (
                    <TouchableOpacity
                      style={[styles.historyListItem, isSelected && styles.historyListItemSelected]}
                      onPress={() => {
                        loadSession(item.sessionId);
                        setShowHistoryModal(false);
                      }}
                    >
                      <View style={[styles.historyListIcon, isSelected ? { backgroundColor: '#4F46E5' } : { backgroundColor: '#F1F5F9' }]}>
                        <MessageSquare size={20} color={isSelected ? '#FFF' : '#64748B'} />
                      </View>

                      <View style={{ flex: 1, marginLeft: 16, marginRight: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <Text style={[styles.historyListTitle, isSelected && { color: '#1E3A8A' }]} numberOfLines={1}>
                            {item.summary ? item.summary.split('\n')[0] : 'Consultation'}
                          </Text>
                          <Text style={styles.historyListDate}>
                            {new Date(item.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={[styles.badge, { backgroundColor: badgeColor.bg, marginLeft: 0 }]}>
                            <Text style={[styles.badgeText, { color: badgeColor.text }]}>
                              {item.status === 'SUMMARY_READY' || item.status === 'AWAITING_NEXT_STEP' ? 'Action Needed' :
                                item.status === 'ASSIGNED' || item.status === 'AI_ONLY_COMPLETED' || item.status === 'CLOSED' ? 'Closed' :
                                  item.status === 'ACTIVE' ? 'Active' : item.status}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity style={styles.historyListTrashBtn} onPress={() => handleDeleteSession(item.sessionId)}>
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingBottom: 24 }}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E3A8A' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  headerIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20 },
  headerTitleCenter: { fontSize: 18, fontWeight: 'bold', color: '#1E3A8A', flex: 1, textAlign: 'center' },

  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  badgeText: { fontSize: 9, fontWeight: '700' },

  errorBanner: { backgroundColor: '#FEE2E2', padding: 10, margin: 16, borderRadius: 8, alignItems: 'center' },
  errorBannerText: { color: '#B91C1C', fontSize: 13, fontWeight: '500' },

  emptyStateContainer: { padding: 24, alignItems: 'center', paddingBottom: 40 },
  botIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#1E3A8A', marginBottom: 12, textAlign: 'center' },
  emptySub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 40, lineHeight: 22, paddingHorizontal: 16 },
  quickActionsGrid: { width: '100%', gap: 12 },
  quickActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  quickActionIconBg: { backgroundColor: '#EEF2FF', padding: 8, borderRadius: 8, marginRight: 16 },
  quickActionText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  chatContainer: { padding: 16, paddingBottom: 32 },
  messageRow: { flexDirection: 'row', marginBottom: 16, width: '100%' },
  messageRowAI: { justifyContent: 'flex-start' },
  messageRowCustomer: { justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 18 },
  bubbleAI: { backgroundColor: '#F1F3F4', borderBottomLeftRadius: 4 },
  bubbleCustomer: { backgroundColor: '#4F46E5', borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  textAI: { color: '#1F2937' },
  textCustomer: { color: '#FFFFFF' },

  summaryCard: { backgroundColor: '#FEFCE8', padding: 16, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#FEF08A' },
  summaryCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#713F12', marginBottom: 8 },
  summaryCardBody: { fontSize: 14, color: '#854D0E', marginBottom: 16, lineHeight: 20 },

  nextStepCard: { backgroundColor: '#EEF2FF', padding: 16, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#C7D2FE' },
  nextStepCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#312E81', marginBottom: 8 },
  nextStepCardBody: { fontSize: 14, color: '#3730A3', marginBottom: 16, lineHeight: 20 },

  lawyersCard: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  lawyersCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 16 },
  lawyerItem: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#DBEAFE', marginBottom: 12 },
  lawyerHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  lawyerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  lawyerAvatarText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  lawyerName: { fontSize: 15, fontWeight: '700', color: '#1E3A8A' },
  verifiedBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  verifiedText: { color: '#059669', fontSize: 9, fontWeight: '700' },
  lawyerStats: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  lawyerFee: { fontSize: 15, fontWeight: '700', color: '#059669' },
  lawyerFeeSub: { fontSize: 10, color: '#6B7280' },
  lawyerChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, fontSize: 11, color: '#334155' },
  lawyerPractice: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  lawyerActionsRow: { flexDirection: 'row', gap: 10 },
  lawyerOutlineBtn: { flex: 1, paddingVertical: 10, borderWidth: 1.5, borderColor: '#4F46E5', borderRadius: 8, alignItems: 'center' },
  lawyerOutlineBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 13 },
  lawyerSolidBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#4F46E5', borderRadius: 8, alignItems: 'center' },
  lawyerSolidBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  primaryBtn: { backgroundColor: '#4F46E5', flexDirection: 'row', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  secondaryBtn: { backgroundColor: '#FFFFFF', flexDirection: 'row', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' },
  secondaryBtnText: { color: '#4F46E5', fontWeight: 'bold', fontSize: 14 },

  inputContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#F8FAFC', borderRadius: 24, paddingLeft: 16, paddingRight: 8, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { flex: 1, minHeight: 36, maxHeight: 120, fontSize: 15, color: '#1F2937', paddingTop: 8, paddingBottom: 8 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  sendBtnDisabled: { backgroundColor: '#F1F5F9' },
  disclaimerText: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 10, },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: '#F3F4F6', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1E3A8A' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  detailsList: { marginBottom: 24, gap: 12 },
  detailText: { fontSize: 14, color: '#4B5563' },

  historyPageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  historyBackBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20 },
  historyPageTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E3A8A' },
  historyPageContent: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 16 },

  historyListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  historyListItemSelected: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
  historyListIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  historyListTitle: { fontSize: 16, fontWeight: '700', color: '#334155', flex: 1, paddingRight: 8 },
  historyListDate: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  historyListTrashBtn: { padding: 8 }
});

export default LegalAssistantScreen;
