// SignalR Platform Fix
// Bu dosya uygulama başlangıcında yüklenmeli
// SignalR'ın Platform kontrolünü manipüle eder

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Orijinal Platform.OS'i sakla
const originalOS = Platform.OS;
const originalSelect = Platform.select;

// Platform.OS'i yeniden tanımla
Object.defineProperty(Platform, 'OS', {
    get() {
        // Stack trace'i kontrol et
        const stack = new Error().stack || '';

        // Eğer çağrı SignalR'dan geliyorsa 'web' döndür
        if (stack.includes('signalr') || stack.includes('@microsoft') || stack.includes('HttpConnection')) {
            console.log('[SignalR Fix] Platform.OS web olarak döndürüldü');
            return 'web';
        }

        // Diğer durumlarda gerçek değeri döndür
        return originalOS;
    },
    configurable: true,
    enumerable: true
});

// Platform.select'i de patch'le
Platform.select = function (obj) {
    const stack = new Error().stack || '';

    if (stack.includes('signalr') || stack.includes('@microsoft')) {
        // SignalR için web seçeneğini döndür
        return obj.web !== undefined ? obj.web : obj.default;
    }

    // Normal davranış
    return originalSelect.call(this, obj);
};

// Global NetInfo'yu ayarla
if (typeof global !== 'undefined') {
    global.NetInfo = NetInfo;
}

// React Native modülüne NetInfo ekle
try {
    const RN = require('react-native');
    if (!RN.NetInfo) {
        RN.NetInfo = NetInfo;
    }
} catch (e) {
    console.warn('[SignalR Fix] React Native modülü patch edilemedi:', e.message);
}

console.log('[SignalR Fix] Platform ve NetInfo patch uygulandı');

export default {};

