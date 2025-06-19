import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Kullanıcı yüklenirken hata:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string, username?: string, id?: string) => {
        try {
            // Gerçek kullanıcıyı parametrelerden al
            const realUser = {
                id: id || '1',
                username: username || email.split('@')[0],
                email: email,
            };

            await AsyncStorage.setItem('user', JSON.stringify(realUser));
            setUser(realUser);
        } catch (error) {
            console.error('Giriş yapılırken hata:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('user');
            setUser(null);
        } catch (error) {
            console.error('Çıkış yapılırken hata:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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