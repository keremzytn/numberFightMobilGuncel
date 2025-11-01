# 🖥️ VPS/Sunucu Deployment Rehberi

## 📋 Gereksinimler

### Sunucu
- **OS**: Ubuntu 22.04/24.04 veya Debian 11/12
- **RAM**: Minimum 1GB (2GB önerilen)
- **Disk**: 10GB
- **Port**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 5227 (API - opsiyonel)

### Domain (Opsiyonel ama önerilen)
- DNS A kaydı sunucu IP'sine yönlendirilmiş
- Örn: `api.numberfight.com` → `your-server-ip`

---

## 🚀 Otomatik Deployment

### 1. Bilgileri Güncelle
`deploy-vps.sh` dosyasını düzenle:
```bash
VPS_IP="185.123.45.67"        # Sunucu IP'niz
VPS_USER="root"               # SSH kullanıcısı
DEPLOY_PATH="/var/www/numberfight"
DOMAIN="api.numberfight.com"  # veya IP adresi
```

### 2. SSH Key Ayarla (Şifresiz giriş)
```bash
# Eğer yoksa SSH key oluştur
ssh-keygen -t rsa -b 4096

# Public key'i sunucuya kopyala
ssh-copy-id root@your-server-ip

# Test et
ssh root@your-server-ip
```

### 3. Deploy!
```bash
cd backend-dotnet
chmod +x deploy-vps.sh
./deploy-vps.sh
```

Script otomatik olarak:
- ✅ Projeyi build eder
- ✅ Sunucuya kopyalar
- ✅ .NET Runtime yükler
- ✅ PostgreSQL kurar
- ✅ Database oluşturur
- ✅ Systemd service ayarlar
- ✅ API'yi başlatır

---

## 🌐 Nginx + SSL Kurulumu (Opsiyonel ama önerilen)

### Sunucuda çalıştır:
```bash
chmod +x setup-nginx.sh
./setup-nginx.sh
```

Script soracak:
- Domain adınız: `api.numberfight.com`
- Email: `your@email.com`

Sonuç:
- ✅ HTTP → HTTPS yönlendirme
- ✅ Let's Encrypt SSL sertifikası
- ✅ WebSocket/SignalR desteği
- ✅ Otomatik SSL yenileme

---

## 🔧 Manuel Deployment

### 1. Sunucuya Bağlan
```bash
ssh root@your-server-ip
```

### 2. .NET Runtime Yükle
```bash
wget https://dot.net/v1/dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 9.0 --runtime aspnetcore --install-dir /usr/share/dotnet
ln -sf /usr/share/dotnet/dotnet /usr/bin/dotnet
dotnet --version
```

### 3. PostgreSQL Yükle
```bash
apt update
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Database oluştur
sudo -u postgres psql
```

PostgreSQL console'da:
```sql
CREATE DATABASE numberfight;
CREATE USER numberfight WITH PASSWORD 'SecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE numberfight TO numberfight;
\q
```

### 4. Projeyi Build Et (Yerel makinede)
```bash
cd backend-dotnet/src/API
dotnet publish -c Release -o ./publish
```

### 5. Sunucuya Kopyala
```bash
scp -r ./publish/* root@your-server-ip:/var/www/numberfight/
```

### 6. Systemd Service Oluştur

Sunucuda:
```bash
nano /etc/systemd/system/numberfight.service
```

Yapıştır:
```ini
[Unit]
Description=NumberFight API
After=network.target postgresql.service

[Service]
WorkingDirectory=/var/www/numberfight
ExecStart=/usr/bin/dotnet /var/www/numberfight/API.dll
Restart=always
RestartSec=10
SyslogIdentifier=numberfight
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ConnectionStrings__DefaultConnection=Host=localhost;Database=numberfight;Username=numberfight;Password=SecurePassword123!
Environment=JwtSettings__SecretKey=CHANGE-THIS-TO-SECURE-KEY-32-CHARS
Environment=JwtSettings__Issuer=NumberFight
Environment=JwtSettings__Audience=NumberFightClients
Environment=JwtSettings__ExpirationInMinutes=60

[Install]
WantedBy=multi-user.target
```

**ÖNEMLİ:** `JwtSettings__SecretKey` ve database `Password` değerlerini değiştirin!

### 7. Service'i Başlat
```bash
systemctl daemon-reload
systemctl enable numberfight
systemctl start numberfight
systemctl status numberfight
```

### 8. Test Et
```bash
curl http://localhost:5227/api/users
```

---

## 🔒 Nginx + SSL (Manuel)

### 1. Nginx Yükle
```bash
apt install -y nginx
```

### 2. Config Oluştur
```bash
nano /etc/nginx/sites-available/numberfight
```

```nginx
server {
    listen 80;
    server_name api.numberfight.com;

    location / {
        proxy_pass http://localhost:5227;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### 3. Aktif Et
```bash
ln -s /etc/nginx/sites-available/numberfight /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 4. SSL Sertifikası (Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.numberfight.com
```

---

## 🔥 Firewall Ayarları

```bash
# UFW yükle (eğer yoksa)
apt install -y ufw

# Kurallar
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Nginx kullanıyorsanız 5227'ye gerek yok
# Direkt erişim istiyorsanız:
# ufw allow 5227/tcp

ufw enable
ufw status
```

---

## 📊 İzleme ve Yönetim

### Logları Görüntüle
```bash
# Real-time logs
journalctl -u numberfight -f

# Son 100 satır
journalctl -u numberfight -n 100

# Bugünün logları
journalctl -u numberfight --since today
```

### Service Yönetimi
```bash
# Durumu kontrol
systemctl status numberfight

# Durdur
systemctl stop numberfight

# Başlat
systemctl start numberfight

# Yeniden başlat
systemctl restart numberfight

# Otomatik başlatmayı kapat
systemctl disable numberfight
```

### Database Backup
```bash
# Backup al
sudo -u postgres pg_dump numberfight > backup_$(date +%Y%m%d).sql

# Restore et
sudo -u postgres psql numberfight < backup_20250101.sql
```

---

## 🔄 Güncelleme (Re-deploy)

### Otomatik
```bash
cd backend-dotnet
./deploy-vps.sh
```

### Manuel
```bash
# Yerel makinede
cd backend-dotnet/src/API
dotnet publish -c Release -o ./publish
scp -r ./publish/* root@your-server-ip:/var/www/numberfight/

# Sunucuda
ssh root@your-server-ip
systemctl restart numberfight
```

---

## 🐛 Sorun Giderme

### API çalışmıyor
```bash
# Service durumu
systemctl status numberfight

# Logları kontrol
journalctl -u numberfight -n 100

# Port dinleniyor mu?
netstat -tlnp | grep 5227

# Process çalışıyor mu?
ps aux | grep dotnet
```

### Database bağlantı hatası
```bash
# PostgreSQL çalışıyor mu?
systemctl status postgresql

# Connection string doğru mu?
cat /etc/systemd/system/numberfight.service | grep Connection

# Database var mı?
sudo -u postgres psql -l
```

### Nginx hatası
```bash
# Config test
nginx -t

# Loglar
tail -f /var/log/nginx/error.log

# Yeniden başlat
systemctl restart nginx
```

### SSL sertifikası yenilenmiyor
```bash
# Manuel test
certbot renew --dry-run

# Cron job kontrol
systemctl status certbot.timer
```

---

## 📈 Performans İyileştirme

### 1. Nginx Cache
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ... diğer ayarlar
}
```

### 2. Database Connection Pooling
`appsettings.Production.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=numberfight;Username=numberfight;Password=***;Pooling=true;MinPoolSize=5;MaxPoolSize=100"
  }
}
```

### 3. Systemd Service Limitleri
```ini
[Service]
LimitNOFILE=65535
LimitNPROC=4096
```

---

## 🎯 Production Checklist

- [ ] JWT SecretKey güvenli ve uzun (min 32 karakter)
- [ ] PostgreSQL şifresi değiştirildi
- [ ] Firewall aktif ve doğru portlar açık
- [ ] Nginx reverse proxy kurulu
- [ ] SSL sertifikası aktif (Let's Encrypt)
- [ ] Otomatik backup scripti ayarlandı
- [ ] Log rotation aktif
- [ ] Monitoring kurulu (opsiyonel: Prometheus, Grafana)
- [ ] Environment variables production değerleri
- [ ] CORS ayarları sadece gerekli domain'lere izin veriyor

---

## 💡 Önerilen VPS Sağlayıcılar

1. **DigitalOcean** - $6/ay başlangıç, kolay UI
2. **Hetzner** - €4.50/ay, uygun fiyat, Almanya
3. **Vultr** - $6/ay, global lokasyonlar
4. **Linode** - $5/ay, güvenilir
5. **Contabo** - €5/ay, yüksek RAM

Tümü bu rehberle uyumlu!

