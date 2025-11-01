# Online Oyun Çıkış Sistemi Test Dökümanı

## Özellikler

### 1. Oyundan Çıkış Onayı
- Geri butonuna basıldığında onay dialog'u gösterilir
- "Oyundan çıkarsanız kaybetmiş sayılacaksınız" uyarısı
- İptal/Çık seçenekleri

### 2. Otomatik Yenilgi
- Oyundan çıkan kullanıcı otomatik kaybeder
- Rakip otomatik kazanır
- Maç sonucu veritabanına kaydedilir

### 3. Component Unmount Kontrolü
- Uygulama kapatılırsa/crash olursa otomatik çıkış
- Navigation ile sayfa değişirse otomatik çıkış
- React ref'ler ile state takibi

### 4. Rakip Bildirimi
- Rakibe "opponentLeft" event'i gönderilir
- "Rakibiniz oyundan ayrıldı. Otomatik olarak kazandınız!" mesajı
- Otomatik ana menüye yönlendirme

## Test Senaryoları

### Senaryo 1: Normal Çıkış (Geri Butonu)
1. Online oyun başlat
2. 1-2 round oyna
3. Geri butonuna bas
4. ❓ "Emin misiniz?" dialog'u çıktı mı?
5. "Çık" seç
6. ✅ Ana menüye döndü mü?
7. ✅ Backend'e LeaveGame çağrısı yapıldı mı?

**Beklenen:**
- Çıkan kullanıcı kaybetti
- Rakip kazandı bildirimi aldı
- Maç kaydedildi

### Senaryo 2: Rakibin Ekranında
1. Kullanıcı A ve B online oyun başlatsın
2. Kullanıcı A oyundan çıksın
3. ✅ Kullanıcı B'de "Rakip ayrıldı" mesajı göründü mü?
4. ✅ Kullanıcı B otomatik ana menüye yönlendirildi mi?

**Beklenen:**
- Kullanıcı B kazandı
- Alert göründü
- Ana menüye yönlendirildi

### Senaryo 3: Uygulama Kapatma
1. Online oyun başlat
2. Uygulamayı kapat (home button/swipe)
3. ✅ Backend'e LeaveGame çağrısı yapıldı mı?
4. ✅ Rakip bildirim aldı mı?

**Beklenen:**
- Component unmount oldu
- LeaveGame çağrıldı
- Rakip kazandı

### Senaryo 4: Navigation ile Çıkış
1. Online oyun başlat
2. URL ile farklı sayfaya git (örn: /profile)
3. ✅ Otomatik çıkış yapıldı mı?
4. ✅ Rakip bildirim aldı mı?

**Beklenen:**
- Component unmount cleanup çalıştı
- LeaveGame çağrıldı
- Rakip kazandı

### Senaryo 5: Tekrar Oyna
1. Online oyun bitsin (7 round)
2. "Tekrar Oyna" seç
3. ✅ Yeni oyun başladı mı?
4. ✅ Eski oyun state'i temizlendi mi?
5. ✅ Yeni matchmaking çalışıyor mu?

**Beklenen:**
- Cleanup yapıldı
- Yeni oyun başlatıldı
- Farklı gameId

### Senaryo 6: İptal Etme
1. Online oyun başlat
2. Geri butonuna bas
3. "İptal" seç
4. ✅ Oyun devam ediyor mu?
5. ✅ LeaveGame çağrılmadı mı?

**Beklenen:**
- Oyun devam etti
- Hiçbir şey değişmedi

## Backend Kontrolleri

### Console Logları
```
LeaveGame çağrıldı - GameId: xxx, UserId: yyy
Oyun tamamlandı - Kazanan: zzz
Rakibe 'opponentLeft' bildirimi gönderildi: zzz
```

### Database Kontrolleri
1. Games tablosunda Status = Completed
2. WinnerId = Rakip UserId
3. Matches tablosuna kayıt eklendi
4. Skorlar doğru kaydedildi

## Frontend Kontrolleri

### Console Logları
```
🚪 Oyundan çıkılıyor: [gameId]
Oyundan çıkış yapıldı
⚠️ Component unmount - Oyundan çıkılıyor
👋 Rakip oyundan ayrıldı
```

### UI Kontrolleri
1. Alert dialog doğru mesajı gösteriyor mu?
2. Ana menüye yönlendirme çalışıyor mu?
3. Cleanup sonrası state temiz mi?
4. Memory leak yok mu?

## Bilinen Sorunlar ve Çözümler

### Sorun 1: useEffect Dependency
**Sorun:** handleGameExit closure'da eski state kullanıyor
**Çözüm:** useRef ile gameId ve matchStatus takibi

### Sorun 2: Double LeaveGame Call
**Sorun:** Hem goBack hem unmount'ta çağrılabilir
**Çözüm:** Backend'te status kontrolü (sadece InProgress'te işlem yap)

### Sorun 3: Network Hatası
**Sorun:** LeaveGame çağrısı başarısız olursa ne olacak?
**Çözüm:** try-catch ile handle ediliyor, rakip yine de bildirim alıyor

## Performans Notları

1. **Ref Kullanımı:** State yerine ref kullanarak gereksiz re-render önlendi
2. **Cleanup:** Event listener'lar düzgün temizleniyor
3. **Error Handling:** Tüm async işlemler try-catch içinde
4. **Memory Leak:** Component unmount'ta tüm subscription'lar kaldırılıyor

## Sonraki Adımlar

1. ✅ LeaveGame endpoint'i implement edildi
2. ✅ Frontend handleGameExit eklendi
3. ✅ opponentLeft event handler eklendi
4. ✅ useRef ile state tracking
5. ⏳ Test senaryolarını çalıştır
6. ⏳ Edge case'leri kontrol et
7. ⏳ Production'a deploy et

