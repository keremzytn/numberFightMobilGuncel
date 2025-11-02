import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/auth';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { API_URL } from '../../src/config/env';

export default function ProfileScreen() {
    const { user, logout, updateUser, token } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Backend'den güncel kullanıcı bilgilerini çek
        const fetchUserProfile = async () => {
            if (!user?.id || !token) return;

            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/Users/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const userData = await response.json();
                    await updateUser({
                        gold: userData.gold,
                        createdAt: userData.createdAt,
                    });
                }
            } catch (error) {
                console.error('Profil bilgileri yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [user?.id]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    // Avatar için baş harf
    const avatarLetter = user?.username ? user.username.charAt(0).toUpperCase() : '?';

    // Kayıt tarihini formatla
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const createdAt = user?.createdAt ? formatDate(user.createdAt) : 'Bilinmiyor';

    return (
        <View style={styles.container}>
            <View style={styles.profileCard}>
                {/* Avatar */}
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{avatarLetter}</Text>
                </View>
                <Text style={styles.title}>Profil Bilgileri</Text>
                {loading && (
                    <ActivityIndicator size="small" color="#f59e0b" style={{ marginBottom: 10 }} />
                )}
                <View style={styles.infoContainer}>
                    <Text style={styles.label}>Kullanıcı Adı:</Text>
                    <Text style={styles.value}>{user?.username}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.label}>E-posta:</Text>
                    <Text style={styles.value}>{user?.email}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.label}>Gold:</Text>
                    <Text style={styles.goldValue}>💰 {user?.gold || 0}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.label}>Kayıt Tarihi:</Text>
                    <Text style={styles.value}>{createdAt}</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 20,
        marginTop: 20,
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f59e0b',
        marginBottom: 20,
    },
    infoContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 5,
    },
    value: {
        fontSize: 18,
        color: '#f8fafc',
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        borderRadius: 8,
        padding: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 16,
    },
    avatarText: {
        color: '#f59e0b',
        fontSize: 36,
        fontWeight: 'bold',
    },
    goldValue: {
        fontSize: 20,
        color: '#fbbf24',
        fontWeight: 'bold',
    },
}); 