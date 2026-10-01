import React from 'react';
import { View, Text } from 'react-native';

export const PlaceholderScreen = ({ route }: any) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{route?.name} Placeholder</Text>
    </View>
  );
};
