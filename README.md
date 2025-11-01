# Number Fight - Online Çok Oyunculu Sayı Savaşı Oyunu

React Native (Expo) ve .NET 9 ile geliştirilmiş gerçek zamanlı çok oyunculu kart oyunu.

## Özellikler

- 🎮 **Bot Modu**: Yapay zeka ile oyna
- 🌐 **Online Mod**: Gerçek oyuncularla eşleş ve oyna
- 👥 **Arkadaş Sistemi**: Arkadaş ekle ve özel oyunlar düzenle
- 📊 **İstatistikler**: Kazanma oranın ve maç geçmişin
- 🔐 **JWT Kimlik Doğrulama**: Güvenli kullanıcı sistemi
- ⚡ **SignalR**: Gerçek zamanlı iletişim

## Teknoloji Stack

### Frontend
- React Native (Expo)
- TypeScript
- SignalR Client
- Expo Router

### Backend
- .NET 9
- SignalR
- Entity Framework Core
- SQLite
- MediatR (CQRS Pattern)
- AutoMapper

## Kurulum

### Backend Kurulumu

1. Backend klasörüne gidin:
```bash
cd backend-dotnet
```

2. Bağımlılıkları yükleyin ve veritabanını oluşturun:
```bash
cd src/API
dotnet restore
dotnet ef database update
```

3. Uygulamayı çalıştırın:
```bash
dotnet run
```

Backend `http://localhost:5227` adresinde çalışacaktır.

### Frontend Kurulumu

1. Ana klasörde bağımlılıkları yükleyin:
```bash
npm install
```

2. `src/config/env.ts` dosyasını düzenleyin:
   - **iOS Simulator** için: `localhost` olarak bırakın
   - **Android Emulator** için: `10.0.2.2` olarak bırakın
   - **Gerçek cihaz** için: Bilgisayarınızın IP adresini girin (örn: `192.168.1.110`)

3. Bilgisayarınızın IP adresini öğrenmek için:
   - **Mac/Linux**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - **Windows**: `ipconfig`

4. Uygulamayı başlatın:
```bash
# iOS Simulator için
npx expo start --ios

# Android Emulator için
npx expo start --android

# Expo Go ile gerçek cihazda
npx expo start
```

## Oyun Kuralları

1. Her oyuncu 1-7 arası kartlara sahiptir
2. Her turda bir kart oynarsınız
3. Büyük kart turda kazanır
4. Her turdan sonra, oynadığınız kartın komşu kartları (±1) yasaklanır
5. 7 tur sonunda en çok turu kazanan oyunu kazanır

## Proje Yapısı

```
├── app/                    # React Native ekranlar
│   ├── (tabs)/            # Ana sekmeler
│   ├── login.tsx          # Giriş ekranı
│   └── register.tsx       # Kayıt ekranı
├── components/            # Yeniden kullanılabilir bileşenler
├── src/
│   ├── config/           # Yapılandırma dosyaları
│   └── services/         # API ve SignalR servisleri
├── utils/                # Oyun mantığı
└── backend-dotnet/
    └── src/
        ├── API/          # Web API ve SignalR Hub
        ├── Application/  # CQRS komutlar ve sorgular
        ├── Core/         # Domain modelleri
        └── Infrastructure/ # Veritabanı ve repository'ler
```

## API Endpoints

### Authentication
- `POST /api/Users/register` - Yeni kullanıcı kaydı
- `POST /api/Users/login` - Kullanıcı girişi

### Friends
- `GET /api/Friends` - Arkadaş listesi
- `GET /api/Friends/search?query=` - Kullanıcı arama
- `POST /api/Friends/request` - Arkadaşlık isteği gönder
- `POST /api/Friends/respond` - Arkadaşlık isteğini yanıtla

### Stats
- `GET /api/Stats/{userId}` - Kullanıcı istatistikleri
- `GET /api/Stats/{userId}/history` - Maç geçmişi

### SignalR Hub (`/gameHub`)
- `FindMatch(userId, mode)` - Eşleşme ara
- `PlayCard(gameId, userId, cardNumber)` - Kart oyna
- `InviteFriend(friendUserId)` - Arkadaşını davet et
- `RespondToInvitation(gameId, accept)` - Daveti yanıtla

## Sorun Giderme

### Backend bağlantı hatası
- Backend'in çalıştığından emin olun (`http://localhost:5227`)
- `src/config/env.ts` dosyasındaki IP adresinin doğru olduğunu kontrol edin

### SignalR bağlantı hatası
- WebSocket desteğinin açık olduğundan emin olun
- Firewall ayarlarını kontrol edin

### Database hatası
- `dotnet ef database update` komutunu tekrar çalıştırın
- SQLite dosyasını silin ve yeniden oluşturun

## Geliştirme

- Backend development: `dotnet watch run` (hot reload için)
- Frontend development: `npx expo start --clear` (cache temizleyerek)

## Lisans

MIT

