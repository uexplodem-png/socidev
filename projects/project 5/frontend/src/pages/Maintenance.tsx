import { useEffect, useState } from 'react';
import { Settings, RefreshCw, Clock, AlertTriangle } from 'lucide-react';

const Maintenance = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                <div className="relative bg-white/30 backdrop-blur-sm p-6 rounded-full">
                  <Settings className="w-16 h-16 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-center mb-3">
              We'll Be Right Back!
            </h1>
            <p className="text-xl text-center text-white/90">
              Scheduled Maintenance in Progress
            </p>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Status Message */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    System Under Maintenance
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    We're currently performing scheduled maintenance to improve your experience. 
                    Our team is working hard to bring everything back online as soon as possible.
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Updating systems{dots}
                </span>
                <span className="text-sm text-gray-500">Please wait</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Auto-Refresh</h3>
                </div>
                <p className="text-sm text-gray-600">
                  This page will automatically refresh when we're back online
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Your Data is Safe</h3>
                </div>
                <p className="text-sm text-gray-600">
                  All your information and progress has been securely saved
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleRefresh}
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Check Status
              </button>
            </div>

            {/* Footer Note */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Expected downtime: <span className="font-medium text-gray-700">15-30 minutes</span>
                <br />
                <span className="text-xs mt-1 block">
                  Need urgent support? Contact us at{' '}
                  <a href="mailto:support@socidev.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    support@socidev.com
                  </a>
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-pink-300/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
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

export default Maintenance;
