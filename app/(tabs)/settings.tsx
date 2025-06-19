import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings as SettingsIcon, Volume2, VolumeX, Smartphone, Info } from 'lucide-react-native';

export default function SettingsScreen() {
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [vibrationEnabled, setVibrationEnabled] = React.useState(true);

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <View style={styles.header}>
        <SettingsIcon size={32} color="#f59e0b" />
        <Text style={styles.title}>Ayarlar</Text>
      </View>

      <View style={styles.settingsContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ses ve Titreşim</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              {soundEnabled ? (
                <Volume2 size={24} color="#10b981" />
              ) : (
                <VolumeX size={24} color="#6b7280" />
              )}
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Ses Efektleri</Text>
                <Text style={styles.settingDescription}>
                  Oyun seslerini aç/kapat
                </Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#374151', true: '#10b981' }}
              thumbColor={soundEnabled ? '#ffffff' : '#9ca3af'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Smartphone size={24} color={vibrationEnabled ? '#10b981' : '#6b7280'} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Titreşim</Text>
                <Text style={styles.settingDescription}>
                  Dokunsal geri bildirimi etkinleştir
                </Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: '#374151', true: '#10b981' }}
              thumbColor={vibrationEnabled ? '#ffffff' : '#9ca3af'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oyun Bilgileri</Text>
          
          <View style={styles.infoCard}>
            <Info size={24} color="#3b82f6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Kart Savaşı v1.0</Text>
              <Text style={styles.infoDescription}>
                Stratejik kart oyunu - Her kartı akıllıca kullan!
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rulesSection}>
          <Text style={styles.sectionTitle}>Oyun Kuralları</Text>
          <View style={styles.rulesCard}>
            <Text style={styles.ruleItem}>• 7 raund sürer, her raundda bir kart oyna</Text>
            <Text style={styles.ruleItem}>• Büyük kart raundu kazanır ve 1 puan alır</Text>
            <Text style={styles.ruleItem}>• Kullandığın kartın ±1'ini sonraki raundda kullanamazsın</Text>
            <Text style={styles.ruleItem}>• Her raund 30 saniye, süre dolunca otomatik seçim</Text>
            <Text style={styles.ruleItem}>• En fazla puan alan oyuncu oyunu kazanır</Text>
          </View>
        </View>
      </View>
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
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  rulesSection: {
    marginBottom: 30,
  },
  rulesCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  ruleItem: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
    lineHeight: 20,
  },
});