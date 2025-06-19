#!/bin/bash

# Kullanıcıdan repo URL'si alınır
read -p "GitHub repo URL'sini gir (örnek: https://github.com/kullanici/repo.git): " REPO_URL

# Kullanıcıdan commit mesajı alınır
read -p "Commit mesajını gir: " COMMIT_MSG

# Git başlatılır
git init

# Dosyalar eklenir
git add .

# Kullanıcının girdiği mesajla commit yapılır
git commit -m "$COMMIT_MSG"

# Ana dal main olarak ayarlanır
git branch -M main

# Uzak repo eklenir
git remote add origin "$REPO_URL"

# Push işlemi yapılır
git push -u origin main

echo "Kodlar başarıyla GitHub'a yüklendi."