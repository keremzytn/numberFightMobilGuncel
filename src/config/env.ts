import { Platform } from 'react-native';

// Kendi bilgisayarınızın IP adresini buraya girin
// Terminal'de 'ifconfig' (Mac/Linux) veya 'ipconfig' (Windows) komutu ile öğrenebilirsiniz
const API_HOST = Platform.select({
    ios: '172.16.12.255',       // iOS Simulator veya gerçek iPhone için
    android: '172.16.12.255',   // Android Emulator veya gerçek telefon için
    default: '172.16.12.255'    // Gerçek cihaz için bilgisayarınızın IP'si
});

export const API_URL = `http://${API_HOST}:5227`;  // .NET API portu
export const SIGNALR_URL = `http://${API_HOST}:5227/gameHub`;  // SignalR hub URL'i

export const JWT_KEY = 'user_jwt';  // AsyncStorage için key