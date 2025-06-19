# Card Battle Game Server

Bu Node.js sunucusu, Card Battle oyunu için gerçek zamanlı multiplayer desteği sağlar.

## Kurulum

1. Sunucu dizinine gidin:
```bash
cd server
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Sunucuyu başlatın:
```bash
npm start
```

Geliştirme için (otomatik yeniden başlatma):
```bash
npm run dev
```

## Özellikler

- **Gerçek Zamanlı Eşleşme**: Socket.io ile anlık oyuncu eşleştirme
- **Oyun Odası Yönetimi**: Her oyun için ayrı oda sistemi
- **Kural Kontrolü**: Sunucu tarafında oyun kuralları doğrulaması
- **Otomatik Kart Seçimi**: 30 saniye süre dolduğunda otomatik seçim
- **Bağlantı Yönetimi**: Oyuncu ayrılma ve bağlantı kopması yönetimi

## API Endpoints

### Health Check
```
GET /health
```
Sunucu durumu ve aktif oyun istatistiklerini döner.

## Socket Events

### Client -> Server
- `findMatch`: Eşleşme arama
- `playCard`: Kart oynama
- `leaveGame`: Oyundan ayrılma

### Server -> Client
- `waitingForMatch`: Eşleşme bekleniyor
- `matchFound`: Eşleşme bulundu
- `roundStart`: Raund başladı
- `roundResult`: Raund sonucu
- `gameEnd`: Oyun bitti
- `opponentPlayed`: Rakip kart seçti
- `opponentLeft`: Rakip oyunu terk etti
- `opponentDisconnected`: Rakip bağlantısı kesildi

## Oyun Kuralları

1. Her oyuncu 1-7 arası kartlara sahip
2. Her kart sadece bir kez kullanılabilir
3. Büyük kart raundu kazanır
4. Kullanılan kartın ±1'i sonraki raundda yasak
5. 30 saniye süre sınırı
6. 7 raund sonunda en yüksek skor kazanır

## Geliştirme

Sunucu `localhost:3001` portunda çalışır. React Native uygulaması bu adrese bağlanır.

Production ortamında:
- Environment variables kullanın
- HTTPS sertifikası ekleyin
- Rate limiting uygulayın
- Logging sistemi ekleyin