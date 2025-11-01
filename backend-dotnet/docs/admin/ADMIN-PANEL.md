# NumberFight Admin Panel

Backend projesine entegre ASP.NET Core MVC tabanlı admin paneli.

## Özellikler

### 📊 Dashboard
- Toplam kullanıcı sayısı
- Aktif oyunlar
- Tamamlanan oyunlar
- Sistem bilgileri

### 👥 Kullanıcı Yönetimi
- Tüm kullanıcıları listeleme
- Online/Offline durumu
- Gold miktarları
- Son görülme zamanı
- Kullanıcı detay sayfası
- Oyun geçmişi

### 🎮 Oyun İzleme
- **Aktif Oyunlar**: Real-time olarak devam eden oyunları görüntüleme (5 saniyede bir otomatik yenilenir)
- **Oyun Geçmişi**: Tüm oyunların listesi
- **Oyun Detayı**: Kartlar, skorlar, round bilgileri

### 💝 Arkadaşlık İlişkileri
- Tüm arkadaşlık isteklerini görüntüleme
- Durum: Beklemede, Kabul Edildi, Reddedildi, Engellendi
- İstek ve kabul tarihleri

## Erişim ve Giriş

Admin panel'e şu URL'den erişebilirsiniz:

```
http://localhost:5227/
```

### 🔐 Giriş Bilgileri

**Varsayılan Kullanıcı:**
- Kullanıcı adı: `admin`
- Şifre: `admin`

⚠️ **ÖNEMLİ**: Production ortamında mutlaka `appsettings.Production.json` dosyasında bu şifreyi değiştirin!

### Güvenlik

- Session tabanlı authentication (2 saat süre)
- Tüm admin sayfaları `[AdminAuthorize]` attribute ile korunuyor
- Giriş yapmadan admin panel'e erişim engelleniyor
- Çıkış butonu ile session temizleniyor

## Sayfa Listesi

- `/` - Dashboard (Ana Sayfa)
- `/Admin/Dashboard` - Dashboard
- `/Admin/Users` - Kullanıcılar
- `/Admin/UserDetail/{id}` - Kullanıcı Detayı
- `/Admin/ActiveGames` - Aktif Oyunlar
- `/Admin/Games` - Tüm Oyunlar
- `/Admin/GameDetail/{id}` - Oyun Detayı
- `/Admin/Friends` - Arkadaşlıklar

## Çalıştırma

```bash
cd backend-dotnet/src/API
dotnet run
```

API portu: `5227` (varsayılan)

## Teknolojiler

- ASP.NET Core MVC
- Razor Views
- Bootstrap 5
- Bootstrap Icons
- SignalR (real-time için hazır)

## Ekran Görüntüleri

### Dashboard
- İstatistik kartları
- Hızlı erişim linkleri
- Sistem bilgileri

### Kullanıcılar
- Tablo formatında kullanıcı listesi
- Filtreleme ve sıralama
- Detay butonları

### Aktif Oyunlar
- Kart tabanlı görünüm
- Her 5 saniyede otomatik yenilenir
- Round bilgileri
- Anlık skorlar

### Oyun Detayı
- İki oyuncunun kartları
- Kullanılmış ve yasaklı kartlar
- Round geçmişi
- Hamle logları

## Şifre Değiştirme

`appsettings.json` dosyasında:

```json
"AdminSettings": {
  "Username": "admin",
  "Password": "YeniGüçlüŞifre123!"
}
```

## Notlar

- ✅ Session tabanlı authentication aktif
- ✅ 2 saat session süresi
- ✅ Tüm admin sayfaları korumalı
- ✅ Login/Logout sistemi
- ⚠️ Production'da mutlaka farklı şifre kullanın
- API endpoint'leri aynı sunucuda çalışıyor

