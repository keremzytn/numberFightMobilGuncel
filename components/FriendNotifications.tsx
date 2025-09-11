import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { socketService } from '../src/services/socketService';

interface GameInvitation {
  gameId: string;
  fromUserId: string;
  fromUsername: string;
}

interface FriendNotificationsProps {
  onGameInvitation?: (gameId: string) => void;
}

export default function FriendNotifications({ onGameInvitation }: FriendNotificationsProps) {
  const [gameInvitation, setGameInvitation] = useState<GameInvitation | null>(null);
  const [showInvitation, setShowInvitation] = useState(false);

  useEffect(() => {
    const handleGameInvitation = (data: GameInvitation) => {
      setGameInvitation(data);
      setShowInvitation(true);
    };

    const handleInvitationDeclined = (data: { friendUserId: string }) => {
      Alert.alert('Davet Reddedildi', 'Arkadaşınız oyun davetinizi reddetti.');
    };

    const handleInvitationAccepted = (data: { gameId: string; isPlayer1: boolean; opponentId: string }) => {
      Alert.alert('Davet Kabul Edildi', 'Arkadaşınız oyun davetinizi kabul etti!');
      onGameInvitation?.(data.gameId);
    };

    socketService.on('friendGameInvitation', handleGameInvitation);
    socketService.on('invitationDeclined', handleInvitationDeclined);
    socketService.on('invitationAccepted', handleInvitationAccepted);

    return () => {
      socketService.off('friendGameInvitation');
      socketService.off('invitationDeclined');
      socketService.off('invitationAccepted');
    };
  }, [onGameInvitation]);

  const respondToInvitation = async (accept: boolean) => {
    if (!gameInvitation) return;

    try {
      await socketService.respondToInvitation(gameInvitation.gameId, accept);
      setShowInvitation(false);
      setGameInvitation(null);

      if (accept) {
        onGameInvitation?.(gameInvitation.gameId);
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'İşlem başarısız');
    }
  };

  if (!showInvitation || !gameInvitation) {
    return null;
  }

  return (
    <Modal
      visible={showInvitation}
      transparent
      animationType="fade"
      onRequestClose={() => setShowInvitation(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Ionicons name="game-controller" size={32} color="#007AFF" />
            <Text style={styles.title}>Oyun Daveti</Text>
          </View>
          
          <Text style={styles.message}>
            <Text style={styles.username}>{gameInvitation.fromUsername}</Text>
            {' '}sizi bir oyuna davet ediyor!
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => respondToInvitation(false)}
            >
              <Text style={styles.rejectButtonText}>Reddet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => respondToInvitation(true)}
            >
              <Text style={styles.acceptButtonText}>Kabul Et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  username: {
    fontWeight: '600',
    color: '#007AFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
  },
  rejectButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});