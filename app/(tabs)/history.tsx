import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, TrendingUp, Target, Award } from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { socketService } from '../../src/services/socketService';
import { API_URL } from '../../src/config/env';

export default function HistoryScreen() {
  const { user, token } = useAuth();
  const userId = user?.id;
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    bestStreak: 0,
  });
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [opponentNames, setOpponentNames] = useState<{ [key: string]: string }>({});

  const fetchGames = async () => {
    if (!userId || !token) return;

    try {
      const res = await fetch(`${API_URL}/api/Matches/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Response kontrolü
      if (!res.ok) {
        console.log('Matches API yanıt hatası:', res.status);
        return;
      }

      // Response body boş mu kontrol et
      const text = await res.text();
      if (!text) {
        console.log('Matches API boş yanıt döndü - henüz maç oynanmamış');
        return;
      }

      // JSON parse et
      const data = JSON.parse(text);

      // Backend direkt array döndürüyor
      if (Array.isArray(data)) {
        updateStats(data);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchOpponentName = async (opponentId: string) => {
    if (opponentNames[opponentId]) return;

    try {
      const res = await fetch(`${API_URL}/api/Users/${opponentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setOpponentNames(prev => ({ ...prev, [opponentId]: userData.username }));
      }
    } catch (error) {
      console.error('Rakip adı alınırken hata:', error);
    }
  };

  const updateStats = (games: any[]) => {
    if (!games || games.length === 0) {
      return;
    }

    const recentGamesList = games.slice(-5).reverse().map((game: any, i: number) => {
      const opponentId = game.player1Id === userId ? game.player2Id : game.player1Id;

      // Rakip adını fetch et
      fetchOpponentName(opponentId);

      return {
        id: game.id || i,
        opponentId,
        opponent: opponentNames[opponentId] || opponentId,
        result: game.winnerId === userId ? 'win' : (game.winnerId ? 'loss' : 'draw'),
        score: `${game.player1Score}-${game.player2Score}`,
        date: game.createdAt ? new Date(game.createdAt).toLocaleDateString('tr-TR') : '',
      };
    });

    setRecentGames(recentGamesList);

    let wins = 0, losses = 0, draws = 0;
    games.forEach((g: any) => {
      if (g.winnerId === userId) wins++;
      else if (!g.winnerId) draws++;
      else losses++;
    });

    setStats({
      totalGames: games.length,
      wins,
      losses,
      draws,
      winRate: games.length ? Math.round((wins / games.length) * 100) : 0,
      bestStreak: 0,
    });
  };

  useEffect(() => {
    if (!userId || !token) return;

    fetchGames();

    const connectSocket = async () => {
      try {
        await socketService.connect();
        console.log('SignalR connected');

        socketService.on('MatchUpdated', () => {
          fetchGames();
        });
      } catch (error) {
        console.error('SignalR connection error:', error);
      }
    };

    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, [userId, token]);

  // Rakip isimleri güncellendiğinde oyunları yeniden render et
  useEffect(() => {
    if (recentGames.length > 0 && Object.keys(opponentNames).length > 0) {
      setRecentGames(prev => prev.map(game => ({
        ...game,
        opponent: opponentNames[game.opponentId] || game.opponent
      })));
    }
  }, [opponentNames]);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
          Maç geçmişini görüntülemek için giriş yapmalısın.
        </Text>
      </View>
    );
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return '#10b981';
      case 'loss': return '#ef4444';
      case 'draw': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'win': return 'Kazandı';
      case 'loss': return 'Kaybetti';
      case 'draw': return 'Berabere';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Trophy size={32} color="#f59e0b" />
          <Text style={styles.title}>Oyun İstatistikleri</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Award size={24} color="#10b981" />
            <Text style={styles.statNumber}>{stats.wins}</Text>
            <Text style={styles.statLabel}>Kazanılan</Text>
          </View>

          <View style={styles.statCard}>
            <Target size={24} color="#ef4444" />
            <Text style={styles.statNumber}>{stats.losses}</Text>
            <Text style={styles.statLabel}>Kaybedilen</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>%{stats.winRate}</Text>
            <Text style={styles.statLabel}>Kazanma Oranı</Text>
          </View>
        </View>

        <View style={styles.additionalStats}>
          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>Toplam Oyun</Text>
            <Text style={styles.additionalStatValue}>{stats.totalGames}</Text>
          </View>
          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>Beraberlik</Text>
            <Text style={styles.additionalStatValue}>{stats.draws}</Text>
          </View>
          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>En İyi Seri</Text>
            <Text style={styles.additionalStatValue}>{stats.bestStreak}</Text>
          </View>
        </View>

        <View style={styles.recentGamesSection}>
          <Text style={styles.sectionTitle}>Son Oyunlar</Text>

          {recentGames.length > 0 ? (
            recentGames.map((game) => (
              <View key={game.id} style={styles.gameItem}>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameOpponent}>vs {opponentNames[game.opponentId] || game.opponent}</Text>
                  <Text style={styles.gameDate}>{game.date}</Text>
                </View>
                <View style={styles.gameResult}>
                  <Text style={styles.gameScore}>{game.score}</Text>
                  <Text style={[styles.gameStatus, { color: getResultColor(game.result) }]}>
                    {getResultText(game.result)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noGamesText}>Henüz oyun geçmişiniz yok</Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  additionalStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 15,
  },
  additionalStatItem: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  additionalStatLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  additionalStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  recentGamesSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  gameItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  gameInfo: {
    flex: 1,
  },
  gameOpponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  gameDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  gameResult: {
    alignItems: 'flex-end',
  },
  gameScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 4,
  },
  gameStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  noGamesText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
  },
});