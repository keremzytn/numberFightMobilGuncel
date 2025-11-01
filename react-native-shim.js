// React Native Proxy - SignalR için platform spoofing
const RealRN = require('react-native');
const NetInfo = require('@react-native-community/netinfo');

// React Native modülünü proxy ile sar
const ReactNativeProxy = new Proxy(RealRN, {
    get(target, prop, receiver) {
        // Platform.OS'i web olarak döndür - SignalR NetInfo kullanmayı durdurur
        if (prop === 'Platform') {
            return new Proxy(target.Platform, {
                get(platformTarget, platformProp) {
                    if (platformProp === 'OS') {
                        return 'web';
                    }
                    return platformTarget[platformProp];
                }
            });
        }

        // NetInfo istenirse doğrudan yönlendir
        if (prop === 'NetInfo') {
            return NetInfo.default || NetInfo;
        }

        return Reflect.get(target, prop, receiver);
    }
});

module.exports = ReactNativeProxy;

