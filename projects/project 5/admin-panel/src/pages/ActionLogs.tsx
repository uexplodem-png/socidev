import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { 
  Eye, 
  Search, 
  Filter, 
  Download,
  User,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

interface ActionLog {
  id: string;
  user_id: string;
  type: string;
  action: string;
  details: string | object;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const columnHelper = createColumnHelper<ActionLog>();

// Simple date formatting helper
const formatDate = (date: Date, formatStr: string) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const replacements: Record<string, string> = {
    'yyyy': date.getFullYear().toString(),
    'MMM': months[date.getMonth()],
    'MM': pad(date.getMonth() + 1),
    'dd': pad(date.getDate()),
    'HH': pad(date.getHours()),
    'mm': pad(date.getMinutes()),
    'ss': pad(date.getSeconds()),
  };
  
  return formatStr.replace(/yyyy|MMM|MM|dd|HH|mm|ss/g, match => replacements[match] || match);
};

export const ActionLogs: React.FC = () => {
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [totalPages, setTotalPages] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  const columns = [
    columnHelper.accessor('created_at', {
      header: 'Timestamp',
      cell: (info) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {formatDate(new Date(info.getValue()), 'MMM dd, yyyy')}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {formatDate(new Date(info.getValue()), 'HH:mm:ss')}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('user', {
      header: 'User',
      cell: (info) => {
        const user = info.getValue();
        return user ? (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">Unknown User</span>
        );
      },
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => {
        const type = info.getValue();
        const typeColors: Record<string, string> = {
          auth: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          order: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          task: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
          transaction: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          profile: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
          settings: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        };
        const colorClass = typeColors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            <Activity className="w-3 h-3 mr-1" />
            {type}
          </span>
        );
      },
    }),
    columnHelper.accessor('action', {
      header: 'Action',
      cell: (info) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('ip_address', {
      header: 'IP Address',
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
          {info.getValue() || 'N/A'}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedLog(info.row.original);
            setShowDetailsModal(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: actionLogs,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  useEffect(() => {
    fetchActionLogs();
    fetchFilterOptions();
  }, [pagination.pageIndex, pagination.pageSize, typeFilter, actionFilter, userIdFilter, globalFilter]);

  const fetchActionLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
      });

      if (typeFilter) params.append('type', typeFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (userIdFilter) params.append('userId', userIdFilter);
      if (globalFilter) params.append('search', globalFilter);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/action-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActionLogs(data.actionLogs || []);
        setTotalPages(data.pagination?.totalPages || 0);
      }
    } catch (error) {
      console.error('Failed to fetch action logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [typesRes, actionsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/action-logs/types`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/action-logs/actions`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setAvailableTypes(typesData || []);
      }

      if (actionsRes.ok) {
        const actionsData = await actionsRes.json();
        setAvailableActions(actionsData || []);
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (userIdFilter) params.append('userId', userIdFilter);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/action-logs/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `action-logs-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const resetFilters = () => {
    setGlobalFilter('');
    setTypeFilter('');
    setActionFilter('');
    setUserIdFilter('');
    setPagination({ pageIndex: 0, pageSize: 20 });
  };

  const formatDetails = (details: string | object) => {
    if (typeof details === 'string') {
      try {
        return JSON.stringify(JSON.parse(details), null, 2);
      } catch {
        return details;
      }
    }
    return JSON.stringify(details, null, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Action Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">View user activity timeline and actions</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search logs..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Types</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Actions</option>
              {availableActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="User ID..."
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <Button variant="outline" onClick={resetFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No action logs found
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.pageIndex + 1} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Action Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}` : 'Unknown'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedLog.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Action</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedLog.action}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(new Date(selectedLog.created_at), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">IP Address</label>
                <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedLog.ip_address || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User Agent</label>
                <p className="text-sm text-gray-900 dark:text-white break-all">{selectedLog.user_agent || 'N/A'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Details</label>
              <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-gray-900 dark:text-white">
                {formatDetails(selectedLog.details)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActionLogs;
