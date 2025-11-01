#!/bin/bash

# Server Health Check Script

# Sunucu bilgileri - deploy-vps.sh ile aynı olmalı
VPS_IP="your-server-ip"
VPS_USER="root"

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔍 NumberFight Backend - Health Check"
echo "====================================="
echo ""

# 1. SSH bağlantısı kontrol
echo -n "1. SSH Bağlantısı: "
if ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "exit" 2>/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ BAŞARISIZ${NC}"
    exit 1
fi

# 2. Service durumu
echo -n "2. NumberFight Service: "
SERVICE_STATUS=$(ssh $VPS_USER@$VPS_IP "systemctl is-active numberfight" 2>/dev/null)
if [ "$SERVICE_STATUS" == "active" ]; then
    echo -e "${GREEN}✅ Çalışıyor${NC}"
else
    echo -e "${RED}❌ Durmuş${NC}"
    ssh $VPS_USER@$VPS_IP "systemctl status numberfight --no-pager"
fi

# 3. PostgreSQL durumu
echo -n "3. PostgreSQL: "
PGSQL_STATUS=$(ssh $VPS_USER@$VPS_IP "systemctl is-active postgresql" 2>/dev/null)
if [ "$PGSQL_STATUS" == "active" ]; then
    echo -e "${GREEN}✅ Çalışıyor${NC}"
else
    echo -e "${RED}❌ Durmuş${NC}"
fi

# 4. API endpoint testi
echo -n "4. API Endpoint: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$VPS_IP:5227/api/users 2>/dev/null)
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✅ Yanıt veriyor ($HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Yanıt vermiyor (HTTP $HTTP_CODE)${NC}"
fi

# 5. Disk kullanımı
echo -n "5. Disk Kullanımı: "
DISK_USAGE=$(ssh $VPS_USER@$VPS_IP "df -h / | tail -1 | awk '{print \$5}'" 2>/dev/null)
echo -e "${BLUE}$DISK_USAGE${NC}"

# 6. Bellek kullanımı
echo -n "6. RAM Kullanımı: "
MEM_USAGE=$(ssh $VPS_USER@$VPS_IP "free -h | grep Mem | awk '{print \$3\"/\"\$2}'" 2>/dev/null)
echo -e "${BLUE}$MEM_USAGE${NC}"

# 7. CPU load
echo -n "7. CPU Load: "
CPU_LOAD=$(ssh $VPS_USER@$VPS_IP "uptime | awk -F'load average:' '{print \$2}'" 2>/dev/null)
echo -e "${BLUE}$CPU_LOAD${NC}"

# 8. Son loglar
echo ""
echo "📋 Son 5 Log Satırı:"
echo "-------------------"
ssh $VPS_USER@$VPS_IP "journalctl -u numberfight -n 5 --no-pager" 2>/dev/null

echo ""
echo "✅ Health check tamamlandı!"

