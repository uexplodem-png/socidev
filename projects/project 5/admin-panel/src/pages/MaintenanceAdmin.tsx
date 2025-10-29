import { useEffect, useState } from 'react';
import { Settings, RefreshCw, Clock, Shield, CheckCircle } from 'lucide-react';

const MaintenanceAdmin = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-slate-700 via-gray-800 to-zinc-900 p-8 text-white">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                <div className="relative bg-white/30 backdrop-blur-sm p-6 rounded-full">
                  <Settings className="w-16 h-16 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-center mb-3">
              Admin Panel Maintenance
            </h1>
            <p className="text-xl text-center text-white/90">
              System Update in Progress
            </p>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Admin Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Admin Access Available Soon</span>
              </div>
            </div>

            {/* Status Message */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    System Maintenance Active
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    We're performing essential system maintenance. The admin panel will be back online shortly. 
                    Your administrative privileges will be fully restored once the update is complete.
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Updating admin systems{dots}
                </span>
                <span className="text-sm text-gray-500">Please standby</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-slate-600 via-gray-700 to-zinc-800 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">No Action Required</h3>
                </div>
                <p className="text-sm text-gray-600">
                  All admin data and settings are secure. No manual intervention needed.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Auto-Detection</h3>
                </div>
                <p className="text-sm text-gray-600">
                  This page will automatically detect when maintenance is complete
                </p>
              </div>
            </div>

            {/* Technical Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Admin Privileges</h3>
                  <p className="text-sm text-gray-600">
                    As an administrator, you will have full access immediately after maintenance completes. 
                    All administrative functions including user management, settings, and system controls will be available.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleRefresh}
                className="group bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Check Status Now
              </button>
            </div>

            {/* Footer Note */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Maintenance Status: <span className="font-medium text-gray-700">In Progress</span>
                <br />
                <span className="text-xs mt-1 block">
                  Expected completion: <span className="font-medium text-gray-700">15-30 minutes</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-300/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-zinc-300/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      {/* Auto-refresh script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            setInterval(function() {
              fetch(window.location.href, { method: 'HEAD' })
                .then(function(response) {
                  if (response.ok) {
                    window.location.reload();
                  }
                })
                .catch(function() {});
            }, 30000);
          `
        }}
      />
    </div>
  );
};

export default MaintenanceAdmin;
