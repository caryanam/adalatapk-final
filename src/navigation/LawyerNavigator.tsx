import React from 'react';
import { Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, MessageSquare, IndianRupee, User, Calendar } from 'lucide-react-native';

// Import Lawyer Screens
import LawyerDashboardScreen from '../screens/lawyer/LawyerDashboardScreen';
import LawyerRequestsScreen from '../screens/lawyer/LawyerRequestsScreen';
import LawyerConsultationsScreen from '../screens/lawyer/LawyerConsultationsScreen';
import LawyerEarningsScreen from '../screens/lawyer/LawyerEarningsScreen';
import LawyerProfileScreen from '../screens/lawyer/LawyerProfileScreen';
import LawyerDocumentsScreen from '../screens/lawyer/LawyerDocumentsScreen';
import LawyerConsultationChatScreen from '../screens/lawyer/LawyerConsultationChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const LawyerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF', // White for active
        tabBarInactiveTintColor: '#A3A3CC',
        tabBarStyle: {
          backgroundColor: '#1C1C4A', // Dark Blue background
          borderTopWidth: 0,
          elevation: 5,
        },
        tabBarLabel: ({ focused, color }) => {
          if (!focused) return null;
          let label = '';
          if (route.name === 'Dashboard') label = 'Dashboard';
          else if (route.name === 'Requests') label = 'Requests';
          else if (route.name === 'Appts') label = 'Appts';
          else if (route.name === 'Earnings') label = 'Earnings';
          else if (route.name === 'Profile') label = 'Profile';
          return <Text style={{ color, fontSize: 11, fontWeight: '700', marginTop: 4 }}>{label}</Text>;
        },
        tabBarIcon: ({ color, focused }) => {
          let IconComponent: any = Home;
          if (route.name === 'Dashboard') IconComponent = Home;
          else if (route.name === 'Requests') IconComponent = MessageSquare;
          else if (route.name === 'Appts') IconComponent = Calendar;
          else if (route.name === 'Earnings') IconComponent = IndianRupee;
          else if (route.name === 'Profile') IconComponent = User;
          
          return <IconComponent size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={LawyerDashboardScreen} />
      <Tab.Screen name="Requests" component={LawyerRequestsScreen} />
      <Tab.Screen name="Appts" component={LawyerConsultationsScreen} />
      <Tab.Screen name="Earnings" component={LawyerEarningsScreen} />
      <Tab.Screen name="Profile" component={LawyerProfileScreen} />
    </Tab.Navigator>
  );
};

export const LawyerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LawyerTabs" component={LawyerTabNavigator} />
      <Stack.Screen name="Documents" component={LawyerDocumentsScreen} />
      <Stack.Screen 
        name="LawyerConsultationChat" 
        component={LawyerConsultationChatScreen}
        options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: 'transparent' } }}
      />
    </Stack.Navigator>
  );
};
