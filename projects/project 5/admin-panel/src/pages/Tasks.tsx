import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
  PaginationState,
  RowSelectionState
} from '@tanstack/react-table';
import {
  Search,
  Filter,
  CheckCircle,
  X,
  Clock,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { tasksAPI } from '../services/api';

interface Task {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'like' | 'follow' | 'view' | 'subscribe';
  platform: 'instagram' | 'youtube';
  targetUrl: string;
  quantity: number;
  remainingQuantity: number;
  rate: number;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  priority: 'low' | 'medium' | 'high';
  description: string;
  createdAt: string;
  updatedAt: string;
}

const columnHelper = createColumnHelper<Task>();

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all'); // Changed default to 'all'
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalPages, setTotalPages] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
        />
      ),
      enableSorting: false,
      enableGlobalFilter: false,
    }),
    columnHelper.accessor('id', {
      header: 'Task ID',
      cell: ({ getValue }) => (
        <div className="text-sm font-mono text-gray-900 dark:text-white">
          #{getValue().substring(0, 8)}
        </div>
      ),
    }),
    columnHelper.accessor('userName', {
      header: 'Creator',
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">{row.original.userName}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.original.userEmail}</div>
        </div>
      ),
    }),
    columnHelper.accessor('platform', {
      header: 'Platform',
      cell: ({ getValue }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getValue() === 'instagram'
          ? 'bg-pink-100 text-pink-800'
          : 'bg-red-100 text-red-800'
          }`}>
          {getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-900 dark:text-white capitalize">{getValue()}</div>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        const statusConfig = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
          approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
          rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: X },
          processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertTriangle },
          completed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle }
        };
        const config = statusConfig[status];
        const Icon = config.icon;

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <Icon className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
      },
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: ({ getValue }) => {
        const priority = getValue();
        const priorityConfig = {
          low: { bg: 'bg-gray-100', text: 'text-gray-800' },
          medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
          high: { bg: 'bg-red-100', text: 'text-red-800' }
        };
        const config = priorityConfig[priority];

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {priority}
          </span>
        );
      },
    }),
    columnHelper.accessor('quantity', {
      header: 'Quantity',
      cell: ({ getValue, row }) => {
        const quantity = getValue();
        const numericQuantity = typeof quantity === 'number' ? quantity : parseInt(quantity) || 0;
        const remaining = row.original.remainingQuantity || 0;
        return (
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{numericQuantity.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {remaining} remaining
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('rate', {
      header: 'Rate',
      cell: ({ getValue }) => {
        const rate = getValue();
        const numericRate = typeof rate === 'number' ? rate : parseFloat(rate) || 0;
        return (
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            ${numericRate.toFixed(3)}
          </div>
        );
      },
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: ({ getValue }) => {
        const dateValue = getValue();
        try {
          const date = dateValue ? new Date(dateValue) : new Date();
          return (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {date.toLocaleDateString()}
            </div>
          );
        } catch (e) {
          return <div className="text-sm text-gray-500 dark:text-gray-400">-</div>;
        }
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {row.original.status === 'pending' && (
            <>
              <button
                onClick={() => handleApproveTask(row.original.id)}
                className="p-1 text-green-600 hover:text-green-800"
                title="Approve task"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleRejectTask(row.original.id)}
                className="p-1 text-red-600 hover:text-red-800"
                title="Reject task"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
      enableSorting: false,
      enableGlobalFilter: false,
    }),
  ];

  const table = useReactTable({
    data: tasks,
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
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: totalPages,
  });

  const fetchTasks = async () => {
    try {
      setIsLoading(true);

      // Convert camelCase to snake_case for sortBy
      const sortByField = sorting[0]?.id || 'createdAt';
      const sortBySnakeCase = sortByField === 'createdAt' ? 'created_at'
        : sortByField === 'updatedAt' ? 'updated_at'
          : sortByField === 'lastUpdatedAt' ? 'last_updated_at'
            : sortByField;

      const params: any = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: globalFilter,
        status: statusFilter,
        platform: platformFilter,
        type: typeFilter,
        sortBy: sortBySnakeCase,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      };

      // Filter out empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      if (activeTab === 'pending') {
        params.admin_status = 'pending';
      }

      const data = await tasksAPI.getTasks(params);
      setTasks(data.data || []);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
      toast.error(error.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeTab, pagination, globalFilter, statusFilter, platformFilter, typeFilter, sorting]);

  useEffect(() => {
    const selectedRowIds = Object.keys(rowSelection).filter(id => rowSelection[id as keyof typeof rowSelection]);
    setSelectedTasks(selectedRowIds);
  }, [rowSelection]);

  const handleApproveTask = async (taskId: string) => {
    try {
      await tasksAPI.approveTask(taskId);
      toast.success('Task approved successfully');
      fetchTasks();
    } catch (error: any) {
      console.error('Failed to approve task:', error);
      toast.error(error.message || 'Failed to approve task');
    }
  };

  const handleRejectTask = async (taskId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await tasksAPI.rejectTask(taskId, reason);
      toast.success('Task rejected successfully');
      fetchTasks();
    } catch (error: any) {
      console.error('Failed to reject task:', error);
      toast.error(error.message || 'Failed to reject task');
    }
  };

  const handleBulkApprove = async () => {
    const selectedTaskIds = Object.keys(rowSelection).filter(id => rowSelection[id as keyof typeof rowSelection]);
    if (selectedTaskIds.length === 0) {
      toast.error('Please select at least one task to approve');
      return;
    }

    try {
      for (const taskId of selectedTaskIds) {
        await tasksAPI.approveTask(taskId);
      }
      toast.success(`Successfully approved ${selectedTaskIds.length} task(s)`);
      setRowSelection({});
      fetchTasks();
    } catch (error: any) {
      console.error('Bulk approve failed:', error);
      toast.error(error.message || 'Bulk approve failed');
    }
  };

  const handleBulkReject = async () => {
    const selectedTaskIds = Object.keys(rowSelection).filter(id => rowSelection[id as keyof typeof rowSelection]);
    if (selectedTaskIds.length === 0) {
      toast.error('Please select at least one task to reject');
      return;
    }

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      for (const taskId of selectedTaskIds) {
        await tasksAPI.rejectTask(taskId, reason);
      }
      toast.success(`Successfully rejected ${selectedTaskIds.length} task(s)`);
      setRowSelection({});
      fetchTasks();
    } catch (error: any) {
      console.error('Bulk reject failed:', error);
      toast.error(error.message || 'Bulk reject failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user tasks, approvals, and status</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleBulkApprove}
            disabled={selectedTasks.length === 0}
            variant="primary"
          >
            Approve Selected
          </Button>
          <Button
            onClick={handleBulkReject}
            disabled={selectedTasks.length === 0}
            variant="danger"
          >
            Reject Selected
          </Button>
          <Button onClick={() => console.log('Add task')}>
            Add Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            All Tasks
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {activeTab === 'all' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          )}

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="like">Like</option>
            <option value="follow">Follow</option>
            <option value="comment">Comment</option>
          </select>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {tasks.length} tasks found
            </span>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
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
                            <ChevronUp className={`h-3 w-3 ${header.column.getIsSorted() === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <ChevronDown className={`h-3 w-3 -mt-1 ${header.column.getIsSorted() === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
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
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                ({tasks.length} tasks)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-1" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
