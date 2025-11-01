#!/bin/bash

echo "🚀 NumberFight Backend - Yerel Docker Deploy"
echo "=============================================="

# Docker'ın çalıştığını kontrol et
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker çalışmıyor. Lütfen Docker'ı başlatın."
    exit 1
fi

# Eski containerları temizle
echo "🧹 Eski containerlar temizleniyor..."
docker-compose down

# Yeni build ve başlat
echo "🔨 Docker image build ediliyor..."
docker-compose build

echo "▶️  Containerlar başlatılıyor..."
docker-compose up -d

echo ""
echo "✅ Backend başarıyla başlatıldı!"
echo ""
echo "📍 API Adresi: http://localhost:5227"
echo "📚 Swagger: http://localhost:5227/swagger"
echo "🗄️  PostgreSQL: localhost:5432"
echo ""
echo "📊 Logları görmek için: docker-compose logs -f api"
echo "⏹️  Durdurmak için: docker-compose down"

