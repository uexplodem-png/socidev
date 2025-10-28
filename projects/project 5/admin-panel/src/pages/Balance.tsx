import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/ui/Modal';
import { usersAPI, withdrawalsAPI } from '../services/api';
import { User } from '../types';
import toast from 'react-hot-toast';
import { 
    Search, FileText, Download, Filter, DollarSign, TrendingUp, TrendingDown,
    Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Calendar,
    User as UserIcon, ChevronLeft, ChevronRight
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

    const [overview, setOverview] = useState<BalanceOverview>({
        totalBalance: 0, pendingDeposits: 0, pendingWithdrawals: 0,
        totalDeposits: 0, totalWithdrawals: 0, activeUsers: 0,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
        search: '', type: 'all', status: 'all',
        dateFrom: '', dateTo: '', minAmount: '', maxAmount: '',
    });

    const [newBalanceEntry, setNewBalanceEntry] = useState({
        userId: '', userName: '', amount: 0,
        type: 'deposit' as 'deposit' | 'withdrawal' | 'adjustment',
        description: '', notes: '',
    });

    const [requestAction, setRequestAction] = useState<'approve' | 'reject'>('approve');
    const [requestNotes, setRequestNotes] = useState('');

    // Single useEffect to fetch data on mount only
    useEffect(() => { 
        fetchData(); 
    }, []); // Empty dependency array - runs once on mount

    // Separate useEffect for filters/pagination (doesn't refetch from server)
    useEffect(() => { 
        applyFiltersAndPagination(); 
    }, [allEntries, filters, currentPage, itemsPerPage]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch all users and transactions with proper pagination
            // Using page=1, limit=100 (max allowed) to get recent data
            const [usersResponse, transactionsResponse] = await Promise.all([
                usersAPI.getUsers({ 
                    page: 1, 
                    limit: 100, 
                    sortBy: 'created_at', 
                    sortOrder: 'desc' 
                }),
                withdrawalsAPI.getTransactions({ 
                    page: 1, 
                    limit: 100, 
                    sortBy: 'created_at', 
                    sortOrder: 'desc' 
                })
            ]);

            setUsers(usersResponse.data);
            setFilteredUsers(usersResponse.data);

            const entries: BalanceEntry[] = transactionsResponse.data.map((tx: any) => {
                const user = usersResponse.data.find((u: User) => u.id === tx.userId);
                return {
                    id: tx.id, userId: tx.userId,
                    userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                    userEmail: user?.email,
                    amount: tx.type === 'withdrawal' ? -Math.abs(tx.amount) : tx.amount,
                    type: tx.type as 'deposit' | 'withdrawal' | 'adjustment',
                    status: tx.status as 'pending' | 'approved' | 'rejected' | 'completed' | 'failed',
                    description: tx.description || `${tx.type} transaction`,
                    method: tx.method, reference: tx.reference, notes: tx.notes,
                    createdAt: new Date(tx.createdAt).toISOString(),
                    processedAt: tx.processedAt ? new Date(tx.processedAt).toISOString() : undefined,
                };
            });

            setAllEntries(entries);
            calculateOverview(usersResponse.data, entries);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load balance data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
        toast.success('Data refreshed successfully');
    };

    const calculateOverview = (usersData: User[], entries: BalanceEntry[]) => {
        const totalBalance = usersData.reduce((sum, user) => sum + (user.balance || 0), 0);
        const activeUsers = usersData.filter(u => u.status === 'active').length;
        const pendingDeposits = entries.filter(e => e.type === 'deposit' && e.status === 'pending')
            .reduce((sum, e) => sum + Math.abs(e.amount), 0);
        const pendingWithdrawals = entries.filter(e => e.type === 'withdrawal' && e.status === 'pending')
            .reduce((sum, e) => sum + Math.abs(e.amount), 0);
        const totalDeposits = entries.filter(e => e.type === 'deposit' && (e.status === 'completed' || e.status === 'approved'))
            .reduce((sum, e) => sum + Math.abs(e.amount), 0);
        const totalWithdrawals = entries.filter(e => e.type === 'withdrawal' && (e.status === 'completed' || e.status === 'approved'))
            .reduce((sum, e) => sum + Math.abs(e.amount), 0);

        setOverview({ totalBalance, pendingDeposits, pendingWithdrawals, totalDeposits, totalWithdrawals, activeUsers });
    };

    const applyFiltersAndPagination = () => {
        let filtered = [...allEntries];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(entry =>
                entry.userName.toLowerCase().includes(searchLower) ||
                entry.userEmail?.toLowerCase().includes(searchLower) ||
                entry.description.toLowerCase().includes(searchLower) ||
                entry.reference?.toLowerCase().includes(searchLower)
            );
        }

        if (filters.type !== 'all') filtered = filtered.filter(entry => entry.type === filters.type);
        if (filters.status !== 'all') filtered = filtered.filter(entry => entry.status === filters.status);
        if (filters.dateFrom) filtered = filtered.filter(entry => new Date(entry.createdAt) >= new Date(filters.dateFrom));
        if (filters.dateTo) filtered = filtered.filter(entry => new Date(entry.createdAt) <= new Date(filters.dateTo));
        if (filters.minAmount) filtered = filtered.filter(entry => Math.abs(entry.amount) >= parseFloat(filters.minAmount));
        if (filters.maxAmount) filtered = filtered.filter(entry => Math.abs(entry.amount) <= parseFloat(filters.maxAmount));

        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const total = Math.ceil(filtered.length / itemsPerPage);
        setTotalPages(total);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
        setBalanceEntries(paginated);
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ search: '', type: 'all', status: 'all', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '' });
        setCurrentPage(1);
    };

    const handleUserSearch = (searchTerm: string) => {
        if (!searchTerm) { setFilteredUsers(users); return; }
        const term = searchTerm.toLowerCase();
        setFilteredUsers(users.filter(user =>
            user.firstName.toLowerCase().includes(term) || user.lastName.toLowerCase().includes(term) ||
            user.username.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
        ));
    };

    const handleAddBalanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewBalanceEntry(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
    };

    const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const user = users.find(u => u.id === e.target.value);
        if (user) setNewBalanceEntry(prev => ({ ...prev, userId: user.id, userName: `${user.firstName} ${user.lastName}` }));
    };

    const handleAddBalanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await withdrawalsAPI.createTransaction({
                user_id: newBalanceEntry.userId, type: newBalanceEntry.type,
                amount: newBalanceEntry.amount, method: 'admin_adjustment',
                description: newBalanceEntry.description, notes: newBalanceEntry.notes,
            });
            toast.success('Balance entry created successfully - Awaiting approval');
            setNewBalanceEntry({ userId: '', userName: '', amount: 0, type: 'deposit', description: '', notes: '' });
            setShowAddBalanceModal(false);
            await fetchData();
        } catch (error) {
            console.error('Failed to add balance entry:', error);
            toast.error('Failed to add balance entry');
        }
    };

    const handleRequestAction = (entry: BalanceEntry, action: 'approve' | 'reject') => {
        setSelectedRequest(entry);
        setRequestAction(action);
        setRequestNotes(entry.notes || '');
        setShowRequestModal(true);
    };

    const handleViewNotes = (entry: BalanceEntry) => {
        setSelectedEntry(entry);
        setShowNotesModal(true);
    };

    const submitRequestAction = async () => {
        if (!selectedRequest) return;
        try {
            if (requestAction === 'approve') {
                await withdrawalsAPI.approveWithdrawal(selectedRequest.id, requestNotes);
                toast.success('Balance request approved successfully');
            } else {
                await withdrawalsAPI.rejectWithdrawal(selectedRequest.id, requestNotes);
                toast.success('Balance request rejected successfully');
            }
            setShowRequestModal(false);
            setSelectedRequest(null);
            await fetchData();
        } catch (error) {
            console.error('Failed to process request:', error);
            toast.error(`Failed to ${requestAction} request`);
        }
    };

    const handleExportCSV = () => {
        const csv = [
            ['User', 'Email', 'Amount', 'Type', 'Status', 'Description', 'Date', 'Processed Date'],
            ...balanceEntries.map(entry => [
                entry.userName, entry.userEmail || '', entry.amount.toFixed(2), entry.type,
                entry.status, entry.description, new Date(entry.createdAt).toLocaleDateString(),
                entry.processedAt ? new Date(entry.processedAt).toLocaleDateString() : ''
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `balance-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Report exported successfully');
    };

    const getStatusBadge = (status: string) => {
        const configs = {
            pending: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
            approved: { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
            rejected: { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
            completed: { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
            failed: { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle },
        };
        const config = configs[status as keyof typeof configs] || configs.pending;
        const Icon = config.icon;
        return (
            <span className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${config.bg}`}>
                <Icon className="h-3 w-3 mr-1" /> {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    );

    return (
        <div className="space-y-6 mt-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Balance Management</h1>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                    <Button variant="outline" onClick={() => setShowFilterModal(true)}>
                        <Filter className="h-4 w-4 mr-2" /> Filters
                    </Button>
                    {hasPermission('users.edit') && (
                        <Button onClick={() => setShowAddBalanceModal(true)}>
                            <DollarSign className="h-4 w-4 mr-2" /> Add Entry
                        </Button>
                    )}
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Balance</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(overview.totalBalance)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{overview.activeUsers} active users</p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Deposits</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{formatCurrency(overview.pendingDeposits)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total: {formatCurrency(overview.totalDeposits)}</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Withdrawals</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{formatCurrency(overview.pendingWithdrawals)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total: {formatCurrency(overview.totalWithdrawals)}</p>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" placeholder="Search by user, email, description, or reference..." value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Balance Entries Table */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Balance Transactions</CardTitle>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Showing {balanceEntries.length} of {allEntries.length} entries</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                                {balanceEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                            <p>No balance entries found</p>
                                            <p className="text-xs mt-1">Try adjusting your filters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    balanceEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                        <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.userName}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{entry.userEmail}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-semibold ${entry.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {entry.amount >= 0 ? '+' : ''}{formatCurrency(entry.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-white capitalize">{entry.type}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(entry.status)}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">{entry.description}</div>
                                                {entry.method && <div className="text-xs text-gray-500 dark:text-gray-400">via {entry.method}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">{formatDate(entry.createdAt)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {entry.notes ? (
                                                    <button onClick={() => handleViewNotes(entry)}
                                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center text-sm">
                                                        <FileText className="h-4 w-4 mr-1" /> View
                                                    </button>
                                                ) : <span className="text-gray-400 text-sm">-</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {entry.status === 'pending' && hasPermission('transactions.approve') && (
                                                    <div className="flex space-x-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleRequestAction(entry, 'approve')}>
                                                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                                        </Button>
                                                        <Button variant="danger" size="sm" onClick={() => handleRequestAction(entry, 'reject')}>
                                                            <XCircle className="h-3 w-3 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Items per page:</span>
                                <select value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="px-2 py-1 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
                                <div className="flex space-x-1">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Balance Modal */}
            <Modal isOpen={showAddBalanceModal} onClose={() => setShowAddBalanceModal(false)} title="Add Balance Entry" size="lg">
                <form onSubmit={handleAddBalanceSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User *</label>
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input type="text" placeholder="Search users..." onChange={(e) => handleUserSearch(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <select name="userId" value={newBalanceEntry.userId} onChange={handleUserSelect}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                                <option value="">Select a user</option>
                                {filteredUsers.map(user => (
                                    <option key={user.id} value={user.id}>{user.firstName} {user.lastName} (@{user.username}) - {formatCurrency(user.balance)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                            <input type="number" name="amount" value={newBalanceEntry.amount} onChange={handleAddBalanceChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                min="0.01" step="0.01" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                            <select name="type" value={newBalanceEntry.type} onChange={handleAddBalanceChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="deposit">Deposit</option>
                                <option value="withdrawal">Withdrawal</option>
                                <option value="adjustment">Adjustment</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                            <textarea name="description" value={newBalanceEntry.description} onChange={handleAddBalanceChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                rows={3} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                            <textarea name="notes" value={newBalanceEntry.notes} onChange={handleAddBalanceChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                rows={3} placeholder="Add any additional notes..." />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowAddBalanceModal(false)}>Cancel</Button>
                        <Button type="submit">Add Entry</Button>
                    </div>
                </form>
            </Modal>

            {/* Request Action Modal */}
            <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)}
                title={`${requestAction === 'approve' ? 'Approve' : 'Reject'} Balance Request`} size="md">
                <div className="space-y-4">
                    {selectedRequest && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="font-medium text-gray-700 dark:text-gray-300">User:</div>
                                <div className="text-gray-900 dark:text-white">{selectedRequest.userName}</div>
                                <div className="font-medium text-gray-700 dark:text-gray-300">Amount:</div>
                                <div className={`font-semibold ${selectedRequest.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(selectedRequest.amount)}
                                </div>
                                <div className="font-medium text-gray-700 dark:text-gray-300">Type:</div>
                                <div className="text-gray-900 dark:text-white capitalize">{selectedRequest.type}</div>
                                <div className="font-medium text-gray-700 dark:text-gray-300">Description:</div>
                                <div className="text-gray-900 dark:text-white">{selectedRequest.description}</div>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                        <textarea value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            rows={3} placeholder={`Reason for ${requestAction === 'approve' ? 'approval' : 'rejection'}...`} />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowRequestModal(false)}>Cancel</Button>
                        <Button variant={requestAction === 'approve' ? 'primary' : 'danger'} onClick={submitRequestAction}>
                            {requestAction === 'approve' ? 'Approve Request' : 'Reject Request'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Notes Modal */}
            <Modal isOpen={showNotesModal} onClose={() => setShowNotesModal(false)} title="Entry Notes" size="md">
                <div className="space-y-4">
                    {selectedEntry && (
                        <div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="font-medium text-gray-700 dark:text-gray-300">User:</div>
                                    <div className="text-gray-900 dark:text-white">{selectedEntry.userName}</div>
                                    <div className="font-medium text-gray-700 dark:text-gray-300">Amount:</div>
                                    <div className={`font-semibold ${selectedEntry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(selectedEntry.amount)}
                                    </div>
                                    <div className="font-medium text-gray-700 dark:text-gray-300">Type:</div>
                                    <div className="text-gray-900 dark:text-white capitalize">{selectedEntry.type}</div>
                                    <div className="font-medium text-gray-700 dark:text-gray-300">Description:</div>
                                    <div className="text-gray-900 dark:text-white">{selectedEntry.description}</div>
                                    <div className="font-medium text-gray-700 dark:text-gray-300">Date:</div>
                                    <div className="text-gray-900 dark:text-white">{formatDate(selectedEntry.createdAt)}</div>
                                    <div className="font-medium text-gray-700 dark:text-gray-300">Status:</div>
                                    <div>{getStatusBadge(selectedEntry.status)}</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                <div className="min-h-[100px] p-3 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    {selectedEntry.notes || <span className="text-gray-400 italic">No notes available</span>}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button type="button" variant="outline" onClick={() => setShowNotesModal(false)}>Close</Button>
                    </div>
                </div>
            </Modal>

            {/* Filter Modal */}
            <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Advanced Filters" size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <Filter className="inline h-4 w-4 mr-1" /> Type
                            </label>
                            <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="all">All Types</option>
                                <option value="deposit">Deposit</option>
                                <option value="withdrawal">Withdrawal</option>
                                <option value="adjustment">Adjustment</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <Filter className="inline h-4 w-4 mr-1" /> Status
                            </label>
                            <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <Calendar className="inline h-4 w-4 mr-1" /> Date From
                            </label>
                            <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <Calendar className="inline h-4 w-4 mr-1" /> Date To
                            </label>
                            <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <DollarSign className="inline h-4 w-4 mr-1" /> Min Amount
                            </label>
                            <input type="number" value={filters.minAmount} onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                min="0" step="0.01" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <DollarSign className="inline h-4 w-4 mr-1" /> Max Amount
                            </label>
                            <input type="number" value={filters.maxAmount} onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                min="0" step="0.01" placeholder="0.00" />
                        </div>
                    </div>
                    <div className="flex justify-between pt-4">
                        <Button type="button" variant="outline" onClick={resetFilters}>Reset Filters</Button>
                        <div className="space-x-3">
                            <Button type="button" variant="outline" onClick={() => setShowFilterModal(false)}>Cancel</Button>
                            <Button onClick={() => setShowFilterModal(false)}>Apply Filters</Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Balance;
