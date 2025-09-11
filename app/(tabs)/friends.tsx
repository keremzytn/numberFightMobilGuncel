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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { friendService, FriendDto, UserDto } from '../../src/services/friendService';
import { socketService } from '../../src/services/socketService';
import { useAuth } from '../../context/auth';

type TabType = 'friends' | 'pending' | 'search';

interface OnlineStatus {
  [userId: string]: boolean;
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendDto[]>([]);
  const [searchResults, setSearchResults] = useState<UserDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({});

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
      <View style={styles.friendItem}>
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
            onPress={() => inviteFriend(friend.id)}
          >
            <Text style={styles.inviteButtonText}>Davet Et</Text>
          </TouchableOpacity>
        )}
      </View>
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
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoCapitalize="none"
              />
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Arkadaşlar</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 5,
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
    padding: 15,
    backgroundColor: 'white',
    marginVertical: 1,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginVertical: 1,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginVertical: 1,
  },
  friendInfo: {
    flex: 1,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  addButton: {
    backgroundColor: '#007AFF',
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
    backgroundColor: 'white',
    margin: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});