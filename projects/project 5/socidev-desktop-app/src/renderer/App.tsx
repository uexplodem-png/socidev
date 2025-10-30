import { useState, useEffect } from 'react';

interface Status {
  authenticated: boolean;
  instagramLoggedIn: boolean;
  instagramUsername?: string;
  currentTask?: any;
}

function App() {
  const [status, setStatus] = useState<Status>({
    authenticated: false,
    instagramLoggedIn: false,
  });
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authentication status on mount
    checkAuthStatus();

    // Listen for status updates
    window.electronAPI.onStatusUpdate((newStatus) => {
      setStatus((prev) => ({ ...prev, ...newStatus }));
    });

    return () => {
      window.electronAPI.removeAllListeners('status-update');
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userInfo = await window.electronAPI.apiGetUserInfo();
      if (userInfo) {
        setStatus((prev) => ({ ...prev, authenticated: true }));
      }

      const instagramStatus = await window.electronAPI.instagramGetStatus();
      setStatus((prev) => ({
        ...prev,
        instagramLoggedIn: instagramStatus.loggedIn,
        instagramUsername: instagramStatus.username,
      }));
    } catch (err) {
      console.error('Failed to check auth status:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.apiAuthenticate(apiKey, apiSecret);
      if (result.success) {
        setStatus((prev) => ({ ...prev, authenticated: true }));
        setApiKey('');
        setApiSecret('');
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.instagramLogin();
      if (result.success) {
        await checkAuthStatus();
      } else {
        setError(result.error || 'Instagram login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Instagram login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramLogout = async () => {
    try {
      await window.electronAPI.instagramLogout();
      setStatus((prev) => ({
        ...prev,
        instagramLoggedIn: false,
        instagramUsername: undefined,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  const handleMinimize = () => {
    window.electronAPI.minimizeToTray();
  };

  const handleQuit = () => {
    if (confirm('Are you sure you want to quit?')) {
      window.electronAPI.quitApp();
    }
  };

  if (!status.authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">SociDev Desktop</h1>
          <p className="text-gray-600 mb-6">Enter your API credentials to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="sk_..."
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your API secret"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Get your API credentials from the SociDev web app settings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">SociDev Desktop</h1>
            <p className="text-sm text-gray-600">Automation Manager</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleMinimize}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Minimize
            </button>
            <button
              onClick={handleQuit}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Quit
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Instagram Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Instagram Account</h2>

          {status.instagramLoggedIn ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {status.instagramUsername?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">@{status.instagramUsername}</p>
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Connected
                  </p>
                </div>
              </div>
              <button
                onClick={handleInstagramLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Connect your Instagram account to start automating tasks
              </p>
              <button
                onClick={handleInstagramLogin}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Opening Browser...' : 'Connect Instagram'}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                You'll need to log in manually once. Your session will be saved securely.
              </p>
            </div>
          )}
        </div>

        {/* Task Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Task Status</h2>

          {status.currentTask ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Task:</span>
                <span className="font-semibold text-gray-800">{status.currentTask.type}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(status.currentTask.completed / status.currentTask.quantity) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  {status.currentTask.completed} / {status.currentTask.quantity} completed
                </span>
                <span>
                  {Math.round((status.currentTask.completed / status.currentTask.quantity) * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No active tasks</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
