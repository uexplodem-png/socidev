import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, ordersAPI, usersAPI } from '../services/api';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';

const TaskDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview'|'order'|'creator'|'executions'|'activity'>('overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await tasksAPI.getTaskById(id as string);
        const t = resp.task || resp;
        setTask(t);

        if (t?.orderId) {
          try {
            const ord: any = await ordersAPI.getOrderById(t.orderId);
            setOrder(ord?.order || ord || null);
          } catch (_) { setOrder(null); }
        }

        if (t?.user?.id || t?.userId) {
          try {
            const u: any = await usersAPI.getUserById(t.user?.id || t.userId);
            setUser((u && (u.user || u)) || null);
          } catch (_) { setUser(null); }
        }
      } catch (e) {
        console.error('Failed to load task:', e);
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!task) return <div className="text-gray-700 dark:text-gray-300">Task not found</div>;

  const statusBadge = (s: string) => {
    const map: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', map[s] || 'bg-gray-100 text-gray-800')}>{s}</span>;
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task #{String(task.id).slice(0,8)}</h1>
          <p className="text-gray-600 dark:text-gray-400">{task.title || `${task.type} on ${task.platform}`}</p>
          <div className="mt-3 flex items-center space-x-2">
            {statusBadge(task.adminStatus || task.admin_status || task.status)}
            <div className="text-sm text-gray-500">Created: {new Date(task.createdAt || task.created_at).toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => navigate('/tasks')}>Back</Button>
          <Button onClick={() => window.open(task.targetUrl || task.target_url, '_blank')}>Open Target</Button>
        </div>
      </div>

      {/* Header cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="text-sm text-gray-500">Quantity</div>
          <div className="text-lg font-semibold">{task.quantity} <span className="text-sm text-gray-500">({task.remainingQuantity ?? task.remaining_quantity} remaining)</span></div>
        </div>
        <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="text-sm text-gray-500">Rate</div>
          <div className="text-lg font-semibold">${typeof task.rate === 'string' ? parseFloat(task.rate).toFixed(3) : (task.rate ?? 0).toFixed?.(3) || Number(task.rate || 0).toFixed(3)}</div>
        </div>
        <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="text-sm text-gray-500">Priority</div>
          <div className="text-lg font-semibold capitalize">{task.priority}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 p-4">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'order', name: 'Order' },
              { id: 'creator', name: 'Creator' },
              { id: 'executions', name: 'Executions' },
              { id: 'activity', name: 'Activity' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn('whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm', activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{task.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border bg-white dark:bg-gray-800 dark:border-gray-700">
                  <div className="text-sm text-gray-500">Type / Platform</div>
                  <div className="text-lg font-semibold capitalize">{task.type} / {task.platform}</div>
                </div>
                <div className="p-4 rounded border bg-white dark:bg-gray-800 dark:border-gray-700">
                  <div className="text-sm text-gray-500">Target URL</div>
                  <div className="text-sm break-all text-blue-600"><a href={task.targetUrl || task.target_url} target="_blank" rel="noreferrer">{task.targetUrl || task.target_url}</a></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'order' && (
            <div>
              {order ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Order</div>
                      <div className="text-lg font-semibold">#{String(order.id).slice(0,8)} - {order.service}</div>
                    </div>
                    <div className="text-sm text-gray-600">Amount: ${Number(order.amount || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Platform</div>
                        <div className="font-medium capitalize">{order.platform}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Quantity</div>
                        <div className="font-medium">{order.quantity}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No related order</div>
              )}
            </div>
          )}

          {activeTab === 'creator' && (
            <div>
              {user ? (
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">{(user.firstName?.[0]||'U')+(user.lastName?.[0]||'')}</div>
                  <div>
                    <div className="text-lg font-semibold">{user.firstName} {user.lastName} {user.username ? `(@${user.username})` : ''}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="mt-3">
                      <Button variant="outline" onClick={() => navigate(`/users?id=${user.id}`)}>Open User</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No creator information available</div>
              )}
            </div>
          )}

          {activeTab === 'executions' && (
            <div className="text-sm text-gray-600">Executions and submissions will show here (not implemented).</div>
          )}

          {activeTab === 'activity' && (
            <div className="text-sm text-gray-600">Activity logs related to this task will show here (not implemented).</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
