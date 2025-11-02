import { Redirect, Tabs } from 'expo-router';
import { Chrome as Home, Trophy, Settings, User, Users } from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { Alert } from 'react-native';
import { useEffect } from 'react';

export default function TabLayout() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      Alert.alert(
        "Giriş Gerekli",
        "Oyun oynamak, geçmişi görüntülemek ve profil ayarları için giriş yapmanız gerekiyor.",
        [{ text: "Tamam", style: "default" }]
      );
    }
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#94a3b8',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Menü',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          href: null, // Tab bar'dan gizle
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'arkidisler',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
        redirect={!user}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Geçmiş',
          tabBarIcon: ({ size, color }) => (
            <Trophy size={size} color={color} />
          ),
        }}
        redirect={!user}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
        redirect={!user}
      />
    </Tabs>
  );
}