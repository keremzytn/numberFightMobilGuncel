# 🚀 NumberFight Backend - Hızlı Deployment Rehberi

## ⚡ Hızlı Başlangıç

### Yerel Docker ile Test
```bash
cd backend-dotnet
./deploy-local.sh
```
API: http://localhost:5227

---

## 🌐 En Kolay Deployment Seçenekleri

### 1️⃣ Railway.app (ÖNERİLEN - Ücretsiz)
```bash
# 1. Railway CLI yükle
npm i -g @railway/cli

# 2. Login ol
railway login

# 3. Proje oluştur
cd backend-dotnet
railway init

# 4. PostgreSQL ekle
railway add

# 5. Environment variables ayarla
railway variables set JWT_SECRET_KEY="güvenli-anahtar-buraya-en-az-32-karakter"

# 6. Deploy!
railway up
```

**Web üzerinden:** https://railway.app → New Project → Deploy from GitHub → `backend-dotnet` klasörünü seç

---

### 2️⃣ Render.com (Kolay)
1. https://render.com → New → Web Service
2. GitHub repo bağla
3. Root directory: `backend-dotnet`
4. Runtime: **Docker**
5. PostgreSQL ekle
6. Environment Variables:
   - `JWT_SECRET_KEY`: güvenli anahtar
   - `ConnectionStrings__DefaultConnection`: (Render otomatik doldurur)
7. Deploy!

**veya** `render.yaml` dosyasını kullan:
```bash
git push origin main
# Render otomatik deploy edecek
```

---

### 3️⃣ Docker Hub + Herhangi bir Sunucu
```bash
# Image build et
docker build -t yourusername/numberfight-api .

# Docker Hub'a push et
docker login
docker push yourusername/numberfight-api

# Herhangi bir sunucuda çalıştır
docker run -p 5227:5227 \
  -e ConnectionStrings__DefaultConnection="Host=db;Database=numberfight;Username=user;Password=pass" \
  -e JwtSettings__SecretKey="your-secret-key" \
  yourusername/numberfight-api
```

---

## 🔧 Deployment Sonrası Kontroller

### 1. API Çalışıyor mu?
```bash
curl https://your-api-url/api/users
```

### 2. WebSocket (SignalR) Çalışıyor mu?
```bash
curl https://your-api-url/gameHub
# Beklenen: 404 veya connection error (normal, GET desteklemiyor)
```

### 3. Swagger UI
```
https://your-api-url/swagger
```

---

## 🔐 Güvenlik Checklist

- [x] JWT SecretKey değiştirildi (min 32 karakter)
- [x] PostgreSQL şifresi güvenli
- [ ] HTTPS sertifikası aktif (Railway/Render otomatik yapar)
- [ ] CORS ayarları production için düzenlendi
- [ ] Database backupları aktif
- [ ] Environment variables Git'e eklenmedi

---

## 📱 Frontend'i Bağlama

`src/config/env.ts` dosyasını güncelle:
```typescript
export const API_URL = 'https://your-api-url.railway.app';
export const WS_URL = 'https://your-api-url.railway.app/gameHub';
```

---

## 🐛 Sorun Giderme

### Railway/Render'da logları görme
```bash
railway logs  # Railway
# veya Render dashboard'dan Logs sekmesine git
```

### Database migration hatası
```bash
# Railway shell'e gir
railway shell

# Migration çalıştır
dotnet ef database update
```

### Port hatası
Program.cs PORT environment variable'ı otomatik algılıyor. Railway/Render bunu otomatik set eder.

---

## 💰 Maliyet Karşılaştırması

| Platform | Ücretsiz Tier | Ücretli Başlangıç | Özellik |
|----------|---------------|-------------------|---------|
| **Railway** | 500 saat/ay | $5/ay | En kolay, CLI desteği |
| **Render** | 750 saat/ay | $7/ay | Otomatik SSL, CDN |
| **Azure** | $200 kredi | ~$13/ay | Enterprise grade |
| **DigitalOcean** | $200 kredi | $6/ay | Full kontrol |

**Tavsiye:** Başlangıç için Railway veya Render kullan.

---

## 📞 Destek

Detaylı rehber için: `DEPLOYMENT.md`

