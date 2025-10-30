/**
 * Default Permissions for User Roles
 * Tüm yeni üyeler bu yetkilerle başlar
 */

export const DEFAULT_PERMISSIONS = {
  task_doer: [
    'dashboard.view',
    'tasks.view',
    'tasks.take',
    'tasks.complete',
    'balance.view',
    'balance.withdraw',
    'devices.view',
    'devices.add',
    'accounts.view',
    'accounts.add',
    'profile.view',
    'profile.edit'
  ],
  task_giver: [
    'dashboard.view',
    'orders.view',
    'orders.create',
    'orders.cancel',
    'balance.view',
    'balance.add',
    'balance.withdraw',
    'devices.view',
    'devices.add',
    'accounts.view',
    'accounts.add',
    'profile.view',
    'profile.edit'
  ],
  both: [
    'dashboard.view',
    'tasks.view',
    'tasks.take',
    'tasks.complete',
    'orders.view',
    'orders.create',
    'orders.cancel',
    'balance.view',
    'balance.add',
    'balance.withdraw',
    'devices.view',
    'devices.add',
    'accounts.view',
    'accounts.add',
    'profile.view',
    'profile.edit'
  ],
  admin: [
    'dashboard.view',
    'users.view',
    'users.edit',
    'users.restrict',
    'orders.view',
    'orders.manage',
    'tasks.view',
    'tasks.manage',
    'transactions.view',
    'withdrawals.view',
    'withdrawals.approve',
    'settings.view',
    'settings.edit'
  ],
  moderator: [
    'dashboard.view',
    'users.view',
    'orders.view',
    'tasks.view',
    'tasks.manage',
    'transactions.view',
    'withdrawals.view'
  ],
  super_admin: ['*'] // Tüm yetkiler
};

/**
 * Kullanıcının default yetkilerini al
 * @param {string} role - Kullanıcı rolü
 * @param {string} userMode - Kullanıcı modu (task_doer, task_giver, both)
 * @returns {Array<string>} Yetki listesi
 */
export const getDefaultPermissions = (role, userMode = 'task_doer') => {
  // Önce role bazlı yetkiler
  if (role === 'super_admin' || role === 'admin' || role === 'moderator') {
    return DEFAULT_PERMISSIONS[role] || [];
  }

  // Normal üyeler için userMode'a göre
  return DEFAULT_PERMISSIONS[userMode] || DEFAULT_PERMISSIONS.task_doer;
};

/**
 * Kullanıcının yetkisini kontrol et (restricted permissions dahil)
 * @param {Array<string>} permissions - Kullanıcının sahip olduğu yetkiler
 * @param {Array<string>|null} restrictedPermissions - Sınırlandırılmış yetkiler
 * @param {string} permission - Kontrol edilecek yetki
 * @returns {Object} { hasPermission: boolean, isRestricted: boolean }
 */
export const checkPermission = (permissions, restrictedPermissions, permission) => {
  // Super admin her şeyi yapabilir
  if (permissions && permissions.includes('*')) {
    return { hasPermission: true, isRestricted: false };
  }

  // Yetki listesinde var mı?
  const hasPermission = permissions && permissions.includes(permission);

  // Sınırlandırılmış mı?
  const isRestricted = restrictedPermissions && 
                       Array.isArray(restrictedPermissions) && 
                       restrictedPermissions.includes(permission);

  return {
    hasPermission,
    isRestricted: hasPermission && isRestricted
  };
};

/**
 * Tüm permissions için detaylı bilgi
 */
export const PERMISSION_INFO = {
  'dashboard.view': {
    name: 'Anasayfa Görüntüleme',
    description: 'Ana sayfa istatistiklerini görüntüleme'
  },
  'tasks.view': {
    name: 'Görevleri Görüntüleme',
    description: 'Mevcut görevleri listeleme'
  },
  'tasks.take': {
    name: 'Görev Alma',
    description: 'Görev alıp tamamlama'
  },
  'tasks.complete': {
    name: 'Görev Tamamlama',
    description: 'Alınan görevleri tamamlama'
  },
  'orders.view': {
    name: 'Siparişleri Görüntüleme',
    description: 'Verilen siparişleri görüntüleme'
  },
  'orders.create': {
    name: 'Sipariş Verme',
    description: 'Yeni sipariş oluşturma'
  },
  'orders.cancel': {
    name: 'Sipariş İptali',
    description: 'Siparişleri iptal etme'
  },
  'balance.view': {
    name: 'Bakiye Görüntüleme',
    description: 'Hesap bakiyesini görüntüleme'
  },
  'balance.add': {
    name: 'Bakiye Ekleme',
    description: 'Hesaba bakiye yükleme'
  },
  'balance.withdraw': {
    name: 'Bakiye Çekme',
    description: 'Bakiye çekme talebi oluşturma'
  },
  'devices.view': {
    name: 'Cihazları Görüntüleme',
    description: 'Kayıtlı cihazları görüntüleme'
  },
  'devices.add': {
    name: 'Cihaz Ekleme',
    description: 'Yeni cihaz ekleme'
  },
  'accounts.view': {
    name: 'Sosyal Hesapları Görüntüleme',
    description: 'Bağlı sosyal medya hesaplarını görüntüleme'
  },
  'accounts.add': {
    name: 'Sosyal Hesap Ekleme',
    description: 'Yeni sosyal medya hesabı ekleme'
  },
  'profile.view': {
    name: 'Profil Görüntüleme',
    description: 'Kendi profilini görüntüleme'
  },
  'profile.edit': {
    name: 'Profil Düzenleme',
    description: 'Profil bilgilerini güncelleme'
  }
};
