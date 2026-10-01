import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface StatusBadgeProps {
  status: string;
  style?: StyleProp<ViewStyle>;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  let bgColor = '#F1F5F9'; // Default Slate 100
  let textColor = '#475569'; // Default Slate 600
  let text = status || 'UNKNOWN';

  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'SUCCESS':
    case 'PAID':
      bgColor = '#ECFDF5'; // Emerald 50
      textColor = '#059669'; // Emerald 600
      break;
    case 'PENDING':
    case 'PROCESSING':
      bgColor = '#FFFBEB'; // Amber 50
      textColor = '#D97706'; // Amber 600
      break;
    case 'FAILED':
    case 'REJECTED':
    case 'CANCELLED':
      bgColor = '#FEF2F2'; // Red 50
      textColor = '#DC2626'; // Red 600
      break;
    case 'SCHEDULED':
      bgColor = '#EFF6FF'; // Blue 50
      textColor = '#2563EB'; // Blue 600
      break;
    default:
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignSelf: 'flex-start'
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  }
});

export default StatusBadge;
