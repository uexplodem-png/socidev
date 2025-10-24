import React, { useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  CreditCard,
  ListTodo,
  DollarSign,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchDashboardStats, fetchChartData, setTimeRange } from '../store/slices/dashboardSlice';
import { addNotification } from '../store/slices/notificationSlice';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, chartData, timeRange, loading } = useAppSelector(state => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats(timeRange));
    dispatch(fetchChartData(timeRange));
  }, [dispatch, timeRange]);

  const handleTimeRangeChange = (newRange: '7d' | '30d' | '90d' | 'custom') => {
    dispatch(setTimeRange(newRange));
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    dispatch(addNotification({
      type: 'success',
      title: 'Export Started',
      message: `Dashboard data export in ${format.toUpperCase()} format has been initiated.`,
    }));
  };

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: stats?.revenue.total ? `$${stats.revenue.total.toLocaleString()}` : '$0',
      change: stats?.revenue.change || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Active Users',
      value: stats?.users.active?.toLocaleString() || '0',
      change: stats?.users.change || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Total Orders',
      value: stats?.orders.total?.toLocaleString() || '0',
      change: stats?.orders.change || 0,
      icon: ShoppingCart,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
    },
    {
      title: 'Approved Tasks',
      value: stats?.tasks.approved?.toLocaleString() || '0',
      change: stats?.tasks.change || 0,
      icon: ListTodo,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ];

  const pieData = [
    { name: 'Instagram', value: 35, color: '#E1306C' },
    { name: 'YouTube', value: 30, color: '#FF0000' },
    { name: 'TikTok', value: 20, color: '#000000' },
    { name: 'Twitter', value: 15, color: '#1DA1F2' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
                <div className="flex items-center mt-2">
                  {card.change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      card.change >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {Math.abs(card.change)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className={cn('p-3 rounded-full', card.bgColor)}>
                <card.icon className={cn('h-6 w-6', card.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Activity
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#10B981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders vs Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Orders vs Tasks
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#F59E0B" />
              <Bar dataKey="tasks" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Platform Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="justify-start">
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button variant="outline" className="justify-start">
            <ShoppingCart className="h-4 w-4 mr-2" />
            View Orders
          </Button>
          <Button variant="outline" className="justify-start">
            <CreditCard className="h-4 w-4 mr-2" />
            Process Withdrawals
          </Button>
          <Button variant="outline" className="justify-start">
            <ListTodo className="h-4 w-4 mr-2" />
            Review Tasks
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[
            { action: 'New user registered', user: 'john.doe@example.com', time: '2 minutes ago' },
            { action: 'Order completed', user: 'jane.smith@example.com', time: '5 minutes ago' },
            { action: 'Withdrawal processed', user: 'mike.johnson@example.com', time: '10 minutes ago' },
            { action: 'Task approved', user: 'sarah.wilson@example.com', time: '15 minutes ago' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.action}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.user}
                </p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;