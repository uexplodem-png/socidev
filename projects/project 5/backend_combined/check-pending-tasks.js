import { sequelize } from './src/config/database.js';
import Task from './src/models/Task.js';

async function check() {
  try {
    const pendingTasks = await Task.findAll({
      where: { screenshotStatus: 'pending' },
      attributes: ['id', 'title', 'orderId', 'userId'],
      limit: 10,
    });

    console.log(`Found ${pendingTasks.length} pending tasks:`);
    pendingTasks.forEach(task => {
      console.log(`- Task ${task.id.substring(0, 8)}... (Order: ${task.orderId ? task.orderId.substring(0, 8) + '...' : 'N/A'})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

check();
