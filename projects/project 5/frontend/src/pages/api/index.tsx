import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Copy, Key, Activity, AlertCircle, RefreshCw } from 'lucide-react';

interface ApiKey {
  id: string;
  apiKey: string;
  apiSecret?: string;
  status: 'active' | 'suspended' | 'revoked';
  lastUsedAt: string | null;
  totalRequests: number;
  rateLimit: number;
  allowedIps: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ipAddress: string;
  responseTime: number;
  errorMessage?: string;
  createdAt: string;
}

const ApiPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{ apiKey: string; apiSecret: string } | null>(null);
  const [logsPagination, setLogsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch API key
  const fetchApiKey = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/user/api-key', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
      } else if (response.status === 404) {
        // User has no API key yet
        setApiKey(null);
      } else {
        throw new Error('Failed to fetch API key');
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch API logs
  const fetchApiLogs = async (page = 1) => {
    try {
      setLogsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/user/api-key/logs?page=${page}&limit=${logsPagination.limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setApiLogs(data.logs);
        setLogsPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching API logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  // Generate new API key
  const handleGenerateApiKey = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/user/api-key/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedKey({
          apiKey: data.apiKey.apiKey,
          apiSecret: data.apiKey.apiSecret,
        });
        setShowGenerateModal(false);
        await fetchApiKey();
        toast.success('API key generated successfully');
      } else {
        throw new Error(data.error || 'Failed to generate API key');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate API key');
    }
  };

  // Regenerate API secret
  const handleRegenerateSecret = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/user/api-key/regenerate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedKey({
          apiKey: data.apiKey.apiKey,
          apiSecret: data.apiKey.apiSecret,
        });
        setShowRegenerateModal(false);
        await fetchApiKey();
        toast.success('API secret regenerated successfully');
      } else {
        throw new Error(data.error || 'Failed to regenerate API secret');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate API secret');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetchApiLogs(1);
    }
  }, [apiKey]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', label: 'Suspended' },
      revoked: { color: 'bg-red-100 text-red-800', label: 'Revoked' },
    };
    const { color, label } = statusMap[status] || statusMap.active;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
  };

  const getMethodBadge = (method: string) => {
    const methodMap: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${methodMap[method] || 'bg-gray-100 text-gray-800'}`}>{method}</span>;
  };

  const getStatusCodeBadge = (code: number) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    if (code >= 200 && code < 300) colorClass = 'bg-green-100 text-green-800';
    else if (code >= 300 && code < 400) colorClass = 'bg-blue-100 text-blue-800';
    else if (code >= 400 && code < 500) colorClass = 'bg-yellow-100 text-yellow-800';
    else if (code >= 500) colorClass = 'bg-red-100 text-red-800';

    return <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>{code}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading API information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Management</h1>
          <p className="text-gray-600">Manage your API keys and monitor usage</p>
        </div>

        {/* No API Key State */}
        {!apiKey && !generatedKey && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
              <Key className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No API Key Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Generate an API key to start integrating with our platform. Each account can have only one API key.
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate API Key
            </button>
          </div>
        )}

        {/* Generated Key Display (One-time show) */}
        {generatedKey && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">⚠️ Save Your Credentials Now!</h3>
                <p className="text-blue-100 mb-6">
                  This is the only time you'll see your API secret. Please save it in a secure location.
                </p>

                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <label className="block text-sm font-medium text-blue-100 mb-2">API Key</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-4 py-2 bg-white/20 rounded text-white font-mono text-sm break-all">
                        {generatedKey.apiKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generatedKey.apiKey, 'API Key')}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <label className="block text-sm font-medium text-blue-100 mb-2">API Secret</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-4 py-2 bg-white/20 rounded text-white font-mono text-sm break-all">
                        {generatedKey.apiSecret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generatedKey.apiSecret, 'API Secret')}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setGeneratedKey(null)}
                  className="mt-6 px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  I've Saved My Credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Key Info */}
        {apiKey && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Stats Cards */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{apiKey.totalRequests.toLocaleString()}</p>
                  </div>
                  <Activity className="w-10 h-10 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rate Limit</p>
                    <p className="text-2xl font-bold text-gray-900">{apiKey.rateLimit.toLocaleString()}/day</p>
                  </div>
                  <Key className="w-10 h-10 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(apiKey.status)}</div>
                  </div>
                  <AlertCircle className="w-10 h-10 text-purple-600" />
                </div>
              </div>
            </div>

            {/* API Key Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">API Key Details</h2>
                <button
                  onClick={() => setShowRegenerateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Regenerate Secret</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono break-all">
                      {apiKey.apiKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(apiKey.apiKey, 'API Key')}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-sm text-gray-900">
                      {new Date(apiKey.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Used</label>
                    <p className="text-sm text-gray-900">
                      {apiKey.lastUsedAt
                        ? new Date(apiKey.lastUsedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {apiKey.allowedIps && apiKey.allowedIps.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allowed IPs</label>
                    <div className="flex flex-wrap gap-2">
                      {apiKey.allowedIps.map((ip, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {ip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* API Logs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">API Request Logs</h2>

              {logsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading logs...</p>
                </div>
              ) : apiLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No API requests yet</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Endpoint
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Response Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {apiLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <code className="text-xs">{log.endpoint}</code>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{getMethodBadge(log.method)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusCodeBadge(log.statusCode)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.responseTime}ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {logsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Page {logsPagination.page} of {logsPagination.totalPages} ({logsPagination.total} total logs)
                      </div>
                      <div className="flex space-x-2">
                        <button
                          disabled={logsPagination.page === 1}
                          onClick={() => fetchApiLogs(logsPagination.page - 1)}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          disabled={logsPagination.page === logsPagination.totalPages}
                          onClick={() => fetchApiLogs(logsPagination.page + 1)}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Generate API Key Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Generate API Key</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to generate an API key? You can only have one API key per account.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleGenerateApiKey}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate
              </button>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Secret Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Regenerate API Secret</h3>
            <p className="text-gray-600 mb-6">
              This will generate a new API secret. Your API key will remain the same, but you'll need to update your
              applications with the new secret.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">⚠️ This will invalidate your current API secret immediately.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRegenerateSecret}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiPage;
