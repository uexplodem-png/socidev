'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    await queryInterface.bulkInsert('email_templates', [
      {
        name: 'Welcome Email',
        key: 'welcome_email',
        subject: 'Welcome to {{appName}}, {{userName}}!',
        body_html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{appName}}!</h1>
    </div>
    <div class="content">
      <h2>Hello {{userName}},</h2>
      <p>Thank you for joining {{appName}}. We're excited to have you on board!</p>
      <p>Your account has been successfully created with the email: <strong>{{userEmail}}</strong></p>
      <p>To get started, please verify your email address by clicking the button below:</p>
      <center>
        <a href="{{verificationLink}}" class="button">Verify Email Address</a>
      </center>
      <p>If you didn't create this account, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        body_text: 'Welcome to {{appName}}, {{userName}}! Thank you for joining. Please verify your email: {{verificationLink}}',
        variables: JSON.stringify(['appName', 'userName', 'userEmail', 'verificationLink']),
        category: 'transactional',
        is_active: true,
        created_by: 1,
        updated_by: 1,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Password Reset',
        key: 'password_reset',
        subject: 'Reset Your Password - {{appName}}',
        body_html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hello {{userName}},</h2>
      <p>We received a request to reset your password for your {{appName}} account.</p>
      <p>Click the button below to reset your password:</p>
      <center>
        <a href="{{resetLink}}" class="button">Reset Password</a>
      </center>
      <p>This link will expire in {{expiryTime}} hours.</p>
      <div class="warning">
        <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will not be changed.
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2025 {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        body_text: 'Password reset requested for {{appName}}. Reset link: {{resetLink}} (expires in {{expiryTime}} hours)',
        variables: JSON.stringify(['appName', 'userName', 'resetLink', 'expiryTime']),
        category: 'transactional',
        is_active: true,
        created_by: 1,
        updated_by: 1,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Order Confirmation',
        key: 'order_confirmation',
        subject: 'Order Confirmation - {{orderNumber}}',
        body_html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .order-details { background: white; padding: 15px; margin: 20px 0; border: 1px solid #ddd; }
    .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
    </div>
    <div class="content">
      <h2>Thank you for your order, {{userName}}!</h2>
      <p>Your order has been confirmed and is being processed.</p>
      <div class="order-details">
        <h3>Order Details:</h3>
        <p><strong>Order Number:</strong> {{orderNumber}}</p>
        <p><strong>Order Date:</strong> {{orderDate}}</p>
        <p><strong>Total Amount:</strong> {{totalAmount}}</p>
        <p><strong>Service:</strong> {{serviceName}}</p>
      </div>
      <center>
        <a href="{{orderLink}}" class="button">View Order Details</a>
      </center>
      <p>You will receive a notification once your order is completed.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        body_text: 'Order Confirmed! Order #{{orderNumber}} for {{totalAmount}} has been placed. Track your order: {{orderLink}}',
        variables: JSON.stringify(['appName', 'userName', 'orderNumber', 'orderDate', 'totalAmount', 'serviceName', 'orderLink']),
        category: 'transactional',
        is_active: true,
        created_by: 1,
        updated_by: 1,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Withdrawal Approved',
        key: 'withdrawal_approved',
        subject: 'Your Withdrawal Request Has Been Approved',
        body_html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .amount { font-size: 32px; color: #10B981; font-weight: bold; text-align: center; margin: 20px 0; }
    .info-box { background: white; padding: 15px; margin: 20px 0; border: 1px solid #ddd; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Withdrawal Approved</h1>
    </div>
    <div class="content">
      <h2>Great news, {{userName}}!</h2>
      <p>Your withdrawal request has been approved and is being processed.</p>
      <div class="amount">{{amount}}</div>
      <div class="info-box">
        <h3>Withdrawal Details:</h3>
        <p><strong>Request ID:</strong> {{withdrawalId}}</p>
        <p><strong>Amount:</strong> {{amount}}</p>
        <p><strong>Method:</strong> {{paymentMethod}}</p>
        <p><strong>Account:</strong> {{accountDetails}}</p>
        <p><strong>Processing Time:</strong> {{processingTime}}</p>
      </div>
      <p>The funds will be transferred to your account within the specified processing time.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        body_text: 'Withdrawal Approved! {{amount}} will be sent to {{accountDetails}} via {{paymentMethod}}. Processing time: {{processingTime}}',
        variables: JSON.stringify(['appName', 'userName', 'withdrawalId', 'amount', 'paymentMethod', 'accountDetails', 'processingTime']),
        category: 'notification',
        is_active: true,
        created_by: 1,
        updated_by: 1,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Task Completed Notification',
        key: 'task_completed',
        subject: 'Task Completed - You Earned {{earnings}}!',
        body_html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .earnings { font-size: 32px; color: #8B5CF6; font-weight: bold; text-align: center; margin: 20px 0; }
    .task-box { background: white; padding: 15px; margin: 20px 0; border: 1px solid #ddd; }
    .button { display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Task Completed!</h1>
    </div>
    <div class="content">
      <h2>Congratulations, {{userName}}!</h2>
      <p>Your task has been completed and approved.</p>
      <div class="earnings">+{{earnings}}</div>
      <div class="task-box">
        <h3>Task Details:</h3>
        <p><strong>Task:</strong> {{taskTitle}}</p>
        <p><strong>Platform:</strong> {{platform}}</p>
        <p><strong>Completed:</strong> {{completedDate}}</p>
        <p><strong>Earnings:</strong> {{earnings}}</p>
      </div>
      <p>The earnings have been added to your account balance.</p>
      <center>
        <a href="{{dashboardLink}}" class="button">View Dashboard</a>
      </center>
    </div>
    <div class="footer">
      <p>&copy; 2025 {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        body_text: 'Task Completed! You earned {{earnings}} for completing "{{taskTitle}}" on {{platform}}. View dashboard: {{dashboardLink}}',
        variables: JSON.stringify(['appName', 'userName', 'taskTitle', 'platform', 'completedDate', 'earnings', 'dashboardLink']),
        category: 'notification',
        is_active: true,
        created_by: 1,
        updated_by: 1,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('email_templates', {
      key: ['welcome_email', 'password_reset', 'order_confirmation', 'withdrawal_approved', 'task_completed']
    }, {});
  }
};
