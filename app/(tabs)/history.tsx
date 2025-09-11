import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, TrendingUp, Target, Award } from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { socketService } from '../../src/services/socketService';
import { API_URL } from '../../src/config/env';

export default function HistoryScreen() {
  const { user } = useAuth();
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

  const fetchGames = async () => {
    try {
      const res = await fetch(`${API_URL}/api/Matches/user/${userId}`);
      const data = await res.json();
      if (data.success) {
        const games = data.matches;
        updateStats(games);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const updateStats = (games: any[]) => {
    setRecentGames(games.slice(-5).reverse().map((game: any, i: number) => ({
      id: game._id || i,
      opponent: game.player1Id === userId ? game.player2Id : game.player1Id,
      result: game.winner === userId ? 'win' : (game.winner ? 'loss' : 'draw'),
      score: `${game.player1Score}-${game.player2Score}`,
      date: game.createdAt ? game.createdAt.substring(0, 10) : '',
    })));

    let wins = 0, losses = 0, draws = 0;
    games.forEach((g: any) => {
      if (g.winner === userId) wins++;
      else if (!g.winner) draws++;
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
    if (!userId) return;

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
  }, [userId]);

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

          {recentGames.map((game) => (
            <View key={game.id} style={styles.gameItem}>
              <View style={styles.gameInfo}>
                <Text style={styles.gameOpponent}>vs {game.opponent}</Text>
                <Text style={styles.gameDate}>{game.date}</Text>
              </View>
              <View style={styles.gameResult}>
                <Text style={styles.gameScore}>{game.score}</Text>
                <Text style={[styles.gameStatus, { color: getResultColor(game.result) }]}>
                  {getResultText(game.result)}
                </Text>
              </View>
            </View>
          ))}
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
});