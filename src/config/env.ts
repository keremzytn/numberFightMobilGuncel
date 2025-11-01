import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Development (local) için IP adresi
const DEV_API_HOST = Platform.select({
    ios: '192.168.0.100',       // iOS Simulator veya gerçek iPhone için
    android: '192.168.0.100',   // Android Emulator veya gerçek telefon için
    default: '192.168.0.100'    // Gerçek cihaz için bilgisayarınızın IP'si
});

// Production için ngrok URL'i (EAS build'den gelir)
const PROD_API_URL = Constants.expoConfig?.extra?.API_URL || 'https://submissively-preinductive-alta.ngrok-free.dev';

// Development mı Production mı?
const isDevelopment = __DEV__;

// API URL'i seç
export const API_URL = isDevelopment
    ? `http://${DEV_API_HOST}:5227`  // Local development
    : PROD_API_URL;                   // Production (ngrok veya deployed backend)

export const SIGNALR_URL = `${API_URL}/gameHub`;  // SignalR hub URL'i

export const JWT_KEY = 'user_jwt';  // AsyncStorage için key

console.log('🌐 API URL:', API_URL);
console.log('📡 SignalR URL:', SIGNALR_URL);