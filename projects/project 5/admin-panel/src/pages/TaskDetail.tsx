import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksAPI, ordersAPI, usersAPI } from '../services/api';

const TaskDetail: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await tasksAPI.getTaskById(id as string);
        const t = resp.task || resp;
        setTask(t);

        // fetch related order and user if present
        if (t?.orderId) {
          const ord = await ordersAPI.getOrderById(t.orderId);
          setOrder(ord);
        }
        if (t?.user?.id || t?.userId) {
          const u = await usersAPI.getUserById(t.user?.id || t.userId);
          setUser(u);
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return <div className="text-gray-700 dark:text-gray-300">Task not found</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task #{String(task.id).slice(0,8)}</h1>
          <p className="text-gray-600 dark:text-gray-400">{task.type} on {task.platform}</p>
        </div>
        <Link to="/tasks" className="text-blue-600 hover:underline">Back to Tasks</Link>
      </div>

      {/* Task summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-lg font-semibold capitalize">{task.status} / {task.adminStatus || task.admin_status}</div>
        </div>
        <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="text-sm text-gray-500">Quantity</div>
          <div className="text-lg font-semibold">{task.quantity} <span className="text-sm text-gray-500">({task.remainingQuantity ?? task.remaining_quantity} remaining)</span></div>
        </div>
        <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="text-sm text-gray-500">Rate</div>
          <div className="text-lg font-semibold">${typeof task.rate === 'string' ? parseFloat(task.rate).toFixed(3) : (task.rate ?? 0).toFixed?.(3) || Number(task.rate || 0).toFixed(3)}</div>
        </div>
      </div>

      {/* Links */}
      <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="text-sm text-gray-500 mb-1">Target URL</div>
        <a className="text-blue-600 break-all" href={task.targetUrl || task.target_url} target="_blank" rel="noreferrer">{task.targetUrl || task.target_url}</a>
      </div>

      {/* User and Order panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="text-lg font-semibold mb-3">Creator</div>
          {user ? (
            <div className="space-y-1">
              <div className="font-medium">{user.firstName} {user.lastName} {user.username ? `(@${user.username})` : ''}</div>
              <div className="text-gray-600 dark:text-gray-400">{user.email}</div>
              <Link className="text-blue-600 hover:underline" to={`/users?id=${user.id}`}>View User</Link>
            </div>
          ) : (
            <div className="text-gray-500">No user info</div>
          )}
        </div>
        <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="text-lg font-semibold mb-3">Order</div>
          {order ? (
            <div className="space-y-1">
              <div className="font-medium">Order #{String(order.id).slice(0,8)}</div>
              <div className="text-gray-600 dark:text-gray-400">{order.platform} - {order.service}</div>
              <div className="text-gray-600 dark:text-gray-400">Qty: {order.quantity} | Amount: ${Number(order.amount || 0).toFixed(2)}</div>
              <Link className="text-blue-600 hover:underline" to={`/orders?id=${order.id}`}>View Order</Link>
            </div>
          ) : (
            <div className="text-gray-500">No related order</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
