import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/ui/Modal';
import { usersAPI, withdrawalsAPI } from '../services/api';
import { User } from '../types';
import toast from 'react-hot-toast';
import { 
    Search, 
    FileText, 
    Download, 
    Filter, 
    DollarSign, 
    TrendingUp, 
    TrendingDown,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Calendar,
    User as UserIcon
} from 'lucide-react';

interface BalanceEntry {
    id: string;
    userId: string;
    userName: string;
    userEmail?: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'adjustment';
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
    description: string;
    method?: string;
    reference?: string;
    notes?: string;
    createdAt: string;
    processedAt?: string;
    processedBy?: string;
}

interface BalanceOverview {
    totalBalance: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
    totalDeposits: number;
    totalWithdrawals: number;
    activeUsers: number;
}

const Balance: React.FC = () => {
    const { hasPermission } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<BalanceEntry | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<BalanceEntry | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [balanceEntries, setBalanceEntries] = useState<BalanceEntry[]>([]);
    const [allEntries, setAllEntries] = useState<BalanceEntry[]>([]);

    // Overview stats
    const [overview, setOverview] = useState<BalanceOverview>({
        totalBalance: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        activeUsers: 0,
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        status: 'all',
        dateFrom: '',
        dateTo: '',
        minAmount: '',
        maxAmount: '',
    });

    // State for add balance form
    const [newBalanceEntry, setNewBalanceEntry] = useState({
        userId: '',
        userName: '',
        amount: 0,
        type: 'deposit' as 'deposit' | 'withdrawal' | 'adjustment',
        description: '',
        notes: '',
    });

    // State for request action
    const [requestAction, setRequestAction] = useState<'approve' | 'reject'>('approve');
    const [requestNotes, setRequestNotes] = useState('');

    // Fetch users for the dropdown
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersResponse, transactionsResponse] = await Promise.all([
                    usersAPI.getUsers({ limit: 100 }),
                    withdrawalsAPI.getTransactions({ limit: 100 })
                ]);

                setUsers(usersResponse.data);
                setFilteredUsers(usersResponse.data);

                // Convert transactions to balance entries format
                const entries: BalanceEntry[] = transactionsResponse.data.map((tx: any) => {
                    const user = usersResponse.data.find(u => u.id === tx.userId);
                    return {
                        id: tx.id,
                        userId: tx.userId,
                        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                        amount: tx.type === 'withdrawal' ? -Math.abs(tx.amount) : tx.amount,
                        type: tx.type as 'deposit' | 'withdrawal' | 'adjustment',
                        status: tx.status as 'pending' | 'approved' | 'rejected' | 'completed',
                        description: tx.description || `${tx.type} transaction`,
                        notes: (tx as any).notes,
                        createdAt: new Date(tx.createdAt).toLocaleDateString(),
                        processedAt: (tx as any).updatedAt ? new Date((tx as any).updatedAt).toLocaleDateString() : undefined,
                    };
                });

                setBalanceEntries(entries);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast.error('Failed to load balance data');
            }
        };

        fetchData();
    }, []);

    // Handle user search
    const handleUserSearch = (searchTerm: string) => {
        if (!searchTerm) {
            setFilteredUsers(users);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = users.filter(user =>
            user.firstName.toLowerCase().includes(term) ||
            user.lastName.toLowerCase().includes(term) ||
            user.username.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term)
        );

        setFilteredUsers(filtered);
    };

    // Handle add balance form changes
    const handleAddBalanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewBalanceEntry(prev => ({
            ...prev,
            [name]: name === 'amount' ? Number(value) : value
        }));
    };

    // Handle user selection in add balance form
    const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = e.target.value;
        const user = users.find(u => u.id === userId);
        if (user) {
            setNewBalanceEntry(prev => ({
                ...prev,
                userId: user.id,
                userName: `${user.firstName} ${user.lastName}`
            }));
        }
    };

    // Handle add balance form submission
    const handleAddBalanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Create transaction via API
            const response = await withdrawalsAPI.createTransaction({
                user_id: newBalanceEntry.userId,
                type: newBalanceEntry.type,
                amount: newBalanceEntry.amount,
                method: 'admin_adjustment',
                description: newBalanceEntry.description,
                notes: newBalanceEntry.notes,
            });

            // Add to entries list with pending status
            const newEntry: BalanceEntry = {
                id: response.transaction.id,
                userId: newBalanceEntry.userId,
                userName: newBalanceEntry.userName,
                amount: newBalanceEntry.type === 'withdrawal' ? -newBalanceEntry.amount : newBalanceEntry.amount,
                type: newBalanceEntry.type as 'deposit' | 'withdrawal' | 'adjustment',
                status: 'pending',
                description: newBalanceEntry.description,
                notes: newBalanceEntry.notes,
                createdAt: new Date().toLocaleDateString(),
            };

            setBalanceEntries(prev => [newEntry, ...prev]);

            toast.success('Balance entry created successfully - Awaiting approval');

            setNewBalanceEntry({
                userId: '',
                userName: '',
                amount: 0,
                type: 'deposit',
                description: '',
                notes: '',
            });
            setShowAddBalanceModal(false);
        } catch (error) {
            console.error('Failed to add balance entry:', error);
            toast.error('Failed to add balance entry');
        }
    };

    // Handle request action
    const handleRequestAction = (entry: BalanceEntry, action: 'approve' | 'reject') => {
        setSelectedRequest(entry);
        setRequestAction(action);
        setRequestNotes(entry.notes || '');
        setShowRequestModal(true);
    };

    // View notes for an entry
    const handleViewNotes = (entry: BalanceEntry) => {
        setSelectedEntry(entry);
        setShowNotesModal(true);
    };

    // Submit request action
    const submitRequestAction = async () => {
        if (!selectedRequest) return;

        try {
            // Call the API to approve or reject
            if (requestAction === 'approve') {
                await withdrawalsAPI.approveWithdrawal(selectedRequest.id, requestNotes);
            } else {
                await withdrawalsAPI.rejectWithdrawal(selectedRequest.id, requestNotes);
            }

            // Update local state
            const updatedEntries: BalanceEntry[] = balanceEntries.map(entry =>
                entry.id === selectedRequest.id
                    ? {
                        ...entry,
                        status: requestAction === 'approve' ? 'completed' : 'rejected' as const,
                        processedAt: new Date().toISOString().split('T')[0],
                        processedBy: 'Admin',
                        notes: requestNotes
                    }
                    : entry
            );
            setBalanceEntries(updatedEntries);

            // If approving a deposit request, update user balance
            if (requestAction === 'approve' && selectedRequest.type === 'deposit') {
                const userIndex = users.findIndex(u => u.id === selectedRequest.userId);
                if (userIndex !== -1) {
                    const updatedUsers = [...users];
                    updatedUsers[userIndex] = {
                        ...updatedUsers[userIndex],
                        balance: updatedUsers[userIndex].balance + selectedRequest.amount
                    };
                    setUsers(updatedUsers);
                    setFilteredUsers(updatedUsers);
                }
            }

            toast.success(`Balance request ${requestAction}d successfully`);
            setShowRequestModal(false);
            setSelectedRequest(null);
        } catch (error) {
            console.error('Failed to process request:', error);
            toast.error(`Failed to ${requestAction} request`);
        }
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        };

        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig[status as keyof typeof statusConfig]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Balance Management</h1>
                {hasPermission('users.edit') && (
                    <Button onClick={() => setShowAddBalanceModal(true)}>Add Balance Entry</Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Balance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Total Balance</h3>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">$24,560.00</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Pending</h3>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">$3,200.00</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">Reserved</h3>
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">$1,800.00</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Balance Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                                {balanceEntries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{entry.userName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <span className={entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {entry.amount >= 0 ? '+' : ''}{entry.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{entry.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {entry.notes ? (
                                                <button
                                                    onClick={() => handleViewNotes(entry)}
                                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                                >
                                                    <FileText className="h-4 w-4 mr-1" />
                                                    View
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{entry.createdAt}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(entry.status)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {entry.status === 'pending' && (
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRequestAction(entry, 'approve')}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleRequestAction(entry, 'reject')}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Add Balance Modal */}
            <Modal
                isOpen={showAddBalanceModal}
                onClose={() => setShowAddBalanceModal(false)}
                title="Add Balance Entry"
                size="lg"
            >
                <form onSubmit={handleAddBalanceSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                User
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    onChange={(e) => handleUserSearch(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <select
                                name="userId"
                                value={newBalanceEntry.userId}
                                onChange={handleUserSelect}
                                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            >
                                <option value="">Select a user</option>
                                {filteredUsers.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName} (@{user.username}) - ${user.balance.toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Amount
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={newBalanceEntry.amount}
                                onChange={handleAddBalanceChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Type
                            </label>
                            <select
                                name="type"
                                value={newBalanceEntry.type}
                                onChange={handleAddBalanceChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="deposit">Deposit</option>
                                <option value="withdrawal">Withdrawal</option>
                                <option value="adjustment">Adjustment</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={newBalanceEntry.description}
                                onChange={handleAddBalanceChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                rows={3}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={newBalanceEntry.notes}
                                onChange={handleAddBalanceChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                rows={3}
                                placeholder="Add any additional notes..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddBalanceModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Entry
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Request Action Modal */}
            <Modal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                title={`${requestAction === 'approve' ? 'Approve' : 'Reject'} Balance Request`}
                size="md"
            >
                <div className="space-y-4">
                    {selectedRequest && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="font-medium">User:</div>
                                <div>{selectedRequest.userName}</div>
                                <div className="font-medium">Amount:</div>
                                <div className={selectedRequest.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {selectedRequest.amount >= 0 ? '+' : ''}{selectedRequest.amount.toFixed(2)}
                                </div>
                                <div className="font-medium">Type:</div>
                                <div>{selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)}</div>
                                <div className="font-medium">Description:</div>
                                <div>{selectedRequest.description}</div>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={requestNotes}
                            onChange={(e) => setRequestNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            rows={3}
                            placeholder={`Reason for ${requestAction === 'approve' ? 'approval' : 'rejection'}...`}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowRequestModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={requestAction === 'approve' ? 'primary' : 'danger'}
                            onClick={submitRequestAction}
                        >
                            {requestAction === 'approve' ? 'Approve Request' : 'Reject Request'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Notes Modal */}
            <Modal
                isOpen={showNotesModal}
                onClose={() => setShowNotesModal(false)}
                title="Entry Notes"
                size="md"
            >
                <div className="space-y-4">
                    {selectedEntry && (
                        <div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="font-medium">User:</div>
                                    <div>{selectedEntry.userName}</div>
                                    <div className="font-medium">Amount:</div>
                                    <div className={selectedEntry.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {selectedEntry.amount >= 0 ? '+' : ''}{selectedEntry.amount.toFixed(2)}
                                    </div>
                                    <div className="font-medium">Type:</div>
                                    <div>{selectedEntry.type.charAt(0).toUpperCase() + selectedEntry.type.slice(1)}</div>
                                    <div className="font-medium">Description:</div>
                                    <div>{selectedEntry.description}</div>
                                    <div className="font-medium">Date:</div>
                                    <div>{selectedEntry.createdAt}</div>
                                    <div className="font-medium">Status:</div>
                                    <div>{getStatusBadge(selectedEntry.status)}</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notes
                                </label>
                                <div className="min-h-[100px] p-3 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600">
                                    {selectedEntry.notes || <span className="text-gray-400 italic">No notes available</span>}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNotesModal(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Balance;