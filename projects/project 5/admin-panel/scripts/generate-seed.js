import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

// Set seed for consistent data generation
faker.seed(12345);

// Generate Users
const generateUsers = (count = 200) => {
  const users = [];
  const roles = ['user', 'admin'];
  const userModes = ['taskDoer', 'taskGiver'];
  const statuses = ['active', 'suspended', 'banned'];
  
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.username({ firstName, lastName });
    
    users.push({
      id: faker.string.uuid(),
      email: faker.internet.email({ firstName, lastName }),
      firstName,
      lastName,
      username,
      phone: faker.phone.number(),
      balance: parseFloat(faker.finance.amount({ min: 0, max: 10000, dec: 2 })),
      role: faker.helpers.weightedArrayElement([
        { weight: 95, value: 'user' },
        { weight: 5, value: 'admin' }
      ]),
      userMode: faker.helpers.arrayElement(userModes),
      status: faker.helpers.weightedArrayElement([
        { weight: 85, value: 'active' },
        { weight: 10, value: 'suspended' },
        { weight: 5, value: 'banned' }
      ]),
      lastLogin: faker.date.recent({ days: 30 }),
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 30 }),
      avatar: faker.image.avatar(),
      totalOrders: faker.number.int({ min: 0, max: 50 }),
      totalSpent: parseFloat(faker.finance.amount({ min: 0, max: 5000, dec: 2 })),
      completedTasks: faker.number.int({ min: 0, max: 200 })
    });
  }
  
  return users;
};

// Generate Orders
const generateOrders = (users, count = 500) => {
  const orders = [];
  const platforms = ['instagram', 'youtube'];
  const services = {
    instagram: ['likes', 'followers', 'views', 'comments'],
    youtube: ['likes', 'subscribers', 'views', 'comments']
  };
  const statuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
  const speeds = ['normal', 'fast', 'express'];
  
  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users.filter(u => u.userMode === 'taskGiver'));
    const platform = faker.helpers.arrayElement(platforms);
    const service = faker.helpers.arrayElement(services[platform]);
    const quantity = faker.number.int({ min: 10, max: 10000 });
    const startCount = faker.number.int({ min: 0, max: 1000 });
    const status = faker.helpers.weightedArrayElement([
      { weight: 10, value: 'pending' },
      { weight: 15, value: 'processing' },
      { weight: 65, value: 'completed' },
      { weight: 7, value: 'failed' },
      { weight: 3, value: 'cancelled' }
    ]);
    const completed = status === 'completed' ? quantity : 
                     status === 'processing' ? faker.number.int({ min: 0, max: quantity }) : 0;
    
    orders.push({
      id: faker.string.uuid(),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      platform,
      service,
      targetUrl: platform === 'instagram' 
        ? `https://instagram.com/p/${faker.string.alphanumeric(11)}`
        : `https://youtube.com/watch?v=${faker.string.alphanumeric(11)}`,
      quantity,
      startCount,
      remainingCount: quantity - completed,
      completed,
      status,
      speed: faker.helpers.arrayElement(speeds),
      amount: parseFloat(faker.finance.amount({ min: 5, max: 500, dec: 2 })),
      progress: status === 'completed' ? 100 : 
               status === 'processing' ? faker.number.int({ min: 10, max: 90 }) : 0,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 7 }),
      completedAt: status === 'completed' ? faker.date.recent({ days: 30 }) : null
    });
  }
  
  return orders;
};

// Generate Tasks
const generateTasks = (users, count = 1200) => {
  const tasks = [];
  const platforms = ['instagram', 'youtube'];
  const types = ['like', 'follow', 'view', 'subscribe'];
  const statuses = ['pending', 'approved', 'rejected', 'processing', 'completed'];
  
  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users);
    const platform = faker.helpers.arrayElement(platforms);
    const type = faker.helpers.arrayElement(types);
    const quantity = faker.number.int({ min: 50, max: 5000 });
    const status = faker.helpers.weightedArrayElement([
      { weight: 20, value: 'pending' },
      { weight: 60, value: 'approved' },
      { weight: 5, value: 'rejected' },
      { weight: 10, value: 'processing' },
      { weight: 5, value: 'completed' }
    ]);
    
    tasks.push({
      id: faker.string.uuid(),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      type,
      platform,
      targetUrl: platform === 'instagram' 
        ? `https://instagram.com/${faker.internet.username()}`
        : `https://youtube.com/channel/${faker.string.alphanumeric(24)}`,
      quantity,
      remainingQuantity: status === 'completed' ? 0 : 
                        status === 'processing' ? faker.number.int({ min: 0, max: quantity }) : quantity,
      rate: parseFloat(faker.finance.amount({ min: 0.01, max: 0.50, dec: 3 })),
      status,
      priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
      description: faker.lorem.sentence(),
      requirements: faker.lorem.sentences(2),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 7 }),
      lastUpdatedAt: faker.date.recent({ days: 7 }),
      approvedAt: status === 'approved' ? faker.date.recent({ days: 30 }) : null,
      completedAt: status === 'completed' ? faker.date.recent({ days: 30 }) : null
    });
  }
  
  return tasks;
};

// Generate Transactions
const generateTransactions = (users, orders, count = 800) => {
  const transactions = [];
  const types = ['deposit', 'withdrawal', 'order_payment', 'task_payment', 'refund'];
  const statuses = ['pending', 'completed', 'failed'];
  const paymentMethods = ['credit_card', 'paypal', 'bank_transfer', 'crypto'];
  
  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users);
    const type = faker.helpers.arrayElement(types);
    const amount = parseFloat(faker.finance.amount({ min: 1, max: 1000, dec: 2 }));
    const status = faker.helpers.weightedArrayElement([
      { weight: 5, value: 'pending' },
      { weight: 90, value: 'completed' },
      { weight: 5, value: 'failed' }
    ]);
    
    transactions.push({
      id: faker.string.uuid(),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      type,
      amount: type === 'withdrawal' || type === 'order_payment' ? -amount : amount,
      status,
      paymentMethod: faker.helpers.arrayElement(paymentMethods),
      reference: faker.string.alphanumeric(12).toUpperCase(),
      description: `${type.replace('_', ' ')} - ${faker.lorem.words(3)}`,
      balanceBefore: parseFloat(faker.finance.amount({ min: 0, max: 5000, dec: 2 })),
      balanceAfter: parseFloat(faker.finance.amount({ min: 0, max: 5000, dec: 2 })),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 7 }),
      completedAt: status === 'completed' ? faker.date.recent({ days: 30 }) : null
    });
  }
  
  return transactions;
};

// Generate Devices
const generateDevices = (users, count = 150) => {
  const devices = [];
  const deviceTypes = ['mobile', 'desktop', 'tablet'];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  const platforms = ['Windows', 'macOS', 'Android', 'iOS', 'Linux'];
  const statuses = ['active', 'inactive', 'banned'];
  
  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users.filter(u => u.userMode === 'taskDoer'));
    
    devices.push({
      id: faker.string.uuid(),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      deviceName: faker.commerce.productName(),
      deviceType: faker.helpers.arrayElement(deviceTypes),
      browser: faker.helpers.arrayElement(browsers),
      platform: faker.helpers.arrayElement(platforms),
      ipAddress: faker.internet.ip(),
      location: `${faker.location.city()}, ${faker.location.country()}`,
      status: faker.helpers.weightedArrayElement([
        { weight: 80, value: 'active' },
        { weight: 15, value: 'inactive' },
        { weight: 5, value: 'banned' }
      ]),
      lastActive: faker.date.recent({ days: 7 }),
      tasksCompleted: faker.number.int({ min: 0, max: 500 }),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 7 })
    });
  }
  
  return devices;
};

// Generate Audit Logs
const generateAuditLogs = (users, count = 300) => {
  const auditLogs = [];
  const actions = [
    'USER_CREATED', 'USER_UPDATED', 'USER_SUSPENDED', 'USER_BANNED', 'USER_RESTORED',
    'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_CANCELLED', 'ORDER_REFUNDED',
    'TASK_CREATED', 'TASK_APPROVED', 'TASK_REJECTED', 'TASK_COMPLETED',
    'TRANSACTION_CREATED', 'WITHDRAWAL_PROCESSED', 'BALANCE_ADDED',
    'DEVICE_REGISTERED', 'DEVICE_BANNED', 'SETTINGS_UPDATED'
  ];
  
  const adminUsers = users.filter(u => u.role === 'admin');
  
  for (let i = 0; i < count; i++) {
    const actor = faker.helpers.arrayElement(adminUsers);
    const action = faker.helpers.arrayElement(actions);
    const targetUser = faker.helpers.arrayElement(users);
    
    auditLogs.push({
      id: faker.string.uuid(),
      actorId: actor.id,
      actorName: `${actor.firstName} ${actor.lastName}`,
      actorEmail: actor.email,
      action,
      resource: action.split('_')[0].toLowerCase(),
      resourceId: faker.string.uuid(),
      targetUserId: targetUser.id,
      targetUserName: `${targetUser.firstName} ${targetUser.lastName}`,
      description: `${action.replace('_', ' ')} performed on ${action.split('_')[0].toLowerCase()}`,
      metadata: {
        ip: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        changes: action.includes('UPDATED') ? {
          before: { status: 'active' },
          after: { status: 'suspended' }
        } : null
      },
      createdAt: faker.date.past({ years: 1 })
    });
  }
  
  return auditLogs;
};

// Generate all data
console.log('Generating seed data...');

const users = generateUsers(200);
const orders = generateOrders(users, 500);
const tasks = generateTasks(users, 1200);
const transactions = generateTransactions(users, orders, 800);
const devices = generateDevices(users, 150);
const auditLogs = generateAuditLogs(users, 300);

// Add demo users
const demoUsers = [
  {
    id: 'admin-demo-id',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    phone: '+1234567890',
    balance: 5000.00,
    role: 'admin',
    userMode: 'taskGiver',
    status: 'active',
    lastLogin: new Date(),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    avatar: faker.image.avatar(),
    totalOrders: 25,
    totalSpent: 2500.00,
    completedTasks: 0
  },
  {
    id: 'viewer-demo-id',
    email: 'viewer@example.com',
    firstName: 'Viewer',
    lastName: 'User',
    username: 'viewer',
    phone: '+1234567891',
    balance: 250.00,
    role: 'user',
    userMode: 'taskDoer',
    status: 'active',
    lastLogin: new Date(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    avatar: faker.image.avatar(),
    totalOrders: 5,
    totalSpent: 150.00,
    completedTasks: 45
  }
];

users.unshift(...demoUsers);

const seedData = {
  users,
  orders,
  tasks,
  transactions,
  devices,
  auditLogs,
  stats: {
    totalUsers: users.length,
    totalOrders: orders.length,
    totalTasks: tasks.length,
    totalTransactions: transactions.length,
    totalDevices: devices.length,
    totalRevenue: transactions
      .filter(t => t.type === 'order_payment' && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    processingOrders: orders.filter(o => o.status === 'processing').length
  },
  generatedAt: new Date().toISOString()
};

// Write to file
const outputPath = path.join(process.cwd(), 'src', 'data', 'seed-data.json');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2));

console.log(`✅ Seed data generated successfully!`);
console.log(`📊 Generated ${users.length} users, ${orders.length} orders, ${tasks.length} tasks`);
console.log(`📁 Saved to: ${outputPath}`);