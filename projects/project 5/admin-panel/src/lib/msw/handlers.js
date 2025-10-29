import { http, HttpResponse } from 'msw';
import seedData from '../../data/seed-data.json';

// In-memory data store (will be reset on page reload)
let data = {
  users: [...seedData.users],
  orders: [...seedData.orders],
  tasks: [...seedData.tasks],
  transactions: [...seedData.transactions],
  devices: [...seedData.devices],
  auditLogs: [...seedData.auditLogs]
};

// Helper functions
const findUser = (email) => data.users.find(u => u.email === email);
const findUserById = (id) => data.users.find(u => u.id === id);
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const addAuditLog = (actorId, action, resource, resourceId, targetUserId = null, description = '', metadata = {}) => {
  const actor = findUserById(actorId);
  const targetUser = targetUserId ? findUserById(targetUserId) : null;
  
  const auditLog = {
    id: generateId(),
    actorId,
    actorName: `${actor.firstName} ${actor.lastName}`,
    actorEmail: actor.email,
    action,
    resource,
    resourceId,
    targetUserId,
    targetUserName: targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : null,
    description: description || `${action.replace('_', ' ')} performed on ${resource}`,
    metadata: {
      ip: '127.0.0.1',
      userAgent: 'Admin Panel',
      ...metadata
    },
    createdAt: new Date().toISOString()
  };
  
  data.auditLogs.unshift(auditLog);
  return auditLog;
};

// Add a passthrough handler for auth endpoints to allow real backend requests
export const authHandlers = [
  http.post('http://localhost:3000/api/auth/login', () => {
    // Passthrough to real backend
    return HttpResponse.passthrough();
  }),
  http.post('http://localhost:3000/api/auth/admin-login', () => {
    // Passthrough to real backend for admin login
    return HttpResponse.passthrough();
  }),
  http.post('http://localhost:3000/api/auth/*', () => {
    // Passthrough to real backend
    return HttpResponse.passthrough();
  }),
  http.get('http://localhost:3000/api/auth/validate', () => {
    // Passthrough to real backend
    return HttpResponse.passthrough();
  }),
  http.get('http://localhost:3000/api/auth/*', () => {
    // Passthrough to real backend
    return HttpResponse.passthrough();
  })
];

// Admin handlers
export const adminHandlers = [
  // Dashboard stats
  http.get('/api/admin/dashboard/stats', () => {
    const stats = {
      totalUsers: data.users.length,
      activeUsers: data.users.filter(u => u.status === 'active').length,
      totalOrders: data.orders.length,
      processingOrders: data.orders.filter(o => o.status === 'processing').length,
      completedOrders: data.orders.filter(o => o.status === 'completed').length,
      totalTasks: data.tasks.length,
      pendingTasks: data.tasks.filter(t => t.status === 'pending').length,
      approvedTasks: data.tasks.filter(t => t.status === 'approved').length,
      totalRevenue: data.transactions
        .filter(t => t.type === 'order_payment' && t.status === 'completed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalBalance: data.users.reduce((sum, u) => sum + u.balance, 0),
      recentTransactions: data.transactions
        .filter(t => t.status === 'completed')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
    };
    
    return HttpResponse.json(stats);
  }),

  // Dashboard charts
  http.get('/api/admin/dashboard/charts', ({ request }) => {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d';
    
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = data.orders.filter(o => 
        o.createdAt && o.createdAt.startsWith(dateStr)
      );
      const dayTasks = data.tasks.filter(t => 
        t.createdAt && t.createdAt.startsWith(dateStr)
      );
      const dayRevenue = data.transactions
        .filter(t => t.createdAt && t.createdAt.startsWith(dateStr) && 
                     t.type === 'order_payment' && t.status === 'completed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      chartData.push({
        date: dateStr,
        dateFormatted: date.toLocaleDateString(),
        orders: dayOrders.length,
        tasks: dayTasks.length,
        revenue: Math.round(dayRevenue * 100) / 100,
        users: Math.floor(Math.random() * 20) + 5 // Simulate new users
      });
    }
    
    return HttpResponse.json(chartData);
  }),

  // Users management
  http.get('/api/admin/users', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    let filteredUsers = [...data.users];
    
    // Apply filters
    if (search) {
      filteredUsers = filteredUsers.filter(user =>
        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    // Apply sorting
    filteredUsers.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    });
  }),

  http.get('/api/admin/users/:id', ({ params }) => {
    const user = findUserById(params.id);
    if (!user) {
      return new HttpResponse('User not found', { status: 404 });
    }
    
    // Get user's orders and tasks
    const userOrders = data.orders.filter(o => o.userId === params.id);
    const userTasks = data.tasks.filter(t => t.userId === params.id);
    const userTransactions = data.transactions.filter(t => t.userId === params.id);
    
    return HttpResponse.json({
      user: { ...user, password: undefined },
      orders: userOrders,
      tasks: userTasks,
      transactions: userTransactions
    });
  }),

  http.put('/api/admin/users/:id', async ({ params, request }) => {
    const updates = await request.json();
    const userIndex = data.users.findIndex(u => u.id === params.id);
    
    if (userIndex === -1) {
      return new HttpResponse('User not found', { status: 404 });
    }
    
    const oldUser = { ...data.users[userIndex] };
    data.users[userIndex] = {
      ...data.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Add audit log
    addAuditLog(
      'admin-demo-id',
      'USER_UPDATED',
      'user',
      params.id,
      params.id,
      'User profile updated',
      { changes: { before: oldUser, after: data.users[userIndex] } }
    );
    
    return HttpResponse.json({
      user: { ...data.users[userIndex], password: undefined }
    });
  }),

  http.post('/api/admin/users/bulk-action', async ({ request }) => {
    const { action, userIds } = await request.json();
    
    const updatedUsers = [];
    
    for (const userId of userIds) {
      const userIndex = data.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        let updates = { updatedAt: new Date().toISOString() };
        
        switch (action) {
          case 'ban':
            updates.status = 'banned';
            break;
          case 'unban':
            updates.status = 'active';
            break;
          case 'suspend':
            updates.status = 'suspended';
            break;
          case 'activate':
            updates.status = 'active';
            break;
        }
        
        data.users[userIndex] = { ...data.users[userIndex], ...updates };
        updatedUsers.push(data.users[userIndex]);
        
        // Add audit log
        addAuditLog(
          'admin-demo-id',
          `USER_${action.toUpperCase()}`,
          'user',
          userId,
          userId,
          `User ${action} via bulk action`
        );
      }
    }
    
    return HttpResponse.json({ updatedUsers });
  }),

  // Orders management
  http.get('/api/admin/orders', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const status = url.searchParams.get('status') || '';
    const platform = url.searchParams.get('platform') || '';
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    let filteredOrders = [...data.orders];
    
    // Apply filters
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    if (platform) {
      filteredOrders = filteredOrders.filter(order => order.platform === platform);
    }
    
    if (search) {
      filteredOrders = filteredOrders.filter(order =>
        order.targetUrl.toLowerCase().includes(search.toLowerCase()) ||
        order.userName.toLowerCase().includes(search.toLowerCase()) ||
        order.userEmail.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply sorting
    filteredOrders.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / limit)
      }
    });
  }),

  http.get('/api/admin/orders/:id', ({ params }) => {
    const order = data.orders.find(o => o.id === params.id);
    if (!order) {
      return new HttpResponse('Order not found', { status: 404 });
    }
    
    // Get related tasks
    const relatedTasks = data.tasks.filter(t => 
      t.platform === order.platform && 
      t.type === order.service &&
      t.targetUrl === order.targetUrl
    );
    
    return HttpResponse.json({
      order,
      relatedTasks
    });
  }),

  http.post('/api/admin/orders/:id/refund', async ({ params }) => {
    const orderIndex = data.orders.findIndex(o => o.id === params.id);
    if (orderIndex === -1) {
      return new HttpResponse('Order not found', { status: 404 });
    }
    
    const order = data.orders[orderIndex];
    data.orders[orderIndex] = {
      ...order,
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    };
    
    // Create refund transaction
    const refundTransaction = {
      id: generateId(),
      userId: order.userId,
      userName: order.userName,
      userEmail: order.userEmail,
      type: 'refund',
      amount: order.amount,
      status: 'completed',
      paymentMethod: 'system',
      reference: `REFUND-${order.id.substring(0, 8).toUpperCase()}`,
      description: `Refund for order ${order.id}`,
      balanceBefore: 0,
      balanceAfter: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
    
    data.transactions.unshift(refundTransaction);
    
    // Add audit log
    addAuditLog(
      'admin-demo-id',
      'ORDER_REFUNDED',
      'order',
      params.id,
      order.userId,
      `Order refunded - Amount: $${order.amount}`
    );
    
    return HttpResponse.json({
      order: data.orders[orderIndex],
      transaction: refundTransaction
    });
  }),

  // Tasks management
  http.get('/api/admin/tasks', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const status = url.searchParams.get('status') || '';
    const platform = url.searchParams.get('platform') || '';
    const type = url.searchParams.get('type') || '';
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    let filteredTasks = [...data.tasks];
    
    // Apply filters
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    if (platform) {
      filteredTasks = filteredTasks.filter(task => task.platform === platform);
    }
    
    if (type) {
      filteredTasks = filteredTasks.filter(task => task.type === type);
    }
    
    if (search) {
      filteredTasks = filteredTasks.filter(task =>
        task.targetUrl.toLowerCase().includes(search.toLowerCase()) ||
        task.userName.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply sorting
    filteredTasks.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      tasks: paginatedTasks,
      pagination: {
        page,
        limit,
        total: filteredTasks.length,
        totalPages: Math.ceil(filteredTasks.length / limit)
      }
    });
  }),

  http.get('/api/admin/tasks/pending', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    const pendingTasks = data.tasks.filter(task => task.status === 'pending');
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTasks = pendingTasks.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      tasks: paginatedTasks,
      pagination: {
        page,
        limit,
        total: pendingTasks.length,
        totalPages: Math.ceil(pendingTasks.length / limit)
      }
    });
  }),

  http.post('/api/admin/tasks/:id/approve', async ({ params }) => {
    const taskIndex = data.tasks.findIndex(t => t.id === params.id);
    if (taskIndex === -1) {
      return new HttpResponse('Task not found', { status: 404 });
    }
    
    const task = data.tasks[taskIndex];
    data.tasks[taskIndex] = {
      ...task,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add audit log
    addAuditLog(
      'admin-demo-id',
      'TASK_APPROVED',
      'task',
      params.id,
      task.userId,
      `Task approved - ${task.type} on ${task.platform}`
    );
    
    return HttpResponse.json({
      task: data.tasks[taskIndex]
    });
  }),

  http.post('/api/admin/tasks/:id/reject', async ({ params, request }) => {
    const { reason } = await request.json();
    const taskIndex = data.tasks.findIndex(t => t.id === params.id);
    
    if (taskIndex === -1) {
      return new HttpResponse('Task not found', { status: 404 });
    }
    
    const task = data.tasks[taskIndex];
    data.tasks[taskIndex] = {
      ...task,
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    };
    
    // Add audit log
    addAuditLog(
      'admin-demo-id',
      'TASK_REJECTED',
      'task',
      params.id,
      task.userId,
      `Task rejected - Reason: ${reason}`,
      { rejectionReason: reason }
    );
    
    return HttpResponse.json({
      task: data.tasks[taskIndex]
    });
  }),

  http.post('/api/admin/tasks/bulk-approve', async ({ request }) => {
    const { taskIds } = await request.json();
    
    const approvedTasks = [];
    
    for (const taskId of taskIds) {
      const taskIndex = data.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        const task = data.tasks[taskIndex];
        data.tasks[taskIndex] = {
          ...task,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        approvedTasks.push(data.tasks[taskIndex]);
        
        // Add audit log
        addAuditLog(
          'admin-demo-id',
          'TASK_APPROVED',
          'task',
          taskId,
          task.userId,
          `Task approved via bulk action - ${task.type} on ${task.platform}`
        );
      }
    }
    
    return HttpResponse.json({ approvedTasks });
  }),

  // Transactions
  http.get('/api/admin/transactions', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    let filteredTransactions = [...data.transactions];
    
    // Apply filters
    if (type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === type);
    }
    
    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status);
    }
    
    if (search) {
      filteredTransactions = filteredTransactions.filter(t =>
        t.userName.toLowerCase().includes(search.toLowerCase()) ||
        t.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        t.reference.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply sorting
    filteredTransactions.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / limit)
      }
    });
  }),

  // Audit logs
  http.get('/api/admin/audit-logs', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const action = url.searchParams.get('action') || '';
    const resource = url.searchParams.get('resource') || '';
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    let filteredLogs = [...data.auditLogs];
    
    // Apply filters
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    
    if (resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === resource);
    }
    
    if (search) {
      filteredLogs = filteredLogs.filter(log =>
        log.actorName.toLowerCase().includes(search.toLowerCase()) ||
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        log.targetUserName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply sorting
    filteredLogs.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      auditLogs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit)
      }
    });
  }),

  // Settings
  http.get('/api/admin/settings', () => {
    const settings = JSON.parse(localStorage.getItem('admin-settings') || '{}');
    const defaultSettings = {
      siteName: 'Social Developer Platform',
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true,
      taskAutoApproval: false,
      maxTasksPerUser: 100,
      minWithdrawalAmount: 10,
      withdrawalFee: 0.05,
      currencies: ['USD', 'EUR', 'GBP'],
      supportedPlatforms: ['instagram', 'youtube'],
      taskApprovalTimeoutHours: 24,
      orderTimeoutHours: 72,
      // Security settings
      twoFactorAuth: false,
      passwordMinLength: 8,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      // Notification settings
      smsNotifications: false,
      pushNotifications: false,
      adminNotifications: true,
      userActivityNotifications: false,
      // Analytics settings
      enableAnalytics: true,
      analyticsRetentionDays: 90,
      trackUserBehavior: true,
      // Performance settings
      cacheEnabled: true,
      cacheTTL: 300,
      apiRateLimit: 1000,
      // Advanced settings
      debugMode: false,
      logLevel: 'info',
      autoBackup: true,
      backupFrequency: 'daily'
    };
    
    return HttpResponse.json({
      ...defaultSettings,
      ...settings
    });
  }),

  http.put('/api/admin/settings', async ({ request }) => {
    const settings = await request.json();
    localStorage.setItem('admin-settings', JSON.stringify(settings));
    
    // Add audit log
    addAuditLog(
      'admin-demo-id',
      'SETTINGS_UPDATED',
      'settings',
      'system',
      null,
      'System settings updated',
      { changes: settings }
    );
    
    return HttpResponse.json(settings);
  }),

  http.post('/api/admin/settings/reset-data', () => {
    // Reset to seed data
    data = {
      users: [...seedData.users],
      orders: [...seedData.orders],
      tasks: [...seedData.tasks],
      transactions: [...seedData.transactions],
      devices: [...seedData.devices],
      auditLogs: [...seedData.auditLogs]
    };
    
    // Add audit log
    addAuditLog(
      'admin-demo-id',
      'DATA_RESET',
      'system',
      'all',
      null,
      'System data reset to seed data'
    );
    
    return HttpResponse.json({ message: 'Data reset successfully' });
  })
];

export const handlers = [
  ...authHandlers,
  ...adminHandlers
];