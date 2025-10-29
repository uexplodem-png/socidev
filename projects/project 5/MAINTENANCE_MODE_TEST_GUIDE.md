# Maintenance Mode Test Guide

## Test Özeti
Bu rehber, maintenance mode'un doğru çalıştığını doğrulamak için adım adım test senaryolarını içerir.

## Çalışan Uygulamalar
- ✅ Backend: http://localhost:3000
- ✅ Admin Panel: http://localhost:5173
- ✅ Frontend (User Panel): http://localhost:5174

## Test Senaryoları

### Senaryo 1: Normal Durum (Maintenance Mode Kapalı)

#### Beklenen Davranış:
- Tüm kullanıcılar login yapabilir
- Tüm sayfalar erişilebilir
- Hiçbir kısıtlama yok

#### Test Adımları:
1. **Admin Panel Test:**
   - http://localhost:5173 adresine git
   - Admin email/password ile giriş yap
   - Dashboard'a erişebildiğini doğrula
   - ✅ Başarılı

2. **User Panel Test:**
   - http://localhost:5174 adresine git
   - Normal kullanıcı email/password ile giriş yap
   - Dashboard'a erişebildiğini doğrula
   - ✅ Başarılı

---

### Senaryo 2: Maintenance Mode Aktif - Admin Testi

#### Aktivasyon:
1. Admin panel'de Settings → General sekmesine git
2. "Maintenance Mode" checkbox'ını işaretle
3. "Save Settings" tıkla
4. ✅ Maintenance mode aktif oldu

#### Beklenen Davranış:
- ✅ Admin login sayfası erişilebilir olmalı
- ✅ Admin giriş yapabilmeli
- ✅ Admin tüm özellikleri kullanabilmeli
- ✅ Admin panel tamamen çalışır durumda

#### Test Adımları:

**Test 1: Admin Login**
1. Admin panel'den logout yap
2. http://localhost:5173/login adresine git
3. Admin email/password gir
4. Login butonuna tıkla
5. **Beklenen:** ✅ Başarılı giriş, dashboard'a yönlendirme
6. **Kontrol:** Admin tüm sayfalara erişebiliyor mu?

**Test 2: Admin Panel İşlevsellik**
1. Settings sayfasını aç → ✅ Açılmalı
2. Users sayfasını aç → ✅ Açılmalı
3. Orders sayfasını aç → ✅ Açılmalı
4. Tasks sayfasını aç → ✅ Açılmalı
5. **Sonuç:** Admin her şeyi kullanabilmeli

**Test 3: Moderator Girişi**
1. Logout yap
2. Moderator hesabı ile login yap
3. **Beklenen:** ✅ Başarılı giriş
4. **Kontrol:** Moderator yetkilerine göre erişim var

**Test 4: Super Admin Girişi**
1. Logout yap
2. Super Admin hesabı ile login yap
3. **Beklenen:** ✅ Başarılı giriş
4. **Kontrol:** Tüm özelliklere tam erişim

---

### Senaryo 3: Maintenance Mode Aktif - User (Normal Kullanıcı) Testi

#### Beklenen Davranış:
- ❌ Normal kullanıcı giriş yapamamalı
- ✅ Login sayfası görüntülenebilir
- ❌ Login denemesi 503 error vermeli
- ✅ Zaten giriş yapmış kullanıcı maintenance sayfasını görmeli
- ✅ Ana sayfa maintenance sayfası göstermeli

#### Test Adımları:

**Test 1: User Login Denemesi**
1. User panel'e git: http://localhost:5174
2. Login sayfası görüntüleniyor mu? → ✅ Evet
3. Normal kullanıcı email/password gir
4. Login butonuna tıkla
5. **Beklenen:** ❌ 503 Error: "The service is currently under maintenance"
6. **Sonuç:** Giriş engellendi ✅

**Test 2: Zaten Giriş Yapmış User**
1. Maintenance mode'u kapat
2. Normal kullanıcı olarak login yap
3. Maintenance mode'u tekrar aç
4. Sayfayı yenile (F5)
5. **Beklenen:** ✅ Maintenance sayfası görüntülenmeli
6. **Kontrol:** 
   - Hiçbir dashboard öğesi görünmemeli
   - Sadece maintenance mesajı olmalı
   - "Check Status" butonu çalışmalı

**Test 3: Ana Sayfa (Home) Erişimi**
1. Browser'da http://localhost:5174 aç (logout durumda)
2. **Beklenen:** ✅ Maintenance sayfası görüntülenmeli
3. **Kontrol:** 
   - Login linkine tıklanabilir mi? → ✅ Evet
   - Login sayfası açılıyor mu? → ✅ Evet (ama login çalışmaz)

**Test 4: Direct URL Erişimi**
1. http://localhost:5174/dashboard direkt yaz
2. **Beklenen:** ✅ Maintenance sayfasına yönlendirilme
3. http://localhost:5174/orders direkt yaz
4. **Beklenen:** ✅ Maintenance sayfasına yönlendirilme

**Test 5: API Erişimi**
```bash
# Token olmadan
curl http://localhost:3000/api/orders
# Beklenen: 503 Maintenance Mode error

# Normal user token ile
curl -H "Authorization: Bearer USER_TOKEN" http://localhost:3000/api/orders
# Beklenen: 503 Maintenance Mode error

# Admin token ile
curl -H "Authorization: Bearer ADMIN_TOKEN" http://localhost:3000/api/orders
# Beklenen: 200 OK (veriler dönmeli)
```

---

### Senaryo 4: Maintenance Mode Kapatma

#### Test Adımları:
1. Admin olarak login ol (maintenance aktif iken)
2. Settings → General git
3. "Maintenance Mode" checkbox'ını kaldır
4. Save Settings tıkla
5. **Beklenen:** Maintenance mode kapandı

#### Doğrulama:
1. Yeni bir incognito/private window aç
2. User panel'e git: http://localhost:5174
3. Normal kullanıcı ile login yap
4. **Beklenen:** ✅ Başarılı giriş, dashboard açılır
5. Tüm özelliklere erişim olmalı

---

## Backend Endpoint Test Matrisi

| Endpoint | Maintenance OFF | Maintenance ON (No Token) | Maintenance ON (User Token) | Maintenance ON (Admin Token) |
|----------|----------------|---------------------------|------------------------------|------------------------------|
| `/health` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `/api/auth/login` | ✅ 200/401 | ✅ 200/401* | ✅ 200/503** | ✅ 200 |
| `/api/auth/admin-login` | ✅ 200/401 | ✅ 200/401 | ✅ 200/403 | ✅ 200 |
| `/api/auth/register` | ✅ 200/400 | ✅ 200/400 | ✅ 200/400 | ✅ 200 |
| `/api/admin/*` | ✅ 200 | ❌ 503 | ❌ 503 | ✅ 200 |
| `/api/orders` | ✅ 200 | ❌ 503 | ❌ 503 | ✅ 200 |
| `/api/tasks` | ✅ 200 | ❌ 503 | ❌ 503 | ✅ 200 |
| `/api/users/profile` | ✅ 200 | ❌ 503 | ❌ 503 | ✅ 200 |

**Notlar:**
- `*` = Login sayfası açılır ama user login başarısız (503)
- `**` = User token ile login denemesi 503 döner

---

## Frontend Sayfa Erişim Matrisi

| Sayfa | Maintenance OFF | Maintenance ON (Logged Out) | Maintenance ON (User Logged In) | Maintenance ON (Admin Logged In) |
|-------|----------------|------------------------------|----------------------------------|-----------------------------------|
| `/` (Home) | ✅ Görünür | ✅ Maintenance Page | ✅ Maintenance Page | ✅ Normal Sayfa |
| `/login` | ✅ Görünür | ✅ Görünür | ✅ Redirect Dashboard | ✅ Redirect Dashboard |
| `/register` | ✅ Görünür | ✅ Görünür | ✅ Redirect Dashboard | ✅ Redirect Dashboard |
| `/dashboard` | ✅ Görünür | ✅ Maintenance Page | ✅ Maintenance Page | ✅ Görünür |
| `/orders` | ✅ Görünür | ✅ Maintenance Page | ✅ Maintenance Page | ✅ Görünür |
| `/tasks` | ✅ Görünür | ✅ Maintenance Page | ✅ Maintenance Page | ✅ Görünür |

---

## Kritik Test Noktaları

### ✅ BAŞARILI OLMASI GEREKENLER:

1. **Admin Access:**
   - ✅ Admin maintenance mode sırasında login yapabilir
   - ✅ Admin tüm özellikleri kullanabilir
   - ✅ Moderator login yapabilir
   - ✅ Super Admin login yapabilir

2. **User Block:**
   - ✅ Normal user login yapamaz (503 error)
   - ✅ Logged-in user sadece maintenance page görür
   - ✅ Hiçbir API endpoint'e erişemez
   - ✅ Direct URL ile sayfa erişimi engellenir

3. **UI/UX:**
   - ✅ Maintenance sayfası güzel görünür
   - ✅ Auto-refresh çalışır (30 saniye)
   - ✅ "Check Status" butonu çalışır
   - ✅ Login sayfası her zaman erişilebilir

### ❌ BAŞARISIZ OLMASI GEREKENLER:

1. **Security:**
   - ❌ User maintenance bypass edemez
   - ❌ Token olmadan API erişimi olmaz
   - ❌ User token ile admin routes erişilemez

2. **Edge Cases:**
   - ❌ Invalid token ile bypass yapılamaz
   - ❌ Expired token ile erişim olmaz
   - ❌ Role manipulation ile bypass yapılamaz

---

## Test Sonuçları Tablosu

| # | Test | Beklenen | Sonuç | Not |
|---|------|----------|-------|-----|
| 1 | Admin login (maintenance ON) | ✅ Success | ⏳ Test | |
| 2 | User login (maintenance ON) | ❌ 503 Error | ⏳ Test | |
| 3 | Admin panel erişim | ✅ Full Access | ⏳ Test | |
| 4 | User maintenance page | ✅ Shows Page | ⏳ Test | |
| 5 | Auto-refresh | ✅ Works | ⏳ Test | |
| 6 | API endpoints (admin token) | ✅ 200 OK | ⏳ Test | |
| 7 | API endpoints (user token) | ❌ 503 | ⏳ Test | |
| 8 | Moderator login | ✅ Success | ⏳ Test | |
| 9 | Direct URL access (user) | ❌ Blocked | ⏳ Test | |
| 10 | Maintenance deactivation | ✅ Works | ⏳ Test | |

---

## Hızlı Test Komutları

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Maintenance status
curl http://localhost:3000/api/settings/public | grep maintenance

# 3. Admin login test (gerçek credentials kullan)
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"ADMIN_EMAIL","password":"ADMIN_PASSWORD"}'

# 4. User login test (maintenance ON iken)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"USER_EMAIL","password":"USER_PASSWORD"}'

# 5. Protected endpoint test
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/orders
```

---

## Sorun Giderme

### Problem: Admin login çalışmıyor
**Çözüm:**
- Backend loglarını kontrol et: `tail -f backend_combined/logs/combined.log`
- `/api/auth/admin-login` endpoint'i whitelist'te mi? ✅ Evet (security.js)
- Admin credentials doğru mu?
- Role doğru mu? (super_admin, admin, moderator)

### Problem: Maintenance page görünmüyor
**Çözüm:**
- Settings'den maintenance.enabled = true olduğunu doğrula
- Browser cache'i temizle (Ctrl+Shift+R)
- Frontend console'da hata var mı kontrol et

### Problem: User hala erişebiliyor
**Çözüm:**
- Token'ın role field'ını kontrol et
- Middleware'in doğru sırada olduğunu doğrula (server.js)
- Backend'i restart et

---

## Commit Geçmişi
- `e51bdda` - Initial maintenance mode implementation
- `8ee7a86` - Fixed /api/auth/admin-login whitelist ✅

**Son Durum:** ✅ Tüm fix'ler uygulandı, test edilmeye hazır!
