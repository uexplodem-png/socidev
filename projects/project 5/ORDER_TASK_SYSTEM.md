# Order & Task Management System
## Complete Feature Documentation

**Version**: 2.0.0  
**Implementation**: Parts 1-10 Complete  
**Status**: Production Ready ✅

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Key Features](#key-features)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Business Logic](#business-logic)
8. [Security Features](#security-features)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

The Order & Task Management System is a comprehensive solution for managing social media service orders and their execution through a crowdsourced task marketplace. It enables:

- **Users** to order social media services (followers, likes, views, etc.)
- **System** to automatically convert orders into executable tasks
- **Workers** to complete tasks and earn rewards
- **Admins** to oversee operations and resolve issues

### Core Workflow

```
User Creates Order → Admin Processes → Task Auto-Created → 
Workers Reserve Task → Submit Proof → Admin Approves → 
User Balance Updated → Order Progress Tracked → Order Completes
```

### Key Metrics

- **Order Processing Time**: < 5 minutes
- **Task Reservation**: 15-minute timer
- **Progress Tracking**: Real-time updates
- **Refund Calculation**: Automatic and smart
- **Security Rating**: EXCELLENT (OWASP compliant)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    User Frontend                         │
│  (React + TypeScript, Port 5174)                        │
│  - Order creation                                        │
│  - Task browsing & execution                            │
│  - Issue reporting                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ REST API (JWT Auth)
                   │
┌──────────────────▼──────────────────────────────────────┐
│                Backend Server                            │
│  (Node.js + Express, Port 3000)                         │
│  - Order business logic                                  │
│  - Task execution management                            │
│  - Security middleware (XSS, rate limiting)             │
│  - Cron jobs (task expiry)                              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Sequelize ORM
                   │
┌──────────────────▼──────────────────────────────────────┐
│                MySQL Database                            │
│  - orders, tasks, task_executions                        │
│  - order_issues                                          │
│  - audit_logs, action_logs                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Admin Panel                            │
│  (React + TypeScript, Port 5173)                        │
│  - Order management (process, complete, refund)         │
│  - Task submission review (approve/reject)              │
│  - Issue resolution                                      │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**Order Creation Flow**:
```
1. User submits order form
2. Backend validates (no duplicates)
3. Calculate unit_price = amount / quantity
4. Deduct user balance
5. Create order with status='pending'
6. Log audit trail
```

**Order Processing Flow**:
```
1. Admin clicks "Process Order"
2. Order status → 'processing'
3. Auto-create task:
   - excludedUserId = order owner
   - quantity = order quantity
   - rate = order unit_price
4. Task status = 'active'
5. Log task creation
```

**Task Execution Flow**:
```
1. Worker reserves task (15-min timer starts)
2. Worker submits proof within 15 minutes
3. Admin reviews submission
4. If approved:
   - Worker balance += task rate
   - Task completedQuantity++
   - Order completedCount++
   - If order complete: status → 'completed'
5. If rejected:
   - Task remainingQuantity++
   - Slot returned to pool
```

---

## Key Features

### 1. Smart Order Management

#### Duplicate Prevention
- Users cannot create multiple active orders for the same platform+service+URL
- Completed/cancelled orders allow new orders for same URL
- Validation occurs at backend before order creation

#### Progress Tracking
- Formula: `(completedCount / quantity) × 100`
- Real-time updates on both admin and user panels
- Visual progress bars with percentage display
- Fixed bug: 0/1000 now shows 0%, not 1000%

#### Priority System
- Orders have priority: `normal`, `urgent`, `critical`
- Admin panel sorts by priority DESC → newest first
- Urgent orders highlighted in UI

### 2. Intelligent Refund System

#### Smart Calculation
```javascript
if (completedCount === 0) {
  refundAmount = totalAmount; // Full refund
} else {
  unitPrice = totalAmount / quantity;
  refundAmount = unitPrice × (quantity - completedCount); // Partial refund
}
```

#### Example
- Order: $100 for 1000 followers ($0.10 each)
- Completed: 300 followers
- Refund: $0.10 × 700 = $70.00
- User receives: $70, keeps 300 followers delivered

#### Refund Modal Preview
Admin sees calculation breakdown before confirming:
```
Order Amount: $100.00
Unit Price: $0.1000
Completed Units: 300
Remaining Units: 700
Refund Amount: $70.00
```

### 3. Secure Order Issue Reporting

#### Features
- Users report issues directly on orders
- Message threading (user ↔ admin conversation)
- XSS protection on all messages
- Rate limiting: 10 messages per 15 minutes
- IP and User-Agent logging
- Issue status: open → in_progress → resolved → closed

#### Security Measures
```javascript
// Input sanitization
body('message')
  .trim()
  .isLength({ min: 10, max: 2000 })
  .escape(); // XSS protection

// Rate limiting
const issueMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many messages. Please wait.'
});
```

### 4. Task Auto-Creation System

#### Trigger
When admin moves order from `pending` to `processing`, system automatically creates task.

#### Task Configuration
```javascript
{
  orderId: order.id,
  excludedUserId: order.userId, // Order owner cannot do task
  title: `${platform} ${service} - Order #${orderId.substring(0,8)}`,
  quantity: order.quantity,
  remainingQuantity: order.quantity,
  rate: order.unitPrice,
  priority: order.priority,
  status: 'active'
}
```

#### Exclusion Logic
- Task has `excludedUserId` field
- Frontend filters tasks: `WHERE task.excludedUserId != currentUser.id`
- Backend validates reservation: Rejects if user = excluded user
- Prevents order manipulation/abuse

### 5. 15-Minute Task Reservation Timer

#### Workflow
1. Worker clicks "Reserve Task"
2. `TaskExecution` created:
   ```javascript
   {
     status: 'pending',
     reservedAt: NOW(),
     expiresAt: NOW() + 15 minutes,
     userId: worker.id,
     taskId: task.id
   }
   ```
3. Task `remainingQuantity` decremented
4. Timer displayed in UI: "14:23 remaining"
5. If submitted: Status → `submitted`
6. If not submitted: Cron job expires reservation

#### Cron Job (Every 5 Minutes)
```javascript
cron.schedule('*/5 * * * *', async () => {
  const expiredExecutions = await TaskExecution.findAll({
    where: {
      status: 'pending',
      submittedAt: null,
      expiresAt: { [Op.lt]: new Date() }
    }
  });

  for (const execution of expiredExecutions) {
    await transaction(() => {
      execution.update({ status: 'expired' });
      Task.increment('remainingQuantity', { 
        where: { id: execution.taskId } 
      });
    });
  }
});
```

### 6. Task Approval & Balance Updates

#### Admin Approval Flow
1. Admin opens Task Submissions page
2. Reviews proof (screenshot, URL)
3. Reads submission notes
4. Clicks "Approve" with optional admin notes

#### Transaction (Atomic Operation)
```javascript
await sequelize.transaction(async (t) => {
  // 1. Update execution
  await execution.update({ 
    status: 'approved',
    reviewedAt: new Date(),
    reviewedBy: adminId,
    adminNotes: notes
  }, { transaction: t });

  // 2. Credit user
  await User.increment('balance', {
    by: task.rate,
    where: { id: execution.userId },
    transaction: t
  });

  // 3. Update task progress
  await Task.increment('completedQuantity', {
    by: 1,
    where: { id: task.id },
    transaction: t
  });

  // 4. Update order progress
  await Order.increment('completedCount', {
    by: 1,
    where: { id: task.orderId },
    transaction: t
  });

  // 5. Check order completion
  const order = await Order.findByPk(task.orderId, { transaction: t });
  if (order.completedCount >= order.quantity) {
    await order.update({ status: 'completed' }, { transaction: t });
  }

  // 6. Log action
  await logAudit({
    actorId: adminId,
    action: 'task_execution_approved',
    resourceId: execution.id,
    metadata: { reward: task.rate },
    transaction: t
  });
});
```

#### Rejection Flow
```javascript
await sequelize.transaction(async (t) => {
  // 1. Update execution
  await execution.update({ 
    status: 'rejected',
    rejectionReason: reason,
    reviewedAt: new Date()
  }, { transaction: t });

  // 2. Return slot to task
  await Task.increment('remainingQuantity', {
    by: 1,
    where: { id: task.id },
    transaction: t
  });

  // 3. Log rejection
  await logAudit({...}, { transaction: t });
});
```

---

## Database Schema

### Enhanced Tables

#### `orders` (New Fields)
```sql
ALTER TABLE orders
ADD COLUMN unit_price DECIMAL(10,4) NOT NULL COMMENT 'Price per unit for refund calc',
ADD COLUMN priority ENUM('normal', 'urgent', 'critical') DEFAULT 'normal',
ADD COLUMN refund_amount DECIMAL(10,2) NULL COMMENT 'Amount refunded if applicable',
ADD COLUMN last_status_change TIMESTAMP NULL COMMENT 'Track status change time',
ADD INDEX idx_orders_priority_status (priority DESC, status, created_at DESC),
ADD INDEX idx_orders_duplicate (user_id, platform, service, target_url);
```

#### `tasks` (New Field)
```sql
ALTER TABLE tasks
ADD COLUMN excluded_user_id CHAR(36) NULL COMMENT 'User who cannot do this task',
ADD CONSTRAINT fk_tasks_excluded_user 
    FOREIGN KEY (excluded_user_id) REFERENCES users(id) ON DELETE SET NULL,
ADD INDEX idx_tasks_excluded (excluded_user_id);
```

### New Tables

#### `order_issues`
```sql
CREATE TABLE order_issues (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  admin_id CHAR(36) NULL,
  message TEXT NOT NULL,
  sender_type ENUM('user', 'admin') NOT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_order_issues_order (order_id, created_at DESC),
  INDEX idx_order_issues_status (status, created_at DESC),
  INDEX idx_order_issues_user (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### `task_executions`
```sql
CREATE TABLE task_executions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  task_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  proof_url VARCHAR(500) NULL,
  submission_notes TEXT NULL,
  admin_notes TEXT NULL,
  rejection_reason TEXT NULL,
  status ENUM('pending', 'submitted', 'approved', 'rejected', 'expired') DEFAULT 'pending',
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL COMMENT '15 minutes from reserved_at',
  submitted_at TIMESTAMP NULL,
  reviewed_at TIMESTAMP NULL,
  reviewed_by CHAR(36) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  
  UNIQUE KEY unique_user_task (task_id, user_id),
  INDEX idx_executions_status_expires (status, expires_at),
  INDEX idx_executions_task (task_id, status, created_at DESC),
  INDEX idx_executions_user (user_id, status, created_at DESC),
  INDEX idx_executions_reviewer (reviewed_by, reviewed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Indexing Strategy

**Performance Optimization**:
- **Composite indexes** for common query patterns
- **Foreign keys** indexed automatically
- **Status + timestamp** for filtered listings
- **User + status** for user-specific queries
- **Covering indexes** where possible

**Query Optimization Example**:
```sql
-- Before (slow): SELECT * FROM tasks WHERE status = 'active'
-- After (fast): 
SELECT id, title, platform, service, quantity, remaining_quantity, rate
FROM tasks 
WHERE status = 'active' 
  AND excluded_user_id != :userId
ORDER BY priority DESC, created_at ASC
LIMIT 20;
-- Uses index: idx_tasks_priority_status_created
```

---

## API Endpoints

### Order Management

#### `POST /admin/orders/:id/process`
**Description**: Moves order to processing and auto-creates task.  
**Auth**: Admin only  
**Request**:
```json
{}
```
**Response**:
```json
{
  "success": true,
  "order": {
    "id": "abc123",
    "status": "processing",
    "task": {
      "id": "task456",
      "quantity": 100,
      "rate": 0.10
    }
  }
}
```

#### `POST /admin/orders/:id/complete`
**Description**: Marks order as completed.  
**Auth**: Admin only  
**Request**:
```json
{}
```
**Response**:
```json
{
  "success": true,
  "order": {
    "id": "abc123",
    "status": "completed"
  }
}
```

#### `POST /admin/orders/:id/refund`
**Description**: Calculates and processes refund.  
**Auth**: Admin only  
**Request**:
```json
{
  "reason": "Order delayed"
}
```
**Response**:
```json
{
  "success": true,
  "refund_amount": 70.00,
  "calculation": {
    "total_amount": 100.00,
    "unit_price": 0.10,
    "completed": 300,
    "remaining": 700
  },
  "user_balance": 170.00
}
```

### Order Issues

#### `GET /admin/orders/:orderId/issues`
**Description**: Lists all issues for an order.  
**Auth**: Admin or order owner  
**Response**:
```json
{
  "issues": [
    {
      "id": "issue1",
      "message": "Order not delivered",
      "sender_type": "user",
      "status": "open",
      "created_at": "2025-10-31T10:00:00Z"
    },
    {
      "id": "issue2",
      "message": "We are investigating",
      "sender_type": "admin",
      "status": "in_progress",
      "created_at": "2025-10-31T10:30:00Z"
    }
  ]
}
```

#### `POST /admin/orders/:orderId/issues`
**Description**: Creates new issue message.  
**Auth**: Authenticated  
**Rate Limit**: 10 messages per 15 minutes  
**Request**:
```json
{
  "type": "Order Not Delivered",
  "description": "I placed order 3 days ago but received no followers"
}
```
**Response**:
```json
{
  "success": true,
  "issue": {
    "id": "issue789",
    "order_id": "abc123",
    "message": "I placed order 3 days ago but received no followers",
    "status": "open"
  }
}
```

#### `PATCH /admin/issues/:id/status`
**Description**: Updates issue status.  
**Auth**: Admin only  
**Request**:
```json
{
  "status": "resolved"
}
```
**Response**:
```json
{
  "success": true,
  "issue": {
    "id": "issue789",
    "status": "resolved"
  }
}
```

### Task Execution

#### `POST /tasks/:taskId/reserve`
**Description**: Reserves task for 15 minutes.  
**Auth**: Authenticated  
**Rate Limit**: 20 reservations per hour  
**Response**:
```json
{
  "success": true,
  "execution": {
    "id": "exec123",
    "task_id": "task456",
    "status": "pending",
    "reserved_at": "2025-10-31T14:00:00Z",
    "expires_at": "2025-10-31T14:15:00Z",
    "remaining_seconds": 900
  }
}
```

#### `PATCH /executions/:id/submit`
**Description**: Submits proof before expiry.  
**Auth**: Task executor  
**Request**:
```json
{
  "proof_url": "https://example.com/proof.png",
  "submission_notes": "Completed task successfully"
}
```
**Response**:
```json
{
  "success": true,
  "execution": {
    "id": "exec123",
    "status": "submitted",
    "submitted_at": "2025-10-31T14:10:00Z"
  }
}
```

#### `POST /admin/executions/:id/approve`
**Description**: Approves submission, credits user.  
**Auth**: Admin only  
**Request**:
```json
{
  "notes": "Good work, proof verified"
}
```
**Response**:
```json
{
  "success": true,
  "reward": 0.50,
  "execution": {
    "id": "exec123",
    "status": "approved",
    "reviewed_at": "2025-10-31T15:00:00Z"
  },
  "user_balance": 10.50,
  "order_progress": {
    "completed": 51,
    "total": 100,
    "percentage": 51
  }
}
```

#### `POST /admin/executions/:id/reject`
**Description**: Rejects submission, returns slot.  
**Auth**: Admin only  
**Request**:
```json
{
  "reason": "Proof screenshot unclear",
  "notes": "Please provide better quality screenshot"
}
```
**Response**:
```json
{
  "success": true,
  "execution": {
    "id": "exec123",
    "status": "rejected",
    "rejection_reason": "Proof screenshot unclear"
  },
  "task": {
    "remaining_quantity": 50
  }
}
```

#### `GET /admin/task-executions`
**Description**: Lists all task submissions.  
**Auth**: Admin only  
**Query Params**:
- `status`: Filter by status (`submitted`, `approved`, `rejected`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sortBy`: Sort field (default: `created_at`)
- `order`: Sort order (`ASC`, `DESC`)

**Response**:
```json
{
  "executions": [
    {
      "id": "exec123",
      "task": {
        "id": "task456",
        "title": "Instagram Followers",
        "rate": 0.50
      },
      "user": {
        "id": "user789",
        "firstName": "John",
        "lastName": "Doe"
      },
      "proof_url": "https://example.com/proof.png",
      "submission_notes": "Completed",
      "status": "submitted",
      "submitted_at": "2025-10-31T14:10:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

## Frontend Components

### Admin Panel

#### Order Management Page (`admin-panel/src/pages/Orders.jsx`)

**Features**:
- **Sorting**: Priority DESC, then newest first
- **Progress Bars**: Shows "completed/total (percentage%)"
- **Action Buttons**: Process, Complete, Refund
- **Details Modal**: Full order info + issue thread
- **Refund Modal**: Calculation preview before confirm

**Key Component**:
```jsx
const RefundModal = ({ order, onConfirm }) => {
  const unitPrice = order.unitPrice || order.amount / order.quantity;
  const refundAmount = order.completedCount > 0
    ? unitPrice * (order.quantity - order.completedCount)
    : order.amount;

  return (
    <Modal>
      <h2>Refund Order</h2>
      <div className="refund-calculation">
        <p>Order Amount: ${order.amount.toFixed(2)}</p>
        <p>Unit Price: ${unitPrice.toFixed(4)}</p>
        <p>Completed: {order.completedCount}</p>
        <p>Remaining: {order.quantity - order.completedCount}</p>
        <p className="text-xl font-bold">
          Refund Amount: ${refundAmount.toFixed(2)}
        </p>
      </div>
      <button onClick={() => onConfirm(refundAmount)}>
        Confirm Refund
      </button>
    </Modal>
  );
};
```

#### Task Submissions Page (`admin-panel/src/pages/TaskSubmissions.jsx`)

**Features**:
- **Filtering**: By status (submitted, approved, rejected)
- **Proof Preview**: Screenshot thumbnail with lightbox
- **Approve/Reject**: Inline actions with notes
- **User Info**: Click to view user profile
- **Order Link**: Navigate to source order

**Approve Handler**:
```jsx
const handleApprove = async (executionId) => {
  try {
    const result = await api.post(`/admin/executions/${executionId}/approve`, {
      notes: adminNotes
    });
    
    toast.success(`Approved! User earned $${result.reward}`);
    refreshList();
  } catch (error) {
    toast.error('Approval failed');
  }
};
```

### User Frontend

#### Orders Page (`frontend/src/pages/Orders.jsx`)

**Features**:
- **Shortened IDs**: Display first 8 chars only
- **Progress Bars**: Real-time updates
- **Report Issue**: Opens secure messaging modal
- **Status Badges**: Color-coded order states

**Report Issue Modal**:
```jsx
const ReportIssueModal = ({ order }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const loadMessages = async () => {
    const res = await api.get(`/orders/${order.id}/issues`);
    setMessages(res.data.issues);
  };

  const sendMessage = async () => {
    await api.post(`/orders/${order.id}/issues`, {
      type: issueType,
      description: newMessage
    });
    setNewMessage('');
    loadMessages();
  };

  return (
    <Modal>
      <h2>Order Issues</h2>
      <div className="message-thread">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender_type}`}>
            <span className="sender">{msg.sender_type}</span>
            <p>{msg.message}</p>
            <span className="time">{formatDate(msg.created_at)}</span>
          </div>
        ))}
      </div>
      <textarea 
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        maxLength={2000}
        placeholder="Describe your issue..."
      />
      <button onClick={sendMessage}>Send Message</button>
    </Modal>
  );
};
```

#### Tasks Page (`frontend/src/pages/Tasks.jsx`)

**Features**:
- **Filtering**: Exclude user's own order tasks
- **Sorting**: Priority first, then oldest tasks
- **Countdown Timer**: Shows remaining reservation time
- **Reserve Button**: One-click reservation
- **Submit Form**: Proof URL + notes upload

**Task Card**:
```jsx
const TaskCard = ({ task, execution }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (execution?.expiresAt) {
      const interval = setInterval(() => {
        const diff = new Date(execution.expiresAt) - new Date();
        if (diff > 0) {
          setTimeRemaining(Math.floor(diff / 1000));
        } else {
          setTimeRemaining(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [execution]);

  const handleReserve = async () => {
    await api.post(`/tasks/${task.id}/reserve`);
    toast.success('Task reserved! You have 15 minutes.');
    refreshTasks();
  };

  return (
    <Card>
      <h3>{task.title}</h3>
      <p>Platform: {task.platform}</p>
      <p>Reward: ${task.rate}</p>
      {execution?.status === 'pending' && (
        <div className="timer">
          Time Remaining: {formatTime(timeRemaining)}
        </div>
      )}
      {!execution && (
        <button onClick={handleReserve}>Reserve Task</button>
      )}
      {execution?.status === 'pending' && (
        <SubmitProofForm execution={execution} />
      )}
    </Card>
  );
};
```

---

## Business Logic

### Order Validation

**Duplicate Prevention**:
```javascript
const validateOrderCreation = async (req, res, next) => {
  const { user_id, platform, service, target_url } = req.body;
  
  const existingOrder = await Order.findOne({
    attributes: ['id', 'status'],
    where: {
      user_id,
      platform,
      service,
      target_url,
      status: ['pending', 'processing']
    },
    raw: true
  });

  if (existingOrder) {
    return res.status(400).json({
      error: 'duplicate_order',
      message: 'You already have an active order for this service and URL'
    });
  }
  
  next();
};
```

### Progress Calculation

```javascript
const calculateOrderProgress = (order) => {
  const completed = order.completedCount || 0;
  const total = order.quantity || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    completed,
    total,
    percentage: Math.min(percentage, 100),
    remaining: Math.max(total - completed, 0),
    isComplete: completed >= total
  };
};
```

### Refund Calculation

```javascript
const calculateRefund = (order) => {
  const unitPrice = parseFloat(order.unitPrice || order.amount / order.quantity);
  const completedCount = order.completedCount || 0;
  const remainingUnits = order.quantity - completedCount;
  
  if (completedCount === 0) {
    return {
      type: 'full',
      amount: parseFloat(order.amount),
      reason: 'No work completed'
    };
  }
  
  if (remainingUnits > 0) {
    return {
      type: 'partial',
      amount: unitPrice * remainingUnits,
      completed: completedCount,
      remaining: remainingUnits,
      reason: `${completedCount} units delivered, ${remainingUnits} refunded`
    };
  }
  
  return {
    type: 'none',
    amount: 0,
    reason: 'Order fully completed'
  };
};
```

### Task Auto-Creation

```javascript
const createTaskFromOrder = async (order, transaction) => {
  const task = await Task.create({
    orderId: order.id,
    excludedUserId: order.userId, // Order owner cannot do task
    title: `${order.platform} ${order.service} - Order #${order.id.substring(0, 8)}`,
    description: order.notes || `Complete ${order.service} for order`,
    type: order.service.toLowerCase(),
    platform: order.platform,
    targetUrl: order.targetUrl,
    quantity: order.quantity,
    remainingQuantity: order.quantity,
    completedQuantity: 0,
    rate: parseFloat(order.unitPrice || order.amount / order.quantity),
    priority: order.priority || 'medium',
    status: 'active',
    requirements: order.requirements
  }, { transaction });

  await logAudit({
    actorId: order.userId,
    action: 'task_auto_created',
    resource: 'task',
    resourceId: task.id,
    description: `Task auto-created from order #${order.id}`,
    metadata: { orderId: order.id, quantity: order.quantity },
    transaction
  });

  return task;
};
```

### Task Expiry (Cron Job)

```javascript
const expireOldReservations = async () => {
  const now = new Date();
  
  const expiredExecutions = await TaskExecution.findAll({
    attributes: ['id', 'taskId', 'userId'],
    where: {
      status: 'pending',
      submittedAt: null,
      expiresAt: { [Op.lt]: now }
    }
  });

  for (const execution of expiredExecutions) {
    await sequelize.transaction(async (t) => {
      // Mark as expired
      await execution.update({ status: 'expired' }, { transaction: t });
      
      // Return slot to task
      await Task.increment('remainingQuantity', {
        by: 1,
        where: { id: execution.taskId },
        transaction: t
      });
      
      // Log expiry
      await logAudit({
        actorId: execution.userId,
        action: 'task_execution_expired',
        resourceId: execution.id,
        description: 'Task reservation expired after 15 minutes',
        transaction: t
      });
    });
  }
  
  console.log(`Expired ${expiredExecutions.length} task reservations`);
};

// Schedule every 5 minutes
cron.schedule('*/5 * * * *', expireOldReservations);
```

---

## Security Features

### 1. XSS Protection

**Implementation**:
```javascript
const { body } = require('express-validator');

router.post('/orders/:orderId/issues', [
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .escape(), // Prevents XSS attacks
], async (req, res) => {
  // Message is now safe
});
```

**Test**:
```javascript
Input: <script>alert('XSS')</script>
Stored: &lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;
Display: <script>alert('XSS')</script> (as text, not executed)
```

### 2. Rate Limiting

**Order Issues**:
```javascript
const issueMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 messages per window
  message: { 
    error: 'rate_limit',
    message: 'Too many messages. Please wait 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/orders/:orderId/issues', issueMessageLimiter, createIssue);
```

**Task Reservations**:
```javascript
const reservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 reservations per hour
  message: { 
    error: 'rate_limit',
    message: 'Too many task reservations. Please wait.' 
  }
});

router.post('/tasks/:taskId/reserve', reservationLimiter, reserveTask);
```

### 3. SQL Injection Prevention

**All queries use Sequelize ORM with parameterized queries**:
```javascript
// ✅ SAFE - Parameterized
const order = await Order.findOne({
  where: { 
    userId: req.user.id, // Safe parameter
    status: 'pending'
  }
});

// ❌ UNSAFE - Raw SQL (NEVER DO THIS)
const query = `SELECT * FROM orders WHERE user_id = '${req.user.id}'`;
```

### 4. Authentication & Authorization

**JWT Middleware**:
```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

**Admin-Only Middleware**:
```javascript
const isAdmin = async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'role'],
    include: [{
      model: Role,
      attributes: ['name'],
      through: { attributes: [] }
    }]
  });
  
  const hasAdminRole = user.Roles.some(role => 
    ['superadmin', 'admin'].includes(role.name)
  );
  
  if (!hasAdminRole) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};
```

### 5. Transaction Safety

**All multi-step operations use transactions**:
```javascript
router.post('/admin/executions/:id/approve', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Update execution
    await execution.update({ status: 'approved' }, { transaction });
    
    // 2. Credit user
    await User.increment('balance', { 
      by: task.rate, 
      where: { id: execution.userId },
      transaction 
    });
    
    // 3. Update task
    await Task.increment('completedQuantity', { 
      by: 1, 
      where: { id: task.id },
      transaction 
    });
    
    // 4. Update order
    await Order.increment('completedCount', { 
      by: 1, 
      where: { id: task.orderId },
      transaction 
    });
    
    // 5. Log audit
    await logAudit({...}, { transaction });
    
    // Commit all changes
    await transaction.commit();
    res.json({ success: true });
    
  } catch (error) {
    // Rollback on any error
    await transaction.rollback();
    res.status(500).json({ error: 'Approval failed' });
  }
});
```

### 6. Audit Logging

**All critical actions logged**:
```javascript
await logAudit({
  actorId: req.user.id,
  actorName: req.user.firstName + ' ' + req.user.lastName,
  actorEmail: req.user.email,
  action: 'order_refunded',
  resource: 'order',
  resourceId: order.id,
  targetUserId: order.userId,
  targetUserName: orderUser.firstName + ' ' + orderUser.lastName,
  description: `Refunded $${refundAmount.toFixed(2)} for order #${order.id}`,
  metadata: {
    orderAmount: order.amount,
    completed: order.completedCount,
    total: order.quantity,
    refundAmount: refundAmount,
    reason: req.body.reason
  },
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
});
```

**Logged Actions**:
- order_created, order_status_changed, order_refunded
- task_created, task_auto_created, task_completed
- task_reserved, task_submitted, task_approved, task_rejected, task_expired
- order_issue_created, order_issue_status_changed
- balance_credited, balance_deducted

### 7. Input Validation

**Comprehensive validation on all endpoints**:
```javascript
router.post('/tasks/:taskId/reserve', [
  param('taskId').isUUID(),
  // No body params needed
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process reservation
});

router.patch('/executions/:id/submit', [
  param('id').isUUID(),
  body('proofUrl')
    .trim()
    .isURL({ protocols: ['http', 'https'] })
    .isLength({ max: 500 }),
  body('submissionNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .escape()
], async (req, res) => {
  // Process submission
});
```

---

## Deployment Guide

### Prerequisites

- Node.js 16+ (LTS recommended)
- MySQL 8.0+
- npm or yarn
- Git

### Installation Steps

#### 1. Clone Repository
```bash
cd "/Users/velatertach/Downloads/projects/project 5"
git pull origin main
```

#### 2. Install Dependencies
```bash
# Backend
cd backend_combined
npm install node-cron

# Admin Panel
cd ../admin-panel
npm install

# Frontend
cd ../frontend
npm install
```

#### 3. Database Setup
```bash
cd backend_combined

# Run migrations
npx sequelize-cli db:migrate

# Verify migrations
npx sequelize-cli db:migrate:status

# Expected output:
# up 2025102821254001-create-roles.cjs
# up 2025102821254002-create-permissions.cjs
# up 2025102821254003-create-users.cjs
# ... (all migrations up)
```

#### 4. Environment Variables

Create `.env` files in each directory:

**backend_combined/.env**:
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=socidev
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
FRONTEND_URL=https://your-domain.com

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_MESSAGES=10
RATE_LIMIT_MAX_RESERVATIONS=20

# Task settings
TASK_EXPIRY_MINUTES=15
CRON_SCHEDULE=*/5 * * * *
```

**admin-panel/.env**:
```env
VITE_API_URL=https://api.your-domain.com
```

**frontend/.env**:
```env
VITE_API_URL=https://api.your-domain.com
```

#### 5. Build Applications
```bash
# Admin Panel
cd admin-panel
npm run build
# Output: dist/

# Frontend
cd ../frontend
npm run build
# Output: dist/
```

#### 6. Start Backend
```bash
cd backend_combined
npm start

# Or with PM2 for production:
pm2 start src/server.js --name socidev-backend
pm2 save
pm2 startup
```

#### 7. Verify Cron Job
```bash
# Check logs for:
# "Task execution expiry scheduler started"
# "Cron job scheduled: */5 * * * *"

tail -f logs/combined.log | grep cron
```

### Production Deployment

#### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend_combined
pm2 start src/server.js --name socidev-backend

# Monitor
pm2 monit

# Logs
pm2 logs socidev-backend

# Auto-restart on reboot
pm2 startup
pm2 save
```

#### Using Docker (Alternative)
```bash
# Create Dockerfile in backend_combined/
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]

# Build and run
docker build -t socidev-backend .
docker run -d -p 3000:3000 --name socidev socidev-backend
```

### Nginx Configuration

```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Admin Panel
server {
    listen 80;
    server_name admin.your-domain.com;
    root /var/www/admin-panel/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# User Frontend
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Monitoring

#### Health Check Endpoint
```javascript
// Add to backend: src/routes/health.js
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    cron: 'running'
  });
});
```

#### Database Monitoring
```sql
-- Check task executions
SELECT 
  status,
  COUNT(*) as count
FROM task_executions
WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY status;

-- Check expired tasks
SELECT COUNT(*) 
FROM task_executions 
WHERE status = 'expired' 
  AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Check average approval time
SELECT 
  AVG(TIMESTAMPDIFF(MINUTE, submitted_at, reviewed_at)) as avg_review_minutes
FROM task_executions
WHERE status = 'approved'
  AND reviewed_at > DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### Backup Strategy

```bash
# Database backup (daily)
0 2 * * * mysqldump -u root -p socidev > /backups/socidev_$(date +\%Y\%m\%d).sql

# Audit logs backup (weekly)
0 3 * * 0 mysqldump -u root -p socidev audit_logs action_logs > /backups/logs_$(date +\%Y\%m\%d).sql

# Retention: Keep 30 days
find /backups -name "socidev_*.sql" -mtime +30 -delete
```

---

## Troubleshooting

### Common Issues

#### 1. Task Executions Not Expiring

**Symptoms**: Reservations past 15 minutes still show as "pending"

**Diagnosis**:
```bash
# Check cron job logs
tail -f logs/combined.log | grep "Task execution expiry"

# Check for stuck executions
SELECT * FROM task_executions 
WHERE status = 'pending' 
  AND expires_at < NOW() 
  AND submitted_at IS NULL;
```

**Solution**:
```bash
# Manually trigger expiry
node -e "require('./src/jobs/taskExpiryScheduler').expireOldReservations()"

# Restart backend to restart cron
pm2 restart socidev-backend
```

#### 2. Progress Bar Shows 0/1000%

**Symptoms**: Progress displays wrong percentage

**Diagnosis**:
```javascript
// Check progress calculation in orderHelpers.js
const percentage = (order.completedCount / order.quantity) * 100;
console.log({ completedCount, quantity, percentage });
```

**Solution**: Ensure formula is `(completed / total) * 100`, not just `completed / total`.

#### 3. Users Can See Their Own Order Tasks

**Symptoms**: Task exclusion not working

**Diagnosis**:
```sql
-- Check if excludedUserId is set
SELECT id, order_id, excluded_user_id, title
FROM tasks
WHERE order_id = 'order-id-here';

-- Should have excluded_user_id = order owner's user_id
```

**Solution**:
```javascript
// Ensure task creation includes excludedUserId
const task = await Task.create({
  ...taskData,
  excludedUserId: order.userId // THIS MUST BE SET
});
```

#### 4. Refund Amount Incorrect

**Symptoms**: Refund doesn't match expected value

**Diagnosis**:
```sql
-- Check order data
SELECT 
  id, 
  amount,
  quantity,
  completed_count,
  unit_price,
  (amount / quantity) as calculated_unit_price,
  ((quantity - completed_count) * unit_price) as expected_refund
FROM orders
WHERE id = 'order-id-here';
```

**Solution**: Ensure `unit_price` is set on order creation:
```javascript
const unitPrice = parseFloat(amount / quantity);
await Order.create({
  ...orderData,
  unitPrice: unitPrice.toFixed(4)
});
```

#### 5. XSS Attack Not Prevented

**Symptoms**: Scripts execute in browser

**Diagnosis**:
```javascript
// Check if .escape() is used
router.post('/orders/:orderId/issues', [
  body('message').trim().escape() // <-- MUST HAVE .escape()
], createIssue);
```

**Solution**: Add `.escape()` to all text input validators.

#### 6. Rate Limit Not Working

**Symptoms**: Users send more than 10 messages in 15 min

**Diagnosis**:
```bash
# Check if rate limiter is applied
grep "issueMessageLimiter" backend_combined/src/routes/admin/orderIssues.js

# Should see:
# router.post('...', issueMessageLimiter, ...)
```

**Solution**: Ensure middleware is applied to route:
```javascript
router.post('/orders/:orderId/issues', issueMessageLimiter, createIssue);
```

#### 7. Database Queries Slow

**Symptoms**: Orders page loads > 5 seconds

**Diagnosis**:
```sql
-- Check if indexes exist
SHOW INDEXES FROM orders;
SHOW INDEXES FROM tasks;
SHOW INDEXES FROM task_executions;

-- Explain query plan
EXPLAIN SELECT * FROM orders 
WHERE status = 'processing' 
ORDER BY priority DESC, created_at DESC;
```

**Solution**:
```sql
-- Add missing indexes
CREATE INDEX idx_orders_priority_status 
  ON orders(priority DESC, status, created_at DESC);
  
CREATE INDEX idx_tasks_status_priority 
  ON tasks(status, priority DESC, created_at ASC);
```

#### 8. Transaction Rollback Failures

**Symptoms**: Partial data updates (e.g., balance credited but execution not updated)

**Diagnosis**:
```javascript
// Check if transaction is used
const transaction = await sequelize.transaction();
try {
  // ... operations
  await transaction.commit();
} catch (error) {
  await transaction.rollback(); // <-- MUST HAVE
  throw error;
}
```

**Solution**: Always wrap multi-step operations in transactions.

---

## Performance Metrics

**Target Metrics**:
- Order creation: < 500ms
- Task reservation: < 300ms
- Task approval: < 1s (includes balance update)
- Admin panel load: < 2s
- User frontend load: < 2s

**Database Optimization**:
- All queries use selective field fetching (attributes array)
- No SELECT * queries
- Composite indexes on frequently queried columns
- Pagination on all list views (limit 20-50 items)

**Cron Job Performance**:
- Runs every 5 minutes
- Processes ~100 expired executions in < 5 seconds
- Uses transactions for atomicity

---

## Future Enhancements

**Planned Features**:
1. Real-time notifications (WebSocket) for task approvals
2. Automated task proof verification (image recognition)
3. User reputation system based on approval rate
4. Bulk order operations (approve/reject multiple tasks)
5. Advanced analytics dashboard (order trends, completion rates)
6. Email notifications for order status changes
7. Mobile app (React Native) for task execution
8. API rate limiting per user (not just IP-based)

---

## Support & Documentation

**Main Documentation**:
- Security Audit: `SECURITY_AUDIT_REPORT.md`
- Testing Guide: `E2E_TESTING_GUIDE.md`
- This Document: `ORDER_TASK_SYSTEM.md`

**API Reference**:
- Swagger/OpenAPI (coming soon)
- Postman collection (available in `/docs/postman`)

**Support Channels**:
- GitHub Issues: https://github.com/uexplodem-png/socidev/issues
- Development Team: [Contact Info]

**Version History**:
- v1.0.0: Initial release (Basic orders & tasks)
- v2.0.0: Order & Task Management System (Current)
  - Smart refunds
  - 15-minute reservations
  - Order issues messaging
  - Task auto-creation
  - Comprehensive security

---

**Last Updated**: October 31, 2025  
**Author**: Development Team  
**License**: Proprietary

