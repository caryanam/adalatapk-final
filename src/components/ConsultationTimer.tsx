import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getSharedTimerSeconds } from '../utils/chatStore';

interface ConsultationTimerProps {
  consultationId: string | number;
  totalDurationSeconds?: number;
  onTimeUp?: () => void;
  isPaused?: boolean;
}

const ConsultationTimer: React.FC<ConsultationTimerProps> = ({
  consultationId,
  totalDurationSeconds = 600, // 10 minutes
  onTimeUp,
  isPaused = false
}) => {
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);

  useEffect(() => {
    let interval: any = null;

    const syncTime = async () => {
      const remaining = await getSharedTimerSeconds(consultationId, totalDurationSeconds);
      setTimeLeft(remaining);
      if (remaining <= 0 && onTimeUp) {
        onTimeUp();
      }
    };

    if (!isPaused) {
      syncTime();
      interval = setInterval(syncTime, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [consultationId, totalDurationSeconds, onTimeUp, isPaused]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const isWarning = timeLeft <= 60; // less than 1 min
  const isDanger = timeLeft <= 15; // less than 15s

  let color = '#059669'; // green
  if (isWarning) color = '#D97706'; // yellow
  if (isDanger) color = '#EF4444'; // red
  if (isPaused) color = '#64748B'; // gray

  return (
    <View style={[styles.container, { backgroundColor: `${color}15`, borderColor: color }]}>
      <Text style={[styles.timeText, { color }]}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums']
  }
});

export default ConsultationTimer;
