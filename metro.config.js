const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// NetInfo için çözümleyici - SignalR paketi için gerekli
config.resolver = config.resolver || {};

// Custom resolver to redirect imports from SignalR
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    const originPath = context.originModulePath || '';

    // SignalR veya HttpConnection içinden gelen istekleri yakala
    const isFromSignalR = originPath.includes('signalr') ||
        originPath.includes('@microsoft') ||
        originPath.includes('HttpConnection') ||
        originPath.includes('LongPollingTransport') ||
        originPath.includes('ServerSentEventsTransport');

    // SignalR'dan gelen react-native import'larını shim'e yönlendir
    if (moduleName === 'react-native' && isFromSignalR) {
        return {
            filePath: path.resolve(__dirname, 'react-native-shim.js'),
            type: 'sourceFile',
        };
    }

    // NetInfo import'larını yönlendir
    if (moduleName.includes('NetInfo') || moduleName.includes('RCTNetInfo')) {
        return {
            filePath: path.resolve(__dirname, 'node_modules/@react-native-community/netinfo/lib/index.js'),
            type: 'sourceFile',
        };
    }

    // Varsayılan resolver
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
