# 📚 NumberFight Backend - Dokümantasyon

NumberFight Backend API ve Admin Panel için tüm dokümantasyon dosyaları.

---

## 📂 Dokümantasyon Yapısı

```
docs/
├── README.md (bu dosya)
├── admin/          # Admin Panel Dokümantasyonu
└── deployment/     # Deployment Kılavuzları
```

---

## 🔐 Admin Panel Dokümantasyonu

Admin panel ile ilgili tüm dokümantasyon [`admin/`](./admin/) klasöründe bulunmaktadır.

### 📄 Dosyalar

| Dosya | Açıklama | Durum |
|-------|----------|--------|
| [ADMIN-PANEL.md](./admin/ADMIN-PANEL.md) | Ana admin panel dokümantasyonu | ✅ |
| [ADMIN-AUTH-GUIDE.md](./admin/ADMIN-AUTH-GUIDE.md) | Admin authentication kılavuzu | ✅ |
| [ADMIN-USER-MANAGEMENT.md](./admin/ADMIN-USER-MANAGEMENT.md) | Kullanıcı yönetimi özellikleri | ✅ |
| [ADMIN-REALTIME-STATS.md](./admin/ADMIN-REALTIME-STATS.md) | Gerçek zamanlı istatistikler | ✅ |
| [FEATURE-SUGGESTIONS.md](./admin/FEATURE-SUGGESTIONS.md) | Gelecek özellik önerileri | 📝 |

### 🚀 Hızlı Başlangıç

```bash
# Admin panele erişim
http://localhost:5227/Admin/Login

# Default credentials
Username: admin
Password: admin
```

**📖 Detaylı Bilgi:** [Admin Panel Dokümantasyonu](./admin/)

---

## 🚀 Deployment Dokümantasyonu

Deployment ve sunucu kurulumu ile ilgili dokümantasyon [`deployment/`](./deployment/) klasöründe bulunmaktadır.

### 📄 Dosyalar

| Dosya | Açıklama | Platform |
|-------|----------|----------|
| [DEPLOYMENT.md](./deployment/DEPLOYMENT.md) | Genel deployment kılavuzu | 🌐 Genel |
| [VPS-DEPLOYMENT.md](./deployment/VPS-DEPLOYMENT.md) | VPS deployment detayları | 🖥️ VPS |
| [QUICKSTART-VPS.md](./deployment/QUICKSTART-VPS.md) | VPS hızlı başlangıç | ⚡ VPS |
| [FLY-DEPLOY.md](./deployment/FLY-DEPLOY.md) | Fly.io deployment | ✈️ Fly.io |
| [NETLIFY-ALTERNATIF.md](./deployment/NETLIFY-ALTERNATIF.md) | Alternatif platformlar | 🔄 Alternatif |
| [README-DEPLOY.md](./deployment/README-DEPLOY.md) | Deployment README | 📋 Genel |

### 🎯 Platform Seçimi

- **VPS/Ubuntu:** Tam kontrol, özelleştirilebilir → [VPS-DEPLOYMENT.md](./deployment/VPS-DEPLOYMENT.md)
- **Fly.io:** Kolay, hızlı, ücretsiz tier → [FLY-DEPLOY.md](./deployment/FLY-DEPLOY.md)
- **Diğer:** Railway, Render, Heroku → [NETLIFY-ALTERNATIF.md](./deployment/NETLIFY-ALTERNATIF.md)

**📖 Detaylı Bilgi:** [Deployment Dokümantasyonu](./deployment/)

---

## 🏗️ Proje Yapısı

```
backend-dotnet/
├── src/
│   ├── API/                 # Web API ve Admin Panel
│   ├── Application/         # Business Logic
│   ├── Core/                # Domain Entities
│   └── Infrastructure/      # Database, Repositories
├── docs/                    # 📚 Dokümantasyon (bu klasör)
│   ├── admin/              # Admin panel docs
│   └── deployment/         # Deployment docs
└── README.md               # Proje ana README
```

---

## 📝 Dokümantasyon Yazım Rehberi

Yeni dokümantasyon eklerken lütfen aşağıdaki yapıyı takip edin:

### Dosya Adlandırma
- `BÜYÜK-HARFLERLE.md` formatı kullanın
- Kelimeler arası tire (-) kullanın
- Açıklayıcı isimler seçin

### İçerik Yapısı
```markdown
# Başlık

## Genel Bakış
(Kısa açıklama)

## Özellikler
(Liste halinde özellikler)

## Kurulum
(Adım adım kurulum)

## Kullanım
(Örneklerle kullanım)

## Sorun Giderme
(Yaygın sorunlar ve çözümleri)
```

### Emoji Kullanımı
Dokümantasyonu daha okunabilir yapmak için emojiler kullanın:
- 🔥 Önemli/Öncelikli
- ✅ Tamamlandı
- 📝 Devam ediyor
- 🚀 Hızlı başlangıç
- 🔐 Güvenlik
- 📊 İstatistikler
- ⚙️ Ayarlar
- 🐛 Hata düzeltme

---

## 🔗 Yararlı Linkler

### API Dokümantasyonu
- Swagger UI: `http://localhost:5227/swagger`
- API Endpoints: [API README](../src/API/README.md) (varsa)

### Admin Panel
- Dashboard: `http://localhost:5227/Admin/Dashboard`
- Login: `http://localhost:5227/Admin/Login`

### External Resources
- [ASP.NET Core Docs](https://docs.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
- [SignalR](https://docs.microsoft.com/en-us/aspnet/core/signalr)
- [Chart.js](https://www.chartjs.org/docs)

---

## 🤝 Katkıda Bulunma

Dokümantasyonu geliştirmek için:

1. Yeni özellik eklediğinizde dokümantasyon ekleyin
2. Değişiklikler yaptığınızda ilgili dokümanları güncelleyin
3. Örnekler ve ekran görüntüleri ekleyin
4. Sorun giderme bölümlerini güncel tutun

---

## 📞 Destek

Sorularınız için:
- GitHub Issues
- Pull Requests
- Direct Contact

---

**Son Güncelleme:** 1 Kasım 2024  
**Versiyon:** 1.0.0  
**Durum:** 🟢 Aktif Geliştirme

