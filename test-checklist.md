# Online Multiplayer Test Kontrol Listesi

## ✅ Hazırlık
- [ ] Backend çalışıyor mu? (`dotnet run`)
- [ ] Ngrok kurulu mu? (`brew install ngrok` veya ngrok.com)
- [ ] API_URL doğru ayarlı mı?

## ✅ Bağlantı Testleri
- [ ] İki cihaz SignalR'a bağlanabiliyor mu?
- [ ] GameHub bağlantısı başarılı mı?
- [ ] JWT token doğru gönderiliyor mu?

## ✅ Matchmaking Testleri
- [ ] İki kullanıcı match bulabiliyor mu?
- [ ] Bot ile match yapılabiliyor mu?
- [ ] Matchmaking iptali çalışıyor mu?

## ✅ Oyun Testleri
- [ ] Hamle gönderme/alma gerçek zamanlı mı?
- [ ] Round geçişleri senkronize mi?
- [ ] Skorlar doğru güncelleniyor mu?
- [ ] Forbidden cards çalışıyor mu?

## ✅ Timeout Testleri
- [ ] 30 saniye dolunca otomatik hamle yapılıyor mu?
- [ ] GameTimeoutService çalışıyor mu?
- [ ] Round süreleri doğru mu?

## ✅ Bağlantı Kopması Testleri
- [ ] WiFi kapatılınca ne oluyor?
- [ ] Tekrar bağlanınca oyun devam ediyor mu?
- [ ] Reconnection mantığı çalışıyor mu?

## ✅ Performans Testleri
- [ ] Latency kabul edilebilir mi?
- [ ] SignalR mesajları kaybolmadan ulaşıyor mu?
- [ ] Eş zamanlı birden fazla oyun çalışabiliyor mu?

## 🔍 Debug Araçları

### Chrome DevTools (Expo Web için)
```
- Network tab > WS (WebSocket)
- SignalR mesajlarını izle
```

### Backend Logs
```bash
cd backend-dotnet/src/API
dotnet run --verbosity detailed
```

### SignalR Bağlantı Kontrolü
```typescript
// socketService.ts'de log ekle
connection.onclose(() => console.log('❌ Bağlantı kesildi'));
connection.onreconnecting(() => console.log('🔄 Tekrar bağlanıyor...'));
connection.onreconnected(() => console.log('✅ Tekrar bağlandı'));
```

## 📱 Test Senaryosu Örnekleri

### Senaryo 1: Normal Oyun
1. Kullanıcı A: Login + Match ara
2. Kullanıcı B: Login + Match ara
3. Match bulundu → Oyun başladı
4. Sırayla hamle yap (7 round)
5. Oyun bitti → Sonuçlar göster

### Senaryo 2: Timeout
1. Match bul
2. Bir kullanıcı hamle yapmasın
3. 30 saniye bekle
4. Otomatik hamle yapılmalı

### Senaryo 3: Bağlantı Kopması
1. Oyun ortasında WiFi kapat
2. 5 saniye bekle
3. WiFi aç
4. Oyun devam etmeli

