# 🔐 ADMIN PANELİ YETKİLENDİRME SİSTEMİ - DETAYLI KILAVUZ

## 📋 MEVCUT DURUM

Admin panelinde şu an **2 KATMANLI** bir yetkilendirme sistemi var:

### 1️⃣ ROL BAZLI ERİŞİM (Role-Based Access)
**Kod Konumu:** `admin-panel/src/components/ProtectedRoute.tsx`

```tsx
// Line 38
const isAdmin = user?.role === 'admin' || 
                user?.role === 'super_admin' || 
                user?.role === 'moderator';
```

**Şu an kimler admin panele girebilir:**
- ✅ `super_admin` - Tam yetki
- ✅ `admin` - Tam yetki
- ✅ `moderator` - Tam yetki
- ❌ `task_doer` - GİREMEZ
- ❌ `task_giver` - GİREMEZ

**Sorun:**
- Admin ve moderatör aynı yetkilere sahip
- Aralarında fark yok
- İkisi de her şeyi yapabiliyor

---

### 2️⃣ YETKİ BAZLI ERİŞİM (Permission-Based Access)
**Kod Konumu:** `admin-panel/src/App.tsx`

```tsx
// Örnek route
<Route path="dashboard" element={
  <ProtectedRouteWithPermission permission="analytics.view">
    <Dashboard />
  </ProtectedRouteWithPermission>
} />
```

**Şu an kontrol edilen yetkiler:**
- `analytics.view` - Dashboard
- `users.view` - Kullanıcılar
- `orders.view` - Siparişler
- `tasks.view` - Görevler
- `balance.view` - Bakiye
- `withdrawals.view` - Çekimler
- `social_accounts.view` - Sosyal Hesaplar
- `devices.view` - Cihazlar
- `platforms.view` - Platformlar
- `services.view` - Hizmetler
- `audit.view` - Denetim Logları
- `settings.view` - Ayarlar

**Sorun:**
- Backend'de kontrol edilmiyor
- Sadece frontend'de var
- Database'de admin/moderator için permission yok

---

## 🎯 ÇÖZÜM: ADMIN VE MODERATÖR YETKİLERİNİ KISITLAMA

### SEÇENEK 1: BACKEND PERMISSION SİSTEMİ (ÖNERİLEN) ⭐

Admin ve moderatör için database'de permission tanımla ve kontrol et.

#### Adım 1: Backend'de Admin Permissions Ekle

**Dosya:** `backend_combined/src/utils/permissions.js`

```javascript
export const DEFAULT_PERMISSIONS = {
  // ... mevcut kodlar ...
  
  admin: [
    // Dashboard & Analytics
    'analytics.view',
    'dashboard.view',
    
    // User Management
    'users.view',
    'users.create',
    'users.edit',
    'users.suspend',
    'users.ban',
    'users.balance',
    
    // Order Management
    'orders.view',
    'orders.edit',
    'orders.cancel',
    'orders.refund',
    
    // Task Management
    'tasks.view',
    'tasks.edit',
    'tasks.approve',
    'tasks.reject',
    'tasks.delete',
    
    // Financial Operations
    'balance.view',
    'balance.adjust',
    'transactions.view',
    'transactions.approve',
    'transactions.reject',
    'withdrawals.view',
    'withdrawals.approve',
    'withdrawals.reject',
    
    // Content Management
    'social_accounts.view',
    'devices.view',
    'devices.ban',
    'platforms.view',
    'platforms.edit',
    'services.view',
    'services.edit',
    
    // System
    'audit.view',
    'settings.view',
    'settings.edit'
  ],
  
  moderator: [
    // Dashboard (Read-only)
    'analytics.view',
    'dashboard.view',
    
    // User Management (Limited)
    'users.view',
    'users.suspend',  // Can suspend but not ban
    
    // Order Management (Read + Basic Actions)
    'orders.view',
    'orders.cancel',
    
    // Task Management (Main duty)
    'tasks.view',
    'tasks.approve',
    'tasks.reject',
    'tasks.review_screenshots',
    
    // Financial (Read-only)
    'balance.view',
    'transactions.view',
    'withdrawals.view',
    
    // Content (Read-only)
    'social_accounts.view',
    'devices.view',
    
    // System (Read-only)
    'audit.view'
    
    // ❌ NO ACCESS:
    // - users.create, users.edit, users.ban, users.balance
    // - balance.adjust, transactions.approve/reject
    // - withdrawals.approve/reject
    // - settings (any)
    // - platforms/services edit
  ],
  
  super_admin: ['*'] // Tüm yetkiler
};
```

#### Adım 2: Admin Panel'de Permission Check Ekle

**Dosya:** `admin-panel/src/contexts/AuthContext.tsx`

```tsx
interface AuthContextType {
  // ... mevcut props ...
  permissions: string[];
  hasPermission: (permission: string) => boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  
  // JWT token'dan permissions'ı çıkar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setPermissions(payload.permissions || []);
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
  }, []);
  
  const hasPermission = (permission: string): boolean => {
    // Super admin her şeyi yapabilir
    if (permissions.includes('*')) return true;
    
    // Yetki var mı?
    return permissions.includes(permission);
  };
  
  // ... return ...
};
```

#### Adım 3: Buton/İşlem Kontrolü Ekle

**Örnek: Users sayfasında Edit butonu**

```tsx
// admin-panel/src/pages/Users.tsx

import { useAuth } from '../contexts/AuthContext';

export const Users = () => {
  const { hasPermission } = useAuth();
  
  return (
    // ...
    {hasPermission('users.edit') && (
      <button onClick={handleEdit}>
        Edit User
      </button>
    )}
    
    {hasPermission('users.ban') && (
      <button onClick={handleBan}>
        Ban User
      </button>
    )}
    
    {hasPermission('users.suspend') && (
      <button onClick={handleSuspend}>
        Suspend User
      </button>
    )}
    // ...
  );
};
```

#### Adım 4: Backend API Endpoint Koruma

**Dosya:** `backend_combined/src/routes/admin/*.js`

```javascript
import { requirePermission } from '../middleware/auth.js';

// Sadece admin yapabilir
router.post('/users/:id/ban',
  authenticateToken,
  requirePermission('users.ban'),
  async (req, res) => {
    // Ban user logic
  }
);

// Admin ve moderator yapabilir
router.post('/tasks/:id/approve',
  authenticateToken,
  requirePermission('tasks.approve'),
  async (req, res) => {
    // Approve task logic
  }
);

// Sadece super admin yapabilir
router.put('/settings',
  authenticateToken,
  requirePermission('settings.edit'),
  async (req, res) => {
    // Update settings logic
  }
);
```

---

### SEÇENEK 2: BASIT ROL KONTROLÜ (HIZLI ÇÖZÜM)

Permission sistemi kurmak istemiyorsan, sadece role'e göre kontrol yap.

#### Frontend'de Rol Kontrolü

**Dosya:** `admin-panel/src/hooks/useRole.ts`

```typescript
import { useAppSelector } from '../store';

export const useRole = () => {
  const { user } = useAppSelector(state => state.auth);
  
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  
  const canEditUsers = isSuperAdmin || isAdmin;
  const canBanUsers = isSuperAdmin || isAdmin;
  const canAdjustBalance = isSuperAdmin || isAdmin;
  const canEditSettings = isSuperAdmin || isAdmin;
  const canApproveWithdrawals = isSuperAdmin || isAdmin;
  
  const canApproveT asks = isSuperAdmin || isAdmin || isModerator;
  const canViewUsers = isSuperAdmin || isAdmin || isModerator;
  
  return {
    isSuperAdmin,
    isAdmin,
    isModerator,
    canEditUsers,
    canBanUsers,
    canAdjustBalance,
    canEditSettings,
    canApproveWithdrawals,
    canApproveTasks,
    canViewUsers,
  };
};
```

#### Kullanım Örneği

```tsx
import { useRole } from '../hooks/useRole';

export const Users = () => {
  const { canEditUsers, canBanUsers } = useRole();
  
  return (
    <>
      {canEditUsers && (
        <button onClick={handleEdit}>Edit</button>
      )}
      
      {canBanUsers && (
        <button onClick={handleBan}>Ban</button>
      )}
      
      {/* Moderator bu butonları göremez */}
    </>
  );
};
```

#### Backend'de Rol Kontrolü

**Dosya:** `backend_combined/src/middleware/auth.js`

```javascript
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
};

// Kullanım
router.post('/users/:id/ban',
  authenticateToken,
  requireRole('super_admin', 'admin'),  // Sadece super_admin ve admin
  async (req, res) => {
    // Ban user
  }
);

router.post('/tasks/:id/approve',
  authenticateToken,
  requireRole('super_admin', 'admin', 'moderator'),  // Hepsi yapabilir
  async (req, res) => {
    // Approve task
  }
);
```

---

## 📊 YETKİ KARŞILAŞTIRMA TABLOSU

### Önerilen Yetki Dağılımı

| İşlem | Super Admin | Admin | Moderator |
|-------|-------------|-------|-----------|
| **Kullanıcı Yönetimi** |
| Kullanıcı Görüntüleme | ✅ | ✅ | ✅ |
| Kullanıcı Oluşturma | ✅ | ✅ | ❌ |
| Kullanıcı Düzenleme | ✅ | ✅ | ❌ |
| Kullanıcı Askıya Alma | ✅ | ✅ | ✅ |
| Kullanıcı Banlama | ✅ | ✅ | ❌ |
| Bakiye Ayarlama | ✅ | ✅ | ❌ |
| **Sipariş Yönetimi** |
| Sipariş Görüntüleme | ✅ | ✅ | ✅ |
| Sipariş Düzenleme | ✅ | ✅ | ❌ |
| Sipariş İptali | ✅ | ✅ | ✅ |
| İade İşlemleri | ✅ | ✅ | ❌ |
| **Görev Yönetimi** |
| Görev Görüntüleme | ✅ | ✅ | ✅ |
| Görev Onaylama | ✅ | ✅ | ✅ |
| Görev Reddetme | ✅ | ✅ | ✅ |
| Screenshot İnceleme | ✅ | ✅ | ✅ |
| Görev Düzenleme | ✅ | ✅ | ❌ |
| Görev Silme | ✅ | ✅ | ❌ |
| **Finansal İşlemler** |
| Bakiye Görüntüleme | ✅ | ✅ | ✅ |
| İşlem Görüntüleme | ✅ | ✅ | ✅ |
| Çekim Görüntüleme | ✅ | ✅ | ✅ |
| Çekim Onaylama | ✅ | ✅ | ❌ |
| Çekim Reddetme | ✅ | ✅ | ❌ |
| İşlem Onaylama | ✅ | ✅ | ❌ |
| Bakiye Ayarlama | ✅ | ✅ | ❌ |
| **İçerik Yönetimi** |
| Sosyal Hesap Görüntüleme | ✅ | ✅ | ✅ |
| Sosyal Hesap Doğrulama | ✅ | ✅ | ✅ |
| Cihaz Görüntüleme | ✅ | ✅ | ✅ |
| Cihaz Banlama | ✅ | ✅ | ❌ |
| Platform Yönetimi | ✅ | ✅ | ❌ |
| Hizmet Yönetimi | ✅ | ✅ | ❌ |
| **Sistem** |
| Dashboard Görüntüleme | ✅ | ✅ | ✅ |
| Analitik Görüntüleme | ✅ | ✅ | ✅ |
| Denetim Logları | ✅ | ✅ | ✅ |
| Sistem Ayarları | ✅ | ✅ | ❌ |
| Yetki Yönetimi | ✅ | ❌ | ❌ |

---

## 🔧 UYGULAMA ADIMLARI

### Hızlı Başlangıç (1-2 saat)

1. **Backend - Rol bazlı middleware ekle**
   ```bash
   # backend_combined/src/middleware/auth.js dosyasına requireRole ekle
   ```

2. **Backend - Kritik endpoint'leri koru**
   ```bash
   # /api/admin/users/:id/ban
   # /api/admin/balance/adjust
   # /api/admin/withdrawals/:id/approve
   # /api/admin/settings
   ```

3. **Frontend - useRole hook'u oluştur**
   ```bash
   # admin-panel/src/hooks/useRole.ts
   ```

4. **Frontend - Butonları gizle**
   ```bash
   # Users.tsx - Edit/Ban butonları
   # Balance.tsx - Adjust butonu
   # Withdrawals.tsx - Approve butonu
   # Settings.tsx - Tüm sayfa
   ```

### Tam Çözüm (4-6 saat)

1. **Backend - Permission sistemi kur** ✅ Zaten var
2. **Backend - Admin permissions ekle** (yukarıdaki kod)
3. **Backend - Endpoint'leri requirePermission ile koru**
4. **Frontend - AuthContext'e permission ekle**
5. **Frontend - Her sayfada permission kontrolü**
6. **Frontend - Buton seviyesinde permission kontrolü**
7. **Test - Her rol için tüm işlemleri test et**

---

## 🎯 ÖNERİ: HANGİSİNİ SEÇMELİ?

### SEÇENEK 1 (Permission Sistemi) - Önerilir Eğer:
- ✅ Gelecekte daha fazla rol ekleyecekseniz
- ✅ İnce ayarlı yetki kontrolü istiyorsanız
- ✅ Audit trail önemliyse
- ✅ Büyük ekip çalışacaksa

### SEÇENEK 2 (Rol Kontrolü) - Önerilir Eğer:
- ✅ Hızlı çözüm istiyorsanız
- ✅ Sadece 3 rol olacaksa (super_admin, admin, moderator)
- ✅ Basit yetki yapısı yeterliyse
- ✅ Küçük ekip çalışacaksa

---

## 💡 SONUÇ VE TAVSİYELER

### Şu An Ne Yapmalı:

1. **Acil (Bugün):**
   - Backend'e `requireRole` middleware'i ekle
   - Kritik 5-10 endpoint'i koru (ban, balance adjust, settings)
   - Frontend'de kritik butonları gizle

2. **Kısa Vadeli (Bu Hafta):**
   - useRole hook'u oluştur
   - Tüm admin sayfalarında rol kontrolü ekle
   - Test et: Moderator olarak giriş yap ve kısıtlamaları kontrol et

3. **Orta Vadeli (Bu Ay):**
   - Full permission sistemi kur
   - Database'de admin/moderator permissions tanımla
   - Access Control sayfasını admin paneli için de kullan

### Güvenlik Notları:

⚠️ **ÖNEMLİ:**
- Frontend kontrolü sadece UI için!
- Her endpoint mutlaka backend'de kontrol edilmeli
- JWT token'da permissions taşınmalı
- Audit log her yetkili işlemde tutulmalı

### Test Senaryoları:

```bash
# Moderator olarak test et:
1. Kullanıcı banlayamıyor mu? ✓
2. Bakiye ayarlayamıyor mu? ✓
3. Sistem ayarlarına giremiyor mu? ✓
4. Görev onaylayabiliyor mu? ✓
5. Çekim onaylayamıyor mu? ✓

# Admin olarak test et:
1. Tüm işlemleri yapabiliyor mu? ✓
2. Sadece settings'e giremiyor mu? ✓

# Super Admin olarak test et:
1. Her şeyi yapabiliyor mu? ✓
```

---

## 📝 ÖRNEK KOD ŞABLONLARI

### Backend Middleware

```javascript
// requireRole.js
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      // Audit log
      logAudit(req, {
        action: 'access_denied',
        resource: req.path,
        description: `User ${req.user.role} attempted to access ${allowedRoles.join(',')} only endpoint`,
        metadata: { requiredRoles: allowedRoles, userRole: req.user.role }
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
};
```

### Frontend Hook

```typescript
// useRole.ts
export const useRole = () => {
  const { user } = useAppSelector(state => state.auth);
  
  return {
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator',
    
    // Helper methods
    canDo: (action: string) => {
      const rolePermissions = {
        super_admin: ['*'],
        admin: [
          'users.edit', 'users.ban', 'balance.adjust', 
          'withdrawals.approve', 'settings.edit'
        ],
        moderator: [
          'tasks.approve', 'users.suspend'
        ]
      };
      
      const perms = rolePermissions[user?.role] || [];
      return perms.includes('*') || perms.includes(action);
    }
  };
};
```

---

Hangi yaklaşımı seçersen seç, **mutlaka backend'de de kontrol et**! 🔒
