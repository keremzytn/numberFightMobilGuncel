import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { LogIn, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../context/auth';
import { API_URL } from '../src/config/env';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { login } = useAuth();

    const validateForm = () => {
        console.log('Form değerleri:', { email, password });
        if (!email || !password) {
            console.log('Email veya şifre boş');
            setError('Lütfen e-posta ve şifre alanlarını doldurun.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Email formatı geçersiz');
            setError('Geçerli bir e-posta adresi giriniz. Örnek: ornek@mail.com');
            return false;
        }
        console.log('Form doğrulama başarılı');
        setError('');
        return true;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;
        try {
            console.log('Login isteği gönderiliyor:', `${API_URL}/api/auth/login`);
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Giriş başarısız');
            }

            const data = await response.json();
            console.log('Login başarılı, data:', data);

            if (data.user) {
                await login(data.user.email, password, data.user.username, data.user.id || data.user._id);
                setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
                setError('');
                setTimeout(() => {
                    setSuccess('');
                    router.push('/');
                }, 1500);
            } else {
                throw new Error('Kullanıcı bilgileri alınamadı');
            }
        } catch (error) {
            console.error('Login hatası:', error);
            setError('Bir hata oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
            setSuccess('');
        }
    };

    return (
        <LinearGradient
            colors={['#0f172a', '#1e293b', '#334155']}
            style={styles.container}
        >
            <View style={styles.header}>
                <LogIn size={48} color="#f8fafc" />
                <Text style={styles.title}>Giriş Yap</Text>
            </View>

            <View style={styles.form}>
                {success ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                        <CheckCircle2 size={20} color="#10b981" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#10b981', flex: 1 }}>{success}</Text>
                    </View>
                ) : null}
                {error ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                        <AlertTriangle size={20} color="#ef4444" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#ef4444', flex: 1 }}>{error}</Text>
                    </View>
                ) : null}
                <TextInput
                    style={styles.input}
                    placeholder="E-posta"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <View style={{ position: 'relative' }}>
                    <TextInput
                        style={styles.input}
                        placeholder="Şifre"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 16, top: 18 }}
                    >
                        {showPassword ? (
                            <EyeOff size={20} color="#94a3b8" />
                        ) : (
                            <Eye size={20} color="#94a3b8" />
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <LinearGradient
                        colors={['#3b82f6', '#1d4ed8']}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>Giriş Yap</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={styles.linkText}>Hesabın yok mu? Kayıt ol</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/')}>
                    <Text style={styles.linkText}>Ana sayfaya dön</Text>
                </TouchableOpacity>
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
        marginTop: 16,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 12,
        padding: 16,
        color: '#f8fafc',
        fontSize: 16,
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    buttonGradient: {
        padding: 16,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    linkText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 16,
    },
}); 