import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, Clock, Trophy, Wifi, WifiOff } from 'lucide-react-native';

interface GameHeaderProps {
  currentRound: number;
  player1Score: number;
  player2Score: number;
  timeLeft: number;
  onBack: () => void;
  opponentType: string;
  isOnline?: boolean;
  isConnected?: boolean;
}

export default function GameHeader({
  currentRound,
  player1Score,
  player2Score,
  timeLeft,
  onBack,
  opponentType,
  isOnline = false,
  isConnected = false,
}: GameHeaderProps) {
  const getTimerColor = () => {
    if (timeLeft <= 5) return '#ef4444';
    if (timeLeft <= 10) return '#f59e0b';
    return '#10b981';
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ArrowLeft size={24} color="#f8fafc" />
      </TouchableOpacity>

      <View style={styles.centerInfo}>
        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>Raund {currentRound}/7</Text>
          {isOnline && (
            <View style={styles.connectionIndicator}>
              {isConnected ? (
                <Wifi size={12} color="#10b981" />
              ) : (
                <WifiOff size={12} color="#ef4444" />
              )}
            </View>
          )}
        </View>
        
        <View style={styles.timerContainer}>
          <Clock size={16} color={getTimerColor()} />
          <Text style={[styles.timerText, { color: getTimerColor() }]}>
            {timeLeft}s
          </Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>Sen</Text>
          <View style={styles.scoreCircle}>
            <Trophy size={16} color="#10b981" />
            <Text style={styles.scoreText}>{player1Score}</Text>
          </View>
        </View>
        
        <Text style={styles.scoreSeparator}>-</Text>
        
        <View style={styles.scoreItem}>
          <Text style={styles.playerLabel}>{opponentType}</Text>
          <View style={styles.scoreCircle}>
            <Trophy size={16} color="#ef4444" />
            <Text style={styles.scoreText}>{player2Score}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  centerInfo: {
    alignItems: 'center',
    gap: 8,
  },
  roundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 8,
  },
  roundText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  connectionIndicator: {
    padding: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreItem: {
    alignItems: 'center',
    gap: 4,
  },
  playerLabel: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  scoreSeparator: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
});