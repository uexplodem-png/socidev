import React from 'react';
import { ShieldAlert, ArrowLeft, Mail, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NoPermissionProps {
  title?: string;
  message?: string;
  permissionName?: string;
  requiredMode?: string;
  showBackButton?: boolean;
  showContactSupport?: boolean;
}

const NoPermission: React.FC<NoPermissionProps> = ({
  title = 'Erişim Reddedildi',
  message = 'Bu kaynağa erişim izniniz bulunmamaktadır.',
  permissionName,
  requiredMode,
  showBackButton = true,
  showContactSupport = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Card Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                <div className="relative bg-white rounded-full p-4">
                  <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </div>

            {/* Permission Details */}
            {(permissionName || requiredMode) && (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg p-5 mb-6">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                  Gerekli Yetkiler:
                </p>
                
                <div className="space-y-3">
                  {permissionName && (
                    <div className="flex items-start bg-white dark:bg-gray-800 rounded-md p-3">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">İzin Adı:</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{permissionName}</p>
                      </div>
                    </div>
                  )}
                  
                  {requiredMode && (
                    <div className="flex items-start bg-white dark:bg-gray-800 rounded-md p-3">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gerekli Mod:</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {requiredMode === 'taskDoer' && 'Görev Yapan'}
                          {requiredMode === 'taskGiver' && 'Görev Veren'}
                          {requiredMode === 'both' && 'Her İkisi'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {showBackButton && (
                <button
                  onClick={() => navigate(-1)}
                  className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Geri Dön
                </button>
              )}

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-all duration-200"
              >
                <Home className="h-5 w-5 mr-2" />
                Ana Sayfaya Dön
              </button>

              {showContactSupport && (
                <button
                  onClick={() => window.location.href = 'mailto:destek@socialdev.com'}
                  className="w-full flex items-center justify-center px-6 py-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Erişim İçin Destek Ekibiyle İletişime Geçin
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Bu bir hata olduğunu düşünüyorsanız, lütfen sistem yöneticinizle iletişime geçin.
            </p>
          </div>
        </div>

        {/* Additional Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            💡 <span className="font-medium">İpucu:</span> Farklı bir hesap modunda daha fazla özelliğe erişebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoPermission;
