import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../src/services/authService';

class AuthError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'AuthError';
    }
}

const AUTH_ERROR_MESSAGES = {
    INVALID_CREDENTIALS: 'E-posta veya şifre hatalı',
    NETWORK_ERROR: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin',
    SERVER_ERROR: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin',
    TOKEN_EXPIRED: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın',
    UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu'
};

type User = {
    id: string;
    username: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    login: (email: string, password: string, username?: string, id?: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
    token: string | null;
    refreshToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshToken = async () => {
        try {
            const currentToken = await authService.getToken();
            if (currentToken) {
                setToken(currentToken);
            }
        } catch (error) {
            console.error('Token yenilenirken hata:', error);
            // Token yenilenemezse çıkış yap
            await logout();
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const [userData, currentToken] = await Promise.all([
                AsyncStorage.getItem('user'),
                authService.getToken()
            ]);

            if (userData && currentToken) {
                setUser(JSON.parse(userData));
                setToken(currentToken);
            } else if (userData) {
                // Token yoksa ama kullanıcı verisi varsa çıkış yap
                await logout();
                throw new AuthError(AUTH_ERROR_MESSAGES.TOKEN_EXPIRED, 'TOKEN_EXPIRED');
            }
        } catch (error) {
            console.error('Kullanıcı yüklenirken hata:', error);
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AUTH_ERROR_MESSAGES.UNKNOWN_ERROR);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string, username?: string, id?: string) => {
        try {
            const response = await authService.login({ email, password });

            const userData = {
                id: response.user.id,
                username: response.user.username,
                email: response.user.email,
            };

            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setToken(response.token);
        } catch (error: any) {
            console.error('Giriş yapılırken hata:', error);

            if (error.name === 'NetworkError') {
                throw new AuthError(AUTH_ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR');
            }

            if (error.response?.status === 401) {
                throw new AuthError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
            }

            if (error.response?.status >= 500) {
                throw new AuthError(AUTH_ERROR_MESSAGES.SERVER_ERROR, 'SERVER_ERROR');
            }

            throw new AuthError(AUTH_ERROR_MESSAGES.UNKNOWN_ERROR, 'UNKNOWN_ERROR');
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            await AsyncStorage.removeItem('user');
            setUser(null);
        } catch (error) {
            console.error('Çıkış yapılırken hata:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isLoading,
            token,
            refreshToken
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 