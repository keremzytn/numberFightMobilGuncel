import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CardComponentProps {
  number: number;
  isValid: boolean;
  isUsed: boolean;
  isSelected: boolean;
  onPress: () => void;
}

export default function CardComponent({ 
  number, 
  isValid, 
  isUsed, 
  isSelected, 
  onPress 
}: CardComponentProps) {
  const getCardColors = () => {
    if (isUsed) {
      return ['#374151', '#4b5563']; // Gray for used cards
    }
    if (!isValid) {
      return ['#7f1d1d', '#991b1b']; // Red for forbidden cards
    }
    if (isSelected) {
      return ['#f59e0b', '#d97706']; // Gold for selected card
    }
    return ['#1e40af', '#3b82f6']; // Blue for valid cards
  };

  const getTextColor = () => {
    if (isUsed) return '#9ca3af';
    if (!isValid) return '#fca5a5';
    return '#ffffff';
  };

  return (
    <TouchableOpacity
      onPress={isValid && !isUsed ? onPress : undefined}
      disabled={isUsed || !isValid}
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        (!isValid || isUsed) && styles.disabledCard,
      ]}
    >
      <LinearGradient
        colors={getCardColors()}
        style={styles.cardGradient}
      >
        <Text style={[styles.cardNumber, { color: getTextColor() }]}>
          {number}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 48,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    margin: 2,
  },
  selectedCard: {
    elevation: 8,
    shadowOpacity: 0.5,
    transform: [{ scale: 1.1 }],
  },
  disabledCard: {
    elevation: 1,
    shadowOpacity: 0.1,
  },
  cardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});