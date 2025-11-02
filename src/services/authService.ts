import { API_URL, JWT_KEY } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.');
        }
        throw error;
    }
};

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData extends LoginData {
    username: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
        gold: number;
        createdAt: string;
    };
}

class AuthError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'AuthError';
    }
}

class AuthService {
    async login(data: LoginData): Promise<AuthResponse> {
        const response = await fetchWithTimeout(`${API_URL}/api/Users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        try {
            if (!response.ok) {
                const error = await response.json();
                if (response.status === 401) {
                    throw new AuthError('E-posta veya şifre hatalı', 'INVALID_CREDENTIALS');
                } else if (response.status === 400) {
                    throw new AuthError(error.message || 'Geçersiz istek', 'INVALID_REQUEST');
                } else if (response.status >= 500) {
                    throw new AuthError('Sunucu hatası. Lütfen daha sonra tekrar deneyin.', 'SERVER_ERROR');
                }
                throw new AuthError(error.message || 'Giriş başarısız', 'UNKNOWN_ERROR');
            }

            const result = await response.json();
            if (!result.token) {
                throw new AuthError('Token alınamadı', 'NO_TOKEN');
            }

            await AsyncStorage.setItem(JWT_KEY, result.token);
            return result;
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'UNKNOWN_ERROR');
        }
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await fetchWithTimeout(`${API_URL}/api/Users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        try {
            if (!response.ok) {
                let errorMessage = 'Kayıt başarısız';
                try {
                    const errorData = await response.text();
                    console.log('Backend hatası:', errorData);

                    // JSON ise parse et, değilse direkt text olarak kullan
                    try {
                        const errorJson = JSON.parse(errorData);
                        errorMessage = errorJson.message || errorJson.title || errorData;
                    } catch {
                        errorMessage = errorData;
                    }
                } catch (e) {
                    console.error('Hata mesajı okunamadı:', e);
                }

                if (response.status === 400) {
                    throw new AuthError(errorMessage, 'BAD_REQUEST');
                } else if (response.status >= 500) {
                    throw new AuthError('Sunucu hatası. Lütfen daha sonra tekrar deneyin.', 'SERVER_ERROR');
                }
                throw new AuthError(errorMessage, 'UNKNOWN_ERROR');
            }

            const result = await response.json();
            if (!result.token) {
                throw new AuthError('Token alınamadı', 'NO_TOKEN');
            }

            await AsyncStorage.setItem(JWT_KEY, result.token);
            return result;
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            console.error('Register catch bloğu hatası:', error);
            throw new AuthError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'UNKNOWN_ERROR');
        }
    }

    async logout(): Promise<void> {
        await AsyncStorage.removeItem(JWT_KEY);
    }

    async getToken(): Promise<string | null> {
        return AsyncStorage.getItem(JWT_KEY);
    }
}

export const authService = new AuthService();
