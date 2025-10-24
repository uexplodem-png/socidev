import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button';
import { usePermissions } from '../hooks/usePermissions';
import { withdrawalsAPI, usersAPI } from '../services/api';
import { User } from '../types';
import { Eye, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

interface WithdrawalRequest {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    method?: { name: string; type?: string; processingTime?: string };
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    requestedAt: string;
    processedAt?: string;
    processedBy?: string;
    notes?: string;
}

// Add a small comment to trigger TypeScript refresh
// This is a workaround for import issues

const Withdrawals: React.FC = () => {
    const { hasPermission } = usePermissions();
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0
    });

    // Mock data for user details tabs
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        try {
            const response = await withdrawalsAPI.getWithdrawals({ limit: 100 });

            const withdrawalRequests: WithdrawalRequest[] = response.data.map((tx: any) => ({
                id: tx.id,
                userId: tx.user_id || tx.userId,
                userName: tx.user?.first_name ? `${tx.user.first_name} ${tx.user.last_name}` : 'Unknown',
                amount: Math.abs(tx.amount),
                method: { name: tx.method || 'Bank Transfer' },
                status: tx.status as 'pending' | 'approved' | 'rejected' | 'completed',
                requestedAt: tx.created_at || tx.createdAt,
                processedAt: tx.updated_at || tx.updatedAt,
                processedBy: 'Admin',
                notes: tx.notes || '',
            }));

            setWithdrawals(withdrawalRequests);
            calculateStats(withdrawalRequests);
        } catch (error) {
            console.error('Failed to fetch withdrawals:', error);
            toast.error('Failed to load withdrawals');
            setWithdrawals([]);
            calculateStats([]);
        }
    };

    const calculateStats = (withdrawalList: WithdrawalRequest[]) => {
        const total = withdrawalList.length;
        const pending = withdrawalList.filter(w => w.status === 'pending').length;
        const approved = withdrawalList.filter(w => w.status === 'approved' || w.status === 'completed').length;
        const rejected = withdrawalList.filter(w => w.status === 'rejected').length;
        const totalAmount = withdrawalList.reduce((sum, w) => sum + w.amount, 0);

        setStats({
            total,
            pending,
            approved,
            rejected,
            totalAmount
        });
    };

    const handleViewUser = async (userId: string) => {
        try {
            const user = await usersAPI.getUserById(userId);
            setSelectedUser(user);
            setShowUserModal(true);
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        }
    };

    const handleApprove = async (withdrawalId: string) => {
        try {
            await withdrawalsAPI.approveWithdrawal(withdrawalId);
            setWithdrawals(prev => prev.map(w =>
                w.id === withdrawalId ? { ...w, status: 'approved', processedAt: new Date().toISOString(), processedBy: 'Admin' } : w
            ));
            calculateStats(withdrawals.map(w =>
                w.id === withdrawalId ? { ...w, status: 'approved', processedAt: new Date().toISOString(), processedBy: 'Admin' } : w
            ));
            toast.success('Withdrawal approved');
        } catch (error) {
            console.error('Failed to approve withdrawal:', error);
            toast.error('Failed to approve withdrawal');
        }
    };

    const handleReject = async (withdrawalId: string) => {
        try {
            await withdrawalsAPI.rejectWithdrawal(withdrawalId);
            setWithdrawals(prev => prev.map(w =>
                w.id === withdrawalId ? { ...w, status: 'rejected', processedAt: new Date().toISOString(), processedBy: 'Admin' } : w
            ));
            calculateStats(withdrawals.map(w =>
                w.id === withdrawalId ? { ...w, status: 'rejected', processedAt: new Date().toISOString(), processedBy: 'Admin' } : w
            ));
            toast.success('Withdrawal rejected');
        } catch (error) {
            console.error('Failed to reject withdrawal:', error);
            toast.error('Failed to reject withdrawal');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
            approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
            paid: { bg: 'bg-blue-100', text: 'text-blue-800', icon: DollarSign }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Withdrawals</h1>
                {hasPermission('withdrawals.process') && (
                    <Button>Process Withdrawals</Button>
                )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">${stats.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.approved}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-300" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.rejected}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                                <Eye className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Withdrawals</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                                {withdrawals.map((withdrawal) => (
                                    <tr key={withdrawal.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center dark:bg-gray-700">
                                                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                                                            {withdrawal.userName.charAt(0)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{withdrawal.userName}</div>
                                                    <button
                                                        onClick={() => handleViewUser(withdrawal.userId)}
                                                        className="text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            ${withdrawal.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {withdrawal.method?.name || 'Bank Transfer'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(withdrawal.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(withdrawal.requestedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {hasPermission('withdrawals.process') && withdrawal.status === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="mr-2"
                                                        onClick={() => handleApprove(withdrawal.id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleReject(withdrawal.id)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {withdrawal.status !== 'pending' && (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {withdrawal.processedBy ? `Processed by ${withdrawal.processedBy}` : 'Processed'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* User Detail Modal */}
            <Modal
                isOpen={showUserModal}
                onClose={() => setShowUserModal(false)}
                title="User Details"
                size="lg"
            >
                {selectedUser && (
                    <div className="space-y-6">
                        {/* User Overview */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-16 w-16">
                                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center dark:bg-gray-700">
                                        <span className="text-xl text-gray-600 dark:text-gray-300 font-medium">
                                            {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {selectedUser.firstName} {selectedUser.lastName}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedUser.email}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        ID: {selectedUser.id}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                        {selectedUser.role}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                        {selectedUser.status}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        ${selectedUser.balance.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* User Activity Tabs */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('withdrawals')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'withdrawals'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    Withdrawal History
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Recent Activity</h4>
                                    <ul className="space-y-2">
                                        <li className="text-sm text-gray-500 dark:text-gray-400">
                                            Last login: {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                                        </li>
                                        <li className="text-sm text-gray-500 dark:text-gray-400">
                                            Last updated: {new Date(selectedUser.updatedAt).toLocaleString()}
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Permissions</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUser.permissions.length > 0 ? (
                                            selectedUser.permissions.map((permission) => (
                                                <span
                                                    key={permission.id}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                >
                                                    {permission.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">No special permissions</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'withdrawals' && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Withdrawal History</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                            <tr>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">$500.00</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Bank Transfer</td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        Approved
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">2023-06-15</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">$250.00</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">PayPal</td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                        Pending
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">2023-06-10</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowUserModal(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Withdrawals;