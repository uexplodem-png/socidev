import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  SortingState
} from '@tanstack/react-table';
import {
  Search,
  Filter,
  Shield,
  User,
  ShoppingCart,
  ListTodo,
  Settings,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { auditLogsAPI } from '../services/api';
import { SystemLogs } from '../components/SystemLogs';

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
  ipAddress: string | null;
  userAgent: string | null;
  metadata: {
    changes?: any;
    [key: string]: any;
  };
  createdAt: string;
}

const columnHelper = createColumnHelper<AuditLog>();

type TabType = 'audit' | 'combined' | 'error';

export const AuditLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalPages, setTotalPages] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const columns = [
    columnHelper.accessor('createdAt', {
      header: 'Timestamp',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {new Date(getValue()).toLocaleString()}
        </div>
      ),
    }),
    columnHelper.accessor('actorName', {
      header: 'Actor',
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.original.actorName}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.original.actorEmail}</div>
        </div>
      ),
    }),
    columnHelper.accessor('action', {
      header: 'Action',
      cell: ({ getValue }) => {
        const action = getValue();
        const actionColors = {
          USER_CREATED: 'bg-green-100 text-green-800',
          USER_UPDATED: 'bg-blue-100 text-blue-800',
          USER_SUSPENDED: 'bg-yellow-100 text-yellow-800',
          USER_BANNED: 'bg-red-100 text-red-800',
          USER_RESTORED: 'bg-green-100 text-green-800',
          ORDER_CREATED: 'bg-purple-100 text-purple-800',
          ORDER_UPDATED: 'bg-blue-100 text-blue-800',
          ORDER_REFUNDED: 'bg-yellow-100 text-yellow-800',
          TASK_APPROVED: 'bg-green-100 text-green-800',
          TASK_REJECTED: 'bg-red-100 text-red-800',
          SETTINGS_UPDATED: 'bg-gray-100 text-gray-800'
        };
        const colorClass = actionColors[action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800';

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {action.replace('_', ' ')}
          </span>
        );
      },
    }),
    columnHelper.accessor('resource', {
      header: 'Resource',
      cell: ({ getValue }) => {
        const resource = getValue();
        const resourceIcons = {
          user: User,
          order: ShoppingCart,
          task: ListTodo,
          settings: Settings
        };
        const Icon = resourceIcons[resource as keyof typeof resourceIcons] || Shield;

        return (
          <div className="flex items-center">
            <Icon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">{resource}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
          {getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('targetUserName', {
      header: 'Target',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {getValue() || '-'}
        </div>
      ),
    }),
    columnHelper.display({
      id: 'details',
      header: 'Details',
      cell: ({ row }) => (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div>IP: {row.original.ipAddress || 'N/A'}</div>
          {row.original.userAgent && (
            <div className="truncate max-w-xs" title={row.original.userAgent}>
              UA: {row.original.userAgent.substring(0, 50)}...
            </div>
          )}
          {row.original.metadata?.changes && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                Has Changes
              </span>
            </div>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: auditLogs,
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

  const fetchAuditLogs = async () => {
    try {
      // Map frontend column names to backend column names
      const sortByMap: Record<string, string> = {
        createdAt: 'created_at',
        action: 'action',
        resource: 'resource',
      };

      const sortBy = sorting[0]?.id || 'createdAt';
      const mappedSortBy = sortByMap[sortBy] || 'created_at';

      const params = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: globalFilter || '',
        action: actionFilter || '',
        resource: resourceFilter || '',
        sortBy: mappedSortBy,
        sortOrder: (sorting[0]?.desc ? 'desc' : 'asc') as 'asc' | 'desc',
      };

      const data = await auditLogsAPI.getAuditLogs(params);
      setAuditLogs(data.auditLogs || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, actionFilter, resourceFilter, JSON.stringify(sorting)]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));
  const uniqueResources = Array.from(new Set(auditLogs.map(log => log.resource)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Logs</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete log of all administrative actions and system events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Immutable Records</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('audit')}
            className={`${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            <Shield className="h-5 w-5 mr-2" />
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('combined')}
            className={`${
              activeTab === 'combined'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            <FileText className="h-5 w-5 mr-2" />
            Combined Logs
          </button>
          <button
            onClick={() => setActiveTab('error')}
            className={`${
              activeTab === 'error'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Logs
          </button>
        </nav>
      </div>

      {/* Audit Logs Tab Content */}
      {activeTab === 'audit' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {auditLogs.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Logs</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {auditLogs.filter(log => log.action.includes('CREATED') || log.action.includes('APPROVED')).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Positive Actions</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {auditLogs.filter(log => log.action.includes('UPDATED') || log.action.includes('SUSPENDED')).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Modifications</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {auditLogs.filter(log => log.action.includes('BANNED') || log.action.includes('REJECTED')).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Restrictive Actions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action.replace('_', ' ')}</option>
            ))}
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Resources</option>
            {uniqueResources.map(resource => (
              <option key={resource} value={resource} className="capitalize">{resource}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {auditLogs.length} logs found
            </span>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none"
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
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedLog(row.original);
                    setShowDetailsModal(true);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                ({auditLogs.length} logs)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-1" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

          {/* Details Modal */}
          {showDetailsModal && selectedLog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>

            <div className="px-6 py-4 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Admin</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedLog.actorName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedLog.actorEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Timestamp</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Action</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resource</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{selectedLog.resource}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Metadata</p>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">IP Address:</span> {selectedLog.ipAddress || 'N/A'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 break-all">
                    <span className="font-medium">User Agent:</span> {selectedLog.userAgent || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Changes */}
              {selectedLog.metadata.changes && (
                <div className="border-t dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Changes</p>
                  <div className="space-y-3">
                    {Object.entries(selectedLog.metadata.changes.before || {}).map(([field, beforeValue]: any) => {
                      const afterValue = selectedLog.metadata.changes?.after?.[field];
                      if (beforeValue === afterValue) return null;

                      return (
                        <div key={field} className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">{field} (Before)</p>
                            <p className="text-sm font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded text-red-900 dark:text-red-300 break-all">
                              {String(beforeValue || '-')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">{field} (After)</p>
                            <p className="text-sm font-mono bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-900 dark:text-green-300 break-all">
                              {String(afterValue || '-')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Combined Logs Tab Content */}
      {activeTab === 'combined' && (
        <SystemLogs type="combined" />
      )}

      {/* Error Logs Tab Content */}
      {activeTab === 'error' && (
        <SystemLogs type="error" />
      )}
    </div>
  );
};

export default AuditLogs;
