import React from 'react';
import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';

interface NoPermissionProps {
  title?: string;
  message?: string;
  requiredPermission?: string;
  requiredRole?: string;
  showBackButton?: boolean;
  showContactSupport?: boolean;
}

const NoPermission: React.FC<NoPermissionProps> = ({
  title = 'Access Denied',
  message = 'You do not have permission to access this resource.',
  requiredPermission,
  requiredRole,
  showBackButton = true,
  showContactSupport = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        {/* Icon with animated background */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 animate-pulse"></div>
            <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-400 relative z-10" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {title}
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>

          {/* Permission/Role Details */}
          {(requiredPermission || requiredRole) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Access Requirements:
              </p>
              {requiredPermission && (
                <div className="flex items-start mb-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2"></span>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Required Permission:</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{requiredPermission}</p>
                  </div>
                </div>
              )}
              {requiredRole && (
                <div className="flex items-start">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mt-1.5 mr-2"></span>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Required Role:</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white capitalize">{requiredRole}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {showBackButton && (
            <Button
              onClick={() => navigate(-1)}
              variant="primary"
              className="w-full flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}

          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="w-full"
          >
            Return to Dashboard
          </Button>

          {showContactSupport && (
            <button
              onClick={() => window.location.href = 'mailto:support@socialdev.com'}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support for Access
            </button>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            If you believe this is an error, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoPermission;
