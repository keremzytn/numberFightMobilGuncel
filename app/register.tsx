import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { UserPlus, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react-native';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validateForm = () => {
        if (!username || !email || !password) {
            setError('Lütfen tüm alanları eksiksiz doldurun.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Geçerli bir e-posta adresi giriniz. Örnek: ornek@mail.com');
            return false;
        }
        if (password.length < 6) {
            setError('Şifreniz en az 6 karakter olmalı. Daha güçlü bir şifre tercih edin.');
            return false;
        }
        setError('');
        return true;
    };

    const handleRegister = async () => {
        console.log('Kayıt butonuna tıklandı');
        if (!validateForm()) return;
        try {
            console.log('Fetch başlatılıyor');
            const response = await fetch('http://172.16.6.36:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });
            console.log('Fetch cevabı:', response);

            if (response.ok) {
                setSuccess('Kayıt başarılı! Yönlendiriliyorsunuz...');
                setError('');
                setTimeout(() => {
                    setSuccess('');
                    router.push('/');
                }, 1500);
            } else {
                setError('Kayıt başarısız oldu. Lütfen bilgilerinizi kontrol edin veya daha sonra tekrar deneyin.');
                setSuccess('');
            }
        } catch (error) {
            console.log('Fetch catch hatası:', error);
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
                <UserPlus size={48} color="#f8fafc" />
                <Text style={styles.title}>Kayıt Ol</Text>
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
                    placeholder="Kullanıcı Adı"
                    placeholderTextColor="#94a3b8"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
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

                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <LinearGradient
                        colors={['#3b82f6', '#1d4ed8']}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>Kayıt Ol</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.linkText}>Giriş sayfasına dön</Text>
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