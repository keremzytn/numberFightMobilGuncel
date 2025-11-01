#!/bin/bash

# Nginx Reverse Proxy + SSL Setup
# Bu script SUNUCUDA çalıştırılmalıdır

set -e

echo "🌐 Nginx + SSL Kurulumu"
echo "======================="
echo ""

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Domain bilgisi al
read -p "Domain adınız (örn: api.numberfight.com): " DOMAIN
read -p "Email adresiniz (SSL için): " EMAIL

echo ""
echo -e "${YELLOW}ℹ️  Domain'in DNS A kaydı bu sunucuya işaret etmeli!${NC}"
read -p "DNS ayarı tamam mı? (y/n): " DNS_READY

if [ "$DNS_READY" != "y" ]; then
    echo "Önce DNS ayarını yapın, sonra bu scripti çalıştırın."
    exit 1
fi

# 1. Nginx yükle
echo "📥 1. Nginx yükleniyor..."
apt update
apt install -y nginx
systemctl enable nginx

# 2. Nginx config oluştur
echo "🔧 2. Nginx yapılandırması..."
cat > /etc/nginx/sites-available/numberfight << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:5227;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Real-IP \$remote_addr;
        
        # WebSocket/SignalR için önemli
        proxy_read_timeout 86400;
    }

    # Swagger UI için özel ayar
    location /swagger {
        proxy_pass http://localhost:5227/swagger;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # SignalR hub
    location /gameHub {
        proxy_pass http://localhost:5227/gameHub;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Site'ı aktif et
ln -sf /etc/nginx/sites-available/numberfight /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx test
nginx -t

# 3. Certbot yükle ve SSL sertifikası al
echo "🔒 3. SSL sertifikası alınıyor..."
apt install -y certbot python3-certbot-nginx

certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

# Nginx'i yeniden başlat
systemctl restart nginx

echo ""
echo -e "${GREEN}✅ Nginx + SSL kurulumu tamamlandı!${NC}"
echo ""
echo "📍 API Adresi: https://$DOMAIN"
echo "📚 Swagger: https://$DOMAIN/swagger"
echo "🔌 WebSocket: wss://$DOMAIN/gameHub"
echo ""
echo "🔄 SSL sertifikası otomatik yenilenecek (90 günlük)"
echo "   Kontrol: certbot renew --dry-run"

