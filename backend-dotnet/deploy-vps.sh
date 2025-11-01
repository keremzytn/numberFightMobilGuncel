#!/bin/bash

# NumberFight Backend - VPS Deploy Script
# Ubuntu/Debian sunucular için

set -e

echo "🚀 NumberFight Backend VPS Deployment"
echo "======================================"
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Değişkenler - KENDİ SUNUCU BİLGİLERİNİZLE DEĞİŞTİRİN
VPS_IP="your-server-ip"
VPS_USER="root"
DEPLOY_PATH="/var/www/numberfight"
DOMAIN="your-domain.com"  # veya IP adresi

# Fonksiyonlar
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 1. Local build
echo "🔨 1. Proje build ediliyor..."
cd src/API
dotnet publish -c Release -o ./publish
print_success "Build tamamlandı"

# 2. Sunucuya kopyala
echo "📦 2. Dosyalar sunucuya kopyalanıyor..."
ssh $VPS_USER@$VPS_IP "mkdir -p $DEPLOY_PATH"
scp -r ./publish/* $VPS_USER@$VPS_IP:$DEPLOY_PATH/
print_success "Dosyalar kopyalandı"

# 3. Sunucuda gerekli paketleri yükle ve servis başlat
echo "⚙️  3. Sunucu yapılandırması..."
ssh $VPS_USER@$VPS_IP 'bash -s' << 'ENDSSH'

# .NET Runtime kontrol
if ! command -v dotnet &> /dev/null; then
    echo "📥 .NET 9.0 Runtime yükleniyor..."
    wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
    chmod +x dotnet-install.sh
    ./dotnet-install.sh --channel 9.0 --runtime aspnetcore --install-dir /usr/share/dotnet
    ln -sf /usr/share/dotnet/dotnet /usr/bin/dotnet
fi

# PostgreSQL kontrol
if ! command -v psql &> /dev/null; then
    echo "📥 PostgreSQL yükleniyor..."
    apt update
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    
    # Database oluştur
    sudo -u postgres psql -c "CREATE DATABASE numberfight;" || true
    sudo -u postgres psql -c "CREATE USER numberfight WITH PASSWORD 'SecurePassword123!';" || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE numberfight TO numberfight;" || true
fi

echo "✅ Sunucu hazırlığı tamamlandı"
ENDSSH

print_success "Sunucu yapılandırıldı"

# 4. Systemd service oluştur
echo "🔧 4. Systemd service oluşturuluyor..."
ssh $VPS_USER@$VPS_IP "cat > /etc/systemd/system/numberfight.service" << 'EOF'
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
Environment=JwtSettings__SecretKey=CHANGE-THIS-TO-SECURE-KEY-MINIMUM-32-CHARACTERS-LONG

[Install]
WantedBy=multi-user.target
EOF

ssh $VPS_USER@$VPS_IP "systemctl daemon-reload"
ssh $VPS_USER@$VPS_IP "systemctl enable numberfight"
ssh $VPS_USER@$VPS_IP "systemctl restart numberfight"

print_success "Service başlatıldı"

# 5. Durum kontrolü
echo ""
echo "📊 5. Servis durumu kontrol ediliyor..."
ssh $VPS_USER@$VPS_IP "systemctl status numberfight --no-pager" || true

echo ""
print_success "Deployment tamamlandı!"
echo ""
echo "📍 API Adresi: http://$VPS_IP:5227"
echo "📚 Swagger: http://$VPS_IP:5227/swagger"
echo ""
echo "🔍 Faydalı komutlar:"
echo "  • Logları görüntüle: ssh $VPS_USER@$VPS_IP 'journalctl -u numberfight -f'"
echo "  • Servisi durdur: ssh $VPS_USER@$VPS_IP 'systemctl stop numberfight'"
echo "  • Servisi başlat: ssh $VPS_USER@$VPS_IP 'systemctl start numberfight'"
echo ""
echo "⚠️  ÖNEMLİ: Sunucuda /etc/systemd/system/numberfight.service dosyasını düzenleyerek"
echo "   JWT_SECRET_KEY ve database şifresini değiştirin!"
echo ""
echo "🌐 Nginx kurulumu için: ./setup-nginx.sh"

