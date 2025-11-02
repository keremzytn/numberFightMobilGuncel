#!/bin/bash

# Web build oluştur
echo "🔨 Building web version..."
npm run build:web

# Dist klasörünü backend'e kopyala (wwwroot olarak)
echo "📦 Copying to backend..."
rm -rf backend-dotnet/src/API/wwwroot
cp -r dist backend-dotnet/src/API/wwwroot

echo "✅ Web files copied to backend-dotnet/src/API/wwwroot"
echo "Backend'i başlat ve http://localhost:5000 adresinden erişebilirsin"

