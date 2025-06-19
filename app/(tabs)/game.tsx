import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Clock, User, Bot, Trophy, ArrowLeft, Wifi, WifiOff } from 'lucide-react-native';
import { GameEngine } from '@/utils/GameEngine';
import { BotPlayer } from '@/utils/BotPlayer';
import { socketManager, GameState, RoundResult as RoundResultType, GameEndResult } from '@/utils/SocketManager';
import CardComponent from '@/components/CardComponent';
import GameHeader from '@/components/GameHeader';
import RoundResult from '@/components/RoundResult';
import { useAuth } from '../../context/auth';

export default function GameScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const [gameEngine] = useState(() => new GameEngine());
  const [botPlayer] = useState(() => new BotPlayer());
  const { user } = useAuth();

  // Local game state (for bot mode)
  const [localGameState, setLocalGameState] = useState(gameEngine.getGameState());

  // Online game state
  const [onlineGameState, setOnlineGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'found' | 'playing'>('idle');

  // Common game state
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showResult, setShowResult] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState<any>(null);
  const [opponentPlayed, setOpponentPlayed] = useState(false);

  // Get current game state based on mode
  const currentGameState = mode === 'online' ? onlineGameState : localGameState;

  // Initialize online game
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

  const initializeOnlineGame = async () => {
    try {
      await socketManager.connect();
      setIsConnected(true);

      // Set up event listeners
      socketManager.on('waitingForMatch', () => {
        setMatchStatus('searching');
      });

      socketManager.on('matchFound', (data: { gameId: string }) => {
        setMatchStatus('found');
        setGameId(data.gameId);
        setTimeout(() => {
          setMatchStatus('playing');
        }, 2000);
      });

      socketManager.on('roundStart', (gameState: GameState) => {
        setOnlineGameState(gameState);
        setTimeLeft(30);
        setSelectedCard(null);
        setShowResult(false);
        setOpponentPlayed(false);
      });

      socketManager.on('opponentPlayed', () => {
        setOpponentPlayed(true);
      });

      socketManager.on('roundResult', (result: RoundResultType) => {
        setLastRoundResult({
          round: result.round,
          player1Card: result.opponentCard,
          player2Card: result.player1Card, // Swap for display
          winner: result.isWinner ? 2 : (result.winner ? 1 : null),
          player1Score: result.player1Score,
          player2Score: result.player2Score,
        });
        setShowResult(true);

        setTimeout(() => {
          setOnlineGameState(prev => prev ? {
            ...prev,
            player1Score: result.player1Score,
            player2Score: result.player2Score,
            currentRound: prev.currentRound + 1
          } : null);
        }, 2000);
      });

      socketManager.on('gameEnd', (result: GameEndResult) => {
        showOnlineGameEndDialog(result);
      });

      socketManager.on('opponentLeft', () => {
        Alert.alert('Oyun Bitti', 'Rakibiniz oyunu terk etti.', [
          { text: 'Ana Menü', onPress: () => router.push('/') }
        ]);
      });

      socketManager.on('opponentDisconnected', () => {
        Alert.alert('Bağlantı Sorunu', 'Rakibinizin bağlantısı kesildi.', [
          { text: 'Ana Menü', onPress: () => router.push('/') }
        ]);
      });

      socketManager.on('connect', () => {
        console.log('Socket bağlantısı başarılı');
      });

      socketManager.on('error', (error: Error) => {
        // ... existing code ...
      });

      // Start matchmaking
      socketManager.findMatch();

    } catch (error) {
      console.error('Failed to connect to server:', error);
      setIsConnected(false);
      Alert.alert(
        'Bağlantı Hatası',
        'Sunucuya bağlanılamadı. Bot modunda oynamak ister misiniz?',
        [
          { text: 'Ana Menü', onPress: () => router.push('/') },
          { text: 'Bot Modu', onPress: () => router.setParams({ mode: 'bot' }) }
        ]
      );
    }
  };

  const cleanup = () => {
    if (gameId) {
      socketManager.leaveGame(gameId);
    }
    socketManager.disconnect();
  };

  // Timer effect
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

  // Reset timer on new round
  useEffect(() => {
    if (currentGameState?.status === 'playing') {
      setTimeLeft(30);
      setSelectedCard(null);
      setShowResult(false);
    }
  }, [currentGameState?.currentRound]);

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
  }, [mode, onlineGameState]);

  const playCard = (cardNumber: number) => {
    if (selectedCard !== null) return;

    setSelectedCard(cardNumber);

    if (mode === 'online' && gameId) {
      // Online mode
      socketManager.playCard(gameId, cardNumber);
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

    // Maç sonucunu backend'e kaydet
    if (user) {
      fetch('http://localhost:3000/api/match', {
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
    }

    Alert.alert(
      'Oyun Bitti',
      message,
      [
        { text: 'Ana Menü', onPress: () => router.push('/') },
        { text: 'Tekrar Oyna', onPress: resetGame }
      ]
    );
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
      fetch('http://localhost:3000/api/match', {
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

  const goBack = () => {
    if (mode === 'online' && gameId) {
      socketManager.leaveGame(gameId);
    }
    router.push('/');
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
          <Text style={styles.statusTitle}>Oyun Yükleniyor...</Text>
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
        currentRound={currentGameState.currentRound}
        player1Score={currentGameState.player1Score}
        player2Score={currentGameState.player2Score}
        timeLeft={timeLeft}
        onBack={goBack}
        opponentType={mode === 'bot' ? 'Bot' : 'Oyuncu'}
        isOnline={mode === 'online'}
        isConnected={isConnected}
      />

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
    gap: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});