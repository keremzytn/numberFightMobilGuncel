import { Platform } from 'react-native';

// Kendi bilgisayarınızın IP adresini buraya girin
// Terminal'de 'ifconfig' (Mac/Linux) veya 'ipconfig' (Windows) komutu ile öğrenebilirsiniz
const API_HOST = Platform.select({
    ios: 'localhost',           // iOS Simulator için localhost
    android: '10.0.2.2',        // Android Emulator için 10.0.2.2
    default: 'localhost'        // Gerçek cihaz için bilgisayarınızın IP'si (örn: 192.168.1.110)
});

export const API_URL = `http://${API_HOST}:5227`;  // .NET API portu
export const SIGNALR_URL = `http://${API_HOST}:5227/gameHub`;  // SignalR hub URL'i

export const JWT_KEY = 'user_jwt';  // AsyncStorage için key