import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Clock, User, Bot, Trophy, ArrowLeft, Wifi, WifiOff } from 'lucide-react-native';
import { GameEngine } from '@/utils/GameEngine';
import { BotPlayer } from '@/utils/BotPlayer';
import { socketService, GameState, RoundResult as RoundResultType, GameEndResult } from '@/src/services/socketService';
import { API_URL } from '@/src/config/env';
import CardComponent from '@/components/CardComponent';
import GameHeader from '@/components/GameHeader';
import RoundResult from '@/components/RoundResult';
import { useAuth } from '../../context/auth';

interface ErrorType {
  type: 'connection' | 'game';
  message: string;
  details?: any;
}

interface DisconnectReason {
  reason: string;
}

interface ReconnectAttempt {
  attempt: number;
}

export default function GameScreen() {
  // Router ve Auth hooks
  const params = useLocalSearchParams<{ mode: string }>();
  const { user } = useAuth();
  const requestedMode = (params?.mode || 'bot') as 'bot' | 'online';
  // Çevrimiçi mod için giriş kontrolü
  const mode = (!user && requestedMode === 'online') ? 'bot' : requestedMode;

  // Giriş yapmamış kullanıcı çevrimiçi modu seçtiyse uyarı göster
  useEffect(() => {
    if (!user && requestedMode === 'online') {
      Alert.alert(
        'Giriş Gerekli',
        'Çevrimiçi oynamak için giriş yapmanız gerekiyor.',
        [
          { text: 'Giriş Yap', onPress: () => router.push('/login') },
          { text: 'Bot ile Oyna', style: 'default' }
        ]
      );
    }
  }, [user, requestedMode]);

  // Game engine states
  const [gameEngine] = useState(() => new GameEngine());
  const [botPlayer] = useState(() => new BotPlayer());
  const [localGameState, setLocalGameState] = useState(gameEngine.getGameState());

  // Online game states
  const [onlineGameState, setOnlineGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'found' | 'playing'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  // UI states
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showResult, setShowResult] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState<any>(null);
  const [opponentPlayed, setOpponentPlayed] = useState(false);
  const [loadingProgress] = useState(new Animated.Value(0));

  // Current game state
  const currentGameState = mode === 'online' ? onlineGameState : localGameState;

  // Effects
  useEffect(() => {
    if (mode === 'online') {
      initializeOnlineGame();
    }
    return () => {
      if (mode === 'online') {
        cleanup();
      }
    };
  }, [mode]);

  useEffect(() => {
    if (currentGameState?.status === 'playing' && timeLeft > 0 && matchStatus === 'playing') {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && currentGameState?.status === 'playing') {
      handleAutoCardSelection();
    }
  }, [timeLeft, currentGameState?.status, matchStatus]);

  useEffect(() => {
    if (currentGameState?.status === 'playing') {
      setTimeLeft(30);
      setSelectedCard(null);
      setShowResult(false);
    }
  }, [currentGameState?.currentRound]);

  useEffect(() => {
    let isSubscribed = true;

    const animate = () => {
      if (!isSubscribed) return;

      Animated.sequence([
        Animated.timing(loadingProgress, {
          toValue: 100,
          duration: 2000,
          useNativeDriver: false
        }),
        Animated.timing(loadingProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false
        })
      ]).start(() => {
        if (isSubscribed) {
          animate();
        }
      });
    };

    if (!currentGameState) {
      animate();
    }

    return () => {
      isSubscribed = false;
      loadingProgress.setValue(0);
    };
  }, [currentGameState]);

  // Callbacks
  const handleAutoCardSelection = useCallback(() => {
    if (mode === 'online' && onlineGameState) {
      const validCards = onlineGameState.validCards;
      if (validCards.length > 0) {
        const lowestCard = Math.min(...validCards);
        playCard(lowestCard);
      }
    } else {
      const validCards = gameEngine.getValidCards(1);
      if (validCards.length > 0) {
        const lowestCard = Math.min(...validCards);
        playCard(lowestCard);
      }
    }
  }, [mode, onlineGameState, gameEngine]);

  const goBack = useCallback(() => {
    cleanup();
    router.push('/');
  }, [mode, gameId]);

  const cleanup = () => {
    if (mode === 'online') {
      socketService.off('connected');
      socketService.off('disconnected');
      socketService.off('reconnecting');
      socketService.off('error');
      socketService.off('waitingForMatch');
      socketService.off('matchFound');
      socketService.off('gameState');
      socketService.off('opponentPlayed');
      socketService.off('roundResult');
      socketService.off('gameEnd');
      socketService.off('opponentLeft');
      socketService.off('opponentDisconnected');
      socketService.disconnect();
    }
    setOnlineGameState(null);
    setGameId(null);
    setMatchStatus('idle');
    setIsConnected(false);
    setConnectionError(null);
    setReconnecting(false);
  };

  const initializeOnlineGame = async () => {
    try {
      cleanup();
      await socketService.connect();
      setIsConnected(true);
      setConnectionError(null);

      const checkConnection = () => {
        const connected = socketService.isConnected();
        setIsConnected(connected);
        return connected;
      };

      socketService.off('waitingForMatch');
      socketService.on('waitingForMatch', () => {
        console.log('Eşleşme bekleniyor...');
        setMatchStatus('searching');
      });

      socketService.off('matchFound');
      socketService.on('matchFound', (data: { gameId: string; isPlayer1: boolean; opponentId: string }) => {
        console.log('Eşleşme bulundu:', data);
        setMatchStatus('found');
        setGameId(data.gameId);
      });

      socketService.off('gameState');
      socketService.on('gameState', (gameState: GameState) => {
        console.log('Oyun durumu:', gameState);
        setMatchStatus('playing');
        setOnlineGameState(gameState);
        setTimeLeft(30);
        setSelectedCard(null);
        setShowResult(false);
        setOpponentPlayed(false);
      });

      socketService.off('opponentPlayed');
      socketService.on('opponentPlayed', () => {
        setOpponentPlayed(true);
      });

      socketService.off('roundResult');
      socketService.on('roundResult', (result: RoundResultType) => {
        console.log('Round sonucu:', result);
        setLastRoundResult({
          round: result.round,
          player1Card: result.opponentCard,
          player2Card: result.player1Card,
          winner: result.isWinner ? 2 : (result.winner ? 1 : null),
          player1Score: result.player1Score,
          player2Score: result.player2Score,
        });
        setShowResult(true);
      });

      socketService.off('gameEnd');
      socketService.on('gameEnd', (result: GameEndResult) => {
        console.log('Oyun bitti:', result);
        showOnlineGameEndDialog(result);
      });

      socketService.off('error');
      socketService.on('error', (error: string) => {
        console.error('Oyun hatası:', error);
        Alert.alert('Hata', error);
      });

      // Start matchmaking
      console.log('Eşleşme aranıyor...');
      await socketService.findMatch('online');

    } catch (error) {
      console.error('Sunucuya bağlanma hatası:', error);
      setConnectionError('Sunucuya bağlanılamadı');
      setIsConnected(false);
    }
  };

  const playCard = (cardNumber: number) => {
    if (selectedCard !== null) return;

    setSelectedCard(cardNumber);

    if (mode === 'online' && gameId) {
      // Online mode
      socketService.playCard(gameId, cardNumber);
    } else {
      // Bot mode
      let botCard = botPlayer.selectCard(gameEngine.getValidCards(2), localGameState);

      const result = gameEngine.playRound(cardNumber, botCard);
      setLastRoundResult(result);
      setShowResult(true);

      setTimeout(() => {
        setLocalGameState(gameEngine.getGameState());
        if (gameEngine.getGameState().status === 'finished') {
          showGameEndDialog();
        }
      }, 2000);
    }
  };

  const showGameEndDialog = () => {
    const state = gameEngine.getGameState();
    let message = '';
    if (state.player1Score > state.player2Score) {
      message = 'Tebrikler! Oyunu kazandınız! 🏆';
    } else if (state.player1Score < state.player2Score) {
      message = 'Kaybettiniz! Tekrar deneyin. 😞';
    } else {
      message = 'Berabere! İyi oyun! 🤝';
    }

    // Maç sonucunu backend'e kaydet (sadece giriş yapmış kullanıcılar için)
    if (user) {
      fetch(`${API_URL}/api/Matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Id: user.id,
          player2Id: 'bot',
          player1Score: state.player1Score,
          player2Score: state.player2Score,
          winner: state.player1Score > state.player2Score ? user.id : (state.player1Score < state.player2Score ? 'bot' : null),
          createdAt: new Date().toISOString(),
          mode: 'bot',
        })
      });
      Alert.alert(
        'Oyun Bitti',
        message,
        [
          { text: 'Ana Menü', onPress: () => router.push('/') },
          { text: 'Tekrar Oyna', onPress: resetGame }
        ]
      );
    } else {
      Alert.alert(
        'Oyun Bitti',
        message + '\n\nMaç sonuçlarını kaydetmek ve çevrimiçi oynamak için giriş yapın!',
        [
          { text: 'Giriş Yap', onPress: () => router.push('/login') },
          { text: 'Ana Menü', onPress: () => router.push('/') },
          { text: 'Tekrar Oyna', onPress: resetGame }
        ]
      );
    }
  };

  const showOnlineGameEndDialog = (result: GameEndResult) => {
    let message = '';
    if (result.isWinner) {
      message = 'Tebrikler! Oyunu kazandınız! 🏆';
    } else if (result.winner) {
      message = 'Kaybettiniz! İyi oyun! 😞';
    } else {
      message = 'Berabere! İyi oyun! 🤝';
    }

    // Maç sonucunu backend'e kaydet
    if (user && onlineGameState) {
      fetch(`${API_URL}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Id: user.id,
          player2Id: onlineGameState.opponentId || 'unknown',
          player1Score: onlineGameState.player1Score,
          player2Score: onlineGameState.player2Score,
          winner: result.isWinner ? user.id : (result.winner ? onlineGameState.opponentId : null),
          createdAt: new Date().toISOString(),
          mode: 'online',
        })
      });
    }

    Alert.alert(
      'Oyun Bitti',
      message,
      [
        { text: 'Ana Menü', onPress: () => router.push('/') },
        {
          text: 'Tekrar Oyna', onPress: () => {
            setMatchStatus('idle');
            initializeOnlineGame();
          }
        }
      ]
    );
  };

  const resetGame = () => {
    gameEngine.resetGame();
    setLocalGameState(gameEngine.getGameState());
    setSelectedCard(null);
    setTimeLeft(30);
    setShowResult(false);
  };

  // Show loading/matching screen for online mode
  if (mode === 'online' && matchStatus !== 'playing') {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#f8fafc" />
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>

          <View style={styles.statusContainer}>
            {isConnected ? (
              <Wifi size={48} color="#10b981" />
            ) : (
              <WifiOff size={48} color="#ef4444" />
            )}

            <Text style={styles.statusTitle}>
              {matchStatus === 'searching' && 'Rakip Aranıyor...'}
              {matchStatus === 'found' && 'Rakip Bulundu!'}
              {matchStatus === 'idle' && !isConnected && 'Bağlanıyor...'}
              {matchStatus === 'idle' && isConnected && 'Hazırlanıyor...'}
            </Text>

            <Text style={styles.statusSubtitle}>
              {matchStatus === 'searching' && 'Uygun bir rakip bekleniyor'}
              {matchStatus === 'found' && 'Oyun başlıyor...'}
              {matchStatus === 'idle' && !isConnected && 'Sunucuya bağlanılıyor'}
              {matchStatus === 'idle' && isConnected && 'Eşleşme sistemi hazırlanıyor'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (!currentGameState) {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#f8fafc" />
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={styles.statusTitle}>Oyun Yükleniyor...</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[
                styles.progressFill,
                {
                  width: loadingProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}>
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.progressGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
            <Text style={styles.progressText}>Oyun hazırlanıyor...</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  const validCards = mode === 'online'
    ? (onlineGameState?.validCards || [])
    : gameEngine.getValidCards(1);

  const forbiddenCards = mode === 'online'
    ? (onlineGameState?.forbiddenCards || [])
    : localGameState.player1ForbiddenCards;

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <GameHeader
        currentRound={currentGameState?.currentRound || 1}
        player1Score={currentGameState?.player1Score || 0}
        player2Score={currentGameState?.player2Score || 0}
        timeLeft={timeLeft}
        onBack={goBack}
        opponentType={mode === 'bot' ? 'Bot' : 'Rakip'}
        isOnline={mode === 'online'}
        isConnected={isConnected}
      />

      {mode === 'online' && (
        <View style={styles.connectionStatus}>
          {isConnected ? (
            <Wifi size={20} color="green" />
          ) : (
            <WifiOff size={20} color="red" />
          )}
          {connectionError && (
            <Text style={styles.errorText}>{connectionError}</Text>
          )}
          {reconnecting && (
            <ActivityIndicator size="small" color="#0000ff" />
          )}
        </View>
      )}

      {showResult && lastRoundResult && (
        <RoundResult
          result={lastRoundResult}
          onDismiss={() => setShowResult(false)}
        />
      )}

      <View style={styles.gameArea}>
        <View style={styles.opponentArea}>
          <View style={styles.playerInfo}>
            {mode === 'bot' ? <Bot size={24} color="#f59e0b" /> : <User size={24} color="#3b82f6" />}
            <Text style={styles.playerName}>
              {mode === 'bot' ? 'Bot' : 'Rakip'}
            </Text>
            {mode === 'online' && opponentPlayed && (
              <View style={styles.playedIndicator}>
                <Text style={styles.playedText}>Kart Seçti</Text>
              </View>
            )}
          </View>
          <View style={styles.cardBack}>
            <Text style={styles.cardBackText}>?</Text>
          </View>
        </View>

        <View style={styles.centerArea}>
          <View style={styles.roundInfo}>
            <Text style={styles.roundText}>
              Raund {currentGameState.currentRound}/7
            </Text>
            <View style={styles.timerContainer}>
              <Clock size={20} color="#f59e0b" />
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
          </View>
        </View>

        <View style={styles.playerArea}>
          <View style={styles.playerInfo}>
            <User size={24} color="#10b981" />
            <Text style={styles.playerName}>Sen</Text>
          </View>

          <View style={styles.cardsContainer}>
            {[1, 2, 3, 4, 5, 6, 7].map((cardNumber) => (
              <CardComponent
                key={cardNumber}
                number={cardNumber}
                isValid={validCards.includes(cardNumber)}
                isUsed={mode === 'online'
                  ? !validCards.includes(cardNumber) && !forbiddenCards.includes(cardNumber)
                  : localGameState.player1UsedCards.includes(cardNumber)
                }
                isSelected={selectedCard === cardNumber}
                onPress={() => playCard(cardNumber)}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Yasak kartlar: {forbiddenCards.length > 0 ?
            forbiddenCards.join(', ') : 'Yok'}
        </Text>
        {mode === 'online' && (
          <View style={styles.connectionStatus}>
            {isConnected ? (
              <Wifi size={16} color="#10b981" />
            ) : (
              <WifiOff size={16} color="#ef4444" />
            )}
            <Text style={[styles.connectionText, { color: isConnected ? '#10b981' : '#ef4444' }]}>
              {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
  },
  backText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    gap: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  opponentArea: {
    alignItems: 'center',
    marginTop: 20,
  },
  playerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  playedIndicator: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  playedText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  cardBack: {
    width: 80,
    height: 120,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundInfo: {
    alignItems: 'center',
    gap: 12,
  },
  roundText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  infoBar: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    gap: 8,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
    marginTop: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  progressText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
});