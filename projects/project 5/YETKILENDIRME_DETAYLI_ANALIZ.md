# 🔐 ÜYE PANELİ YETKİLENDİRME SİSTEMİ - DETAYLI ANALİZ

## 📋 ÖNEMLİ NOTLAR

### ⚠️ Şu Anda Aktif OLMAYAN Yetkiler
Aşağıdaki yetkiler **database'de tanımlı** ancak **frontend kodunda kullanılmıyor**:
- Çoğu yetki henüz frontend'e entegre edilmemiş
- Sadece temel yetkiler aktif (dashboard, orders, tasks, devices, accounts)
- Gelecekte özellikler eklendikçe bu yetkiler aktif hale gelecek

### ✅ Şu Anda Aktif Olan Yetkiler
Frontend'de **gerçekten kullanılan** yetkiler:

---

## 1️⃣ ACCOUNTS (Sosyal Medya Hesapları)

### 📍 Kullanım Yerleri:
- **Sidebar Menü**: "Sosyal Medya Hesapları" grubu
- **Sayfalar**: 
  - `/my-accounts/instagram` - Instagram hesapları
  - `/my-accounts/youtube` - YouTube kanalları
  - `/my-accounts/tiktok` - TikTok hesapları (gelecek)
  - `/my-accounts/twitter` - Twitter hesapları (gelecek)

### 🔑 Yetkiler ve Etkileri:

#### `accounts.view` ✅ AKTİF
**Etki Alanı:**
- ✅ Sidebar'da "Sosyal Medya Hesapları" menüsünü gösterir
- ✅ `/my-accounts/instagram` sayfasına erişim
- ✅ `/my-accounts/youtube` sayfasına erişim
- ✅ Kullanıcının bağlı sosyal medya hesaplarını listeleme

**Default Permissions:**
- ✅ task_doer: VAR
- ✅ task_giver: VAR
- ✅ both: VAR

**Kısıtlanırsa:**
- ❌ Sidebar'da menü gizlenir
- ❌ Sayfalara erişim engellenir
- 🔄 RestrictedPermission ekranı gösterilir (henüz eklenmedi)

**Kod Lokasyonu:**
```tsx
// Sidebar.tsx - Line 118
{
  id: "social-accounts",
  label: t("socialMediaAccounts"),
  icon: Users,
  permission: "accounts.view",  // ← BURASI
  children: [...]
}

// App.tsx - Line 189, 199, 211, 221
<ProtectedRouteWithPermission permission='accounts.view'>
  <Route path="/my-accounts/instagram" element={<InstagramAccountsPage />} />
</ProtectedRouteWithPermission>
```

---

#### `accounts.create` ❌ KULLANILMIYOR
**Durum:** Database'de var, frontend'de kullanılmıyor
**Planlanan Kullanım:** Yeni sosyal medya hesabı ekleme butonu
**Şimdilik:** Accounts.view yetkisi varsa ekleme yapılabiliyor

---

#### `accounts.edit` ❌ KULLANILMIYOR
**Durum:** Database'de var, frontend'de kullanılmıyor
**Planlanan Kullanım:** Hesap bilgilerini düzenleme butonu

---

#### `accounts.delete` ❌ KULLANILMIYOR
**Durum:** Database'de var, frontend'de kullanılmıyor
**Planlanan Kullanım:** Hesap silme butonu

---

## 2️⃣ ACTION_LOGS (İşlem Logları)

### ❌ TAMAMEN KULLANILMIYOR
**Durum:** Frontend'de bu özellik henüz yok
**Gelecek Plan:** Kullanıcı işlem geçmişi sayfası

---

## 3️⃣ ANALYTICS (Analitikler)

### ❌ TAMAMEN KULLANILMIYOR
**Durum:** Frontend'de bu özellik henüz yok
**Gelecek Plan:** İstatistik ve analitik raporlar sayfası

---

## 4️⃣ API_KEYS (API Anahtarları)

### ❌ TAMAMEN KULLANILMIYOR
**Durum:** Frontend'de bu özellik henüz yok
**Gelecek Plan:** API entegrasyonu için key yönetimi

---

## 5️⃣ AUDIT (Denetim Logları)

### ❌ TAMAMEN KULLANILMIYOR
**Durum:** Backend'de audit log sistemi var ama frontend'de görüntüleme yok
**Gelecek Plan:** Admin panelde kullanılıyor, üye panelinde planlı değil

---

## 6️⃣ BALANCE (Bakiye İşlemleri)

### 📍 Kullanım Yerleri:
- **Sayfalar**:
  - `/add-balance` - Bakiye ekleme
  - `/withdraw-balance` - Bakiye çekme

### 🔑 Yetkiler:

#### `balance.view` ❌ KULLANILMIYOR
**Durum:** Kod'da kontrol edilmiyor, herkes bakiyesini görüyor
**Planlanan:** Dashboard ve header'daki bakiye gösterimi

---

#### `balance.adjust` ❌ KULLANILMIYOR
**Durum:** Sadece admin işlemi, üye panelinde yok

---

## 7️⃣ DASHBOARD (Anasayfa)

### 📍 Kullanım Yerleri:
- **Ana Sayfa**: `/dashboard`

### 🔑 Yetkiler:

#### `dashboard.view` ✅ AKTİF
**Etki Alanı:**
- ✅ Sidebar'da "Dashboard" menüsünü gösterir
- ✅ `/dashboard` sayfasına erişim
- ✅ Kullanıcı istatistiklerini görüntüleme

**Default Permissions:**
- ✅ task_doer: VAR
- ✅ task_giver: VAR
- ✅ both: VAR
- ✅ admin: VAR
- ✅ moderator: VAR

**Kısıtlanırsa:**
- ❌ Dashboard menüsü gizlenir
- ❌ Anasayfaya erişim engellenir
- ⚠️ Kullanıcı başka bir sayfaya yönlendirilir

**Kod Lokasyonu:**
```tsx
// Sidebar.tsx - Line 81
{
  id: "dashboard",
  label: t("dashboard"),
  icon: LayoutDashboard,
  href: "/dashboard",
  permission: "dashboard.view",  // ← BURASI
}

// App.tsx - Line 113
<ProtectedRouteWithPermission permission='dashboard.view'>
  <Route path="/dashboard" element={<DashboardPage />} />
</ProtectedRouteWithPermission>
```

---

#### `dashboard.analytics` ❌ KULLANILMIYOR
**Durum:** Gelecek özellik için ayrılmış

---

## 8️⃣ DEVICES (Cihaz Ayarları)

### 📍 Kullanım Yerleri:
- **Sayfalar**:
  - `/add-devices` - Cihaz ekleme
  - `/my-devices` - Cihazlarım

### 🔑 Yetkiler:

#### `devices.view` ✅ AKTİF
**Etki Alanı:**
- ✅ Sidebar'da "Cihaz Ayarları" menü grubunu gösterir
- ✅ `/my-devices` sayfasına erişim
- ✅ Alt menü "Cihazlarım" görünür

**Default Permissions:**
- ✅ task_doer: VAR (devices.add olarak)
- ✅ task_giver: VAR (devices.add olarak)
- ✅ both: VAR

**Kısıtlanırsa:**
- ❌ "Cihaz Ayarları" menü grubu gizlenir
- ❌ Cihaz listesine erişim engellenir

**Kod Lokasyonu:**
```tsx
// Sidebar.tsx - Line 139
{
  id: "devices",
  label: t("deviceSettings"),
  icon: Laptop,
  permission: "devices.view",  // ← BURASI
  children: [...]
}

// App.tsx - Line 177
<ProtectedRouteWithPermission permission='devices.view'>
  <Route path="/my-devices" element={<MyDevicesPage />} />
</ProtectedRouteWithPermission>
```

---

#### `devices.create` ✅ AKTİF
**Etki Alanı:**
- ✅ `/add-devices` sayfasına erişim
- ✅ Alt menü "Cihaz Ekle" görünür

**Default Permissions:**
- ✅ task_doer: VAR (devices.add olarak)
- ✅ task_giver: VAR (devices.add olarak)

**Kısıtlanırsa:**
- ❌ "Cihaz Ekle" alt menüsü gizlenir
- ❌ Cihaz ekleme sayfasına erişim engellenir

**Kod Lokasyonu:**
```tsx
// Sidebar.tsx - Line 147
{
  id: "add-devices",
  label: t("addDevices"),
  icon: Laptop,
  href: "/add-devices",
  permission: "devices.create",  // ← BURASI
}

// App.tsx - Line 167
<ProtectedRouteWithPermission permission='devices.create'>
  <Route path="/add-devices" element={<AddDevicesPage />} />
</ProtectedRouteWithPermission>
```

---

#### `devices.manage` ❌ KULLANILMIYOR
**Durum:** Gelecek özellik (düzenleme, silme)

---

#### `devices.ban` ❌ KULLANILMIYOR
**Durum:** Admin özelliği, üye panelinde olmayacak

---

## 9️⃣ DISPUTES (İtirazlar)

### ❌ TAMAMEN KULLANILMIYOR
**Durum:** Frontend'de bu özellik henüz yok
**Gelecek Plan:** Sipariş/görev itiraz sistemi

---

## 🔟 INSTAGRAM (Instagram Hesapları)

### ❌ KULLANILMIYOR (accounts.view kullanılıyor)
**Durum:** Ayrı yetki yerine `accounts.view` kullanılıyor

---

## 1️⃣1️⃣ ORDERS (Siparişler)

### 📍 Kullanım Yerleri:
- **Sayfalar**:
  - `/new-order` - Yeni sipariş ver
  - `/my-orders` - Siparişlerim

### 🔑 Yetkiler:

#### `orders.create` ✅ AKTİF + RESTRICTION DESTEĞİ
**Etki Alanı:**
- ✅ Sidebar'da "Yeni Sipariş" menüsünü gösterir (sadece Task Giver için)
- ✅ `/new-order` sayfasına erişim
- ✅ Sipariş verme formunu kullanabilme
- 🔒 **RESTRICTION KONTROLÜ VAR!**

**Default Permissions:**
- ❌ task_doer: YOK
- ✅ task_giver: VAR
- ✅ both: VAR

**Kısıtlanırsa:**
- ❌ "Yeni Sipariş" menüsü gizlenir
- 🔴 **RestrictedPermission ekranı gösterilir**
- 📝 Mesaj: "Sipariş Verme yetkiniz sınırlandırıldı"

**Kod Lokasyonu:**
```tsx
// Sidebar.tsx - Line 87
{
  id: "new-order",
  label: t("newOrder"),
  icon: ShoppingCart,
  href: "/new-order",
  requiredMode: "taskGiver",
  permission: "orders.create",  // ← BURASI
}

// App.tsx - Line 125
<ProtectedRouteWithPermission permission='orders.create'>
  <Route path="/new-order" element={<NewOrderPage />} />
</ProtectedRouteWithPermission>

// new-order/index.tsx - Line 35-82
const permissionCheck = canUsePermission('orders.create');
if (permissionCheck.isRestricted) {
  return <RestrictedPermission permissionName="Sipariş Verme" />;
}
```

---

#### `orders.view` ✅ AKTİF
**Etki Alanı:**
- ✅ Sidebar'da "Siparişlerim" menüsünü gösterir (sadece Task Giver için)
- ✅ `/my-orders` sayfasına erişim
- ✅ Verilen siparişleri listeleme

**Default Permissions:**
- ❌ task_doer: YOK
- ✅ task_giver: VAR
- ✅ both: VAR

**Kısıtlanırsa:**
- ❌ "Siparişlerim" menüsü gizlenir
- ❌ Sipariş listesine erişim engellenir

**Kod Lokasyonu:**
```tsx
// Sidebar.tsx - Line 94
{
  id: "my-orders",
  label: t("myOrders"),
  icon: ClipboardList,
  href: "/my-orders",
  requiredMode: "taskGiver",
  permission: "orders.view",  // ← BURASI
}

// App.tsx - Line 135
<ProtectedRouteWithPermission permission='orders.view'>
  <Route path="/my-orders" element={<MyOrdersPage />} />
</ProtectedRouteWithPermission>
```

---

#### `orders.cancel` ❌ KULLANILMIYOR
**Durum:** Default permissions'da var ama frontend'de kontrol edilmiyor
**Planlanan:** Sipariş iptal butonu

---

#### `orders.edit` ❌ KULLANILMIYOR
#### `orders.delete` ❌ KULLANILMIYOR
#### `orders.refund` ❌ KULLANILMIYOR

---

## 1️⃣2️⃣ PERMISSIONS (Yetki Yönetimi)

### ❌ TAMAMEN KULLANILMIYOR
**Durum:** Sadece admin panelinde var

---

## 1️⃣3️⃣ PLATFORMS (Platformlar)

### ❌ KULLANILMIYOR
**Durum:** Backend'de yönetiliyor, üye panelinde yok

---

## 1️⃣4️⃣ REPORTS (Raporlar)

### ❌ TAMAMEN KULLANILMIYOR
**Gelecek Plan:** Kullanıcı için sipariş/görev raporları

---

## 1️⃣5️⃣ ROLES (Rol Yönetimi)

### ❌ TAMAMEN KULLANILMIYOR
**Durum:** Sadece admin panelinde var

---

## 1️⃣6️⃣ SERVICES (Hizmetler)

### ❌ KULLANILMIYOR
**Durum:** Backend'de yönetiliyor, üye panelinde yok

---

## 1️⃣7️⃣ SETTINGS (Ayarlar)

### ❌ ÜYE PANELİNDE KULLANILMIYOR
**Durum:** Profil sayfası var ama permission kontrolü yok

---

## 1️⃣8️⃣ SOCIAL_ACCOUNTS (Sosyal Medya Hesapları)

### ℹ️ `accounts.view` ile AYNI
**Durum:** Ayrı permission yerine `accounts.*` kullanılıyor

---

## 1️⃣9️⃣ TASKS (Görevler)

### 📍 Kullanım Yerleri:
- **Sayfa**: `/tasks`

### 🔑 Yetkiler:

#### `tasks.view` ✅ AKTİF
**Etki Alanı:**
- ✅ Sidebar'da "Görevler" menüsünü gösterir
- ✅ `/tasks` sayfasına erişim
- ✅ Mevcut görevleri listeleme

**Default Permissions:**
- ✅ task_doer: VAR
- ❌ task_giver: YOK
- ✅ both: VAR
- ✅ admin: VAR
- ✅ moderator: VAR

**Kısıtlanırsa:**
- ❌ "Görevler" menüsü gizlenir
- ❌ Görev listesine erişim engellenir

**Kod Lokasyonu:**
```tsx
// Sidebar.tsx - Line 131
{
  id: "tasks",
  label: t("tasks"),
  icon: PlaySquare,
  href: "/tasks",
  permission: "tasks.view",  // ← BURASI
}

// App.tsx - Line 233
<ProtectedRouteWithPermission permission='tasks.view'>
  <Route path="/tasks" element={<TasksPage />} />
</ProtectedRouteWithPermission>
```

---

#### `tasks.create` ❌ KULLANILMIYOR
#### `tasks.edit` ❌ KULLANILMIYOR
#### `tasks.delete` ❌ KULLANILMIYOR
#### `tasks.approve` ❌ KULLANILMIYOR
#### `tasks.reject` ❌ KULLANILMIYOR
#### `tasks.review_screenshots` ❌ KULLANILMIYOR

---

## 2️⃣0️⃣ TRANSACTIONS (İşlemler)

### 📍 Kullanım Yerleri:
- **Sayfa**: `/add-balance`

### 🔑 Yetkiler:

#### `transactions.create` ✅ AKTİF
**Etki Alanı:**
- ✅ Sidebar'da "Bakiye Ekle" menüsünü gösterir (sadece Task Giver için)
- ✅ `/add-balance` sayfasına erişim
- ✅ Bakiye yükleme işlemi yapabilme

**Default Permissions:**
- ❌ task_doer: YOK
- ✅ task_giver: VAR (balance.add olarak)
- ✅ both: VAR

**Kısıtlanırsa:**
- ❌ "Bakiye Ekle" menüsü gizlenir
- ❌ Bakiye yükleme sayfasına erişim engellenir

**Kod Lokasyonu:**
```tsx
// Sidebar.tsx - Line 102
{
  id: "add-balance",
  label: t("addBalance"),
  icon: Wallet,
  href: "/add-balance",
  requiredMode: "taskGiver",
  permission: "transactions.create",  // ← BURASI
}

// App.tsx - Line 145
<ProtectedRouteWithPermission permission='transactions.create'>
  <Route path="/add-balance" element={<AddBalancePage />} />
</ProtectedRouteWithPermission>
```

---

#### Diğer transaction yetkileri ❌ KULLANILMIYOR

---

## 2️⃣1️⃣ USERS (Kullanıcı Yönetimi)

### ❌ TAMAMEN KULLANILMIYOR
**Durum:** Sadece admin panelinde var

---

## 2️⃣2️⃣ WITHDRAWALS (Bakiye Çekme)

### 📍 Kullanım Yerleri:
- **Sayfa**: `/withdraw-balance`

### 🔑 Yetkiler:

#### `withdrawals.create` ✅ AKTİF
**Etki Alanı:**
- ✅ Sidebar'da "Bakiye Çek" menüsünü gösterir
- ✅ `/withdraw-balance` sayfasına erişim
- ✅ Bakiye çekme talebi oluşturabilme

**Default Permissions:**
- ✅ task_doer: VAR (balance.withdraw olarak)
- ✅ task_giver: VAR
- ✅ both: VAR

**Kısıtlanırsa:**
- ❌ "Bakiye Çek" menüsü gizlenir
- ❌ Bakiye çekme sayfasına erişim engellenir

**Kod Lokasyonu:**
```tsx
// Sidebar.tsx - Line 109
{
  id: "withdraw-balance",
  label: t("withdrawBalance"),
  icon: ArrowDownLeft,
  href: "/withdraw-balance",
  permission: "withdrawals.create",  // ← BURASI
}

// App.tsx - Line 157
<ProtectedRouteWithPermission permission='withdrawals.create'>
  <Route path="/withdraw-balance" element={<WithdrawBalancePage />} />
</ProtectedRouteWithPermission>
```

---

#### Diğer withdrawal yetkileri ❌ KULLANILMIYOR

---

## 📊 ÖZET TABLO

### ✅ Aktif Yetkiler (Frontend'de Kullanılıyor)

| Yetki | Sayfa/Menü | Task Doer | Task Giver | Restriction Desteği |
|-------|------------|-----------|------------|---------------------|
| `dashboard.view` | Anasayfa | ✅ | ✅ | ❌ |
| `orders.create` | Yeni Sipariş | ❌ | ✅ | ✅ |
| `orders.view` | Siparişlerim | ❌ | ✅ | ❌ |
| `transactions.create` | Bakiye Ekle | ❌ | ✅ | ❌ |
| `withdrawals.create` | Bakiye Çek | ✅ | ✅ | ❌ |
| `devices.view` | Cihazlarım | ✅ | ✅ | ❌ |
| `devices.create` | Cihaz Ekle | ✅ | ✅ | ❌ |
| `accounts.view` | Sosyal Hesaplar | ✅ | ✅ | ❌ |
| `tasks.view` | Görevler | ✅ | ❌ | ❌ |

**TOPLAM: 9 aktif yetki**

### ❌ Tanımlı Ama Kullanılmayan Yetkiler

**TOPLAM: ~80+ yetki henüz frontend'de kullanılmıyor**

Bunlar gelecekte özellikler eklendikçe aktif hale gelecek.

---

## 🎯 ÖNERİLER

### 1. Eksik Restriction Kontrolleri Ekle
Şu sayfalara restriction kontrolü eklenmeli:
- `/my-orders` - orders.view
- `/add-balance` - transactions.create
- `/withdraw-balance` - withdrawals.create
- `/tasks` - tasks.view
- `/my-devices` - devices.view
- `/add-devices` - devices.create
- `/my-accounts/*` - accounts.view

### 2. Alt İşlem Yetkileri Ekle
Şu işlemler için yetki kontrolleri eklenmeli:
- Sipariş iptal butonu → `orders.cancel`
- Sipariş düzenle butonu → `orders.edit`
- Cihaz sil butonu → `devices.delete`
- Hesap sil butonu → `accounts.delete`
- Görev al butonu → `tasks.take`
- Görev tamamla butonu → `tasks.complete`

### 3. Yeni Özellikler İçin Hazırlık
Database'de tanımlı ama kullanılmayan yetkiler gelecek özellikler için:
- İtiraz sistemi → disputes.*
- Analitik sayfası → analytics.*
- Raporlar → reports.*
- API entegrasyonu → api_keys.*

---

## 🔒 GÜVENLİK NOTU

**ÖNEMLİ:** 
- Frontend kontrolü sadece UI için
- Backend'de mutlaka aynı yetki kontrolü olmalı
- Her API endpoint'inde yetki kontrolü yapılmalı
- Kısıtlanmış yetkiler JWT token'da taşınmalı

---

## 📝 SONUÇ

**Kullanılan Yetkiler:** 9 adet
**Kullanılmayan Yetkiler:** ~80+ adet
**Restriction Desteği:** Sadece 1 yetki (orders.create)

Sistem temel özellikleri için hazır, ancak:
- Daha fazla restriction kontrolü eklenmeli
- Alt işlem yetkileri aktif hale getirilmeli
- Yeni özellikler için yetkiler tanımlanmalı
