import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, Clock, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { realApiService } from '../services/realApi';

interface SystemLog {
    level: string;
    message: string;
    timestamp: string;
    [key: string]: any;
}

interface SystemLogsProps {
    type: 'combined' | 'error';
}

export const SystemLogs: React.FC<SystemLogsProps> = ({ type }) => {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        pages: 0,
    });

    useEffect(() => {
        fetchLogs();
    }, [type, pagination.page, search]);

    const fetchLogs = async () => {
        try {
            setIsLoading(true);
            const apiMethod = type === 'combined' ? realApiService.getCombinedLogs.bind(realApiService) : realApiService.getErrorLogs.bind(realApiService);
            const response = await apiMethod({
                page: pagination.page,
                limit: pagination.limit,
                search,
            });

            if (response.success && response.data) {
                setLogs(response.data.logs);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages,
                }));
            }
        } catch (error) {
            console.error(`Error fetching ${type} logs:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleClearLogs = async () => {
        if (!confirm(`Are you sure you want to clear all ${type} logs? This action cannot be undone.`)) {
            return;
        }

        try {
            await realApiService.clearSystemLogs(type);
            alert(`${type} logs cleared successfully`);
            fetchLogs();
        } catch (error) {
            console.error(`Error clearing ${type} logs:`, error);
            alert(`Failed to clear ${type} logs`);
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'warn':
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'info':
                return <Info className="h-4 w-4 text-blue-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getLevelBadgeClass = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'error':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'warn':
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'info':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={fetchLogs}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        <button
                            onClick={handleClearLogs}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                            Clear Logs
                        </button>
                    </div>
                </div>

                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Showing {logs.length} of {pagination.total} logs
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">Loading logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400">No logs found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.map((log, index) => (
                            <div
                                key={index}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        {getLevelIcon(log.level)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${getLevelBadgeClass(log.level)}`}>
                                                {log.level || 'info'}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                                            {log.message}
                                        </p>

                                        {Object.keys(log).length > 3 && (
                                            <details className="mt-2">
                                                <summary className="text-xs text-blue-600 dark:text-blue-300 cursor-pointer hover:underline">
                                                    Show metadata
                                                </summary>
                                                <pre className="mt-2 text-xs font-mono text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded overflow-x-auto break-words">
                                                    {JSON.stringify(
                                                        Object.fromEntries(
                                                            Object.entries(log).filter(([key]) => !['level', 'message', 'timestamp'].includes(key))
                                                        ),
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Page {pagination.page} of {pagination.pages}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                First
                            </button>

                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>

                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}
                                disabled={pagination.page === pagination.pages}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Last
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
