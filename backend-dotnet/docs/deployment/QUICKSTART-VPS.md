# ⚡ VPS Hızlı Başlangıç

## 🚀 3 Adımda Deploy

### 1️⃣ Sunucu Bilgilerini Gir

`deploy-vps.sh` dosyasını düzenle (satır 17-20):
```bash
VPS_IP="185.123.45.67"           # Sunucu IP'niz
VPS_USER="root"                  # SSH kullanıcısı
DEPLOY_PATH="/var/www/numberfight"
DOMAIN="api.numberfight.com"     # veya IP adresi
```

### 2️⃣ SSH Key Ayarla
```bash
ssh-copy-id root@your-server-ip
```

### 3️⃣ Deploy!
```bash
cd backend-dotnet
./deploy-vps.sh
```

**Hepsi bu!** 🎉

---

## 🌐 SSL Ekle (Opsiyonel - 2 dakika)

Sunucuya bağlan ve çalıştır:
```bash
ssh root@your-server-ip
cd /var/www/numberfight
./setup-nginx.sh
```

---

## 📝 Deployment Sonrası

### API Test
```bash
curl http://your-server-ip:5227/api/users
```

### Frontend Güncelle
`src/config/env.ts`:
```typescript
export const API_URL = 'https://api.numberfight.com'; // veya http://your-ip:5227
export const WS_URL = 'wss://api.numberfight.com/gameHub'; // veya ws://your-ip:5227/gameHub
```

---

## 🔄 Güncelleme (Re-deploy)

```bash
./deploy-vps.sh
```

---

## 📊 Loglar

```bash
ssh root@your-server-ip 'journalctl -u numberfight -f'
```

---

## ⚠️ UYARILAR

1. **JWT SecretKey değiştir!** Sunucuda:
   ```bash
   nano /etc/systemd/system/numberfight.service
   # JwtSettings__SecretKey satırını düzenle
   systemctl daemon-reload
   systemctl restart numberfight
   ```

2. **Database şifresi değiştir!** Aynı dosyada `Password=` kısmını düzenle

3. **Firewall aktif et:**
   ```bash
   ufw allow 22,80,443/tcp
   ufw enable
   ```

---

## 💰 Önerilen Sunucular

- **Hetzner**: €4.50/ay - 2GB RAM, 40GB SSD
- **DigitalOcean**: $6/ay - 1GB RAM, 25GB SSD
- **Vultr**: $6/ay - 1GB RAM, 25GB SSD

Hepsi yeterli!

---

## 📚 Detaylı Rehber

Daha fazla bilgi için: `VPS-DEPLOYMENT.md`

