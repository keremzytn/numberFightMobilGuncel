# NumberFight Backend - Deployment Rehberi

## 🐳 Docker ile Yerel Test

```bash
cd backend-dotnet
docker-compose up --build
```

API: `http://localhost:5227`
Swagger: `http://localhost:5227/swagger`

---

## 🚀 Railway.app'e Deploy

1. [Railway.app](https://railway.app) hesabı açın
2. GitHub repo'nuzu bağlayın
3. "New Project" → "Deploy from GitHub repo"
4. Root directory: `backend-dotnet` seçin
5. Environment Variables:
   ```
   JWT_SECRET_KEY=güvenli-256-bit-anahtar-buraya
   ConnectionStrings__DefaultConnection=PostgreSQL connection string (Railway otomatik sağlar)
   ASPNETCORE_ENVIRONMENT=Production
   ```
6. PostgreSQL servisi ekleyin (Add Database → PostgreSQL)
7. Deploy!

**Railway Port Ayarı:** Railway otomatik `PORT` ortam değişkeni sağlar. `Program.cs`'i güncelleyin:
```csharp
builder.WebHost.UseUrls($"http://*:{Environment.GetEnvironmentVariable("PORT") ?? "5227"}");
```

---

## 🌐 Render.com'a Deploy

1. [Render.com](https://render.com) hesabı açın
2. "New" → "Web Service"
3. GitHub repo'nuzu bağlayın
4. Ayarlar:
   - **Name**: numberfight-api
   - **Root Directory**: `backend-dotnet`
   - **Runtime**: Docker
   - **Instance Type**: Free veya Starter
5. PostgreSQL ekleyin: "New" → "PostgreSQL"
6. Environment Variables:
   ```
   JWT_SECRET_KEY=güvenli-anahtar
   ConnectionStrings__DefaultConnection=${{postgres.DATABASE_URL}}
   ASPNETCORE_ENVIRONMENT=Production
   ```
7. Deploy!

---

## ☁️ Azure App Service'e Deploy

```bash
# Azure CLI ile
az login
az group create --name numberfight-rg --location eastus
az appservice plan create --name numberfight-plan --resource-group numberfight-rg --sku B1 --is-linux
az webapp create --resource-group numberfight-rg --plan numberfight-plan --name numberfight-api --runtime "DOTNET|9.0"

# Docker Image'ı build ve push
docker build -t numberfight-api .
docker tag numberfight-api youracr.azurecr.io/numberfight-api
docker push youracr.azurecr.io/numberfight-api

# Azure PostgreSQL oluştur
az postgres flexible-server create --resource-group numberfight-rg --name numberfight-db --location eastus --admin-user dbadmin --admin-password SecurePass123! --sku-name Standard_B1ms --tier Burstable --storage-size 32
```

---

## 🖥️ Linux Sunucuda Manual Deploy

### 1. Sunucuya Bağlan
```bash
ssh user@your-server-ip
```

### 2. .NET 9.0 Runtime Yükle
```bash
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
sudo bash dotnet-install.sh --channel 9.0 --runtime aspnetcore
```

### 3. PostgreSQL Yükle
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database oluştur
sudo -u postgres psql
CREATE DATABASE numberfight;
CREATE USER dbuser WITH PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE numberfight TO dbuser;
\q
```

### 4. Projeyi Deploy Et
```bash
# Yerel makinede build
cd backend-dotnet/src/API
dotnet publish -c Release -o ./publish

# Sunucuya kopyala
scp -r ./publish user@your-server-ip:/var/www/numberfight/

# Sunucuda
cd /var/www/numberfight
dotnet API.dll
```

### 5. Systemd Service Oluştur
```bash
sudo nano /etc/systemd/system/numberfight.service
```

```ini
[Unit]
Description=NumberFight API
After=network.target

[Service]
WorkingDirectory=/var/www/numberfight
ExecStart=/usr/bin/dotnet /var/www/numberfight/API.dll
Restart=always
RestartSec=10
SyslogIdentifier=numberfight
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ConnectionStrings__DefaultConnection=Host=localhost;Database=numberfight;Username=dbuser;Password=securepassword
Environment=JwtSettings__SecretKey=your-secret-key

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable numberfight
sudo systemctl start numberfight
sudo systemctl status numberfight
```

### 6. Nginx Reverse Proxy (Opsiyonel)
```bash
sudo apt install nginx

sudo nano /etc/nginx/sites-available/numberfight
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5227;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/numberfight /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Güvenlik Kontrol Listesi

- [ ] JWT SecretKey'i güvenli ve uzun bir değer yap
- [ ] PostgreSQL şifrelerini güvenli tut
- [ ] HTTPS/SSL sertifikası ekle (Let's Encrypt)
- [ ] CORS ayarlarını production için güncelle
- [ ] Rate limiting ekle
- [ ] Firewall kuralları ayarla
- [ ] Backup stratejisi oluştur
- [ ] Environment variables'ı güvenli sakla (.env dosyası Git'e ekleme!)

---

## 📊 Database Migration

İlk deploy'da migration çalıştır:
```bash
cd backend-dotnet/src/API
dotnet ef database update
```

Veya Program.cs'e otomatik migration ekle:
```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}
```

---

## 🔍 Health Check

API'nin çalıştığını kontrol et:
```bash
curl http://your-api-url/api/users
```

---

## 💡 Tavsiyeler

1. **Railway/Render** → En kolay ve hızlı, ücretsiz tier var
2. **Azure** → Enterprise level, daha pahalı ama güvenilir
3. **VPS (DigitalOcean/Linode)** → Full kontrol, orta zorluk
4. **Docker Compose** → Yerel test için ideal

Hangi platformu seçersen seç, JWT secret'ı ve database şifrelerini mutlaka değiştir!

