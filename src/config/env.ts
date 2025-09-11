import { Platform } from 'react-native';

export const API_URL = Platform.select({
    ios: 'http://192.168.99.145:3000',
    android: 'http://10.0.2.2:3000',
    default: 'http://192.168.99.145:3000'
});
