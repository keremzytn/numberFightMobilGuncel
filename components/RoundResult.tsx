import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Zap, Shield } from 'lucide-react-native';
import { RoundResult as RoundResultType } from '@/utils/GameEngine';

interface RoundResultProps {
  result: RoundResultType;
  onDismiss: () => void;
}

export default function RoundResult({ result, onDismiss }: RoundResultProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getResultInfo = () => {
    if (result.winner === 1) {
      return {
        title: 'Sen Kazandın!',
        subtitle: `${result.player1Card} vs ${result.player2Card}`,
        icon: Trophy,
        colors: ['#10b981', '#059669'],
        iconColor: '#ffffff',
      };
    } else if (result.winner === 2) {
      return {
        title: 'Rakip Kazandı!',
        subtitle: `${result.player1Card} vs ${result.player2Card}`,
        icon: Shield,
        colors: ['#ef4444', '#dc2626'],
        iconColor: '#ffffff',
      };
    } else {
      return {
        title: 'Berabere!',
        subtitle: `${result.player1Card} vs ${result.player2Card}`,
        icon: Zap,
        colors: ['#f59e0b', '#d97706'],
        iconColor: '#ffffff',
      };
    }
  };

  const resultInfo = getResultInfo();
  const IconComponent = resultInfo.icon;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={resultInfo.colors}
            style={styles.resultCard}
          >
            <IconComponent size={48} color={resultInfo.iconColor} />
            <Text style={styles.resultTitle}>{resultInfo.title}</Text>
            <Text style={styles.resultSubtitle}>{resultInfo.subtitle}</Text>
            
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>
                {result.player1Score} - {result.player2Score}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    margin: 40,
  },
  resultCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  scoreContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});