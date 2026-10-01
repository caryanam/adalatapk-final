import React from 'react';
import { Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, UserCheck, ShieldCheck, Users, CreditCard } from 'lucide-react-native';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminVerificationsScreen from '../screens/admin/AdminVerificationsScreen';
import AdminDirectoryScreen from '../screens/admin/AdminDirectoryScreen';
import AdminPaymentsScreen from '../screens/admin/AdminPaymentsScreen';
const Tab = createBottomTabNavigator();

export const AdminNavigator = () => {
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
          else if (route.name === 'Lawyer Approvals') label = 'Approvals';
          else if (route.name === 'Lawyer Management') label = 'Directory';
          else if (route.name === 'Payment Audit') label = 'Payments';
          return <Text style={{ color, fontSize: 11, fontWeight: '700', marginTop: 4 }}>{label}</Text>;
        },
        tabBarIcon: ({ color, focused }) => {
          let IconComponent: any = LayoutDashboard;
          if (route.name === 'Dashboard') IconComponent = LayoutDashboard;
          else if (route.name === 'Lawyer Approvals') IconComponent = UserCheck;
          else if (route.name === 'Lawyer Management') IconComponent = ShieldCheck;
          else if (route.name === 'Payment Audit') IconComponent = CreditCard;
          
          return <IconComponent size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen} 
      />
      <Tab.Screen 
        name="Lawyer Approvals" 
        component={AdminVerificationsScreen} 
        options={{ tabBarLabel: 'Approvals' }}
      />
      <Tab.Screen 
        name="Lawyer Management" 
        component={AdminDirectoryScreen} 
        options={{ tabBarLabel: 'Directory' }}
      />
      <Tab.Screen 
        name="Payment Audit" 
        component={AdminPaymentsScreen} 
        options={{ tabBarLabel: 'Payments' }}
      />
    </Tab.Navigator>
  );
};
