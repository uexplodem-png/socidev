import { Task, User, Order, sequelize } from './src/models/index.js';

async function checkTasks() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Count all tasks
    const totalTasks = await Task.count();
    console.log(`📊 Total tasks in database: ${totalTasks}`);

    // Count by admin_status
    const pendingTasks = await Task.count({ where: { adminStatus: 'pending' } });
    const approvedTasks = await Task.count({ where: { adminStatus: 'approved' } });
    const rejectedTasks = await Task.count({ where: { adminStatus: 'rejected' } });

    console.log(`\n📋 Tasks by admin status:`);
    console.log(`  - Pending: ${pendingTasks}`);
    console.log(`  - Approved: ${approvedTasks}`);
    console.log(`  - Rejected: ${rejectedTasks}`);

    // Get sample of tasks with order info
    const sampleTasks = await Task.findAll({
      limit: 5,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'status'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`\n📝 Sample tasks (most recent 5):`);
    sampleTasks.forEach((task, index) => {
      const taskData = task.toJSON();
      console.log(`\n${index + 1}. Task ${taskData.id.substring(0, 8)}`);
      console.log(`   - Admin Status: ${taskData.adminStatus}`);
      console.log(`   - Status: ${taskData.status}`);
      console.log(`   - Order ID: ${taskData.orderId || 'None'}`);
      console.log(`   - Order Status: ${taskData.order?.status || 'N/A'}`);
      console.log(`   - Platform: ${taskData.platform}`);
      console.log(`   - Type: ${taskData.type}`);
    });

    // Query like the admin route does
    console.log(`\n\n🔍 Testing admin route query (pending tasks):`);
    const adminTasks = await Task.findAll({
      where: { adminStatus: 'pending' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ],
      limit: 10,
      order: [['createdAt', 'ASC']]
    });

    console.log(`   Found ${adminTasks.length} pending tasks for admin`);
    if (adminTasks.length > 0) {
      adminTasks.forEach((task, index) => {
        const taskData = task.toJSON();
        console.log(`   ${index + 1}. ${taskData.id.substring(0, 8)} - ${taskData.platform} ${taskData.type}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTasks();
