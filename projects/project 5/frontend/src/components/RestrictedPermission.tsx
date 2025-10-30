import React from 'react';
import { ShieldOff, Clock, AlertTriangle } from 'lucide-react';

interface RestrictedPermissionProps {
  permissionName?: string;
  message?: string;
  showContactSupport?: boolean;
}

export const RestrictedPermission: React.FC<RestrictedPermissionProps> = ({
  permissionName,
  message,
  showContactSupport = true
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <ShieldOff className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Yetkiniz Sınırlandırıldı
            </h2>
            <p className="text-white/90 text-sm">
              Bu özelliğe erişiminiz geçici olarak kısıtlanmıştır
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-6">
            {/* Warning Message */}
            <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {message || 'Bu özelliği kullanma yetkiniz yönetici tarafından kısa bir süreliğine kısıtlanmıştır.'}
                </p>
              </div>
            </div>

            {/* Permission Info */}
            {permissionName && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Kısıtlanan Özellik
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {permissionName}
                </p>
              </div>
            )}

            {/* Time Info */}
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-5 h-5" />
              <span>
                Bu kısıtlama geçici olabilir. Lütfen daha sonra tekrar deneyin.
              </span>
            </div>

            {/* Support Contact */}
            {showContactSupport && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                  Bu durumun bir hata olduğunu düşünüyorsanız veya daha fazla bilgi almak istiyorsanız:
                </p>
                <button
                  onClick={() => {
                    // TODO: Destek sayfasına yönlendir veya modal aç
                    console.log('Contact support clicked');
                  }}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors duration-200"
                >
                  Destek Ekibi ile İletişime Geç
                </button>
              </div>
            )}

            {/* Info Footer */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                Hesabınızın diğer özellikleri normal şekilde çalışmaya devam edecektir.
                Sınırlama sadece bu özellik için geçerlidir.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Geri Dön
          </button>
        </div>
      </div>
    </div>
  );
};

// Compact version for inline use
export const RestrictedPermissionCompact: React.FC<{
  permissionName?: string;
}> = ({ permissionName }) => {
  return (
    <div className="flex items-center space-x-3 px-4 py-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
      <ShieldOff className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Bu özellik şu an kullanılamıyor
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          {permissionName || 'Yetkiniz'} geçici olarak sınırlandırıldı
        </p>
      </div>
    </div>
  );
};
