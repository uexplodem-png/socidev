import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender
} from '@tanstack/react-table';
import {
  Clock,
  CheckCircle,
  Filter,
  RefreshCw,
  Search,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Ban,
  RotateCcw,
  Plus,
  ChevronUp,
  ChevronDown,
  Play,
  Check,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ProtectedPage } from '../components/ProtectedPage';
import { ordersAPI } from '../services/api';

interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  platform: 'instagram' | 'youtube' | 'twitter' | 'tiktok';
  service: string;
  targetUrl: string;
  quantity: number;
  completed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  speed?: 'normal' | 'fast' | 'express';
  priority?: 'normal' | 'urgent' | 'critical'; // **PART 6: Priority field**
  amount: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

const columnHelper = createColumnHelper<Order>();

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalPages, setTotalPages] = useState(0);
  // **PART 6: Default sort by priority (urgent first) then newest**
  const [sorting, setSorting] = useState<any[]>([
    { id: 'priority', desc: true },
    { id: 'createdAt', desc: true },
  ]);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // **PART 6: Refund modal state**
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundCalculation, setRefundCalculation] = useState<{
    orderId: string;
    amount: number;
    quantity: number;
    completed: number;
    unitPrice: number;
    refundAmount: number;
  } | null>(null);

  // New state for add order form
  const [newOrder, setNewOrder] = useState({
    userId: '',
    userName: '',
    userEmail: '',
    platform: 'instagram' as 'instagram' | 'youtube' | 'twitter' | 'tiktok',
    service: '',
    targetUrl: '',
    quantity: 0,
    amount: 0,
    speed: 'normal' as 'normal' | 'fast' | 'express',
    status: 'pending' as 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded',
  });

  // New state for edit order form
  const [editOrder, setEditOrder] = useState({
    userId: '',
    userName: '',
    userEmail: '',
    platform: 'instagram' as 'instagram' | 'youtube' | 'twitter' | 'tiktok',
    service: '',
    targetUrl: '',
    quantity: 0,
    amount: 0,
    speed: 'normal' as 'normal' | 'fast' | 'express',
    status: 'pending' as 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded',
  });

  const columns = [
    columnHelper.accessor('id', {
      header: 'Order ID',
      cell: ({ getValue }) => (
        <div className="text-sm font-mono text-gray-900 dark:text-white">
          #{getValue().substring(0, 8)}
        </div>
      ),
    }),
    columnHelper.accessor('userName', {
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">{row.original.userName}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.original.userEmail}</div>
        </div>
      ),
    }),
    columnHelper.accessor('platform', {
      header: 'Platform',
      cell: ({ getValue }) => {
        const platform = getValue();
        const platformConfig = {
          instagram: { bg: 'bg-pink-100', text: 'text-pink-800', darkBg: 'dark:bg-pink-900', darkText: 'dark:text-pink-200' },
          youtube: { bg: 'bg-red-100', text: 'text-red-800', darkBg: 'dark:bg-red-900', darkText: 'dark:text-red-200' },
          twitter: { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-200' },
          tiktok: { bg: 'bg-black', text: 'text-white', darkBg: 'dark:bg-gray-800', darkText: 'dark:text-white' }
        };
        const config = platformConfig[platform];

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.darkBg} ${config.darkText}`}>
            {platform}
          </span>
        );
      },
    }),
    columnHelper.accessor('service', {
      header: 'Service',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-900 dark:text-white capitalize">{getValue()}</div>
      ),
    }),
    columnHelper.accessor('speed', {
      header: 'Speed',
      cell: ({ getValue }) => {
        const speed = getValue();
        const cls = speed === 'express'
          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
          : speed === 'fast'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
            {speed || 'normal'}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        const statusConfig = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-200', icon: Clock },
          processing: { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-200', icon: RefreshCw },
          completed: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-200', icon: CheckCircle },
          failed: { bg: 'bg-red-100', text: 'text-red-800', darkBg: 'dark:bg-red-900', darkText: 'dark:text-red-200', icon: AlertTriangle },
          cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'dark:bg-gray-700', darkText: 'dark:text-gray-300', icon: Ban },
          refunded: { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'dark:bg-purple-900', darkText: 'dark:text-purple-200', icon: RefreshCw }
        };
        const config = statusConfig[status];
        const Icon = config.icon;

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.darkBg} ${config.darkText}`}>
            <Icon className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
      },
    }),
    columnHelper.accessor('progress', {
      header: 'Progress',
      cell: ({ row }) => {
        const { completed, quantity } = row.original;
        // **PART 6: Fix progress calculation** - Calculate from completed/quantity, not from backend field
        const calculatedProgress = quantity > 0 ? Math.round((completed / quantity) * 100) : 0;
        const safeProgress = Math.min(calculatedProgress, 100); // Cap at 100%
        
        return (
          <div className="w-full">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">{completed}/{quantity}</span>
              <span className="font-semibold">{safeProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 dark:bg-blue-500"
                style={{ width: `${safeProgress}%` }}
              />
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: ({ getValue }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          ${getValue().toFixed(2)}
        </div>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(getValue()).toLocaleDateString()}
        </div>
      ),
    }),
    columnHelper.accessor('targetUrl', {
      header: 'Order Link',
      cell: ({ getValue }) => {
        const url = getValue();
        if (!url) {
          return <span className="text-gray-500 dark:text-gray-400 text-sm">No URL</span>;
        }

        try {
          // Extract domain from URL for display
          const domain = new URL(url).hostname.replace('www.', '');
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
              title={url}
            >
              {domain}
            </a>
          );
        } catch (e) {
          // If URL is invalid, show the raw URL
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
              title={url}
            >
              View Link
            </a>
          );
        }
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleViewOrder(order.id)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditOrder(order)}
              className="p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
              title="Edit order"
            >
              <Edit className="h-4 w-4" />
            </button>
            {/* **PART 6: Process button - pending orders only** */}
            {order.status === 'pending' && (
              <button
                onClick={() => handleProcessOrder(order.id)}
                className="p-1 text-green-400 hover:text-green-600 dark:hover:text-green-300"
                title="Process order (creates task)"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            {/* **PART 6: Complete button - processing orders only** */}
            {order.status === 'processing' && (
              <button
                onClick={() => handleCompleteOrder(order.id)}
                className="p-1 text-purple-400 hover:text-purple-600 dark:hover:text-purple-300"
                title="Mark as completed"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
            {/* **PART 6: Refund button with calculation preview** */}
            {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'refunded' && (
              <button
                onClick={() => handleRefundOrder(order)}
                className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                title="Refund order"
              >
                <DollarSign className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableGlobalFilter: false,
    }),
  ];

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      globalFilter,
      sorting,
      pagination,
    },
    manualPagination: true,
    pageCount: totalPages,
  });

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const hasSort = sorting && sorting.length > 0;
      const sortKeyMap: Record<string, string> = {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        amount: 'amount',
        quantity: 'quantity',
      };
      const mappedSortBy = hasSort ? (sortKeyMap[sorting[0].id] || 'created_at') : 'created_at';
      const params = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: globalFilter,
        status: statusFilter,
        platform: platformFilter,
        sortBy: mappedSortBy,
        sortOrder: (hasSort ? (sorting[0].desc ? 'desc' : 'asc') : 'desc') as 'asc' | 'desc',
      };

      // Use the real API instead of mock data
      const response = await ordersAPI.getOrders(params);

      // Map backend order data to frontend Order interface
      const mappedOrders = response.data.map((order: any) => ({
        id: order.id,
        userId: order.userId || order.user_id || '',
        userName: order.userName || order.user_name || 'Unknown User',
        userEmail: order.userEmail || order.user_email || '',
        amount: typeof order.amount === 'string' ? parseFloat(order.amount) : order.amount,
        status: order.status,
        platform: order.platform,
        service: order.service,
        targetUrl: order.targetUrl || order.target_url || '',
        quantity: order.quantity,
        completed: order.completedCount || order.completed_count || 0,
        progress: order.progress || 0,
        createdAt: order.createdAt || order.created_at,
        updatedAt: order.updatedAt || order.updated_at,
        startCount: order.startCount || order.start_count,
        remainingCount: order.remainingCount || order.remaining_count,
        completedCount: order.completedCount || order.completed_count,
        speed: order.speed || 'normal',
        startedAt: order.startedAt || order.started_at,
        completedAt: order.completedAt || order.completed_at,
      }));

      // If current sort is by speed, apply client-side priority (express > fast > normal)
      const isSpeedSort = sorting?.[0]?.id === 'speed';
      const sorted = isSpeedSort
        ? [...mappedOrders].sort((a, b) => {
          const rank = (s?: string) => (s === 'express' ? 3 : s === 'fast' ? 2 : 1);
          const diff = rank(b.speed) - rank(a.speed);
          return sorting?.[0]?.desc ? diff : -diff;
        })
        : mappedOrders;
      setOrders(sorted);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination, globalFilter, statusFilter, platformFilter, sorting]);

  // Poll for order progress updates every 20 seconds for active orders
  useEffect(() => {
    const hasActiveOrders = orders.some(
      (order) => order.status === "processing" || order.status === "pending"
    );

    if (!hasActiveOrders) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchOrders();
    }, 20000); // Poll every 20 seconds

    return () => clearInterval(intervalId);
  }, [orders, pagination, globalFilter, statusFilter, platformFilter, sorting]);

  const handleViewOrder = async (orderId: string) => {
    try {
      // Use the real API to fetch order details
      const fetchedOrder = await ordersAPI.getOrderById(orderId);

      // Map backend order data to frontend Order interface
      const mappedOrder = {
        id: fetchedOrder.id,
        userId: fetchedOrder.userId,
        userName: fetchedOrder.userName || 'Unknown User',
        userEmail: fetchedOrder.userEmail || '',
        amount: typeof fetchedOrder.amount === 'string' ? parseFloat(fetchedOrder.amount) : fetchedOrder.amount,
        status: fetchedOrder.status,
        platform: fetchedOrder.platform,
        service: fetchedOrder.service,
        targetUrl: fetchedOrder.targetUrl,
        quantity: fetchedOrder.quantity,
        completed: fetchedOrder.completedCount || 0,
        progress: fetchedOrder.progress,
        createdAt: fetchedOrder.createdAt,
        updatedAt: fetchedOrder.updatedAt,
        startCount: fetchedOrder.startCount,
        remainingCount: fetchedOrder.remainingCount,
        completedCount: fetchedOrder.completedCount,
        speed: fetchedOrder.speed || 'normal',
        startedAt: fetchedOrder.startedAt,
        completedAt: fetchedOrder.completedAt,
      };

      setSelectedOrder(mappedOrder);
      setShowOrderDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      toast.error('Failed to fetch order details');
    }
  };

  // **PART 6: Show refund calculation modal**
  const handleRefundOrder = (order: Order) => {
    const unitPrice = order.amount / order.quantity;
    const refundAmount = order.completed > 0 
      ? unitPrice * (order.quantity - order.completed)
      : order.amount;

    setRefundCalculation({
      orderId: order.id,
      amount: order.amount,
      quantity: order.quantity,
      completed: order.completed,
      unitPrice,
      refundAmount
    });
    setShowRefundModal(true);
  };

  // **PART 6: Confirm and execute refund**
  const handleConfirmRefund = async () => {
    if (!refundCalculation) return;

    try {
      await ordersAPI.refundOrder(refundCalculation.orderId);
      toast.success(`Order refunded successfully! $${refundCalculation.refundAmount.toFixed(2)} returned to user.`);
      setShowRefundModal(false);
      setRefundCalculation(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Failed to refund order:', error);
      toast.error(error.message || 'Failed to refund order');
    }
  };

  // **PART 6: Process order (move to processing, create task)**
  const handleProcessOrder = async (orderId: string) => {
    if (!confirm('Move this order to processing status? This will create a task for workers.')) return;

    try {
      await ordersAPI.processOrder(orderId);
      toast.success('Order moved to processing. Task created successfully.');
      fetchOrders();
    } catch (error: any) {
      console.error('Failed to process order:', error);
      toast.error(error.message || 'Failed to process order');
    }
  };

  // **PART 6: Complete order**
  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm('Mark this order as completed?')) return;

    try {
      await ordersAPI.completeOrder(orderId);
      toast.success('Order marked as completed');
      fetchOrders();
    } catch (error: any) {
      console.error('Failed to complete order:', error);
      toast.error(error.message || 'Failed to complete order');
    }
  };

  // Handle add order form changes
  const handleAddOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewOrder(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'amount' ? Number(value) : value
    }));
  };

  // Handle edit order form changes
  const handleEditOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditOrder(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'amount' ? Number(value) : value
    }));
  };

  // Handle add order form submission
  const handleAddOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a new order object
      const orderToAdd = {
        ...newOrder,
        id: `order-${Date.now()}`,
        completed: 0,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // In a real app, you would call an API to add the order
      // For now, we'll just add it to the local state
      setOrders(prev => [orderToAdd as Order, ...prev]);

      toast.success('Order added successfully');

      // Reset form and close modal
      setNewOrder({
        userId: '',
        userName: '',
        userEmail: '',
        platform: 'instagram',
        service: '',
        targetUrl: '',
        quantity: 0,
        amount: 0,
        speed: 'normal',
        status: 'pending',
      });
      setShowAddOrderModal(false);
    } catch (error) {
      console.error('Failed to add order:', error);
      toast.error('Failed to add order');
    }
  };

  // Handle edit order form submission
  const handleEditOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      // Send field updates first
      const fieldUpdates: any = {
        platform: editOrder.platform,
        service: editOrder.service,
        target_url: editOrder.targetUrl,
        quantity: editOrder.quantity,
        amount: editOrder.amount,
        speed: editOrder.speed,
      };
      // Only send changed values
      Object.keys(fieldUpdates).forEach(k => {
        const current = (selectedOrder as any)[k === 'target_url' ? 'targetUrl' : k];
        if (String(fieldUpdates[k]) === String(current)) {
          delete fieldUpdates[k];
        }
      });

      if (Object.keys(fieldUpdates).length > 0) {
        // call backend update
        await ordersAPI.updateOrder(selectedOrder.id, fieldUpdates);
      }

      // If status has changed, update it via the API
      if (editOrder.status !== selectedOrder.status) {
        await ordersAPI.updateOrderStatus(selectedOrder.id, editOrder.status);
      }

      // Update local state
      const updatedOrder = {
        ...selectedOrder,
        ...editOrder,
        updatedAt: new Date().toISOString(),
      };

      setOrders(prev =>
        prev.map(order => order.id === selectedOrder.id ? updatedOrder : order)
      );

      toast.success('Order updated successfully');

      // Close modal
      setShowEditOrderModal(false);
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order');
    }
  };

  // Open edit order modal with order data
  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditOrder({
      userId: order.userId,
      userName: order.userName,
      userEmail: order.userEmail,
      platform: order.platform,
      service: order.service,
      targetUrl: order.targetUrl,
      quantity: order.quantity,
      amount: order.amount,
      speed: (order as any).speed || 'normal',
      status: order.status,
    });
    setShowEditOrderModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedPage requiredPermission="orders.view" pageName="Orders Management">
      <div className="space-y-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage and track all orders and their status</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => {
              // Remove the mock data reset since we're using real data now
              fetchOrders();
              toast.success('Data refreshed successfully');
            }} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={() => setShowAddOrderModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Order
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter</option>
              <option value="tiktok">TikTok</option>
            </select>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {orders.length} orders found
              </span>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow border border-gray-200 rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none dark:text-gray-300"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center space-x-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <div className="flex flex-col">
                              <ChevronUp className={`h-3 w-3 ${header.column.getIsSorted() === 'asc' ? 'text-blue-600' : 'text-gray-400'} dark:text-gray-300`} />
                              <ChevronDown className={`h-3 w-3 -mt-1 ${header.column.getIsSorted() === 'desc' ? 'text-blue-600' : 'text-gray-400'} dark:text-gray-300`} />
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  ({orders.length} orders)
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-1" />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Order Modal */}
        <Modal
          isOpen={showAddOrderModal}
          onClose={() => setShowAddOrderModal(false)}
          title="Add New Order"
          size="lg"
        >
          <form onSubmit={handleAddOrderSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  name="userId"
                  value={newOrder.userId}
                  onChange={handleAddOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Name
                </label>
                <input
                  type="text"
                  name="userName"
                  value={newOrder.userName}
                  onChange={handleAddOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  name="userEmail"
                  value={newOrder.userEmail}
                  onChange={handleAddOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform
                </label>
                <select
                  name="platform"
                  value={newOrder.platform}
                  onChange={handleAddOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service
                </label>
                <input
                  type="text"
                  name="service"
                  value={newOrder.service}
                  onChange={handleAddOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target URL
                </label>
                <input
                  type="url"
                  name="targetUrl"
                  value={newOrder.targetUrl}
                  onChange={handleAddOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={newOrder.quantity}
                  onChange={handleAddOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={newOrder.amount}
                  onChange={handleAddOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Speed
                </label>
                <select
                  name="speed"
                  value={newOrder.speed}
                  onChange={handleAddOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                  <option value="express">Express</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={newOrder.status}
                  onChange={handleAddOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddOrderModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Add Order
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Order Modal */}
        <Modal
          isOpen={showEditOrderModal}
          onClose={() => setShowEditOrderModal(false)}
          title="Edit Order"
          size="lg"
        >
          <form onSubmit={handleEditOrderSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  name="userId"
                  value={editOrder.userId}
                  onChange={handleEditOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  readOnly
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Name
                </label>
                <input
                  type="text"
                  name="userName"
                  value={editOrder.userName}
                  onChange={handleEditOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  readOnly
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  name="userEmail"
                  value={editOrder.userEmail}
                  onChange={handleEditOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  readOnly
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform
                </label>
                <select
                  name="platform"
                  value={editOrder.platform}
                  onChange={handleEditOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service
                </label>
                <input
                  type="text"
                  name="service"
                  value={editOrder.service}
                  onChange={handleEditOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target URL
                </label>
                <input
                  type="url"
                  name="targetUrl"
                  value={editOrder.targetUrl}
                  onChange={handleEditOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={editOrder.quantity}
                  onChange={handleEditOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={editOrder.amount}
                  onChange={handleEditOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Speed
                </label>
                <select
                  name="speed"
                  value={editOrder.speed}
                  onChange={handleEditOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                  <option value="express">Express</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={editOrder.status}
                  onChange={handleEditOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditOrderModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* Order Detail Modal */}
        <Modal
          isOpen={showOrderDetailModal}
          onClose={() => setShowOrderDetailModal(false)}
          title="Order Details"
          size="lg"
        >
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Order Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                      <span className="text-gray-900 dark:text-white font-mono">#{selectedOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Service:</span>
                      <span className="text-gray-900 dark:text-white capitalize">{selectedOrder.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                      <span className="text-gray-900 dark:text-white capitalize">{selectedOrder.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="text-gray-900 dark:text-white capitalize">{selectedOrder.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="text-gray-900 dark:text-white">${selectedOrder.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(selectedOrder.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Target Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Target URL:</span>
                      <a
                        href={selectedOrder.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline truncate max-w-[150px]"
                        title={selectedOrder.targetUrl}
                      >
                        {(() => {
                          try {
                            return new URL(selectedOrder.targetUrl).hostname.replace('www.', '');
                          } catch (e) {
                            return 'View Link';
                          }
                        })()}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                      <span className="text-gray-900 dark:text-white">{selectedOrder.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                      <span className="text-gray-900 dark:text-white">{selectedOrder.completed.toLocaleString()}</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{selectedOrder.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300 dark:bg-blue-500"
                          style={{ width: `${selectedOrder.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                    <span className="text-gray-900 dark:text-white">{selectedOrder.userId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">User Name:</span>
                    <span className="text-gray-900 dark:text-white">{selectedOrder.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">User Email:</span>
                    <span className="text-gray-900 dark:text-white">{selectedOrder.userEmail}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetailModal(false)}
                >
                  Close
                </Button>
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <Button
                    variant="primary"
                    onClick={async () => {
                      if (!selectedOrder) return;
                      if (!confirm('Are you sure you want to refund this order?')) return;
                      try {
                        await ordersAPI.refundOrder(selectedOrder.id);
                        toast.success('Order refunded successfully');
                        setShowOrderDetailModal(false);
                        fetchOrders();
                      } catch (error: any) {
                        console.error('Failed to refund order:', error);
                        toast.error(error.message || 'Failed to refund order');
                      }
                    }}
                  >
                    Refund Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* **PART 6: Refund Calculation Modal** */}
        <Modal
          isOpen={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setRefundCalculation(null);
          }}
          title="Refund Order"
        >
          {refundCalculation && (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Refund Calculation
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      This will credit the user's balance and mark the order as refunded.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Refund Details
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Order Amount:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      ${refundCalculation.amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Quantity:</span>
                    <span className="text-gray-900 dark:text-white">
                      {refundCalculation.quantity.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                    <span className="text-gray-900 dark:text-white">
                      {refundCalculation.completed.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Unit Price:</span>
                    <span className="text-gray-900 dark:text-white">
                      ${refundCalculation.unitPrice.toFixed(4)}
                    </span>
                  </div>

                  <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Remaining Units:</span>
                      <span className="text-gray-900 dark:text-white">
                        {(refundCalculation.quantity - refundCalculation.completed).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-800 dark:text-green-300 font-semibold">
                        Refund Amount:
                      </span>
                      <span className="text-green-900 dark:text-green-200 text-xl font-bold">
                        ${refundCalculation.refundAmount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      {refundCalculation.completed === 0 
                        ? 'Full refund (no work completed)'
                        : `Partial refund (${refundCalculation.completed} units completed)`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundCalculation(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmRefund}
                >
                  Confirm Refund
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </ProtectedPage>
  );
};

export default Orders;