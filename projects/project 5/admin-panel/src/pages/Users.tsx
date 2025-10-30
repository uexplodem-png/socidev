import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, UserCheck, UserX, Shield, Plus } from 'lucide-react';
import { User, FilterParams, Order, Transaction, SocialAccount, Task, Device } from '../types';
import { usersAPI } from '../services/api';
import { realApiService } from '../services/realApi';
import { useAppDispatch } from '../store';
import { addNotification } from '../store/slices/notificationSlice';
import { usePermissions } from '../hooks/usePermissions';
import { useRole } from '../hooks/useRole';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { cn } from '../utils/cn';
import { ProtectedPage } from '../components/ProtectedPage';

const Users: React.FC = () => {
  const dispatch = useAppDispatch();
  const { canAccess } = usePermissions();
  const { canEditUsers, canAdjustBalance } = useRole();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // User detail tabs
  const [activeTab, setActiveTab] = useState('overview');

  // State for balance adjustment form
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false);
  const [adjustBalanceData, setAdjustBalanceData] = useState({
    amount: 0,
    type: 'add' as 'add' | 'subtract',
    reason: '',
  });

  // Mock data for user details
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<Transaction[]>([]);
  const [userSocialAccounts, setUserSocialAccounts] = useState<SocialAccount[]>([]);
  const [userDevices, setUserDevices] = useState<Device[]>([]);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [userActivityLogs, setUserActivityLogs] = useState<any[]>([]);
  const [selectedActivityLog, setSelectedActivityLog] = useState<any>(null);
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [activityLogPage, setActivityLogPage] = useState(0);
  const ACTIVITY_LOGS_PER_PAGE = 5;

  // API Key state
  const [userApiKey, setUserApiKey] = useState<any>(null);
  const [userApiLogs, setUserApiLogs] = useState<any[]>([]);
  const [apiLogsLoading, setApiLogsLoading] = useState(false);
  const [apiLogsPagination, setApiLogsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [showEditRateLimitModal, setShowEditRateLimitModal] = useState(false);
  const [showEditAllowedIpsModal, setShowEditAllowedIpsModal] = useState(false);
  const [editRateLimit, setEditRateLimit] = useState('');
  const [editAllowedIps, setEditAllowedIps] = useState('');

  // New state for add user form
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: 'task_doer' as 'task_doer' | 'task_giver' | 'admin' | 'super_admin' | 'moderator',
    status: 'active' as 'active' | 'suspended' | 'banned' | 'pending',
    balance: 0,
  });

  // New state for edit user form
  const [editUser, setEditUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'task_doer' as 'task_doer' | 'task_giver' | 'admin' | 'super_admin' | 'moderator',
    status: 'active' as 'active' | 'suspended' | 'banned' | 'pending',
    balance: 0,
  });

  const fetchUsers = async (params: FilterParams = {}) => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...params,
      });
      setUsers(response.data);
      setPagination(prev => ({
        ...prev,
        pageCount: response.pagination.totalPages,
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch users',
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle search - reset to page 1 and fetch with search term
  const handleSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    setPagination(prev => ({
      ...prev,
      pageIndex: 0, // Reset to first page when searching
    }));
  };

  useEffect(() => {
    const params: FilterParams = {};
    if (searchQuery) {
      params.search = searchQuery;
    }
    fetchUsers(params);
  }, [pagination.pageIndex, pagination.pageSize, searchQuery]);

  // Fetch user details when a user is selected
  useEffect(() => {
    if (selectedUser) {
      // Reset activity log pagination when selecting a new user
      setActivityLogPage(0);

      // Fetch real data from backend instead of using mock data
      const fetchUserDetails = async () => {
        try {
          // Fetch user details with related data
          const userResponse: any = await usersAPI.getUserById(selectedUser.id);

          // Extract the user data from the response
          const userWithDetails = userResponse.user || userResponse;

          if (!userWithDetails || typeof userWithDetails !== 'object') {
            throw new Error('No user data received');
          }

          // Update selectedUser with latest data including lastLogin
          setSelectedUser(userWithDetails);

          // The backend includes orders, tasks, transactions, withdrawals, devices, and social accounts in the user object
          setUserOrders(userWithDetails.orders || []);
          setUserWithdrawals(userWithDetails.withdrawals || []);
          setUserSocialAccounts(userWithDetails.socialAccounts || []);
          setUserDevices(userWithDetails.devices || []);
          setUserTasks(userWithDetails.tasks || []);

          // Convert transaction amounts to numbers if they are strings
          const transactionsWithNumericAmounts = (userWithDetails.transactions || []).map((transaction: any) => ({
            ...transaction,
            amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount
          }));

          setUserTransactions(transactionsWithNumericAmounts);

          // Fetch activity logs for this user (logs where this user was the actor or target)
          try {
            // Use the new user_id parameter to fetch logs where user is either actor OR target
            const auditData = await realApiService.getAuditLogs({
              page: 1,
              limit: 100,
              user_id: selectedUser.id, // Backend will filter for actor_id OR target_user_id
            });
            console.log('Fetched audit logs for user:', auditData.auditLogs?.length);
            setUserActivityLogs(auditData.auditLogs || []);
          } catch (error) {
            console.error('Error fetching activity logs:', error);
            setUserActivityLogs([]);
          }

          // Fetch API key data
          try {
            const apiKeyData = await realApiService.getUserApiKey(selectedUser.id);
            setUserApiKey(apiKeyData.apiKey || null);
          } catch (error: any) {
            // 404 means user has no API key yet - this is normal
            if (error?.message?.includes('404')) {
              setUserApiKey(null);
            } else {
              console.error('Error fetching API key:', error);
            }
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          dispatch(addNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to fetch user details: ' + (error instanceof Error ? error.message : 'Unknown error'),
          }));
        }
      };

      fetchUserDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.id]);

  // Populate edit form when showing edit modal
  useEffect(() => {
    if (showEditUserModal && selectedUser) {
      setEditUser({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        username: selectedUser.username,
        password: '',
        role: selectedUser.role as 'task_doer' | 'task_giver' | 'admin' | 'super_admin' | 'moderator',
        status: selectedUser.status as 'active' | 'suspended' | 'banned' | 'pending',
        balance: selectedUser.balance,
      });
    }
  }, [showEditUserModal, selectedUser]);

  // Fetch API logs when API tab is opened
  useEffect(() => {
    if (activeTab === 'api' && selectedUser && userApiKey) {
      fetchApiLogs(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedUser?.id, userApiKey?.id]);

  const handleUserAction = async (userId: string, action: 'activate' | 'suspend' | 'ban') => {
    try {
      let updatedUser;

      switch (action) {
        case 'activate':
          updatedUser = await usersAPI.activateUser(userId);
          break;
        case 'suspend':
          updatedUser = await usersAPI.suspendUser(userId);
          break;
        case 'ban':
          // For ban, we'll use updateUser to set status to 'banned'
          updatedUser = await usersAPI.updateUser(userId, { status: 'banned' });
          break;
        default:
          throw new Error('Invalid action');
      }

      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: `User ${action}ed successfully`,
      }));

      // Update the user in the local state
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));

      // If we're viewing the user that was updated, update that too
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(updatedUser);
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to ${action} user`,
      }));
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setActiveTab('overview');
    setShowUserModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      banned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };

    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusConfig[status as keyof typeof statusConfig]
      )}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      moderator: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      task_doer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      task_giver: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      readonly: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };

    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        roleConfig[role as keyof typeof roleConfig] || roleConfig.readonly
      )}>
        <Shield className="h-3 w-3 mr-1" />
        {role.replace('_', ' ')}
      </span>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };

    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusConfig[status as keyof typeof statusConfig]
      )}>
        {status}
      </span>
    );
  };

  const getTransactionTypeBadge = (type: string) => {
    const typeConfig = {
      deposit: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      withdrawal: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      order: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      refund: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      adjustment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    };

    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        typeConfig[type as keyof typeof typeConfig]
      )}>
        {type}
      </span>
    );
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {row.original.firstName[0]}{row.original.lastName[0]}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              @{row.original.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {getValue() as string}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => getRoleBadge(getValue() as string),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => getStatusBadge(getValue() as string),
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ getValue }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          ${(getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(getValue() as string).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewUser(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canAccess('users', 'edit') && (
            <>
              {/* Only admin and super_admin can activate users */}
              {canEditUsers && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUserAction(row.original.id, 'activate')}
                  disabled={row.original.status === 'active'}
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
              )}
              {/* Moderators can suspend, but not ban */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUserAction(row.original.id, 'suspend')}
                disabled={row.original.status === 'suspended'}
              >
                <UserX className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Handle add user form changes
  const handleAddUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: name === 'balance' ? Number(value) : value
    }));
  };

  // Handle edit user form changes
  const handleEditUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditUser(prev => ({
      ...prev,
      [name]: name === 'balance' ? Number(value) : value
    }));
  };

  // Handle add user form submission
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a new user using the real API
      const createdUser = await usersAPI.createUser(newUser);

      // Add the created user to the local state
      setUsers(prev => [createdUser, ...prev]);

      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'User added successfully',
      }));

      // Reset form and close modal
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        role: 'task_doer',
        status: 'active',
        balance: 0,
      });
      setShowAddUserModal(false);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add user',
      }));
    }
  };

  // Handle edit user form submission
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      // Only include password if it's not empty
      const updateData: any = { ...editUser };
      if (!updateData.password) {
        delete updateData.password;
      }

      // Update user
      const updatedUser = await usersAPI.updateUser(selectedUser.id, updateData);

      // Update local state
      setUsers(prev =>
        prev.map(user => user.id === selectedUser.id ? updatedUser : user)
      );

      // Update the selected user with updated data
      setSelectedUser(updatedUser);

      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'User updated successfully',
      }));

      // Close modal and reset form
      setShowEditUserModal(false);
      setEditUser({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        role: 'task_doer',
        status: 'active',
        balance: 0,
      });
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update user',
      }));
    }
  };

  // Open edit user modal with user data
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      password: '',
      role: user.role,
      status: user.status,
      balance: user.balance,
    });
    setShowUserModal(false);
    setShowEditUserModal(true);
  };

  // Handle balance adjustment form changes
  const handleAdjustBalanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdjustBalanceData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value
    }));
  };

  // Handle balance adjustment form submission
  const handleAdjustBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      // Adjust user balance using the real API
      const result = await usersAPI.adjustUserBalance(
        selectedUser.id,
        adjustBalanceData.amount,
        adjustBalanceData.type,
        adjustBalanceData.reason
      );

      // Update the selected user with the new balance
      setSelectedUser(result.user);

      // Update the user in the main users list
      setUsers(prev =>
        prev.map(user => user.id === selectedUser.id ? result.user : user)
      );

      // Refresh transactions to show the new adjustment
      const transactionsResponse = await usersAPI.getUserTransactions(selectedUser.id, {
        page: 1,
        limit: 20,
      });

      // Convert transaction amounts to numbers if they are strings
      const transactionsWithNumericAmounts = transactionsResponse.data.map(transaction => ({
        ...transaction,
        amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount
      }));

      setUserTransactions(transactionsWithNumericAmounts);

      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: `User balance ${adjustBalanceData.type}ed successfully`,
      }));

      // Reset form and close modal
      setAdjustBalanceData({
        amount: 0,
        type: 'add',
        reason: '',
      });
      setShowAdjustBalanceModal(false);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to adjust user balance',
      }));
    }
  };

  // Tab content components
  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Personal Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Full Name</span>
              <span className="text-gray-900 dark:text-white">{selectedUser?.firstName} {selectedUser?.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Username</span>
              <span className="text-gray-900 dark:text-white">@{selectedUser?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email</span>
              <span className="text-gray-900 dark:text-white">{selectedUser?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Role</span>
              <span className="text-gray-900 dark:text-white">{selectedUser?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status</span>
              <span className="text-gray-900 dark:text-white">{selectedUser?.status}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Details</h3>
            {canAccess('users', 'edit') && canAdjustBalance && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdjustBalanceModal(true)}
              >
                Adjust Balance
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Account Balance</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${selectedUser?.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Joined Date</span>
              <span className="text-gray-900 dark:text-white">
                {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last Login</span>
              <span className="text-gray-900 dark:text-white">
                {selectedUser?.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {userActivityLogs.length > 0
              ? `Page ${activityLogPage + 1} of ${Math.ceil(userActivityLogs.length / ACTIVITY_LOGS_PER_PAGE)}`
              : 'No logs'
            }
          </span>
        </div>
        <div className="space-y-3">
          {userActivityLogs.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No activity logs found</p>
          ) : (
            userActivityLogs
              .slice(activityLogPage * ACTIVITY_LOGS_PER_PAGE, (activityLogPage + 1) * ACTIVITY_LOGS_PER_PAGE)
              .map((log: any, index: number) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedActivityLog(log);
                    setShowActivityLogModal(true);
                  }}
                  className="flex items-start justify-between py-2 px-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {log.action?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      By {log.actor_name || log.actorName || log.actor?.first_name + ' ' + log.actor?.last_name} • {new Date(log.createdAt || log.created_at).toLocaleString()}
                    </div>
                    {log.metadata?.changes && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        {Object.entries(log.metadata.changes.before || {})
                          .filter(([field, beforeValue]: any) => beforeValue !== log.metadata.changes?.after?.[field])
                          .slice(0, 2)
                          .map(([field, beforeValue]: any) => {
                            const afterValue = log.metadata.changes?.after?.[field];
                            return (
                              <div key={field} className="truncate">
                                <span className="font-medium capitalize">{field}:</span> {String(beforeValue || '-')} → {String(afterValue || '-')}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Pagination Controls */}
        {userActivityLogs.length > ACTIVITY_LOGS_PER_PAGE && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing {Math.min(activityLogPage * ACTIVITY_LOGS_PER_PAGE + 1, userActivityLogs.length)} - {Math.min((activityLogPage + 1) * ACTIVITY_LOGS_PER_PAGE, userActivityLogs.length)} of {userActivityLogs.length}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivityLogPage(prev => Math.max(0, prev - 1))}
                disabled={activityLogPage === 0}
              >
                ← Previous
              </Button>
              <div className="text-xs text-gray-600 dark:text-gray-400 px-2">
                Page {activityLogPage + 1} / {Math.ceil(userActivityLogs.length / ACTIVITY_LOGS_PER_PAGE)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivityLogPage(prev => {
                  const maxPage = Math.ceil(userActivityLogs.length / ACTIVITY_LOGS_PER_PAGE) - 1;
                  return Math.min(prev + 1, maxPage);
                })}
                disabled={activityLogPage >= Math.ceil(userActivityLogs.length / ACTIVITY_LOGS_PER_PAGE) - 1}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrdersTab = () => {
    try {
      return (
        <div className="overflow-x-auto">
          {userOrders && userOrders.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {userOrders.map(order => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{(order.id || '').substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {order.service || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{order.platform || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${(order.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getOrderStatusBadge(order.status || 'pending')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No orders found for this user</p>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error rendering orders tab:', error);
      return (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading orders: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      );
    }
  };

  const renderBalanceHistoryTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {userTransactions.map(transaction => (
            <tr key={transaction.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                #{transaction.id.substring(0, 8)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {transaction.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getTransactionTypeBadge(transaction.type)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(transaction.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {transaction.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderWithdrawalsTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {userWithdrawals.length > 0 ? (
            userWithdrawals.map((withdrawal: any) => (
              <tr key={withdrawal.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  #{withdrawal.id.substring(0, 8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span className="text-red-600 font-semibold">
                    -${typeof withdrawal.amount === 'number' ? withdrawal.amount.toFixed(2) : '0.00'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {withdrawal.description || 'Withdrawal'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${withdrawal.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : withdrawal.status === 'failed'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : withdrawal.status === 'pending' || withdrawal.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                    {withdrawal.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No withdrawals found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderSocialMediaTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {userSocialAccounts && userSocialAccounts.length > 0 ? (
        userSocialAccounts.map(account => (
          <div key={account.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${account.platform === 'instagram' ? 'bg-pink-500' : 'bg-red-500'
                  }`}>
                  <span className="text-white font-bold">{account.platform.charAt(0).toUpperCase()}</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{account.username}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{account.platform}</p>
                </div>
              </div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                {account.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{(account.followers || 0).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Health Score</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{(account.healthScore || 0)}%</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Last activity: {account.lastActivity ? new Date(account.lastActivity).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-1 md:col-span-2 text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No social media accounts connected</p>
        </div>
      )}
    </div>
  );

  const renderDevicesTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Seen</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tasks Completed</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {userDevices.map(device => (
            <tr key={device.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {device.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                {device.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${device.status === 'online'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                  {device.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(device.lastSeen).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {device.usage.tasksCompleted}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTasksTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Success Rate</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {userTasks.map(task => (
            <tr key={task.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{task.description}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                {task.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : task.status === 'active'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                  {task.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.priority === 'high'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : task.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                  {task.priority}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {task.analytics && (
                  <div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {task.analytics.completed}/{task.analytics.totalAssigned}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(task.analytics.completed / task.analytics.totalAssigned) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {task.analytics?.successRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Fetch API logs with pagination
  const fetchApiLogs = async (page = 1) => {
    if (!selectedUser) return;

    setApiLogsLoading(true);
    try {
      const response = await realApiService.getUserApiLogs(selectedUser.id, {
        page,
        limit: apiLogsPagination.limit,
      });
      setUserApiLogs(response.logs || []);
      setApiLogsPagination(response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching API logs:', error);
      setUserApiLogs([]);
    } finally {
      setApiLogsLoading(false);
    }
  };

  const handleApiKeyStatusChange = async (status: string) => {
    if (!userApiKey) return;

    try {
      await realApiService.updateApiKeyStatus(userApiKey.id, status);

      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: `API key ${status === 'active' ? 'activated' : status === 'suspended' ? 'suspended' : 'revoked'}`,
      }));

      // Refresh API key data
      const apiKeyData = await realApiService.getUserApiKey(selectedUser!.id);
      setUserApiKey(apiKeyData.apiKey || null);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update API key status',
      }));
    }
  };

  const handleDeleteApiKey = async () => {
    if (!userApiKey) return;

    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await realApiService.deleteApiKey(userApiKey.id);

      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'API key deleted successfully',
      }));

      setUserApiKey(null);
      setUserApiLogs([]);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete API key',
      }));
    }
  };

  const handleUpdateRateLimit = async () => {
    if (!userApiKey || !editRateLimit) return;

    const rateLimit = parseInt(editRateLimit);
    if (isNaN(rateLimit) || rateLimit < 1) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Rate limit must be a positive number',
      }));
      return;
    }

    try {
      await realApiService.updateApiKeyRateLimit(userApiKey.id, rateLimit);

      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'Rate limit updated successfully',
      }));

      // Refresh API key data
      const apiKeyData = await realApiService.getUserApiKey(selectedUser!.id);
      setUserApiKey(apiKeyData.apiKey || null);
      setShowEditRateLimitModal(false);
      setEditRateLimit('');
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update rate limit',
      }));
    }
  };

  const handleUpdateAllowedIps = async () => {
    if (!userApiKey) return;

    // Parse IPs from textarea (one per line or comma-separated)
    const ips = editAllowedIps
      .split(/[\n,]/)
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0);

    try {
      await realApiService.updateApiKeyAllowedIps(userApiKey.id, ips);

      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'Allowed IPs updated successfully',
      }));

      // Refresh API key data
      const apiKeyData = await realApiService.getUserApiKey(selectedUser!.id);
      setUserApiKey(apiKeyData.apiKey || null);
      setShowEditAllowedIpsModal(false);
      setEditAllowedIps('');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to update allowed IPs',
      }));
    }
  };

  const renderApiTab = () => {
    if (!userApiKey) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No API Key
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This user hasn't generated an API key yet.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Users can generate an API key from their account settings.
          </p>
        </div>
      );
    }

    const getStatusBadge = (status: string) => {
      const statusMap: Record<string, { color: string; label: string }> = {
        active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: 'Active' },
        suspended: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', label: 'Suspended' },
        revoked: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', label: 'Revoked' },
      };
      const { color, label } = statusMap[status] || statusMap.active;
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
          {label}
        </span>
      );
    };

    return (
      <div className="space-y-6">
        {/* API Key Info */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Key Information</h3>
            {getStatusBadge(userApiKey.status)}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono">
                  {userApiKey.apiKey}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(userApiKey.apiKey);
                    dispatch(addNotification({
                      type: 'success',
                      title: 'Copied',
                      message: 'API key copied to clipboard',
                    }));
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Created
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(userApiKey.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Used
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {userApiKey.lastUsedAt
                    ? new Date(userApiKey.lastUsedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                    : 'Never'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Requests
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {userApiKey.totalRequests?.toLocaleString() || 0}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rate Limit
                  </label>
                  {canAccess('api', 'edit') && (
                    <button
                      onClick={() => {
                        setEditRateLimit(userApiKey.rateLimit?.toString() || '1000');
                        setShowEditRateLimitModal(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-900 dark:text-white">
                  {userApiKey.rateLimit?.toLocaleString() || 1000} req/day
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allowed IPs
                </label>
                {canAccess('api', 'edit') && (
                  <button
                    onClick={() => {
                      setEditAllowedIps((userApiKey.allowedIps || []).join('\n'));
                      setShowEditAllowedIpsModal(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </button>
                )}
              </div>
              {userApiKey.allowedIps && userApiKey.allowedIps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userApiKey.allowedIps.map((ip: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded"
                    >
                      {ip}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">All IPs allowed</p>
              )}
            </div>

            {canAccess('api', 'edit') && (
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {userApiKey.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApiKeyStatusChange('suspended')}
                  >
                    Suspend
                  </Button>
                )}
                {userApiKey.status === 'suspended' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApiKeyStatusChange('active')}
                  >
                    Activate
                  </Button>
                )}
                {userApiKey.status !== 'revoked' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApiKeyStatusChange('revoked')}
                  >
                    Revoke
                  </Button>
                )}
                {canAccess('api', 'delete') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteApiKey}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* API Logs */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Request Logs</h3>

          {apiLogsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading logs...</p>
            </div>
          ) : userApiLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No API requests yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Response Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {userApiLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <code className="text-xs">{log.endpoint}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            log.method === 'GET' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                            log.method === 'POST' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                            log.method === 'PUT' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                            log.method === 'DELETE' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          )}>
                            {log.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            log.statusCode >= 200 && log.statusCode < 300 && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                            log.statusCode >= 300 && log.statusCode < 400 && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                            log.statusCode >= 400 && log.statusCode < 500 && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                            log.statusCode >= 500 && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          )}>
                            {log.statusCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {log.ipAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {log.responseTime}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {apiLogsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {apiLogsPagination.page} of {apiLogsPagination.totalPages} ({apiLogsPagination.total} total logs)
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={apiLogsPagination.page === 1}
                      onClick={() => fetchApiLogs(apiLogsPagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={apiLogsPagination.page === apiLogsPagination.totalPages}
                      onClick={() => fetchApiLogs(apiLogsPagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderAnalyticsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{userOrders.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Spent</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${userTransactions
                .filter(t => t.type === 'order_payment')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Success Rate</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {userTasks.length > 0
                ? Math.round(userTasks.reduce((sum, t) => sum + (t.analytics?.successRate || 0), 0) / userTasks.length)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedPage requiredPermission="users.view" pageName="User Management">
      <div className="space-y-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Users Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          {canAccess('users', 'edit') && (
            <Button onClick={() => setShowAddUserModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>

        <DataTable
          data={users}
          columns={columns}
          searchPlaceholder="Search users..."
          loading={loading}
          onRowClick={handleViewUser}
          onSearch={handleSearch}
          pagination={{
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            pageCount: pagination.pageCount,
            onPaginationChange: (newPagination) => {
              setPagination(prev => ({
                ...prev,
                ...newPagination
              }));
            },
          }}
        />

        {/* User Detail Modal */}
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title="User Details"
          size="xl"
        >
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-xl font-medium text-white">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    @{selectedUser.username}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', name: 'Overview' },
                    { id: 'orders', name: 'Orders' },
                    { id: 'balance', name: 'Balance History' },
                    { id: 'withdrawals', name: 'Withdrawals' },
                    { id: 'social', name: 'Social Media' },
                    { id: 'devices', name: 'Devices' },
                    { id: 'tasks', name: 'Tasks' },
                    { id: 'api', name: 'API' },
                    { id: 'analytics', name: 'Analytics' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      )}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="py-4">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'orders' && (
                  <div>
                    <pre style={{ display: 'none' }}>{JSON.stringify({ ordersCount: userOrders.length, ordersData: userOrders }, null, 2)}</pre>
                    {renderOrdersTab()}
                  </div>
                )}
                {activeTab === 'balance' && renderBalanceHistoryTab()}
                {activeTab === 'withdrawals' && renderWithdrawalsTab()}
                {activeTab === 'social' && renderSocialMediaTab()}
                {activeTab === 'devices' && renderDevicesTab()}
                {activeTab === 'tasks' && renderTasksTab()}
                {activeTab === 'api' && renderApiTab()}
                {activeTab === 'analytics' && renderAnalyticsTab()}
              </div>

              {canAccess('users', 'edit') && (
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdjustBalanceModal(true)}
                  >
                    Adjust Balance
                  </Button>
                  <Button variant="outline" onClick={() => handleEditUser(selectedUser)}>
                    Edit User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUserAction(selectedUser.id, 'suspend')}
                  >
                    Suspend User
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleUserAction(selectedUser.id, 'ban')}
                  >
                    Ban User
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Add User Modal */}
        <Modal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          title="Add New User"
          size="lg"
        >
          <form onSubmit={handleAddUserSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={newUser.firstName}
                  onChange={handleAddUserChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={newUser.lastName}
                  onChange={handleAddUserChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={newUser.username}
                  onChange={handleAddUserChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleAddUserChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleAddUserChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="task_doer">Task Doer</option>
                  <option value="task_giver">Task Giver</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={newUser.status}
                  onChange={handleAddUserChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Balance
                </label>
                <input
                  type="number"
                  name="balance"
                  value={newUser.balance}
                  onChange={handleAddUserChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddUserModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Add User
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditUserModal}
          onClose={() => setShowEditUserModal(false)}
          title="Edit User"
          size="lg"
        >
          <form onSubmit={handleEditUserSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Personal Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750 rounded-lg p-4 border border-blue-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={editUser.firstName}
                    onChange={handleEditUserChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={editUser.lastName}
                    onChange={handleEditUserChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={editUser.username}
                    onChange={handleEditUserChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editUser.email}
                    onChange={handleEditUserChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-750 rounded-lg p-4 border border-amber-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                Security
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={editUser.password}
                    onChange={handleEditUserChange}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    💡 Leave empty to keep the current password
                  </p>
                </div>
              </div>
            </div>

            {/* Account Settings Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-750 rounded-lg p-4 border border-green-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Account Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={editUser.role}
                    onChange={handleEditUserChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                  >
                    <option value="task_doer">Task Doer</option>
                    <option value="task_giver">Task Giver</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={editUser.status}
                    onChange={handleEditUserChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Balance
                  </label>
                  <input
                    type="number"
                    name="balance"
                    value={editUser.balance}
                    onChange={handleEditUserChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditUserModal(false)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button type="submit" className="px-6 bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* Adjust Balance Modal */}
        <Modal
          isOpen={showAdjustBalanceModal}
          onClose={() => setShowAdjustBalanceModal(false)}
          title="Adjust User Balance"
          size="md"
        >
          <form onSubmit={handleAdjustBalanceSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adjustment Type
                </label>
                <select
                  name="type"
                  value={adjustBalanceData.type}
                  onChange={handleAdjustBalanceChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="add">Add Funds</option>
                  <option value="subtract">Subtract Funds</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={adjustBalanceData.amount}
                  onChange={handleAdjustBalanceChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={adjustBalanceData.reason}
                  onChange={handleAdjustBalanceChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdjustBalanceModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Adjust Balance
              </Button>
            </div>
          </form>
        </Modal>

        {/* Activity Log Details Modal */}
        <Modal
          isOpen={showActivityLogModal}
          onClose={() => setShowActivityLogModal(false)}
          title="Activity Log Details"
          size="xl"
        >
          {selectedActivityLog && (
            <div className="space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Header Info - Action & Resource */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">ACTION</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedActivityLog.action?.replace(/_/g, ' ') || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">RESOURCE TYPE</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                      {selectedActivityLog.resource || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedActivityLog.description && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">DESCRIPTION</p>
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                    {selectedActivityLog.description}
                  </p>
                </div>
              )}

              {/* Actor Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-3">PERFORMED BY</p>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedActivityLog.actor_name || selectedActivityLog.actorName ||
                      (selectedActivityLog.actor ? `${selectedActivityLog.actor.first_name} ${selectedActivityLog.actor.last_name}` : 'System')}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-300">
                    {selectedActivityLog.actor_email || selectedActivityLog.actor?.email || 'system@internal'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-2">
                    <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    {new Date(selectedActivityLog.createdAt || selectedActivityLog.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Resource Details */}
              {(selectedActivityLog.resource_id || selectedActivityLog.target_user_id) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-3">RESOURCE DETAILS</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedActivityLog.resource_id && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Resource ID</p>
                        <p className="font-mono text-green-600 dark:text-green-400 break-all bg-white dark:bg-gray-800 p-2 rounded text-xs">
                          {selectedActivityLog.resource_id}
                        </p>
                      </div>
                    )}
                    {selectedActivityLog.target_user_id && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Target User ID</p>
                        <p className="font-mono text-green-600 dark:text-green-400 break-all bg-white dark:bg-gray-800 p-2 rounded text-xs">
                          {selectedActivityLog.target_user_id}
                        </p>
                      </div>
                    )}
                    {selectedActivityLog.target_user_name && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Target User</p>
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          {selectedActivityLog.target_user_name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedActivityLog.metadata && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center">
                    <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Operation Details
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                    {selectedActivityLog.metadata.type && (
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase">Type</span>
                        <span className="text-sm text-gray-900 dark:text-white capitalize font-medium">
                          {selectedActivityLog.metadata.type}
                        </span>
                      </div>
                    )}
                    {selectedActivityLog.metadata.amount && (
                      <div className="flex justify-between items-start border-t border-gray-200 dark:border-gray-700 pt-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase">Amount</span>
                        <span className="text-sm text-gray-900 dark:text-white font-semibold">
                          ${selectedActivityLog.metadata.amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedActivityLog.metadata.method && (
                      <div className="flex justify-between items-start border-t border-gray-200 dark:border-gray-700 pt-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase">Method</span>
                        <span className="text-sm text-gray-900 dark:text-white capitalize font-medium">
                          {selectedActivityLog.metadata.method.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                    {selectedActivityLog.metadata.status && (
                      <div className="flex justify-between items-start border-t border-gray-200 dark:border-gray-700 pt-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase">Status</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${selectedActivityLog.metadata.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                          selectedActivityLog.metadata.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                            selectedActivityLog.metadata.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                          }`}>
                          {selectedActivityLog.metadata.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Changes - Before and After */}
              {selectedActivityLog.metadata?.changes && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center">
                    <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                    Changes Made
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Field</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Before</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">After</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.entries(selectedActivityLog.metadata.changes.before || {}).map(
                          ([field, beforeValue]: any) => {
                            const afterValue = selectedActivityLog.metadata.changes?.after?.[field];
                            if (beforeValue === afterValue) return null;
                            return (
                              <tr key={field} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize">
                                  {field.replace(/_/g, ' ')}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                  <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-1.5 rounded-md text-xs font-medium inline-block break-words max-w-xs">
                                    {String(beforeValue || 'N/A').substring(0, 50)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1.5 rounded-md text-xs font-medium inline-block break-words max-w-xs">
                                    {String(afterValue || 'N/A').substring(0, 50)}
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Network Information */}
              <div className="bg-gradient-to-r from-slate-50 to-zinc-50 dark:from-slate-900/20 dark:to-zinc-900/20 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-4">NETWORK & DEVICE INFO</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">IP Address</p>
                    <p className="text-sm text-gray-900 dark:text-white font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded">
                      {selectedActivityLog.ip_address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">User Agent</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 break-words bg-white dark:bg-gray-800 px-3 py-2 rounded font-mono max-h-20 overflow-y-auto">
                      {selectedActivityLog.user_agent || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">EVENT TIMESTAMP</p>
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {new Date(selectedActivityLog.createdAt || selectedActivityLog.created_at).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowActivityLogModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Rate Limit Modal */}
        <Modal
          isOpen={showEditRateLimitModal}
          onClose={() => {
            setShowEditRateLimitModal(false);
            setEditRateLimit('');
          }}
          title="Edit Rate Limit"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate Limit (requests per day)
              </label>
              <input
                type="number"
                min="1"
                value={editRateLimit}
                onChange={(e) => setEditRateLimit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="1000"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Number of API requests allowed per day
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditRateLimitModal(false);
                  setEditRateLimit('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRateLimit}>
                Save
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Allowed IPs Modal */}
        <Modal
          isOpen={showEditAllowedIpsModal}
          onClose={() => {
            setShowEditAllowedIpsModal(false);
            setEditAllowedIps('');
          }}
          title="Edit Allowed IP Addresses"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Allowed IP Addresses
              </label>
              <textarea
                value={editAllowedIps}
                onChange={(e) => setEditAllowedIps(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                placeholder="Enter IP addresses (one per line or comma-separated)&#10;192.168.1.1&#10;10.0.0.1&#10;Or use * to allow all IPs"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter IP addresses one per line or comma-separated. Use * to allow all IPs. Leave empty to restrict all.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> If the list is empty, API requests from all IPs will be blocked. Current user's IP was automatically added when they created the API key.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditAllowedIpsModal(false);
                  setEditAllowedIps('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateAllowedIps}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ProtectedPage>
  );
};

export default Users;