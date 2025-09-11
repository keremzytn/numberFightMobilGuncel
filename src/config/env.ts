import { Platform } from 'react-native';

const API_HOST = Platform.select({
    ios: '192.168.1.110',      // Kendi IP adresiniz
    android: 'localhost',        // Android Emulator için localhost
    default: '192.168.1.110'   // Kendi IP adresiniz
});

export const API_URL = `http://${API_HOST}:5227`;  // .NET API portu
export const SIGNALR_URL = `http://${API_HOST}:5227/gameHub`;  // SignalR hub URL'i

export const JWT_KEY = 'user_jwt';  // AsyncStorage için key