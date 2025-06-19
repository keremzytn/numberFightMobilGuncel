import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bot, Users, Play, LogIn, UserPlus } from 'lucide-react-native';
import { useAuth } from '../../context/auth';

export default function HomeScreen() {
  const { user } = useAuth();

  const startBotGame = () => {
    router.push({
      pathname: '/game',
      params: { mode: 'bot' }
    });
  };

  const startOnlineGame = () => {
    router.push({
      pathname: '/game',
      params: { mode: 'online' }
    });
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Kart Savaşı</Text>
        <Text style={styles.subtitle}>Stratejik 7 Raund Mücadelesi</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.gameButton} onPress={startBotGame}>
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.buttonGradient}
          >
            <Bot size={32} color="#ffffff" />
            <Text style={styles.buttonText}>Bilgisayara Karşı</Text>
            <Text style={styles.buttonSubtext}>Yapay zeka ile oyna</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gameButton} onPress={startOnlineGame}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.buttonGradient}
          >
            <Users size={32} color="#ffffff" />
            <Text style={styles.buttonText}>Çevrimiçi Oyun</Text>
            <Text style={styles.buttonSubtext}>Gerçek oyuncularla eşleş</Text>
          </LinearGradient>
        </TouchableOpacity>

        {!user && (
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={[styles.authButton, styles.loginButton]}
              onPress={() => router.push('/login')}
            >
              <LogIn size={24} color="#ffffff" />
              <Text style={styles.authButtonText}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authButton, styles.registerButton]}
              onPress={() => router.push('/register')}
            >
              <UserPlus size={24} color="#ffffff" />
              <Text style={styles.authButtonText}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Play size={20} color="#94a3b8" />
        <Text style={styles.footerText}>Oyuna başlamak için bir mod seç</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  gameInfo: {
    marginBottom: 40,
  },
  infoCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  gameButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  authButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  loginButton: {
    backgroundColor: '#3b82f6',
  },
  registerButton: {
    backgroundColor: '#10b981',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});