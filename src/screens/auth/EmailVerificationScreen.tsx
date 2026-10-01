import React, { useState } from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import OtpModal from '../../components/OtpModal';

const EmailVerificationScreen = ({ navigation, route }: any) => {
  const { email, role } = route.params || {};
  const [isOpen, setIsOpen] = useState(true);

  const handleSuccess = () => {
    setIsOpen(false);
    navigation.replace('Login');
  };

  const handleClose = () => {
    setIsOpen(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <OtpModal 
          isOpen={isOpen}
          onClose={handleClose}
          email={email || ''}
          role={role || 'CUSTOMER'}
          onSuccess={handleSuccess}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2FB',
  }
});

export default EmailVerificationScreen;
