# Admin Panel - Kullanıcı Yönetimi Kılavuzu

## Özellikler

Admin panel ile kullanıcılar üzerinde tam kontrol sağlayabilirsiniz.

### 1. 💰 Gold Yönetimi

#### Gold Ekleme
- Kullanıcı detay sayfasında **"Gold Ekle"** butonuna tıklayın
- 1-10,000 arası gold miktarı girin
- Sistem otomatik olarak kullanıcının hesabına ekler

#### Gold Çıkarma
- Kullanıcı detay sayfasında **"Gold Çıkar"** butonuna tıklayın
- Maksimum kullanıcının sahip olduğu gold kadar çıkarabilirsiniz
- Yetersiz gold durumunda hata mesajı gösterilir

**Kullanım Örnekleri:**
- Etkinlik ödülü: +500 gold
- Hata telafisi: +1000 gold
- Ceza: -200 gold
- Hile yapan kullanıcı: Tüm gold sıfırla

### 2. 🚫 Ban Sistemi

#### Kullanıcı Banlama

**Ban Türleri:**
1. **Geçici Ban**: Belirli süre (1-30 gün)
2. **Kalıcı Ban**: Süresiz

**Ban Süreci:**
```
1. User Detail sayfasına git
2. "Kullanıcıyı Banla" butonuna tıkla
3. Ban sebebini yaz (zorunlu)
4. Süre seç veya kalıcı ban için boş bırak
5. "Banla" butonuna tıkla
```

**Ban Sebepleri Örnekleri:**
- "Hile kullanımı"
- "Uygunsuz davranış"
- "Spam"
- "Küfür ve hakaret"
- "Birden fazla hesap"

#### Ban Durumu

Banlı kullanıcılar:
- ❌ Giriş yapamaz
- ❌ API endpoint'lerine erişemez
- ⚠️ Ban süresi bitmişse otomatik olarak kaldırılır

**Login Ban Mesajı:**
```
"Hesabınız 15.01.2025 23:59 tarihine kadar banlandı. 
Sebep: Hile kullanımı"
```

#### Banı Kaldırma

1. User Detail sayfasına git
2. **"Banı Kaldır"** butonuna tıkla
3. Onay ver

### 3. 📊 Kullanıcı Bilgileri

Admin panelde görüntülenen bilgiler:

**Temel Bilgiler:**
- Kullanıcı adı
- Email
- Online/Offline durumu
- Gold miktarı
- Kayıt tarihi
- Son görülme

**Ban Bilgileri (varsa):**
- Ban durumu (Aktif/Pasif)
- Ban tarihi
- Ban sebebi
- Ban bitiş tarihi (geçici banlarda)

**Oyun İstatistikleri:**
- Toplam oyun sayısı
- Kazanma oranı
- Galibiyet/Mağlubiyet/Beraberlik
- Detaylı oyun geçmişi

### 4. 🔍 Kullanıcı Arama ve Filtreleme

**Users Sayfası:**
- Tüm kullanıcılar listelenir
- Son kayıt tarihine göre sıralı
- Ban durumu badge ile gösterilir
- Online/Offline durumu

## API Değişiklikleri

### User Entity Yeni Alanlar

```csharp
public bool IsBanned { get; private set; }
public DateTime? BannedAt { get; private set; }
public string? BanReason { get; private set; }
public DateTime? BannedUntil { get; private set; }
```

### Yeni Metodlar

```csharp
// Gold işlemleri (zaten vardı)
user.AddGold(amount);
user.RemoveGold(amount);

// Ban işlemleri (yeni)
user.Ban(reason, until);
user.Unban();
user.IsCurrentlyBanned();
```

### Admin Controller Endpoint'leri

```
POST /Admin/AddGold
POST /Admin/RemoveGold
POST /Admin/BanUser
POST /Admin/UnbanUser
```

## Güvenlik

### Admin Panel Koruması
- ✅ Session authentication
- ✅ [AdminAuthorize] attribute
- ✅ CSRF token koruması
- ✅ TempData ile mesaj gösterimi

### Validasyon
- Gold: 1-10,000 arası
- Ban sebebi: Zorunlu
- Ban süresi: 1-30 gün veya kalıcı

### Log ve İzleme
- TempData ile başarı/hata mesajları
- User activity tracking
- Ban history (geliştirilebilir)

## Database Migration

Ban özelliklerini aktif etmek için migration çalıştırın:

```bash
cd backend-dotnet/src/Infrastructure
dotnet ef database update --startup-project ../API
```

## Kullanım Senaryoları

### Senaryo 1: Hile Yapan Kullanıcı
```
1. Kullanıcıyı bul
2. Tüm gold'unu çıkar (ceza)
3. 30 gün ban ver
4. Ban sebebi: "Hile kullanımı tespit edildi"
```

### Senaryo 2: Etkinlik Ödülü
```
1. Etkinliğe katılan kullanıcıları listele
2. Her birine +500 gold ekle
3. TempData ile başarı mesajı
```

### Senaryo 3: Yanlışlıkla Ban
```
1. User Detail'e git
2. "Banı Kaldır" butonuna tıkla
3. İsteğe bağlı: Telafi gold'u ekle
```

### Senaryo 4: Geçici Susturma
```
1. Spam yapan kullanıcıyı seç
2. 3 gün ban ver
3. Sebep: "Spam mesaj gönderimi"
4. 3 gün sonra otomatik açılır
```

## Best Practices

### Ban Sebepleri
✅ **İyi:**
- "Hile kullanımı - SpeedHack tespit edildi"
- "Uygunsuz davranış - Sürekli küfür"
- "Spam - 100+ mesaj/dakika"

❌ **Kötü:**
- "Ban"
- "Yasak"
- Sebep yazmamak

### Gold İşlemleri
- Büyük miktarlar için önce kontrol et
- Log tut (geliştirilebilir)
- Kullanıcıya bildirim gönder (geliştirilebilir)

### Ban Süreleri
- İlk ihlal: 1-3 gün
- Tekrar eden: 7-14 gün
- Ciddi: 30 gün
- Çok ciddi: Kalıcı

## Geliştirme Önerileri

### İyileştirmeler
1. **Ban History**: Kullanıcının geçmiş ban kayıtları
2. **Bulk Actions**: Toplu gold ekleme/çıkarma
3. **Email Notification**: Ban/Unban bildirimleri
4. **Audit Log**: Tüm admin işlemlerini logla
5. **Statistics**: En çok banlananlar, gold dağılımı
6. **Export**: Kullanıcı listesini CSV/Excel export
7. **Advanced Filters**: Gold aralığı, ban durumu, kayıt tarihi

### Güvenlik İyileştirmeleri
1. **Role-based access**: Farklı admin seviyeleri
2. **IP logging**: Hangi admin hangi IP'den işlem yaptı
3. **Two-factor auth**: Kritik işlemler için 2FA
4. **Action confirmation**: Önemli işlemler için şifre tekrarı

## Sorun Giderme

### Ban Çalışmıyor
- Migration çalıştırıldı mı? `dotnet ef database update`
- Login handler'da ban kontrolü var mı?
- User.IsCurrentlyBanned() doğru çalışıyor mu?

### Gold Eklenmiyor
- Amount 1-10000 arası mı?
- User entity update ediliyor mu?
- TempData mesajı görünüyor mu?

### Modal Açılmıyor
- Bootstrap 5 JS yüklü mü?
- data-bs-toggle="modal" doğru mu?
- Modal ID'leri unique mi?

## Test

```bash
cd backend-dotnet/src/API
dotnet run

# Test senaryoları:
1. http://localhost:5227/Admin/Login
2. Login: admin / admin
3. Users sayfasına git
4. Bir kullanıcı seç
5. Gold ekle/çıkar test et
6. Ban/Unban test et
7. Banlı kullanıcıyla login dene
```

## Özet

Bu admin panel ile:
- ✅ Gold yönetimi (ekle/çıkar)
- ✅ Ban yönetimi (geçici/kalıcı)
- ✅ Kullanıcı istatistikleri
- ✅ Güvenli admin panel
- ✅ Modal-based UI
- ✅ TempData feedback

Kullanıcılar üzerinde tam kontrol sağlayabilir, gerektiğinde müdahale edebilirsiniz.

