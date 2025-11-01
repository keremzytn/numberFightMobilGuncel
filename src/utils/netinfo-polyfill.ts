// NetInfo polyfill for @microsoft/signalr
import NetInfo from '@react-native-community/netinfo';

// Global NetInfo'yu ayarla
if (typeof global !== 'undefined') {
    // @ts-ignore
    global.NetInfo = NetInfo;

    console.log('[NetInfo Polyfill] NetInfo global olarak ayarlandı');
}

export default NetInfo;

