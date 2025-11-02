import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Bot, Users, Play, LogIn, UserPlus, Gamepad2, Trophy } from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { Link } from 'expo-router';
import FriendNotifications from '../../components/FriendNotifications';
import { authService } from '@/src/services/authService';
import { API_URL } from '@/src/config/env';

export default function HomeScreen() {
  const { user, updateUser } = useAuth();

  // Sayfa her açıldığında gold'u güncelle
  useFocusEffect(
    React.useCallback(() => {
      const refreshGold = async () => {
        if (!user) return;
        try {
          const token = await authService.getToken();
          const response = await fetch(`${API_URL}/api/Users/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            await updateUser({ gold: userData.gold });
          }
        } catch (error) {
          console.error('Gold güncellenirken hata:', error);
        }
      };
      refreshGold();
    }, [user?.id])
  );

  const startBotGame = () => {
    router.push({
      pathname: '/game',
      params: { mode: 'bot' }
    });
  };

  const startOnlineGame = () => {
    if (!user) {
      Alert.alert(
        'Giriş Gerekli',
        'Çevrimiçi oynamak için giriş yapmanız gerekiyor.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    router.push({
      pathname: '/game',
      params: { mode: 'online' }
    });
  };

  const handleGameInvitation = (gameId: string) => {
    router.push({
      pathname: '/game',
      params: { mode: 'friend', gameId }
    });
  };

  if (!user) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
        <View style={styles.welcomeContainer}>
          <Gamepad2 size={72} color="#f59e0b" style={styles.icon} />
          <Text style={styles.title}>Hoş Geldiniz!</Text>
          <Text style={styles.subtitle}>
            Oyun oynamak ve arkadaşlarınızla rekabet etmek için hesap oluşturun veya giriş yapın.
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Gamepad2 size={36} color="#10b981" />
              <Text style={styles.featureText}>Çevrimiçi Oyun</Text>
            </View>
            <View style={styles.featureItem}>
              <Trophy size={36} color="#f59e0b" />
              <Text style={styles.featureText}>Sıralama Tablosu</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={() => router.push('/login')}
            >
              <LogIn size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.registerButton]}
              onPress={() => router.push('/register')}
            >
              <UserPlus size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Kart Savaşı</Text>
        <Text style={styles.subtitle}>Stratejik 7 Raund Mücadelesi</Text>
        {user && (
          <View style={styles.goldDisplay}>
            <Text style={styles.goldText}>💰 {user.gold} Gold</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.gameButton} onPress={startBotGame}>
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Bot size={36} color="#ffffff" />
            <Text style={styles.buttonText}>Bilgisayara Karşı</Text>
            <Text style={styles.buttonSubtext}>Yapay zeka ile oyna</Text>
            <Text style={styles.entryFee}>🎫 10 Gold</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gameButton} onPress={startOnlineGame}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Users size={36} color="#ffffff" />
            <Text style={styles.buttonText}>Çevrimiçi Oyun</Text>
            <Text style={styles.buttonSubtext}>Gerçek oyuncularla eşleş</Text>
            <Text style={styles.entryFee}>🎫 25 Gold</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Play size={20} color="#94a3b8" />
        <Text style={styles.footerText}>Oyuna başlamak için bir mod seç</Text>
      </View>

      <FriendNotifications onGameInvitation={handleGameInvitation} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
    maxWidth: '80%',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 48,
  },
  featureItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 24,
    borderRadius: 20,
    width: '47%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureText: {
    color: '#f8fafc',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  loginButton: {
    backgroundColor: '#2563eb',
  },
  registerButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 48,
  },
  gameButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  buttonSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 16,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
  },
  goldDisplay: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  goldText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  entryFee: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '600',
  },
});