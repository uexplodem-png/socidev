# End-to-End Testing Guide
## Order & Task Management System

**Test Environment**: Development/Staging  
**Database**: MySQL with test data  
**Backend**: http://localhost:3000  
**Admin Panel**: http://localhost:5173  
**User Frontend**: http://localhost:5174  

---

## Test Case 1: Order Creation & Duplicate Prevention

### Objective
Verify that users cannot create duplicate active orders and that completed orders allow new orders for the same URL.

### Prerequisites
- User account with sufficient balance
- Instagram/YouTube service available

### Test Steps

1. **Create First Order**
   ```
   1. Login to user frontend (http://localhost:5174)
   2. Navigate to "New Order" page
   3. Fill in order form:
      - Platform: Instagram
      - Service: Followers
      - Target URL: https://instagram.com/testaccount
      - Quantity: 100
      - Speed: Normal
   4. Submit order
   ```
   **Expected**: Order created successfully, balance deducted

2. **Attempt Duplicate Order**
   ```
   1. Immediately try to create another order
   2. Use SAME platform, service, and target URL
   3. Submit order
   ```
   **Expected**: Error message "You already have an active order for this service and URL"
   **Status**: ❌ Duplicate prevented

3. **Complete First Order**
   ```
   1. Login to admin panel (http://localhost:5173)
   2. Navigate to Orders page
   3. Find the test order
   4. Click "Complete Order" button
   ```
   **Expected**: Order status changes to "completed"

4. **Create New Order for Same URL**
   ```
   1. Return to user frontend
   2. Create new order with SAME URL as before
   3. Submit order
   ```
   **Expected**: ✅ Order created successfully (previous order was completed)

### Success Criteria
- ✅ Duplicate prevention works for pending/processing orders
- ✅ New orders allowed after completion
- ✅ Error messages clear and user-friendly

---

## Test Case 2: Progress Bar Accuracy

### Objective
Verify that progress bars display correct percentages based on completed/quantity calculations.

### Prerequisites
- Admin access
- Order with known quantity

### Test Steps

1. **Check Initial Progress**
   ```
   1. Create order: quantity=100
   2. View order in user frontend
   3. Observe progress bar
   ```
   **Expected**: Shows "0/100 (0%)" with empty progress bar

2. **Simulate Partial Completion**
   ```
   1. In database, manually update:
      UPDATE orders 
      SET completed_count = 25 
      WHERE id = 'test-order-id';
   2. Refresh user frontend Orders page
   3. Observe progress bar
   ```
   **Expected**: Shows "25/100 (25%)" with 25% filled bar

3. **Verify Admin Panel Progress**
   ```
   1. Login to admin panel
   2. Navigate to Orders page
   3. Find same order
   4. Observe progress bar
   ```
   **Expected**: Same display "25/100 (25%)"

4. **Test Edge Cases**
   ```
   Test A: 100/100 completion
   Expected: "100/100 (100%)" with full bar
   
   Test B: 0/1000 completion
   Expected: "0/1000 (0%)" not "0/1000 (1000%)" ❌
   
   Test C: 999/1000 completion
   Expected: "999/1000 (99%)" with 99% filled bar
   ```

### Success Criteria
- ✅ Progress calculation: (completed / quantity) × 100
- ✅ Progress bar width matches percentage
- ✅ No overflow bugs (0/1000% issue fixed)
- ✅ Consistent display across admin and user panels

---

## Test Case 3: Refund Calculation

### Objective
Verify smart partial and full refund calculations based on completed work.

### Prerequisites
- Admin access
- Order with unit price

### Test Steps

1. **Full Refund (No Work Done)**
   ```
   1. Create order: $100 for 1000 units ($0.10 each)
   2. completedCount = 0
   3. Admin clicks "Refund Order"
   4. View refund modal
   ```
   **Expected Calculation**:
   ```
   Order Amount: $100.00
   Total Quantity: 1000
   Completed: 0
   Unit Price: $0.1000
   Remaining Units: 1000
   Refund Amount: $100.00 (Full refund - no work completed)
   ```

2. **Partial Refund (Some Work Done)**
   ```
   1. Same order with completedCount = 300
   2. Admin clicks "Refund Order"
   3. View refund modal
   ```
   **Expected Calculation**:
   ```
   Order Amount: $100.00
   Total Quantity: 1000
   Completed: 300
   Unit Price: $0.1000
   Remaining Units: 700
   Refund Amount: $70.00 (Partial refund - 300 units completed)
   ```

3. **Confirm Refund**
   ```
   1. Click "Confirm Refund" in modal
   2. Check order status
   3. Check user balance
   ```
   **Expected**:
   - ✅ Order status changed to "refunded"
   - ✅ User balance increased by $70.00
   - ✅ Transaction record created
   - ✅ Audit log entry: "Refunded $70.00 for order #abc12345"

4. **Edge Case: Fully Completed Order**
   ```
   1. Order: $50 for 500 units
   2. completedCount = 500
   3. Try to refund
   ```
   **Expected**: Error "No refundable amount (order fully completed)"

### Success Criteria
- ✅ Full refund when completedCount = 0
- ✅ Partial refund = unit_price × (quantity - completed)
- ✅ User balance updated correctly
- ✅ Cannot refund fully completed orders
- ✅ Audit log records all refunds

---

## Test Case 4: Task Exclusion (Order Owner Cannot Do Own Task)

### Objective
Verify that order owners cannot reserve or complete their own order's tasks.

### Prerequisites
- Two user accounts (User A, User B)
- Admin access

### Test Steps

1. **User A Creates Order**
   ```
   1. Login as User A
   2. Create order: Instagram Followers, 100 quantity
   3. Note order ID
   ```
   **Expected**: Order created, status "pending"

2. **Admin Processes Order**
   ```
   1. Login to admin panel
   2. Find User A's order
   3. Click "Process Order" button
   ```
   **Expected**: 
   - ✅ Order status → "processing"
   - ✅ Task auto-created
   - ✅ Task has `excludedUserId` = User A's ID

3. **User A Tries to View Task**
   ```
   1. Login as User A (order owner)
   2. Navigate to Tasks page
   3. Search for the task
   ```
   **Expected**: ❌ Task is NOT visible to User A (filtered out)

4. **User B Reserves Task**
   ```
   1. Login as User B
   2. Navigate to Tasks page
   3. Find the task
   4. Click "Reserve Task"
   ```
   **Expected**: ✅ Reservation successful, 15-minute timer starts

5. **Attempt Direct API Call (Security Test)**
   ```
   1. User A tries POST /tasks/:taskId/reserve with User A's token
   2. Backend should check excludedUserId
   ```
   **Expected**: ❌ 403 Forbidden "You cannot complete your own order's task"

### Success Criteria
- ✅ excludedUserId set correctly on task creation
- ✅ Frontend filters tasks from UI
- ✅ Backend API blocks reservation attempts
- ✅ Other users can reserve the task
- ✅ Audit log records task creation with order link

---

## Test Case 5: 15-Minute Task Reservation Expiry

### Objective
Verify that task reservations expire after 15 minutes and return to available pool.

### Prerequisites
- User account
- Task available for reservation
- Backend running with cron job

### Test Steps

1. **Reserve Task**
   ```
   1. Login to user frontend
   2. Navigate to Tasks page
   3. Reserve available task
   4. Note time: e.g., 14:00:00
   ```
   **Expected**: 
   - ✅ Task execution created with status "pending"
   - ✅ expiresAt = 14:15:00 (15 minutes later)
   - ✅ Task.remainingQuantity decremented

2. **Wait Without Submitting (Option A: Natural Wait)**
   ```
   1. Do NOT submit proof
   2. Wait 16 minutes
   3. Cron job runs (every 5 minutes)
   ```
   **Expected**: After cron job:
   - ✅ Task execution status → "expired"
   - ✅ Task.remainingQuantity incremented back
   - ✅ Audit log: "Task execution expired"

3. **Or Manual Database Update (Option B: Fast Test)**
   ```
   1. Update expires_at to past time:
      UPDATE task_executions 
      SET expires_at = NOW() - INTERVAL 1 MINUTE 
      WHERE id = 'execution-id';
   2. Wait for next cron run (max 5 minutes)
   3. Or manually trigger: node src/jobs/taskExpiryScheduler.js
   ```
   **Expected**: Same as Option A

4. **Verify Task Available Again**
   ```
   1. Another user navigates to Tasks page
   2. Search for the same task
   ```
   **Expected**: ✅ Task shows as available again

5. **Test Submission Before Expiry**
   ```
   1. Reserve task at 14:00
   2. Submit proof at 14:10 (within 15 min)
   3. Check expiry
   ```
   **Expected**: ❌ NOT expired, status = "submitted"

### Success Criteria
- ✅ Reservations expire after 15 minutes
- ✅ Cron job runs every 5 minutes
- ✅ Expired tasks return to pool
- ✅ Submissions within time limit NOT expired
- ✅ Multiple users can attempt same task slot

---

## Test Case 6: Order Issues Security (XSS & Rate Limiting)

### Objective
Verify XSS protection and rate limiting on order issue messaging system.

### Prerequisites
- User account
- Order with ID
- Browser developer tools

### Test Steps

1. **XSS Attack Test**
   ```
   1. Navigate to Orders page
   2. Click "Report Issue" on any order
   3. Enter malicious content:
      <script>alert('XSS')</script>
      <img src=x onerror=alert('XSS')>
   4. Submit report
   ```
   **Expected**: 
   - ✅ Message saved in database as escaped:
     `&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;`
   - ✅ Admin views message: displays as text, no script execution
   - ✅ Browser console: No JavaScript errors

2. **Rate Limit Test**
   ```
   1. User submits 10 messages in 5 minutes
   2. Attempt 11th message
   ```
   **Expected**: 
   - ✅ First 10 messages accepted
   - ❌ 11th message rejected with 429 status
   - ✅ Error: "Too many messages. Please wait 15 minutes."

3. **IP & User-Agent Logging**
   ```
   1. Submit issue message
   2. Check audit logs table:
      SELECT * FROM audit_logs 
      WHERE action = 'order_issue_created' 
      ORDER BY created_at DESC LIMIT 1;
   ```
   **Expected**:
   - ✅ ip_address recorded (e.g., "127.0.0.1")
   - ✅ user_agent recorded (e.g., "Mozilla/5.0...")
   - ✅ metadata includes message preview

4. **Admin Reply Test**
   ```
   1. Admin navigates to Order Details
   2. Views issue thread
   3. Replies to user message
   4. Check for XSS in admin reply
   ```
   **Expected**: 
   - ✅ Admin replies also XSS protected
   - ✅ Full conversation thread displayed
   - ✅ Clear sender identification (User vs Admin)

### Success Criteria
- ✅ XSS attacks prevented via .escape()
- ✅ Rate limiting enforces 10 msg/15min limit
- ✅ IP and User-Agent logged for all messages
- ✅ Admin and user messages equally protected
- ✅ No security warnings in browser console

---

## Test Case 7: Task Approval Flow & Balance Update

### Objective
Verify complete task approval workflow including balance credits and order progress updates.

### Prerequisites
- Admin account
- User account with reserved task
- Task linked to order

### Test Steps

1. **User Reserves and Submits Task**
   ```
   1. User reserves task (rate: $0.50)
   2. User uploads screenshot proof
   3. User adds submission notes: "Completed successfully"
   4. Submit before 15-minute timer
   ```
   **Expected**: 
   - ✅ Task execution status → "submitted"
   - ✅ submittedAt timestamp recorded
   - ✅ Appears in admin Task Submissions queue

2. **Admin Views Submission**
   ```
   1. Login to admin panel
   2. Navigate to Task Submissions page
   3. Find submitted task
   ```
   **Expected Display**:
   - ✅ User name and email
   - ✅ Task details (platform, type, target URL)
   - ✅ Screenshot preview
   - ✅ Submission notes
   - ✅ Time remaining indicator (if near expiry)
   - ✅ Actions: Approve, Reject buttons

3. **Admin Approves Task**
   ```
   1. Admin clicks "Approve" button
   2. Optional: Add admin notes
   3. Confirm approval
   ```
   **Expected Backend Actions** (Transaction):
   ```
   1. Task execution status → "approved"
   2. User balance += $0.50
   3. Task.completedQuantity += 1
   4. Order.completedCount += 1
   5. Audit log created
   6. Transaction committed
   ```

4. **Verify User Balance**
   ```
   1. Check user's balance before: $10.00
   2. After approval: $10.50
   ```
   **Expected**: ✅ Balance increased by task rate

5. **Verify Order Progress**
   ```
   1. Order had 100 quantity, 49 completed
   2. After approval: 50 completed
   3. Progress bar: 50/100 (50%)
   ```
   **Expected**: ✅ Order progress updated

6. **Verify Order Completion**
   ```
   1. Create order: quantity = 10
   2. Approve 10 task executions
   3. After 10th approval
   ```
   **Expected**: 
   - ✅ Order.completedCount = 10
   - ✅ Order.status auto-changed to "completed"
   - ✅ No more tasks available for this order

7. **Test Rejection Flow**
   ```
   1. User submits task
   2. Admin clicks "Reject"
   3. Admin enters reason: "Screenshot unclear"
   4. Confirm rejection
   ```
   **Expected Backend Actions**:
   ```
   1. Task execution status → "rejected"
   2. Task.remainingQuantity += 1 (slot returned)
   3. User balance NOT changed
   4. Audit log with rejection reason
   5. User sees rejection reason in UI
   ```

### Success Criteria
- ✅ Approval credits user balance
- ✅ Task completed quantity increments
- ✅ Order progress updates correctly
- ✅ Order auto-completes when all tasks done
- ✅ Rejection returns slot to pool
- ✅ All actions logged in audit trail
- ✅ Transaction rollback on any failure

---

## Automated Test Script (Optional)

### Setup
```bash
cd "/Users/velatertach/Downloads/projects/project 5/backend_combined"
npm install --save-dev jest supertest
```

### Test File: `tests/orderTaskFlow.test.js`
```javascript
const request = require('supertest');
const app = require('../src/server');

describe('Order & Task Management Flow', () => {
  let userToken, adminToken, orderId, taskId, executionId;

  beforeAll(async () => {
    // Login and get tokens
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    userToken = userLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });
    adminToken = adminLogin.body.token;
  });

  test('TC1: Prevent duplicate orders', async () => {
    const orderData = {
      platform: 'instagram',
      service: 'followers',
      targetUrl: 'https://instagram.com/test',
      quantity: 100
    };

    // Create first order
    const res1 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send(orderData);
    
    expect(res1.status).toBe(201);
    orderId = res1.body.order.id;

    // Attempt duplicate
    const res2 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send(orderData);
    
    expect(res2.status).toBe(400);
    expect(res2.body.error).toContain('duplicate');
  });

  test('TC2: Progress bar calculation', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(200);
    const progress = (res.body.order.completedCount / res.body.order.quantity) * 100;
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  test('TC3: Refund calculation', async () => {
    const res = await request(app)
      .post(`/api/admin/orders/${orderId}/refund`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.refund_amount).toBeGreaterThan(0);
  });

  test('TC4: Task exclusion', async () => {
    // Process order (creates task)
    await request(app)
      .post(`/api/admin/orders/${orderId}/process`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    // Get tasks
    const res = await request(app)
      .get('/api/tasks/available')
      .set('Authorization', `Bearer ${userToken}`);
    
    // Order owner should not see their own task
    const ownTask = res.body.tasks.find(t => t.orderId === orderId);
    expect(ownTask).toBeUndefined();
  });

  test('TC5: Task expiry', async () => {
    // Reserve task
    const res = await request(app)
      .post(`/api/tasks/${taskId}/reserve`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(200);
    const expiresAt = new Date(res.body.execution.expiresAt);
    const reservedAt = new Date(res.body.execution.reservedAt);
    const diffMinutes = (expiresAt - reservedAt) / 1000 / 60;
    
    expect(diffMinutes).toBe(15);
  });

  test('TC6: XSS protection', async () => {
    const malicious = '<script>alert("XSS")</script>';
    const res = await request(app)
      .post(`/api/orders/${orderId}/report`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'issue', description: malicious });
    
    expect(res.status).toBe(201);
    
    // Fetch and verify escaping
    const issuesRes = await request(app)
      .get(`/api/admin/orders/${orderId}/issues`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(issuesRes.body.issues[0].message).not.toContain('<script>');
  });

  test('TC7: Task approval flow', async () => {
    // Approve execution
    const res = await request(app)
      .post(`/api/admin/executions/${executionId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reward).toBeGreaterThan(0);
  });
});
```

### Run Tests
```bash
npm test -- orderTaskFlow.test.js
```

---

## Manual Testing Checklist

### Pre-Deployment Verification

- [ ] ✅ Test Case 1: Order duplicate prevention works
- [ ] ✅ Test Case 2: Progress bars display correctly
- [ ] ✅ Test Case 3: Refund calculations accurate
- [ ] ✅ Test Case 4: Task exclusion enforced
- [ ] ✅ Test Case 5: 15-minute expiry functional
- [ ] ✅ Test Case 6: XSS attacks prevented
- [ ] ✅ Test Case 7: Approval flow complete

### Browser Compatibility

- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)

### Performance Tests

- [ ] Backend handles 100+ concurrent users
- [ ] Admin panel loads < 2 seconds
- [ ] User frontend responsive on mobile

### Security Verification

- [ ] All endpoints require authentication
- [ ] Admin endpoints require admin role
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Rate limiting active

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test orders
DELETE FROM orders WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%test%'
);

-- Delete test task executions
DELETE FROM task_executions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%test%'
);

-- Delete test audit logs (optional)
DELETE FROM audit_logs WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

---

## Test Report Template

```markdown
# Test Execution Report
Date: YYYY-MM-DD
Tester: Name
Environment: Development

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Duplicate Prevention | ✅ PASS | Works as expected |
| TC2: Progress Bar | ✅ PASS | Fixed bug verified |
| TC3: Refund Calculation | ✅ PASS | Partial refunds correct |
| TC4: Task Exclusion | ✅ PASS | Owner cannot see task |
| TC5: 15-Min Expiry | ✅ PASS | Cron job working |
| TC6: XSS Protection | ✅ PASS | All inputs escaped |
| TC7: Approval Flow | ✅ PASS | Balance updated |

## Issues Found
None

## Recommendations
System ready for production deployment.
```

---

**Last Updated**: October 31, 2025  
**Next Test Cycle**: After production deployment
