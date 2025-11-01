# 🚀 Deployment - Dokümantasyon

NumberFight Backend deployment kılavuzları ve platform önerileri.

---

## 📋 İçindekiler

1. [Platform Seçimi](#platform-seçimi)
2. [Dokümantasyon Dosyaları](#dokümantasyon-dosyaları)
3. [Hızlı Başlangıç](#hızlı-başlangıç)
4. [Karşılaştırma](#karşılaştırma)
5. [Production Checklist](#production-checklist)

---

## 🎯 Platform Seçimi

### 🖥️ VPS (Ubuntu/Linux)
**En İyi Seçim:** Tam kontrol, özelleştirilebilir, maliyet etkin

✅ **Avantajlar:**
- Tam kontrol ve esneklik
- Özelleştirilebilir konfigürasyon
- Maliyet etkin (uzun vadede)
- Root erişimi

❌ **Dezavantajlar:**
- Kurulum ve yönetim gerektir
- Güvenlik güncellemeleri manuel
- Daha fazla teknik bilgi gerekli

📖 **Dokümantasyon:** [VPS-DEPLOYMENT.md](./VPS-DEPLOYMENT.md)

---

### ✈️ Fly.io
**En İyi Seçim:** Hızlı başlangıç, ücretsiz tier

✅ **Avantajlar:**
- Ücretsiz tier (3 GB RAM)
- Kolay deployment (flyctl CLI)
- Otomatik SSL
- Global CDN

❌ **Dezavantajlar:**
- Limitli ücretsiz tier
- Özelleştirme kısıtlamaları
- Bazı bölgelerde yavaş

📖 **Dokümantasyon:** [FLY-DEPLOY.md](./FLY-DEPLOY.md)

---

### 🚂 Railway
**En İyi Seçim:** Developer-friendly, otomatik deployment

✅ **Avantajlar:**
- GitHub entegrasyonu
- Otomatik deployment
- Güzel UI/UX
- $5 ücretsiz kredi

❌ **Dezavantajlar:**
- Ücretli (ücretsiz kredi sonrası)
- Limitli özelleştirme

📖 **Dokümantasyon:** [NETLIFY-ALTERNATIF.md](./NETLIFY-ALTERNATIF.md)

---

### 🎨 Render
**En İyi Seçim:** Basit, güvenilir, ücretsiz tier

✅ **Avantajlar:**
- Ücretsiz tier (512 MB RAM)
- Kolay setup
- PostgreSQL dahil
- Auto SSL

❌ **Dezavantajlar:**
- Ücretsiz tier yavaş (cold start)
- Limitli kaynak

📖 **Dokümantasyon:** [NETLIFY-ALTERNATIF.md](./NETLIFY-ALTERNATIF.md)

---

## 📄 Dokümantasyon Dosyaları

| Dosya | Platform | Zorluk | Okuma Süresi |
|-------|----------|--------|--------------|
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Genel | ⚡⚡ | 15 dk |
| **[VPS-DEPLOYMENT.md](./VPS-DEPLOYMENT.md)** | VPS/Ubuntu | ⚡⚡⚡⚡ | 30 dk |
| **[QUICKSTART-VPS.md](./QUICKSTART-VPS.md)** | VPS/Ubuntu | ⚡⚡⚡ | 20 dk |
| **[FLY-DEPLOY.md](./FLY-DEPLOY.md)** | Fly.io | ⚡⚡ | 15 dk |
| **[NETLIFY-ALTERNATIF.md](./NETLIFY-ALTERNATIF.md)** | Railway/Render | ⚡⚡ | 15 dk |
| **[README-DEPLOY.md](./README-DEPLOY.md)** | Genel | ⚡ | 10 dk |

---

## 🚀 Hızlı Başlangıç

### Option 1: VPS (Ubuntu)
```bash
# 1. VPS Satın Al (DigitalOcean, Hetzner, etc.)
# 2. SSH ile bağlan
ssh root@your-vps-ip

# 3. Kurulum scripti çalıştır
git clone https://github.com/your-repo/numberFightMobilGuncel.git
cd numberFightMobilGuncel/backend-dotnet
chmod +x deploy.sh
./deploy.sh

# 4. Tamamlandı!
# API: http://your-vps-ip:5227
```

📖 **Detaylı Kılavuz:** [VPS-DEPLOYMENT.md](./VPS-DEPLOYMENT.md)

---

### Option 2: Fly.io
```bash
# 1. Fly.io hesabı oluştur
# https://fly.io/app/sign-up

# 2. flyctl CLI kur
curl -L https://fly.io/install.sh | sh

# 3. Login
flyctl auth login

# 4. Deploy
cd backend-dotnet
flyctl launch
flyctl deploy

# 5. Tamamlandı!
# API: https://your-app.fly.dev
```

📖 **Detaylı Kılavuz:** [FLY-DEPLOY.md](./FLY-DEPLOY.md)

---

### Option 3: Railway
```bash
# 1. Railway hesabı oluştur
# https://railway.app

# 2. GitHub'dan import et
# - New Project
# - Deploy from GitHub repo
# - Select your repository

# 3. Environment variables ekle
# - PostgreSQL connection string
# - JWT settings
# - Admin credentials

# 4. Tamamlandı!
# Railway otomatik deploy eder
```

📖 **Detaylı Kılavuz:** [NETLIFY-ALTERNATIF.md](./NETLIFY-ALTERNATIF.md)

---

## 📊 Platform Karşılaştırması

| Özellik | VPS | Fly.io | Railway | Render |
|---------|-----|--------|---------|--------|
| **Fiyat** | $5-20/ay | Ücretsiz-$10 | $5-20/ay | Ücretsiz-$7 |
| **Ücretsiz Tier** | ❌ | ✅ (3GB RAM) | ✅ ($5 kredi) | ✅ (512MB) |
| **Setup Süresi** | 30-60 dk | 10-15 dk | 5-10 dk | 10-15 dk |
| **Zorluk** | ⚡⚡⚡⚡ | ⚡⚡ | ⚡ | ⚡⚡ |
| **Özelleştirme** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Auto Scale** | ❌ (manuel) | ✅ | ✅ | ✅ |
| **PostgreSQL** | Manuel | Manual | Included | Included |
| **SSL** | Manuel (Let's Encrypt) | Auto | Auto | Auto |
| **CI/CD** | Manuel | ✅ | ✅ (GitHub) | ✅ (GitHub) |
| **Monitoring** | Manuel | ✅ | ✅ | ✅ |
| **Backup** | Manuel | Manuel | ✅ | ✅ |

---

## ✅ Production Checklist

### 🔐 Güvenlik
- [ ] Environment variables kullan (credentials)
- [ ] HTTPS/SSL aktif
- [ ] CORS policy yapılandır
- [ ] Rate limiting ekle
- [ ] Database backup planı
- [ ] Admin panel şifresini güçlendir

### ⚙️ Konfigürasyon
- [ ] `appsettings.Production.json` yapılandır
- [ ] Database connection string
- [ ] JWT secret key değiştir
- [ ] Email/SMS servisleri yapılandır
- [ ] Logging ayarla (Serilog, etc.)

### 🚀 Performance
- [ ] Database indexleri ekle
- [ ] Response cache ekle
- [ ] Static file compression
- [ ] CDN kullan (opsiyonel)
- [ ] Load testing yap

### 📊 Monitoring
- [ ] Application Insights / New Relic
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Database monitoring

### 🔄 CI/CD
- [ ] GitHub Actions / GitLab CI
- [ ] Otomatik testler
- [ ] Otomatik deployment
- [ ] Rolling deployment strategy
- [ ] Rollback planı

---

## 🛠️ Deployment Komutları

### Build
```bash
dotnet build -c Release
```

### Publish
```bash
dotnet publish -c Release -o ./publish
```

### Database Migration
```bash
# Development
dotnet ef database update

# Production
dotnet ef database update --configuration Production
```

### Run
```bash
# Development
dotnet run --project src/API

# Production
dotnet src/API/bin/Release/net9.0/API.dll
```

---

## 🐛 Yaygın Sorunlar

### 1. Database Bağlantı Hatası
**Sorun:** "Could not connect to PostgreSQL"

**Çözüm:**
```bash
# Connection string kontrol et
echo $ConnectionStrings__DefaultConnection

# PostgreSQL çalışıyor mu?
sudo systemctl status postgresql

# Firewall kuralları
sudo ufw allow 5432
```

---

### 2. Port Zaten Kullanımda
**Sorun:** "Port 5227 is already in use"

**Çözüm:**
```bash
# Portu kullanan process'i bul
sudo lsof -i :5227

# Process'i durdur
sudo kill -9 <PID>
```

---

### 3. SSL Certificate Hatası
**Sorun:** "SSL certificate problem"

**Çözüm:**
```bash
# Let's Encrypt ile SSL kur
sudo certbot --nginx -d your-domain.com
```

---

## 📚 Ek Kaynaklar

### ASP.NET Core Deployment
- [Microsoft Docs - Deployment](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/)
- [Deploy to Linux](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/linux-nginx)

### PostgreSQL
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

### Nginx
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Reverse Proxy Config](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

### Docker
- [Docker Documentation](https://docs.docker.com/)
- [.NET Docker Images](https://hub.docker.com/_/microsoft-dotnet)

---

## 🤝 Katkıda Bulunma

Deployment dokümantasyonunu geliştirmek için:

1. Yeni platform ekleme
2. Sorun giderme bölümü genişletme
3. Örnek deployment scriptleri
4. Video kılavuzları

---

## 📞 Destek

Deployment sorunları için:
- GitHub Issues
- Stack Overflow
- Discord/Slack Community

---

**Son Güncelleme:** 1 Kasım 2024  
**Versiyon:** 1.0.0  
**Platform:** Multi-Platform

