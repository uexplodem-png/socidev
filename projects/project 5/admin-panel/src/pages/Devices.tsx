import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button';
import { usePermissions } from '../hooks/usePermissions';
import {
    Power,
    RotateCw,
    Upload,
    BarChart3,
    Play,
    Pause,
    Smartphone,
    Monitor,
    Tablet,
    Server,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Search,
    Filter
} from 'lucide-react';
import Modal from '../components/ui/Modal';

interface Device {
    id: string;
    name: string;
    type: 'mobile' | 'desktop' | 'tablet' | 'server';
    status: 'online' | 'offline' | 'maintenance' | 'error';
    userId: string;
    lastSeen: string;
    version: string;
    location: string;
    usage: {
        tasksCompleted: number;
        uptime: number;
        quotaUsed: number;
        quotaLimit: number;
    };
    configuration: {
        autoUpdate: boolean;
        maxConcurrentTasks: number;
        workingHours: {
            start: string;
            end: string;
        };
    };
    currentTask?: {
        id: string;
        name: string;
        progress: number;
    };
}

const Devices: React.FC = () => {
    const { hasPermission } = usePermissions();
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        online: 0,
        offline: 0,
        maintenance: 0,
        error: 0,
        avgUptime: 0,
        totalTasks: 0
    });
    const [newProgram, setNewProgram] = useState({
        name: '',
        version: '',
        file: null as File | null
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Mock data initialization
    useEffect(() => {
        const mockDevices: Device[] = [
            {
                id: 'device-1',
                name: 'MacBook Pro',
                type: 'desktop',
                status: 'online',
                userId: 'user-1',
                lastSeen: new Date().toISOString(),
                version: 'v2.3.1',
                location: 'San Francisco, CA',
                usage: {
                    tasksCompleted: 124,
                    uptime: 98.5,
                    quotaUsed: 750,
                    quotaLimit: 1000
                },
                configuration: {
                    autoUpdate: true,
                    maxConcurrentTasks: 5,
                    workingHours: {
                        start: '09:00',
                        end: '17:00'
                    }
                },
                currentTask: {
                    id: 'task-101',
                    name: 'Instagram Likes',
                    progress: 65
                }
            },
            {
                id: 'device-2',
                name: 'iPhone 14',
                type: 'mobile',
                status: 'online',
                userId: 'user-2',
                lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                version: 'v2.3.1',
                location: 'San Francisco, CA',
                usage: {
                    tasksCompleted: 87,
                    uptime: 92.3,
                    quotaUsed: 420,
                    quotaLimit: 500
                },
                configuration: {
                    autoUpdate: true,
                    maxConcurrentTasks: 3,
                    workingHours: {
                        start: '08:00',
                        end: '20:00'
                    }
                },
                currentTask: {
                    id: 'task-102',
                    name: 'Twitter Retweets',
                    progress: 30
                }
            },
            {
                id: 'device-3',
                name: 'Windows Server',
                type: 'server',
                status: 'maintenance',
                userId: 'user-3',
                lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                version: 'v2.2.0',
                location: 'New York, NY',
                usage: {
                    tasksCompleted: 420,
                    uptime: 99.8,
                    quotaUsed: 2100,
                    quotaLimit: 3000
                },
                configuration: {
                    autoUpdate: false,
                    maxConcurrentTasks: 20,
                    workingHours: {
                        start: '00:00',
                        end: '23:59'
                    }
                }
            },
            {
                id: 'device-4',
                name: 'iPad Pro',
                type: 'tablet',
                status: 'offline',
                userId: 'user-4',
                lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                version: 'v2.3.1',
                location: 'Los Angeles, CA',
                usage: {
                    tasksCompleted: 56,
                    uptime: 76.2,
                    quotaUsed: 280,
                    quotaLimit: 400
                },
                configuration: {
                    autoUpdate: true,
                    maxConcurrentTasks: 2,
                    workingHours: {
                        start: '09:00',
                        end: '18:00'
                    }
                }
            },
            {
                id: 'device-5',
                name: 'Dell Workstation',
                type: 'desktop',
                status: 'error',
                userId: 'user-5',
                lastSeen: new Date().toISOString(),
                version: 'v2.1.5',
                location: 'Chicago, IL',
                usage: {
                    tasksCompleted: 210,
                    uptime: 85.7,
                    quotaUsed: 950,
                    quotaLimit: 1200
                },
                configuration: {
                    autoUpdate: false,
                    maxConcurrentTasks: 8,
                    workingHours: {
                        start: '08:00',
                        end: '18:00'
                    }
                },
                currentTask: {
                    id: 'task-103',
                    name: 'YouTube Views',
                    progress: 15
                }
            }
        ];

        setDevices(mockDevices);
        calculateStats(mockDevices);
    }, []);

    const calculateStats = (deviceList: Device[]) => {
        const total = deviceList.length;
        const online = deviceList.filter(d => d.status === 'online').length;
        const offline = deviceList.filter(d => d.status === 'offline').length;
        const maintenance = deviceList.filter(d => d.status === 'maintenance').length;
        const error = deviceList.filter(d => d.status === 'error').length;

        const avgUptime = deviceList.reduce((sum, device) => sum + device.usage.uptime, 0) / total;
        const totalTasks = deviceList.reduce((sum, device) => sum + device.usage.tasksCompleted, 0);

        setStats({
            total,
            online,
            offline,
            maintenance,
            error,
            avgUptime: parseFloat(avgUptime.toFixed(1)),
            totalTasks
        });
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'mobile': return <Smartphone className="h-5 w-5" />;
            case 'desktop': return <Monitor className="h-5 w-5" />;
            case 'tablet': return <Tablet className="h-5 w-5" />;
            case 'server': return <Server className="h-5 w-5" />;
            default: return <Monitor className="h-5 w-5" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            online: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            offline: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
            maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
            error: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const handleSelectDevice = (deviceId: string) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    const handleSelectAll = () => {
        if (selectedDevices.length === devices.length) {
            setSelectedDevices([]);
        } else {
            setSelectedDevices(devices.map(d => d.id));
        }
    };

    const handleShutdown = async (deviceId?: string) => {
        const deviceIds = deviceId ? [deviceId] : selectedDevices;
        if (deviceIds.length === 0) return;

        try {
            // In a real app, this would call an API
            setDevices(prev => prev.map(device =>
                deviceIds.includes(device.id)
                    ? { ...device, status: 'offline' }
                    : device
            ));
            setSelectedDevices([]);
            toast.success(`Successfully shut down ${deviceIds.length} device(s)`);
        } catch (error) {
            toast.error('Failed to shut down device(s)');
        }
    };

    const handleRestart = async (deviceId?: string) => {
        const deviceIds = deviceId ? [deviceId] : selectedDevices;
        if (deviceIds.length === 0) return;

        try {
            // In a real app, this would call an API
            setDevices(prev => prev.map(device =>
                deviceIds.includes(device.id)
                    ? { ...device, status: 'online' }
                    : device
            ));
            setSelectedDevices([]);
            toast.success(`Successfully restarted ${deviceIds.length} device(s)`);
        } catch (error) {
            toast.error('Failed to restart device(s)');
        }
    };

    const handleProgramUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProgram.name || !newProgram.version || !newProgram.file) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            // In a real app, this would upload the file and call an API
            setDevices(prev => prev.map(device => ({
                ...device,
                version: newProgram.version
            })));
            setShowUploadModal(false);
            setNewProgram({ name: '', version: '', file: null });
            toast.success('Program uploaded and deployed successfully');
        } catch (error) {
            toast.error('Failed to upload program');
        }
    };

    const filteredDevices = devices.filter(device => {
        const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? device.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage devices, upload programs, and monitor tasks</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {hasPermission('devices.edit') && (
                        <>
                            <Button
                                onClick={() => setShowUploadModal(true)}
                                disabled={selectedDevices.length === 0}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Program
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowStatsModal(true)}
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Statistics
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                                <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Devices</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
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
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Online</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.online}</p>
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
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Uptime</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.avgUptime}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks Completed</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalTasks}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search devices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="error">Error</option>
                    </select>

                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {filteredDevices.length} devices found
                        </span>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedDevices.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 dark:bg-blue-900 dark:border-blue-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <p className="text-blue-800 dark:text-blue-200">
                            {selectedDevices.length} device(s) selected
                        </p>
                        <div className="flex space-x-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleRestart()}
                            >
                                <RotateCw className="h-4 w-4 mr-1" />
                                Restart
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleShutdown()}
                            >
                                <Power className="h-4 w-4 mr-1" />
                                Shutdown
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Active Devices</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={selectedDevices.length === devices.length && devices.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Task</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Version</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                                {filteredDevices.map((device) => (
                                    <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedDevices.includes(device.id)}
                                                onChange={() => handleSelectDevice(device.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                                    {getDeviceIcon(device.type)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{device.location}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(device.status)}
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Last seen: {new Date(device.lastSeen).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {device.currentTask ? (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {device.currentTask.name}
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1 dark:bg-gray-700">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 dark:bg-blue-500"
                                                            style={{ width: `${device.currentTask.progress}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {device.currentTask.progress}% complete
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">No active task</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {device.usage.tasksCompleted} tasks
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1 dark:bg-gray-700">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full transition-all duration-300 dark:bg-green-500"
                                                    style={{ width: `${(device.usage.quotaUsed / device.usage.quotaLimit) * 100}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {device.usage.quotaUsed}/{device.usage.quotaLimit} quota
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {device.version}
                                            {!device.configuration.autoUpdate && (
                                                <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                    Manual
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {device.status !== 'offline' && (
                                                    <button
                                                        onClick={() => handleRestart(device.id)}
                                                        className="p-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                        title="Restart device"
                                                    >
                                                        <RotateCw className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {device.status !== 'offline' && (
                                                    <button
                                                        onClick={() => handleShutdown(device.id)}
                                                        className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        title="Shutdown device"
                                                    >
                                                        <Power className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Upload Program Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title="Upload Program"
                size="md"
            >
                <form onSubmit={handleProgramUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Program Name
                        </label>
                        <input
                            type="text"
                            value={newProgram.name}
                            onChange={(e) => setNewProgram(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter program name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Version
                        </label>
                        <input
                            type="text"
                            value={newProgram.version}
                            onChange={(e) => setNewProgram(prev => ({ ...prev, version: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="e.g., v2.4.0"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Program File
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {newProgram.file ? newProgram.file.name : 'ZIP, EXE, or DMG (MAX. 100MB)'}
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setNewProgram(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                                    accept=".zip,.exe,.dmg"
                                    required
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowUploadModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            Upload & Deploy
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Statistics Modal */}
            <Modal
                isOpen={showStatsModal}
                onClose={() => setShowStatsModal(false)}
                title="Device Statistics"
                size="lg"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Device Status Distribution</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Online</span>
                                    <span className="text-gray-900 dark:text-white">{stats.online} ({(stats.online / stats.total * 100).toFixed(1)}%)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Offline</span>
                                    <span className="text-gray-900 dark:text-white">{stats.offline} ({(stats.offline / stats.total * 100).toFixed(1)}%)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Maintenance</span>
                                    <span className="text-gray-900 dark:text-white">{stats.maintenance} ({(stats.maintenance / stats.total * 100).toFixed(1)}%)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Error</span>
                                    <span className="text-gray-900 dark:text-white">{stats.error} ({(stats.error / stats.total * 100).toFixed(1)}%)</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Performance Metrics</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Average Uptime</span>
                                    <span className="text-gray-900 dark:text-white">{stats.avgUptime}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Total Tasks Completed</span>
                                    <span className="text-gray-900 dark:text-white">{stats.totalTasks.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Devices with Auto-Update</span>
                                    <span className="text-gray-900 dark:text-white">
                                        {devices.filter(d => d.configuration.autoUpdate).length} ({(devices.filter(d => d.configuration.autoUpdate).length / devices.length * 100).toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Device Types</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {devices.filter(d => d.type === 'desktop').length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Desktop</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {devices.filter(d => d.type === 'mobile').length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Mobile</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {devices.filter(d => d.type === 'tablet').length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Tablet</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {devices.filter(d => d.type === 'server').length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Server</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowStatsModal(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Add toast function (in a real app, this would be imported)
const toast = {
    success: (message: string) => console.log(`Success: ${message}`),
    error: (message: string) => console.log(`Error: ${message}`)
};

export default Devices;