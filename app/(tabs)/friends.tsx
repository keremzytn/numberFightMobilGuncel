import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { friendService, FriendDto, UserDto } from '../../src/services/friendService';
import { socketService } from '../../src/services/socketService';
import { useAuth } from '../../context/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../src/config/env';

type TabType = 'friends' | 'pending' | 'search';

interface OnlineStatus {
  [userId: string]: boolean;
}

interface FriendProfile {
  id: string;
  username: string;
  email: string;
  gold: number;
  createdAt: string;
  isOnline?: boolean;
}

export default function FriendsScreen() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendDto[]>([]);
  const [searchResults, setSearchResults] = useState<UserDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({});
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const loadFriends = useCallback(async () => {
    try {
      const friendsData = await friendService.getFriends('Accepted');
      setFriends(friendsData);
    } catch (error) {
      console.error('Arkadaşlar yüklenirken hata:', error);
      Alert.alert('Hata', 'Arkadaşlar yüklenemedi');
    }
  }, []);

  const loadPendingRequests = useCallback(async () => {
    try {
      const pendingData = await friendService.getPendingRequests();
      setPendingRequests(pendingData);
    } catch (error) {
      console.error('Bekleyen istekler yüklenirken hata:', error);
    }
  }, []);

  const searchUsers = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await friendService.searchUsers(term);
      setSearchResults(results);
    } catch (error) {
      console.error('Kullanıcı arama hatası:', error);
      Alert.alert('Hata', 'Kullanıcı arama başarısız');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendFriendRequest = async (friendUserId: string) => {
    try {
      await friendService.sendFriendRequest(friendUserId);
      Alert.alert('Başarılı', 'Arkadaşlık isteği gönderildi');
      // Remove from search results
      setSearchResults(prev => prev.filter(user => user.id !== friendUserId));
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Arkadaşlık isteği gönderilemedi');
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      await friendService.respondToFriendRequest(requestId, accept);
      Alert.alert('Başarılı', accept ? 'Arkadaşlık isteği kabul edildi' : 'Arkadaşlık isteği reddedildi');
      await loadPendingRequests();
      if (accept) {
        await loadFriends();
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'İşlem başarısız');
    }
  };

  const inviteFriend = async (friendUserId: string) => {
    try {
      await socketService.inviteFriend(friendUserId);
      Alert.alert('Başarılı', 'Oyun daveti gönderildi');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Oyun daveti gönderilemedi');
    }
  };

  const fetchFriendProfile = async (friendId: string) => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/Users/${friendId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedFriend(data);
        setShowProfileModal(true);
      } else {
        Alert.alert('Hata', 'Profil bilgileri yüklenemedi');
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      Alert.alert('Hata', 'Profil bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const deleteFriendship = async (friendId: string) => {
    Alert.alert(
      'Arkadaşlığı Sil',
      'Bu kullanıcıyla arkadaşlığınızı kesmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await friendService.deleteFriendship(friendId);
              if (result.success) {
                Alert.alert('Başarılı', 'Arkadaşlık ilişkisi silindi');
                setShowProfileModal(false);
                setSelectedFriend(null);
                await loadFriends();
              } else {
                Alert.alert('Hata', result.message || 'Arkadaşlık silinemedi');
              }
            } catch (error: any) {
              console.error('Arkadaşlık silme hatası:', error);
              Alert.alert('Hata', error.message || 'Arkadaşlık silinemedi');
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadFriends(), loadPendingRequests()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadFriends, loadPendingRequests]);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, [loadFriends, loadPendingRequests]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchUsers]);

  useEffect(() => {
    // Setup socket event listeners
    const handleFriendOnlineStatus = (data: { friendId: string; isOnline: boolean }) => {
      setOnlineStatus(prev => ({
        ...prev,
        [data.friendId]: data.isOnline
      }));
    };

    socketService.on('friendOnlineStatusChanged', handleFriendOnlineStatus);

    return () => {
      socketService.off('friendOnlineStatusChanged');
    };
  }, []);

  const renderFriend = ({ item }: { item: FriendDto }) => {
    const friend = item.userId === user?.id ? item.friendUser : item.user;
    const isOnline = onlineStatus[friend.id] ?? friend.isOnline;

    return (
      <TouchableOpacity
        style={styles.friendItem}
        onPress={() => fetchFriendProfile(friend.id)}
        activeOpacity={0.7}
      >
        <View style={styles.friendInfo}>
          <View style={styles.friendHeader}>
            <Text style={styles.friendName}>{friend.username}</Text>
            <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E' }]} />
          </View>
          <Text style={styles.friendEmail}>{friend.email}</Text>
        </View>
        {isOnline && (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={(e) => {
              e.stopPropagation();
              inviteFriend(friend.id);
            }}
          >
            <Text style={styles.inviteButtonText}>Davet Et</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderPendingRequest = ({ item }: { item: FriendDto }) => (
    <View style={styles.requestItem}>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.user.username}</Text>
        <Text style={styles.friendEmail}>{item.user.email}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => respondToRequest(item.id, true)}
        >
          <Ionicons name="checkmark" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => respondToRequest(item.id, false)}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }: { item: UserDto }) => (
    <View style={styles.searchItem}>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => sendFriendRequest(item.id)}
      >
        <Ionicons name="person-add" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Henüz arkadaşınız yok</Text>
            }
          />
        );
      case 'pending':
        return (
          <FlatList
            data={pendingRequests}
            renderItem={renderPendingRequest}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Bekleyen arkadaşlık isteği yok</Text>
            }
          />
        );
      case 'search':
        return (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Kullanıcı ara..."
                placeholderTextColor="#64748b"
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoCapitalize="none"
              />
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={styles.loadingIndicator} />
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  searchTerm.length >= 2 ? (
                    <Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>
                  ) : (
                    <Text style={styles.emptyText}>Aramak için en az 2 karakter girin</Text>
                  )
                }
              />
            )}
          </View>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Arkadaşlar</Text>
          <Text style={styles.subtitle}>Arkadaşlarınla oyna ve yeni arkadaşlar edin</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Arkadaşlar
            </Text>
            {friends.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{friends.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              İstekler
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.activeTab]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
              Ara
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {renderTabContent()}
        </View>
      </SafeAreaView>

      {/* Profil Detay Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Profil Detayları</Text>
                <TouchableOpacity
                  onPress={() => setShowProfileModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#f8fafc" />
                </TouchableOpacity>
              </View>

              {selectedFriend && (
                <View style={styles.profileContent}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {selectedFriend.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.profileInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Kullanıcı Adı:</Text>
                      <Text style={styles.infoValue}>{selectedFriend.username}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>E-posta:</Text>
                      <Text style={styles.infoValue}>{selectedFriend.email}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Gold:</Text>
                      <Text style={styles.goldValue}>💰 {selectedFriend.gold}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Kayıt Tarihi:</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(selectedFriend.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    {onlineStatus[selectedFriend.id] && (
                      <TouchableOpacity
                        style={[styles.modalButton, styles.inviteModalButton]}
                        onPress={() => {
                          inviteFriend(selectedFriend.id);
                          setShowProfileModal(false);
                        }}
                      >
                        <Ionicons name="game-controller" size={20} color="white" />
                        <Text style={styles.modalButtonText}>Oyuna Davet Et</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.modalButton, styles.deleteModalButton]}
                      onPress={() => deleteFriendship(selectedFriend.id)}
                    >
                      <Ionicons name="person-remove" size={20} color="white" />
                      <Text style={styles.modalButtonText}>Arkadaşlıktan Çıkar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  tabText: {
    fontSize: 15,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  friendInfo: {
    flex: 1,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
  },
  friendEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  inviteButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 12,
    color: '#94a3b8',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f8fafc',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  closeButton: {
    padding: 4,
  },
  profileContent: {
    padding: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatarText: {
    color: '#f59e0b',
    fontSize: 40,
    fontWeight: 'bold',
  },
  profileInfo: {
    gap: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '600',
  },
  goldValue: {
    fontSize: 18,
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  inviteModalButton: {
    backgroundColor: '#3b82f6',
  },
  deleteModalButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});