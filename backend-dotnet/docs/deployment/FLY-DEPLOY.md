# Fly.io Deployment - Alternatif Platform

Fly.io da Railway gibi .NET backend için iyi bir seçenek.

## 🚀 Hızlı Deploy

### 1. Fly CLI Yükle
```bash
# macOS
brew install flyctl

# veya
curl -L https://fly.io/install.sh | sh
```

### 2. Login
```bash
flyctl auth login
```

### 3. App Oluştur
```bash
cd backend-dotnet
flyctl launch --no-deploy

# Sorular:
# App name: numberfight-api
# Region: Amsterdam veya Frankfurt (Avrupa)
# PostgreSQL? YES
# Upstash Redis? NO (ihtiyacımız yok)
```

### 4. Secrets Ekle
```bash
flyctl secrets set JWT_SECRET_KEY="guvenli-32-karakter-minimum-anahtar"
```

### 5. Deploy!
```bash
flyctl deploy
```

---

## 📝 Fly.toml Yapılandırması

`fly.toml` dosyası otomatik oluşturuldu ama kontrol et:

```toml
app = "numberfight-api"
primary_region = "ams"

[build]
  dockerfile = "Dockerfile"

[env]
  ASPNETCORE_ENVIRONMENT = "Production"

[http_service]
  internal_port = 5227
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

---

## 💰 Maliyet

- **Free Tier:** 3 shared-cpu VM, 160GB transfer/ay
- Backend için yeterli!

---

## 🔍 Faydalı Komutlar

```bash
# Logları izle
flyctl logs

# SSH bağlantısı
flyctl ssh console

# Database bağlan
flyctl postgres connect -a numberfight-api-db

# Deployment durumu
flyctl status

# Scale up/down
flyctl scale count 2  # 2 instance
flyctl scale vm shared-cpu-2x  # Daha güçlü makine
```

---

## 🔗 Sonuç

URL: `https://numberfight-api.fly.dev`

Frontend env.ts'i güncelle:
```typescript
export const API_URL = 'https://numberfight-api.fly.dev';
export const WS_URL = 'https://numberfight-api.fly.dev/gameHub';
```

