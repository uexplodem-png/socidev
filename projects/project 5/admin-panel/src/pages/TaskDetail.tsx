import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, ordersAPI, usersAPI } from '../services/api';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';
import {
    ArrowLeft,
    ExternalLink,
    CheckCircle,
    Clock,
    XCircle,
    TrendingUp,
    Package,
    DollarSign,
    Flag,
    User,
    FileText,
    Activity,
    PlayCircle
} from 'lucide-react';

const TaskDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState<any>(null);
    const [order, setOrder] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [executions, setExecutions] = useState<any[]>([]);
    const [loadingExecutions, setLoadingExecutions] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'order' | 'creator' | 'executions' | 'activity'>('overview');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const resp = await tasksAPI.getTaskById(id as string);
                const t = resp.task || resp;
                setTask(t);

                if (t?.orderId) {
                    try {
                        const ord: any = await ordersAPI.getOrderById(t.orderId);
                        setOrder(ord?.order || ord || null);
                    } catch (_) { setOrder(null); }
                }

                if (t?.user?.id || t?.userId) {
                    try {
                        const u: any = await usersAPI.getUserById(t.user?.id || t.userId);
                        setUser((u && (u.user || u)) || null);
                    } catch (_) { setUser(null); }
                }
            } catch (e) {
                console.error('Failed to load task:', e);
            } finally {
                setLoading(false);
            }
        };

        if (id) load();
    }, [id]);

    // Fetch executions when Executions tab is active
    useEffect(() => {
        const loadExecutions = async () => {
            if (activeTab === 'executions' && id) {
                setLoadingExecutions(true);
                try {
                    const resp = await tasksAPI.getSubmittedTasks({ taskId: id, limit: 100 });
                    setExecutions(resp.executions || resp.data || []);
                } catch (e) {
                    console.error('Failed to load executions:', e);
                    setExecutions([]);
                } finally {
                    setLoadingExecutions(false);
                }
            }
        };

        loadExecutions();
    }, [activeTab, id]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!task) return <div className="text-gray-700 dark:text-gray-300">Task not found</div>;

    const getStatusBadge = (s: string) => {
        const configs: any = {
            pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', icon: Clock },
            approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
            rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', icon: XCircle },
            processing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', icon: TrendingUp },
            completed: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200', icon: CheckCircle },
        };
        const config = configs[s] || { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200', icon: Clock };
        const Icon = config.icon;
        return (
            <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold', config.bg, config.text)}>
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {s}
            </span>
        );
    };

    const getPriorityBadge = (p: string) => {
        const configs: any = {
            low: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
            medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
            high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
            urgent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
        };
        const config = configs[p] || configs.medium;
        return (
            <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold', config.bg, config.text)}>
                <Flag className="w-3.5 h-3.5 mr-1.5" />
                {p}
            </span>
        );
    };

    return (
        <div className="space-y-6 mt-6">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">#{String(task.id).slice(0, 8)}</h1>
                            {getStatusBadge(task.adminStatus || task.admin_status || task.status)}
                            {getPriorityBadge(task.priority || 'medium')}
                        </div>
                        <h2 className="text-xl text-gray-700 dark:text-gray-300 mb-3">
                            {task.title || `${task.type} task on ${task.platform}`}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1.5" />
                                Created {new Date(task.createdAt || task.created_at).toLocaleDateString()}
                            </div>
                            {task.updatedAt && (
                                <div className="flex items-center">
                                    <Activity className="w-4 h-4 mr-1.5" />
                                    Updated {new Date(task.updatedAt || task.updated_at).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={() => navigate('/tasks')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <Button onClick={() => window.open(task.targetUrl || task.target_url, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Target
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total Quantity</div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{task.quantity?.toLocaleString()}</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-5 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Remaining</div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">{(task.remainingQuantity ?? task.remaining_quantity)?.toLocaleString()}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Rate per Task</div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        ₺{typeof task.rate === 'string' ? parseFloat(task.rate).toFixed(2) : (task.rate ?? 0).toFixed?.(2) || Number(task.rate || 0).toFixed(2)}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-orange-500 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Progress</div>
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {task.quantity > 0 ? Math.round(((task.quantity - (task.remainingQuantity ?? task.remaining_quantity)) / task.quantity) * 100) : 0}%
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8 px-6">
                        {[
                            { id: 'overview', name: 'Overview', icon: FileText },
                            { id: 'order', name: 'Order', icon: Package },
                            { id: 'creator', name: 'Creator', icon: User },
                            { id: 'executions', name: 'Executions', icon: PlayCircle },
                            { id: 'activity', name: 'Activity', icon: Activity },
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors',
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Description */}
                            {task.description && (
                                <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-blue-500" />
                                        Description
                                    </h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{task.description}</p>
                                </div>
                            )}

                            {/* Task Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Task Type</div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white capitalize">{task.type}</div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Platform</div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white capitalize">{task.platform}</div>
                                </div>
                            </div>

                            {/* Target URL */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Target URL</div>
                                <a
                                    href={task.targetUrl || task.target_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all flex items-start"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                    {task.targetUrl || task.target_url}
                                </a>
                            </div>

                            {/* Requirements if available */}
                            {task.requirements && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center">
                                        <Flag className="w-5 h-5 mr-2" />
                                        Requirements
                                    </h3>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">{task.requirements}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'order' && (
                        <div>
                            {order ? (
                                <div className="space-y-6">
                                    {/* Order Header */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Order ID</div>
                                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">#{String(order.id).slice(0, 8)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Amount</div>
                                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">${Number(order.amount || 0).toFixed(2)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-blue-700 dark:text-blue-300 font-medium">{order.service}</span>
                                            <Button variant="outline" size="sm" onClick={() => navigate(`/orders`)}>
                                                View Order Details
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Order Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Platform</div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">{order.platform}</div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Quantity</div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">{order.quantity?.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Status</div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">{order.status}</div>
                                        </div>
                                    </div>

                                    {/* Order Target */}
                                    {order.targetUrl && (
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Order Target URL</div>
                                            <a
                                                href={order.targetUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all flex items-start"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                                {order.targetUrl}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No related order found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'creator' && (
                        <div>
                            {user ? (
                                <div className="space-y-6">
                                    {/* User Profile Card */}
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                                        <div className="flex items-start space-x-5">
                                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                                {(user.firstName?.[0] || 'U') + (user.lastName?.[0] || '')}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                                    {user.firstName} {user.lastName}
                                                </h3>
                                                {user.username && (
                                                    <p className="text-purple-600 dark:text-purple-300 font-medium mb-2">@{user.username}</p>
                                                )}
                                                <p className="text-gray-600 dark:text-gray-400 mb-4">{user.email}</p>
                                                <Button variant="outline" onClick={() => navigate(`/users?id=${user.id}`)}>
                                                    <User className="w-4 h-4 mr-2" />
                                                    View Full Profile
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* User Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Status</div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">{user.status || 'Active'}</div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Role</div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">{user.role?.replace('_', ' ') || 'User'}</div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Balance</div>
                                            <div className="text-lg font-bold text-green-600 dark:text-green-400">${user.balance?.toFixed(2) || '0.00'}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No creator information available</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'executions' && (
                        <div>
                            {loadingExecutions ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : executions.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Task Submissions ({executions.length})
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-900">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Screenshot</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Earnings</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                                {executions.map((execution: any) => {
                                                    const getStatusBadge = (status: string) => {
                                                        const configs: any = {
                                                            pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200' },
                                                            approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
                                                            rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
                                                        };
                                                        const config = configs[status] || configs.pending;
                                                        return (
                                                            <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
                                                                {status}
                                                            </span>
                                                        );
                                                    };

                                                    return (
                                                        <tr key={execution.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {execution.user?.firstName} {execution.user?.lastName}
                                                                </div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {execution.user?.email}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {execution.screenshotUrl || execution.screenshot_url ? (
                                                                    <a
                                                                        href={execution.screenshotUrl || execution.screenshot_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4 mr-1" />
                                                                        View
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-400 text-sm">No screenshot</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {getStatusBadge(execution.screenshotStatus || execution.screenshot_status || 'pending')}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                                                                ${Number(execution.earnings || 0).toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                {execution.screenshotSubmittedAt || execution.screenshot_submitted_at
                                                                    ? new Date(execution.screenshotSubmittedAt || execution.screenshot_submitted_at).toLocaleDateString()
                                                                    : 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                {(execution.screenshotStatus || execution.screenshot_status) === 'pending' && (
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={async () => {
                                                                                try {
                                                                                    await tasksAPI.approveTaskScreenshot(execution.id);
                                                                                    // Reload executions
                                                                                    const resp = await tasksAPI.getSubmittedTasks({ taskId: id, limit: 100 });
                                                                                    setExecutions(resp.executions || resp.data || []);
                                                                                } catch (e) {
                                                                                    console.error('Failed to approve:', e);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                                            Approve
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="danger"
                                                                            onClick={async () => {
                                                                                const reason = prompt('Rejection reason:');
                                                                                if (!reason) return;
                                                                                try {
                                                                                    await tasksAPI.rejectTaskScreenshot(execution.id, reason);
                                                                                    // Reload executions
                                                                                    const resp = await tasksAPI.getSubmittedTasks({ taskId: id, limit: 100 });
                                                                                    setExecutions(resp.executions || resp.data || []);
                                                                                } catch (e) {
                                                                                    console.error('Failed to reject:', e);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <XCircle className="w-3 h-3 mr-1" />
                                                                            Reject
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                                {(execution.screenshotStatus || execution.screenshot_status) === 'rejected' && execution.rejectionReason && (
                                                                    <div className="text-xs text-red-600 dark:text-red-400">
                                                                        {execution.rejectionReason || execution.rejection_reason}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <PlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No Submissions Yet</p>
                                    <p className="text-sm text-gray-400 mt-2">Task submissions will appear here once users complete and submit this task</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="text-center py-12">
                            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Activity Timeline</p>
                            <p className="text-sm text-gray-400 mt-2">Task-related activity logs will be displayed here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskDetail;
