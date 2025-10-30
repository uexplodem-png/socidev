import React, { useEffect, useState } from 'react';
import {
    Shield,
    Activity,
    AlertTriangle,
    User,
    Search,
    Filter,
    Download,
    Eye,
    Calendar,
    Clock,
    MapPin,
    Monitor,
    X,
    RefreshCw,
} from 'lucide-react';

interface AuditLog {
    id: string;
    actorId: string;
    actorName: string;
    actorEmail: string;
    action: string;
    resource: string;
    resourceId: string;
    targetUserId: string | null;
    targetUserName: string | null;
    description: string;
    metadata: {
        ip: string;
        userAgent: string;
        changes?: {
            before: any;
            after: any;
        };
    };
    createdAt: string;
}

interface AuditStats {
    totalLogs: number;
    positiveActions: number;
    modifications: number;
    restrictiveActions: number;
}

export const AuditLogsModern: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AuditStats>({
        totalLogs: 0,
        positiveActions: 0,
        modifications: 0,
        restrictiveActions: 0,
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [resourceFilter, setResourceFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(actionFilter && { action: actionFilter }),
                ...(resourceFilter && { resource: resourceFilter }),
            });

            const response = await fetch(
                `http://localhost:3000/api/admin/audit-logs?${params}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
                setTotalPages(data.pagination?.pages || 1);

                // Calculate stats
                const positiveActions = data.logs.filter((log: AuditLog) =>
                    ['USER_CREATED', 'USER_VERIFIED', 'TRANSACTION_APPROVED'].includes(log.action)
                ).length;
                const modifications = data.logs.filter((log: AuditLog) =>
                    ['USER_UPDATED', 'SETTINGS_UPDATED', 'PERMISSION_UPDATED'].includes(log.action)
                ).length;
                const restrictiveActions = data.logs.filter((log: AuditLog) =>
                    ['USER_BANNED', 'USER_SUSPENDED', 'TRANSACTION_REJECTED'].includes(log.action)
                ).length;

                setStats({
                    totalLogs: data.logs.length,
                    positiveActions,
                    modifications,
                    restrictiveActions,
                });
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, resourceFilter]);

    const getActionBadge = (action: string) => {
        const actionStyles: Record<string, string> = {
            USER_CREATED: 'bg-green-100 text-green-800 border-green-200',
            USER_UPDATED: 'bg-blue-100 text-blue-800 border-blue-200',
            USER_DELETED: 'bg-red-100 text-red-800 border-red-200',
            USER_BANNED: 'bg-red-100 text-red-800 border-red-200',
            USER_SUSPENDED: 'bg-orange-100 text-orange-800 border-orange-200',
            USER_VERIFIED: 'bg-green-100 text-green-800 border-green-200',
            TRANSACTION_APPROVED: 'bg-green-100 text-green-800 border-green-200',
            TRANSACTION_REJECTED: 'bg-red-100 text-red-800 border-red-200',
            SETTINGS_UPDATED: 'bg-purple-100 text-purple-800 border-purple-200',
            PERMISSION_UPDATED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        };

        return (
            <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${actionStyles[action] || 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
            >
                {action.replace(/_/g, ' ')}
            </span>
        );
    };

    const getResourceIcon = (resource: string) => {
        switch (resource) {
            case 'user':
                return <User className="h-5 w-5 text-blue-500" />;
            case 'transaction':
                return <Activity className="h-5 w-5 text-green-500" />;
            case 'settings':
                return <Shield className="h-5 w-5 text-purple-500" />;
            default:
                return <Shield className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                        <p className="text-gray-500 mt-1">
                            Track all administrative actions and system events
                        </p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Logs</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.totalLogs}
                                </p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Positive Actions</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {stats.positiveActions}
                                </p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Modifications</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">
                                    {stats.modifications}
                                </p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Restrictive</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {stats.restrictiveActions}
                                </p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Actions</option>
                            <option value="USER_CREATED">User Created</option>
                            <option value="USER_UPDATED">User Updated</option>
                            <option value="USER_DELETED">User Deleted</option>
                            <option value="USER_BANNED">User Banned</option>
                            <option value="TRANSACTION_APPROVED">Transaction Approved</option>
                            <option value="TRANSACTION_REJECTED">Transaction Rejected</option>
                        </select>

                        <select
                            value={resourceFilter}
                            onChange={(e) => setResourceFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Resources</option>
                            <option value="user">User</option>
                            <option value="transaction">Transaction</option>
                            <option value="settings">Settings</option>
                            <option value="order">Order</option>
                            <option value="task">Task</option>
                        </select>

                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all shadow-lg hover:shadow-xl">
                            <Download className="h-4 w-4" />
                            Export Logs
                        </button>
                    </div>
                </div>

                {/* Audit Logs Table */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Actor
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Action
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Resource
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Target
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {log.actorName}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {log.actorEmail}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getActionBadge(log.action)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {getResourceIcon(log.resource)}
                                                        <span className="text-sm text-gray-900 capitalize">
                                                            {log.resource}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {log.targetUserName ? (
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {log.targetUserName}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                ID: {log.targetUserId}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(log.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(log.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => setSelectedLog(log)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Page {page} of {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Log Details Modal */}
                {selectedLog && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={() => setSelectedLog(null)}
                    >
                        <div 
                            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-gray-900">Audit Log Details</h2>
                                    <button
                                        onClick={() => setSelectedLog(null)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Actor Information */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                        Actor Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Name</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedLog.actorName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedLog.actorEmail}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">ID</p>
                                            <p className="text-sm font-mono text-gray-900">
                                                {selectedLog.actorId}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Details */}
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                        Action Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Action</p>
                                            <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Description</p>
                                            <p className="text-sm text-gray-900 mt-1">
                                                {selectedLog.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Resource Information */}
                                <div className="bg-purple-50 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                        Resource Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Resource Type</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {getResourceIcon(selectedLog.resource)}
                                                <p className="text-sm font-medium text-gray-900 capitalize">
                                                    {selectedLog.resource}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Resource ID</p>
                                            <p className="text-sm font-mono text-gray-900">
                                                {selectedLog.resourceId}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Target Information */}
                                {selectedLog.targetUserId && (
                                    <div className="bg-green-50 rounded-xl p-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                            Target Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Target User</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {selectedLog.targetUserName}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">User ID</p>
                                                <p className="text-sm font-mono text-gray-900">
                                                    {selectedLog.targetUserId}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                        Metadata
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-500">IP Address:</span>
                                            <span className="font-mono text-gray-900">
                                                {selectedLog.metadata.ip}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm">
                                            <Monitor className="h-4 w-4 text-gray-500 mt-0.5" />
                                            <span className="text-gray-500">User Agent:</span>
                                            <span className="text-gray-900 break-all">
                                                {selectedLog.metadata.userAgent}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-500">Timestamp:</span>
                                            <span className="text-gray-900">
                                                {new Date(selectedLog.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Changes */}
                                {selectedLog.metadata.changes && (
                                    <div className="bg-yellow-50 rounded-xl p-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                            Changes
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-2">Before</p>
                                                <pre className="text-xs bg-white p-3 rounded-lg overflow-auto max-h-40">
                                                    {JSON.stringify(selectedLog.metadata.changes.before, null, 2)}
                                                </pre>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-2">After</p>
                                                <pre className="text-xs bg-white p-3 rounded-lg overflow-auto max-h-40">
                                                    {JSON.stringify(selectedLog.metadata.changes.after, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogsModern;
