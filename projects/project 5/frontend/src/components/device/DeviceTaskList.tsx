import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  BarChart2,
  Sliders,
} from 'lucide-react';

interface Task {
  id: string;
  deviceId: string;
  name: string;
  type: 'like' | 'follow' | 'comment' | 'view';
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  targetUrl: string;
  completedActions: number;
  totalActions: number;
  errorCount: number;
}

interface DeviceTaskListProps {
  deviceId: string;
}

const mockTasks: Task[] = [
  {
    id: 'TASK-001',
    deviceId: 'DEV-001',
    name: 'Instagram Like Task',
    type: 'like',
    status: 'running',
    progress: 45,
    startTime: '2024-03-10T09:00:00Z',
    targetUrl: 'https://instagram.com/example',
    completedActions: 450,
    totalActions: 1000,
    errorCount: 2,
  },
  {
    id: 'TASK-002',
    deviceId: 'DEV-001',
    name: 'YouTube View Task',
    type: 'view',
    status: 'paused',
    progress: 75,
    startTime: '2024-03-10T08:30:00Z',
    targetUrl: 'https://youtube.com/watch?v=example',
    completedActions: 750,
    totalActions: 1000,
    errorCount: 0,
  },
  {
    id: 'TASK-003',
    deviceId: 'DEV-001',
    name: 'Instagram Follow Task',
    type: 'follow',
    status: 'completed',
    progress: 100,
    startTime: '2024-03-09T15:00:00Z',
    endTime: '2024-03-09T18:00:00Z',
    targetUrl: 'https://instagram.com/user',
    completedActions: 500,
    totalActions: 500,
    errorCount: 1,
  },
];

export const DeviceTaskList = ({ deviceId }: DeviceTaskListProps) => {
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-50';
      case 'paused':
        return 'text-yellow-600 bg-yellow-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = searchQuery
      ? task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesTab = selectedTab === 'active' 
      ? ['running', 'paused'].includes(task.status)
      : ['completed', 'failed'].includes(task.status);

    return matchesSearch && matchesStatus && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Automated Tasks</h2>
          <p className="text-sm text-gray-500">Manage and monitor your device's automated tasks</p>
        </div>
        <Button
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          Create New Task
        </Button>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Active Tasks</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">8</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">98.5%</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Avg. Completion</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">1.2h</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">0.3%</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tabs */}
          <div className="flex rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setSelectedTab('active')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedTab === 'active'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Tasks
            </button>
            <button
              onClick={() => setSelectedTab('history')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedTab === 'history'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Task History
            </button>
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pr-8 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200"
            >
              <option value="all">All Statuses</option>
              <option value="running">Running</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Task Info */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Sliders className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{task.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{task.id}</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-900">{task.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:w-1/3">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-lg font-medium text-gray-900">{task.completedActions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-lg font-medium text-gray-900">{task.totalActions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Errors</p>
                  <p className="text-lg font-medium text-gray-900">{task.errorCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {task.status === 'running' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-yellow-600"
                    title="Pause Task"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                )}
                {task.status === 'paused' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600"
                    title="Resume Task"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                {['running', 'paused'].includes(task.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600"
                    title="Restart Task"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600"
                  title="View Details"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Started: {new Date(task.startTime).toLocaleString()}</span>
                {task.endTime && (
                  <>
                    <span>•</span>
                    <span>Ended: {new Date(task.endTime).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};