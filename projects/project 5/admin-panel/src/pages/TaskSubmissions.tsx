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
    ChevronRight,
    Image,
    ExternalLink,
    Eye,
    DollarSign,
    FileText,
    MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TaskSubmission, TaskSubmissionStatus } from '../types';
import { tasksAPI } from '../services/api';

interface TaskSubmissionWithOrder extends TaskSubmission {
    orderId: string;
    // Add earnings and proof count
    moneyEarned: number;
    proofsSent: number;
}

const API_BASE_URL = 'http://localhost:3000';

// Mock order data for demonstration
const mockOrders = [
    {
        id: 'order1',
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        platform: 'instagram',
        service: 'Likes',
        targetUrl: 'https://instagram.com/p/ABC123',
        quantity: 100,
        completed: 80,
        status: 'processing',
        amount: 2.00,
        progress: 80,
        createdAt: '2023-05-15T09:00:00Z',
        updatedAt: '2023-05-15T10:30:00Z'
    },
    {
        id: 'order2',
        userId: 'user2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        platform: 'youtube',
        service: 'Views',
        targetUrl: 'https://youtube.com/watch?v=XYZ789',
        quantity: 500,
        completed: 500,
        status: 'completed',
        amount: 5.00,
        progress: 100,
        createdAt: '2023-05-16T10:00:00Z',
        updatedAt: '2023-05-16T14:45:00Z'
    },
    {
        id: 'order3',
        userId: 'user3',
        userName: 'Robert Johnson',
        userEmail: 'robert@example.com',
        platform: 'instagram',
        service: 'Likes',
        targetUrl: 'https://instagram.com/p/DEF456',
        quantity: 200,
        completed: 200,
        status: 'completed',
        amount: 4.00,
        progress: 100,
        createdAt: '2023-05-17T08:00:00Z',
        updatedAt: '2023-05-17T09:15:00Z'
    },
    {
        id: 'order4',
        userId: 'user4',
        userName: 'Emily Davis',
        userEmail: 'emily@example.com',
        platform: 'tiktok',
        service: 'Followers',
        targetUrl: 'https://tiktok.com/@emilydavis',
        quantity: 50,
        completed: 0,
        status: 'pending',
        amount: 2.50,
        progress: 0,
        createdAt: '2023-05-18T10:00:00Z',
        updatedAt: '2023-05-18T11:20:00Z'
    }
];

// Mock data for task submissions with earnings and proof counts
const mockSubmissions: TaskSubmissionWithOrder[] = [
    {
        id: '1',
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        taskId: 'task1',
        taskName: 'Instagram Likes',
        orderId: 'order1',
        screenshotUrl: 'https://placehold.co/600x400/EEE/31343C',
        submissionNumber: 1,
        status: 'pending',
        submittedAt: '2023-05-15T10:30:00Z',
        moneyEarned: 0.50,
        proofsSent: 25
    },
    {
        id: '2',
        userId: 'user2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        taskId: 'task2',
        taskName: 'YouTube Views',
        orderId: 'order2',
        screenshotUrl: 'https://placehold.co/600x400/EEE/31343C',
        submissionNumber: 2,
        status: 'pending',
        submittedAt: '2023-05-16T14:45:00Z',
        moneyEarned: 1.25,
        proofsSent: 100
    },
    {
        id: '3',
        userId: 'user3',
        userName: 'Robert Johnson',
        userEmail: 'robert@example.com',
        taskId: 'task1',
        taskName: 'Instagram Likes',
        orderId: 'order3',
        screenshotUrl: 'https://placehold.co/600x400/EEE/31343C',
        submissionNumber: 3,
        status: 'approved',
        submittedAt: '2023-05-17T09:15:00Z',
        reviewedAt: '2023-05-17T10:00:00Z',
        reviewedBy: 'Admin',
        moneyEarned: 2.00,
        proofsSent: 50
    },
    {
        id: '4',
        userId: 'user4',
        userName: 'Emily Davis',
        userEmail: 'emily@example.com',
        taskId: 'task3',
        taskName: 'TikTok Followers',
        orderId: 'order4',
        screenshotUrl: 'https://placehold.co/600x400/EEE/31343C',
        submissionNumber: 1,
        status: 'rejected',
        submittedAt: '2023-05-18T11:20:00Z',
        reviewedAt: '2023-05-18T12:00:00Z',
        reviewedBy: 'Admin',
        rejectionReason: 'Wrong screenshot provided - please provide a valid screenshot of the completed task',
        moneyEarned: 0.00,
        proofsSent: 10
    }
];

const columnHelper = createColumnHelper<TaskSubmissionWithOrder>();

export const TaskSubmissions: React.FC = () => {
    const [submissions, setSubmissions] = useState<TaskSubmissionWithOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [taskFilter, setTaskFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [totalPages, setTotalPages] = useState(0);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
    const [currentScreenshot, setCurrentScreenshot] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingSubmissionId, setRejectingSubmissionId] = useState<string | null>(null);
    const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showProofsModal, setShowProofsModal] = useState(false);
    const [selectedOrderProofs, setSelectedOrderProofs] = useState<TaskSubmissionWithOrder[]>([]);
    const [showRejectionNoteModal, setShowRejectionNoteModal] = useState(false);
    const [selectedRejectionNote, setSelectedRejectionNote] = useState<string>('');

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
        columnHelper.accessor('userName', {
            header: 'User',
            cell: ({ row }) => (
                <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{row.original.userName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{row.original.userEmail}</div>
                </div>
            ),
        }),
        columnHelper.accessor('taskName', {
            header: 'Task Name',
            cell: ({ getValue }) => (
                <div className="text-sm font-medium text-gray-900 dark:text-white">{getValue()}</div>
            ),
        }),
        columnHelper.display({
            id: 'screenshot',
            header: 'Screenshot',
            cell: ({ row }) => (
                <button
                    onClick={() => {
                        setCurrentScreenshot(row.original.screenshotUrl);
                        setScreenshotModalOpen(true);
                    }}
                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="View screenshot"
                >
                    <Image className="h-5 w-5" />
                </button>
            ),
        }),
        columnHelper.accessor('orderId', {
            header: 'Order',
            cell: ({ getValue, row }) => (
                <button
                    onClick={() => viewOrderDetails(row.original.orderId)}
                    className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="View order details"
                >
                    <span className="text-sm font-mono">#{getValue().substring(0, 8)}</span>
                    <ExternalLink className="h-4 w-4 ml-1" />
                </button>
            ),
        }),
        columnHelper.accessor('submissionNumber', {
            header: 'Submission #',
            cell: ({ getValue }) => (
                <div className="text-sm text-gray-900 dark:text-white">#{getValue()}</div>
            ),
        }),
        columnHelper.accessor('moneyEarned', {
            header: 'Money Earned',
            cell: ({ getValue }) => (
                <div className="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                    <DollarSign className="h-4 w-4 mr-1" />
                    ${getValue().toFixed(2)}
                </div>
            ),
        }),
        columnHelper.accessor('proofsSent', {
            header: 'Proofs Sent',
            cell: ({ getValue, row }) => (
                <button
                    onClick={() => viewOrderProofs(row.original.orderId)}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    <FileText className="h-4 w-4 mr-1" />
                    {getValue()}
                </button>
            ),
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: ({ getValue, row }) => {
                const status = getValue();
                const statusConfig = {
                    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
                    approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
                    rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: X }
                };
                const config = statusConfig[status];
                const Icon = config.icon;

                return (
                    <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {status}
                        </span>
                        {status === 'rejected' && row.original.rejectionReason && (
                            <button
                                onClick={() => {
                                    setSelectedRejectionNote(row.original.rejectionReason || '');
                                    setShowRejectionNoteModal(true);
                                }}
                                className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                title="View rejection note"
                            >
                                <MessageCircle className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                );
            },
        }),
        columnHelper.accessor('submittedAt', {
            header: 'Submitted',
            cell: ({ getValue }) => (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(getValue()).toLocaleDateString()}
                </div>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center space-x-2">
                    {row.original.status === 'pending' && (
                        <>
                            <button
                                onClick={() => handleApproveSubmission(row.original.id)}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Approve submission"
                            >
                                <ThumbsUp className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setRejectingSubmissionId(row.original.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Reject submission"
                            >
                                <ThumbsDown className="h-4 w-4" />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => {
                            setCurrentScreenshot(row.original.screenshotUrl);
                            setScreenshotModalOpen(true);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View screenshot"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                </div>
            ),
            enableSorting: false,
            enableGlobalFilter: false,
        }),
    ];

    const table = useReactTable({
        data: submissions,
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

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                setIsLoading(true);
                const response = await tasksAPI.getSubmittedTasks({
                    page: pagination.pageIndex + 1,
                    limit: pagination.pageSize,
                    search: globalFilter,
                    status: statusFilter,
                });
                
                // Backend returns array directly, not wrapped in object
                const tasksArray = Array.isArray(response) ? response : [];
                
                // Transform backend response to match frontend interface
                const transformedTasks = tasksArray.map((task: any) => ({
                    id: task.id,
                    userId: task.userId,
                    userName: task.user?.username || 'Unknown',
                    userEmail: task.user?.email || '',
                    taskId: task.id,
                    taskName: `${task.platform} ${task.type}`,
                    orderId: task.orderId || 'N/A',
                    screenshotUrl: task.screenshotUrl || '',
                    submissionNumber: 1, // Backend doesn't track this yet
                    status: task.screenshotStatus || 'pending',
                    submittedAt: task.screenshotSubmittedAt,
                    reviewedAt: task.completedAt,
                    reviewedBy: 'Admin',
                    rejectionReason: task.rejectionReason,
                    moneyEarned: task.rate || 0,
                    proofsSent: 1, // Backend doesn't track this yet
                    targetUrl: task.targetUrl,
                    platform: task.platform,
                    type: task.type,
                }));
                
                setSubmissions(transformedTasks);
                // Backend returns array without pagination, so calculate total from array length
                setTotalPages(Math.ceil(transformedTasks.length / pagination.pageSize));
            } catch (error: any) {
                console.error('Failed to fetch task submissions:', error);
                toast.error(error.message || 'Failed to load task submissions');
                setSubmissions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, statusFilter, taskFilter, userFilter, sorting]);

    useEffect(() => {
        const selectedRowIds = Object.keys(rowSelection).filter(id => rowSelection[id as keyof typeof rowSelection]);
        setSelectedSubmissions(selectedRowIds);
    }, [rowSelection]);

    const handleApproveSubmission = async (submissionId: string) => {
        try {
            await tasksAPI.approveTaskScreenshot(submissionId);
            setSubmissions(submissions.map(sub =>
                sub.id === submissionId ? { ...sub, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: 'Admin' } : sub
            ));
            toast.success('Submission approved successfully - Payment processed');
        } catch (error: any) {
            console.error('Failed to approve submission:', error);
            toast.error(error.message || 'Failed to approve submission');
        }
    };

    const handleRejectSubmission = async () => {
        if (!rejectingSubmissionId || !rejectionReason) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            if (rejectingSubmissionId === 'bulk') {
                // Handle bulk rejection
                const selectedSubmissionIds = Object.keys(rowSelection).filter(id => rowSelection[id as keyof typeof rowSelection]);
                for (const id of selectedSubmissionIds) {
                    await tasksAPI.rejectTaskScreenshot(id, rejectionReason);
                }
                toast.success(`Successfully rejected ${selectedSubmissionIds.length} submission(s)`);
                setRowSelection({});
            } else {
                // Handle single rejection
                await tasksAPI.rejectTaskScreenshot(rejectingSubmissionId, rejectionReason);
                setSubmissions(submissions.map(sub =>
                    sub.id === rejectingSubmissionId ?
                        { ...sub, status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: 'Admin', rejectionReason } : sub
                ));
                toast.success('Submission rejected successfully');
            }
            setRejectingSubmissionId(null);
            setRejectionReason('');
            // Refetch submissions
            window.location.reload(); // Simple refetch - could be improved with state management
        } catch (error: any) {
            console.error('Failed to reject submission:', error);
            toast.error(error.message || 'Failed to reject submission');
        }
    };

    const handleBulkApprove = async () => {
        const selectedSubmissionIds = Object.keys(rowSelection).filter(id => rowSelection[id as keyof typeof rowSelection]);
        if (selectedSubmissionIds.length === 0) {
            toast.error('Please select at least one submission to approve');
            return;
        }

        try {
            for (const id of selectedSubmissionIds) {
                await tasksAPI.approveTaskScreenshot(id);
            }
            setSubmissions(submissions.map(sub =>
                selectedSubmissionIds.includes(sub.id) ?
                    { ...sub, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: 'Admin' } : sub
            ));
            toast.success(`Successfully approved ${selectedSubmissionIds.length} submission(s)`);
            setRowSelection({});
        } catch (error) {
            console.error('Bulk approve failed:', error);
            toast.error('Bulk approve failed');
        }
    };

    const handleBulkReject = async () => {
        const selectedSubmissionIds = Object.keys(rowSelection).filter(id => rowSelection[id as keyof typeof rowSelection]);
        if (selectedSubmissionIds.length === 0) {
            toast.error('Please select at least one submission to reject');
            return;
        }

        if (!rejectionReason) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            // Simulate API call
            setSubmissions(submissions.map(sub =>
                selectedSubmissionIds.includes(sub.id) ?
                    { ...sub, status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: 'Admin', rejectionReason } : sub
            ));
            toast.success(`Successfully rejected ${selectedSubmissionIds.length} submission(s)`);
            setRowSelection({});
            setRejectionReason('');
        } catch (error) {
            console.error('Bulk reject failed:', error);
            toast.error('Bulk reject failed');
        }
    };

    const viewOrderDetails = (orderId: string) => {
        // Find the order in mock data
        const order = mockOrders.find(o => o.id === orderId);
        if (order) {
            setSelectedOrder(order);
            setShowOrderDetailModal(true);
        } else {
            toast.error('Order not found');
        }
    };

    const viewOrderProofs = (orderId: string) => {
        // Find all submissions for this order
        const orderProofs = mockSubmissions.filter(sub => sub.orderId === orderId);
        setSelectedOrderProofs(orderProofs);
        setShowProofsModal(true);
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Submissions</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage user task submissions and approvals</p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        onClick={handleBulkApprove}
                        disabled={selectedSubmissions.length === 0}
                        variant="primary"
                    >
                        Approve Selected
                    </Button>
                    <Button
                        onClick={() => {
                            const selectedSubmissionIds = Object.keys(rowSelection).filter(id => rowSelection[id as keyof typeof rowSelection]);
                            if (selectedSubmissionIds.length === 0) {
                                toast.error('Please select at least one submission to reject');
                                return;
                            }
                            setRejectingSubmissionId('bulk');
                        }}
                        disabled={selectedSubmissions.length === 0}
                        variant="danger"
                    >
                        Reject Selected
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search submissions..."
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
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <select
                        value={taskFilter}
                        onChange={(e) => setTaskFilter(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Tasks</option>
                        <option value="task1">Instagram Likes</option>
                        <option value="task2">YouTube Views</option>
                        <option value="task3">TikTok Followers</option>
                    </select>

                    <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Users</option>
                        <option value="user1">John Doe</option>
                        <option value="user2">Jane Smith</option>
                        <option value="user3">Robert Johnson</option>
                        <option value="user4">Emily Davis</option>
                    </select>

                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {submissions.length} submissions found
                        </span>
                    </div>
                </div>
            </div>

            {/* Submissions Table */}
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
                                ({submissions.length} submissions)
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

            {/* Screenshot Modal */}
            {screenshotModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto dark:bg-gray-800">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Screenshot Preview</h3>
                            <button
                                onClick={() => setScreenshotModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-4">
                            <img
                                src={currentScreenshot.startsWith('http') ? currentScreenshot : `${API_BASE_URL}${currentScreenshot}`}
                                alt="Submission screenshot"
                                className="max-w-full h-auto rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reason Modal */}
            {rejectingSubmissionId && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full dark:bg-gray-800">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Reject Submission</h3>
                        </div>
                        <div className="p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                Reason for rejection
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter reason for rejection..."
                            />
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 dark:border-gray-700">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setRejectingSubmissionId(null);
                                    setRejectionReason('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleRejectSubmission}
                            >
                                Reject Submission
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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

                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowOrderDetailModal(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Order Proofs Modal */}
            <Modal
                isOpen={showProofsModal}
                onClose={() => setShowProofsModal(false)}
                title="Order Proofs"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Proofs Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Total Proofs</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedOrderProofs.length}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Approved</div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {selectedOrderProofs.filter(p => p.status === 'approved').length}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {selectedOrderProofs.filter(p => p.status === 'pending').length}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Proofs Details</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Submission #</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Money Earned</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Submitted</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                    {selectedOrderProofs.map((proof) => (
                                        <tr key={proof.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                #{proof.submissionNumber}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    proof.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    proof.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {proof.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                                                ${proof.moneyEarned.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(proof.submittedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => {
                                                        setCurrentScreenshot(proof.screenshotUrl);
                                                        setScreenshotModalOpen(true);
                                                        setShowProofsModal(false);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    View Screenshot
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowProofsModal(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Rejection Note Modal */}
            <Modal
                isOpen={showRejectionNoteModal}
                onClose={() => setShowRejectionNoteModal(false)}
                title="Rejection Note"
                size="md"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-gray-800 dark:text-gray-200">
                                {selectedRejectionNote}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowRejectionNoteModal(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TaskSubmissions;