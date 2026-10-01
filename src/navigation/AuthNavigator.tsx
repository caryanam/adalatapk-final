import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

// Import Screens (to be created)
import LoginScreen from '../screens/auth/LoginScreen';
import CustomerRegisterScreen from '../screens/auth/CustomerRegisterScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import LawyerRegisterWizardScreen from '../screens/auth/LawyerRegisterWizardScreen';
import { PlaceholderScreen } from '../screens/placeholder/PlaceholderScreen';
import { CustomerNavigator } from './CustomerNavigator';
import { LawyerNavigator } from './LawyerNavigator';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import { ActivityIndicator, View } from 'react-native';

import { AdminNavigator } from './AdminNavigator';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  const { user, token, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2FB' }}>
        <ActivityIndicator size="large" color="#1C1C4A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CustomerRegister" component={CustomerRegisterScreen} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
            <Stack.Screen name="LawyerRegisterWizard" component={LawyerRegisterWizardScreen} />
          </>
        ) : (
          // App Stack (Based on Role)
          <>
            {role === 'CUSTOMER' && (
              <Stack.Screen name="CustomerRoot" component={CustomerNavigator} />
            )}
            {role === 'LAWYER' && (
              user?.registrationStatus !== 'SUBMITTED' && user?.registrationStatus !== 'APPROVED' && user?.registrationStatus !== 'VERIFIED' ? (
                <>
                  <Stack.Screen name="LawyerRegisterWizard" component={LawyerRegisterWizardScreen} />
                  <Stack.Screen name="LawyerDashboard" component={LawyerNavigator} />
                </>
              ) : (
                <>
                  <Stack.Screen name="LawyerDashboard" component={LawyerNavigator} />
                  <Stack.Screen name="LawyerRegisterWizard" component={LawyerRegisterWizardScreen} />
                </>
              )
            )}
            {role === 'ADMIN' && (
              <Stack.Screen name="AdminRoot" component={AdminNavigator} />
            )}
            
            {/* Common Authenticated Screens */}
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
