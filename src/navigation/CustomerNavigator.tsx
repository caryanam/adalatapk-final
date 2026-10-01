import React from 'react';
import { Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Bot, Scale, Calendar, MessageSquare, User } from 'lucide-react-native';

import LegalAssistantScreen from '../screens/customer/LegalAssistantScreen';
import ConsultationsScreen from '../screens/customer/ConsultationsScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import FindLawyersScreen from '../screens/customer/FindLawyersScreen';
import ConsultationChatScreen from '../screens/customer/ConsultationChatScreen';
import AppointmentsScreen from '../screens/customer/AppointmentsScreen';
import PaymentsScreen from '../screens/customer/PaymentsScreen';
import PrivacyScreen from '../screens/customer/PrivacyScreen';
// CustomerDashboardScreen is removed from bottom tabs, but kept available if needed.

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack for Consultations (List -> Chat)
const ConsultationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ConsultationsList" component={ConsultationsScreen} />
    <Stack.Screen name="ConsultationChat" component={ConsultationChatScreen} />
  </Stack.Navigator>
);

// Main Bottom Tab Navigator
export const CustomerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#D97706', // accent-gold
        tabBarInactiveTintColor: '#A3A3CC', // muted purple-ish grey
        tabBarStyle: {
          backgroundColor: '#1C1C4A', // Dark Blue background
          borderTopWidth: 0,
          elevation: 5,
        },
        tabBarLabel: ({ focused, color }) => {
          if (!focused) return null;
          let label = '';
          if (route.name === 'AI Assistant') label = 'Assistant';
          else if (route.name === 'Advocates') label = 'Advocates';
          else if (route.name === 'Appointments') label = 'Appts';
          else if (route.name === 'Consultations') label = 'Chats';
          else if (route.name === 'Profile') label = 'Profile';
          return <Text style={{ color, fontSize: 11, fontWeight: '700', marginTop: 4 }}>{label}</Text>;
        },
        tabBarIcon: ({ color, focused }) => {
          let IconComponent: any = Bot;
          if (route.name === 'AI Assistant') IconComponent = Bot;
          else if (route.name === 'Advocates') IconComponent = Scale;
          else if (route.name === 'Appointments') IconComponent = Calendar;
          else if (route.name === 'Consultations') IconComponent = MessageSquare;
          else if (route.name === 'Profile') IconComponent = User;
          
          return <IconComponent size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Advocates" component={FindLawyersScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="AI Assistant" component={LegalAssistantScreen} />
      <Tab.Screen name="Consultations" component={ConsultationsStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Root Customer Stack (Tabs + Modals/Inner Screens not in tabs)
export const CustomerNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
    <Stack.Screen name="Payments" component={PaymentsScreen} />
    <Stack.Screen name="Privacy" component={PrivacyScreen} />
  </Stack.Navigator>
);
