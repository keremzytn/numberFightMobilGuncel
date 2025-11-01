# 🔐 Admin Panel - Dokümantasyon

NumberFight Admin Panel için kapsamlı dokümantasyon.

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [Dokümantasyon Dosyaları](#dokümantasyon-dosyaları)
4. [Özellikler](#özellikler)
5. [Mimari](#mimari)
6. [Güvenlik](#güvenlik)
7. [Sorun Giderme](#sorun-giderme)

---

## 🎯 Genel Bakış

NumberFight Admin Panel, oyun yöneticilerinin kullanıcıları, oyunları ve sistem ayarlarını yönetmesi için geliştirilmiş web tabanlı bir yönetim arayüzüdür.

### ✅ Mevcut Özellikler

- 📊 **Dashboard**: Gerçek zamanlı istatistikler ve grafikler
- 👥 **Kullanıcı Yönetimi**: Kullanıcıları görüntüleme, ban, gold yönetimi
- 🎮 **Oyun Yönetimi**: Oyun geçmişi, aktif oyunlar, detaylı bilgiler
- 👫 **Arkadaşlık İlişkileri**: Kullanıcı arkadaşlıklarını görüntüleme
- 🔐 **Güvenli Login**: Session-based authentication
- 📈 **Real-time Updates**: SignalR ile canlı güncellemeler

---

## 🚀 Hızlı Başlangıç

### 1. Server'ı Başlat
```bash
cd backend-dotnet/src/API
dotnet run
```

### 2. Admin Panel'e Eriş
```
http://localhost:5227/Admin/Login
```

### 3. Login Bilgileri
**Development:**
```
Username: admin
Password: admin
```

**Production:**
```
Username: ${ADMIN_USERNAME}  # Environment variable
Password: ${ADMIN_PASSWORD}  # Environment variable
```

### 4. Dashboard'a Geç
Login sonrası otomatik olarak Dashboard'a yönlendirilirsiniz.

---

## 📄 Dokümantasyon Dosyaları

| Dosya | Açıklama | Okuma Süresi |
|-------|----------|--------------|
| **[ADMIN-PANEL.md](./ADMIN-PANEL.md)** | Ana admin panel dokümantasyonu<br>Genel özellikler, ekran görüntüleri | 10 dk |
| **[ADMIN-AUTH-GUIDE.md](./ADMIN-AUTH-GUIDE.md)** | Authentication kılavuzu<br>Login, session yönetimi, güvenlik | 8 dk |
| **[ADMIN-USER-MANAGEMENT.md](./ADMIN-USER-MANAGEMENT.md)** | Kullanıcı yönetimi özellikleri<br>Ban, gold, kullanıcı detayları | 15 dk |
| **[ADMIN-REALTIME-STATS.md](./ADMIN-REALTIME-STATS.md)** | Gerçek zamanlı istatistikler<br>SignalR, grafikler, live updates | 12 dk |
| **[FEATURE-SUGGESTIONS.md](./FEATURE-SUGGESTIONS.md)** | Gelecek özellik önerileri<br>20+ özellik önerisi ve roadmap | 20 dk |

---

## 🎨 Özellikler

### 📊 Dashboard
- **Toplam İstatistikler**: Kullanıcı sayısı, oyun sayısı, online kullanıcılar
- **Gerçek Zamanlı Grafikler**:
  - Line Chart: Son 7 günün oyun istatistikleri
  - Donut Chart: Online/Offline kullanıcı dağılımı
  - Bar Chart: Oyun durum dağılımı
- **Hızlı Erişim**: Sık kullanılan sayfalara hızlı linkler
- **SignalR**: 5 saniyede bir otomatik güncelleme

📖 **Detay:** [ADMIN-REALTIME-STATS.md](./ADMIN-REALTIME-STATS.md)

---

### 👥 Kullanıcı Yönetimi
- **Kullanıcı Listesi**: Tüm kullanıcıları görüntüleme
- **Kullanıcı Detayları**: Profil bilgileri, oyun geçmişi, istatistikler
- **Gold Yönetimi**: 
  - Gold ekleme (modal ile)
  - Gold çıkarma (modal ile)
- **Ban Sistemi**:
  - Kullanıcıyı banlama (sebep + süre)
  - Ban kaldırma
  - Ban geçmişi
- **Online Status**: Gerçek zamanlı online/offline durumu
- **Banlı Badge**: Banlı kullanıcılar listede işaretlenir

📖 **Detay:** [ADMIN-USER-MANAGEMENT.md](./ADMIN-USER-MANAGEMENT.md)

---

### 🎮 Oyun Yönetimi
- **Aktif Oyunlar**: Şu anda devam eden oyunlar
- **Oyun Geçmişi**: Tüm oyunların listesi
- **Oyun Detayları**:
  - Oyuncu bilgileri
  - Skorlar
  - Hamle geçmişi (moves)
  - Oyun süresi

---

### 👫 Arkadaşlık İlişkileri
- **Friendship Listesi**: Tüm arkadaşlık ilişkileri
- **Durum Gösterimi**: Pending, Accepted, Declined, Blocked
- **Kullanıcı Bilgileri**: Her iki taraf için detaylı bilgi

---

### 🔐 Güvenlik
- **Session-Based Auth**: Güvenli session yönetimi
- **Password Hashing**: BCrypt ile şifre hashleme
- **Environment Variables**: Production'da güvenli credential yönetimi
- **Custom Authorization Filter**: AdminAuthorizationFilter
- **Auto Logout**: 2 saat session timeout

📖 **Detay:** [ADMIN-AUTH-GUIDE.md](./ADMIN-AUTH-GUIDE.md)

---

## 🏗️ Mimari

### Teknolojiler
- **Backend**: ASP.NET Core 9.0 MVC
- **Database**: PostgreSQL + Entity Framework Core
- **Real-time**: SignalR (WebSocket)
- **Frontend**: Razor Views + Bootstrap 5
- **Charts**: Chart.js 4.4.0
- **Icons**: Bootstrap Icons

### Klasör Yapısı
```
src/API/
├── Controllers/
│   └── AdminController.cs       # Admin panel controller
├── Views/
│   ├── Admin/
│   │   ├── Login.cshtml        # Login sayfası
│   │   ├── Dashboard.cshtml    # Ana dashboard
│   │   ├── Users.cshtml        # Kullanıcı listesi
│   │   ├── UserDetail.cshtml   # Kullanıcı detayı
│   │   ├── Games.cshtml        # Oyun listesi
│   │   ├── GameDetail.cshtml   # Oyun detayı
│   │   ├── ActiveGames.cshtml  # Aktif oyunlar
│   │   └── Friends.cshtml      # Arkadaşlıklar
│   └── Shared/
│       └── _Layout.cshtml      # Ana layout
├── SignalR/
│   └── AdminHub.cs             # Admin SignalR hub
├── BackgroundServices/
│   └── AdminStatsBackgroundService.cs  # Otomatik güncelleme
└── Filters/
    └── AdminAuthorizationFilter.cs     # Auth filter
```

### Data Flow
```
User Request
    ↓
AdminController
    ↓
Repository (IUserRepository, IGameRepository, etc.)
    ↓
Entity Framework Core
    ↓
PostgreSQL Database
    ↓
Razor View
    ↓
Browser (with SignalR for real-time)
```

---

## 🔒 Güvenlik

### Authentication Flow
```
1. User → /Admin/Login (GET)
2. Display login form
3. User → /Admin/Login (POST) with credentials
4. Verify credentials from appsettings.json
5. If valid:
   - Create session (HttpContext.Session)
   - Set AdminUsername and IsAdminAuthenticated
   - Redirect to Dashboard
6. If invalid:
   - Show error message
```

### Authorization
```csharp
[AdminAuthorize]  // Custom filter
public async Task<IActionResult> Dashboard()
{
    // Only authenticated admins can access
}
```

### Session Management
- **Timeout**: 2 saat
- **Cookie**: HttpOnly, Secure
- **Name**: .NumberFight.AdminSession

---

## 🐛 Sorun Giderme

### Login Yapamıyorum
**Sorun:** "Geçersiz kullanıcı adı veya şifre" hatası

**Çözümler:**
1. `appsettings.json` kontrol et:
```json
{
  "AdminSettings": {
    "Username": "admin",
    "Password": "admin"
  }
}
```

2. Production'da environment variables kontrol et:
```bash
echo $ADMIN_USERNAME
echo $ADMIN_PASSWORD
```

---

### Grafikler Güncellenmiyor
**Sorun:** Real-time güncellemeler çalışmıyor

**Çözümler:**
1. Browser console'u kontrol et:
```javascript
// Şunu görmelisiniz:
✅ Admin Hub'a bağlanıldı
📊 Yeni istatistikler alındı
```

2. SignalR bağlantısını test et:
```bash
# Server loglarında olmalı:
[INFO] Admin connected: connection_id
```

3. AdminStatsBackgroundService çalışıyor mu kontrol et:
```bash
# Logda olmalı:
[INFO] Admin Stats Background Service started
[INFO] Stats sent to all connected admins
```

---

### Session Süresi Doldu
**Sorun:** 2 saat sonra otomatik logout

**Çözüm:** Bu normal davranıştır. Session timeout'u değiştirmek için:
```csharp
// Program.cs
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(8); // 8 saat
});
```

---

### Database Bağlantı Hatası
**Sorun:** "Could not connect to database" hatası

**Çözüm:**
1. Connection string kontrol et:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=numberfight;..."
  }
}
```

2. PostgreSQL çalışıyor mu kontrol et:
```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

---

## 📚 İleri Seviye

### Custom Widget Ekleme
Dashboard'a yeni widget eklemek için:

1. **Controller'da veri hazırla:**
```csharp
viewModel.CustomData = await _repository.GetCustomDataAsync();
```

2. **View'da widget ekle:**
```html
<div class="card">
    <div class="card-body">
        <h5>Custom Widget</h5>
        <p>@Model.CustomData</p>
    </div>
</div>
```

3. **SignalR'da güncelle:**
```csharp
var stats = new
{
    // ... existing stats
    CustomData = customData
};
```

---

### Yeni Sayfa Ekleme

1. **View oluştur:** `Views/Admin/NewPage.cshtml`
2. **Controller'da action ekle:**
```csharp
[AdminAuthorize]
public async Task<IActionResult> NewPage()
{
    return View();
}
```
3. **Layout'ta menü linki ekle:**
```html
<a asp-controller="Admin" asp-action="NewPage" class="nav-link">
    <i class="bi bi-icon"></i> New Page
</a>
```

---

## 🚀 Gelecek Özellikler

Detaylı özellik önerileri ve roadmap için:

📖 **[FEATURE-SUGGESTIONS.md](./FEATURE-SUGGESTIONS.md)**

**Öncelikli özellikler:**
1. 🔍 Arama ve Filtreleme
2. 📝 Activity Log
3. 📦 Toplu İşlemler
4. 🔔 Bildirim Sistemi
5. ⚙️ Sistem Ayarları

---

## 🤝 Katkıda Bulunma

Admin panel geliştirmelerine katkıda bulunmak için:

1. Yeni özellik eklerken dokümantasyon ekleyin
2. Ekran görüntüleri ekleyin
3. Kod örnekleri verin
4. Test senaryoları yazın

---

## 📞 Destek

Sorularınız için:
- GitHub Issues
- Pull Requests
- Documentation Updates

---

**Son Güncelleme:** 1 Kasım 2024  
**Versiyon:** 1.0.0  
**Durum:** ✅ Production Ready

