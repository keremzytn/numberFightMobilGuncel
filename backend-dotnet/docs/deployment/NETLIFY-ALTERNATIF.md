# Netlify Alternatifi - Hybrid Deploy Stratejisi

## 🎯 Önerilen Mimari

```
┌─────────────────┐
│   Frontend      │
│   (Expo Web)    │  → Netlify / Vercel
│   React Native  │
└────────┬────────┘
         │
         │ API Calls
         │ WebSocket
         ▼
┌─────────────────┐
│   Backend       │
│   (.NET 9)      │  → Railway / Render / Azure
│   + PostgreSQL  │
└─────────────────┘
```

---

## 🚀 Backend: Railway (ÖNERİLEN)

### Neden Railway?
- ✅ .NET 9 desteği
- ✅ PostgreSQL dahil
- ✅ WebSocket/SignalR çalışır
- ✅ 500 saat/ay ücretsiz
- ✅ Otomatik HTTPS
- ✅ GitHub auto-deploy

### Hızlı Deploy
```bash
cd backend-dotnet
npm i -g @railway/cli
railway login
railway init
railway add  # PostgreSQL seç
railway variables set JWT_SECRET_KEY="guvenli-32-karakter-anahtar"
railway up
```

Deploy sonrası URL: `https://numberfight-api.up.railway.app`

---

## 🌐 Frontend: Netlify (Opsiyonel - Expo Web için)

Eğer Expo projesini web'e export edip Netlify'da host etmek istersen:

### 1. Expo Web Build
```bash
cd /Users/kerem/Documents/GitHub/numberFightMobilGuncel
npx expo export:web
```

### 2. Netlify Config
`netlify.toml` oluştur:
```toml
[build]
  command = "npx expo export:web"
  publish = "web-build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

### 3. Environment Variables (Netlify Dashboard)
```
EXPO_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
```

### 4. Deploy
```bash
npm i -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## 📱 Mobil Uygulama: Expo + Backend

Mobil uygulama için backend URL'i güncelle:

`src/config/env.ts`:
```typescript
export const API_URL = 'https://numberfight-api.up.railway.app';
export const WS_URL = 'https://numberfight-api.up.railway.app/gameHub';
```

Expo build:
```bash
eas build --platform android
eas build --platform ios
```

---

## 🔄 Tam Deploy Akışı

### 1. Backend Deploy (Railway)
```bash
cd backend-dotnet
railway up
# URL'i not al: https://numberfight-api.up.railway.app
```

### 2. Frontend env güncelle
```bash
cd ..
# src/config/env.ts dosyasını Railway URL'i ile güncelle
```

### 3. Mobil Test
```bash
npx expo start
```

### 4. (Opsiyonel) Web Deploy
```bash
npx expo export:web
netlify deploy --prod
```

---

## 💡 Diğer Backend Alternatifleri

### 1. **Render.com**
```bash
# render.yaml dosyası hazır
git push origin main
# Render otomatik deploy eder
```

### 2. **Azure App Service**
```bash
az webapp up --runtime "DOTNET:9.0" --name numberfight-api
```

### 3. **DigitalOcean App Platform**
- Dockerfile var, direkt deploy edilir
- $6/ay başlangıç

### 4. **Fly.io**
```bash
flyctl launch
flyctl deploy
```

---

## ⚡ En Hızlı Çözüm

### Backend için Railway:
1. https://railway.app
2. "New Project" → "Deploy from GitHub"
3. `backend-dotnet` klasörünü seç
4. PostgreSQL ekle
5. JWT_SECRET_KEY env variable'ı ekle
6. Deploy! ✅

### Frontend için:
- **Mobil:** Expo Go veya EAS Build
- **Web:** Netlify veya Vercel (opsiyonel)

---

## 🔥 Sonuç

**Backend için Netlify kullanılamaz**, ama:
- Backend → Railway (ücretsiz, kolay)
- Frontend Web → Netlify (opsiyonel)
- Mobil App → Expo/EAS Build

Bu kombinasyon en yaygın ve güvenilir çözüm!

